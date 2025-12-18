import { createClient } from "@/lib/supabase/server";
import type {
  Workflow,
  WorkflowStep,
  StepType,
  BranchCondition,
  FilterOperator,
  SendEmailStepConfig,
  SendSmsStepConfig,
  AddTagStepConfig,
  RemoveTagStepConfig,
  UpdateFieldStepConfig,
  CreateTaskStepConfig,
  CreateDealStepConfig,
  SendNotificationStepConfig,
  ConditionStepConfig,
  SplitStepConfig,
  GoToStepConfig,
  WaitStepConfig,
} from "@/types/workflow";

// Action handlers
import { executeAddTag, executeRemoveTag } from "./actions/tag-actions";
import { executeSendEmail } from "./actions/send-email";
import { executeSendSms } from "./actions/send-sms";
import { executeUpdateField } from "./actions/update-field";
import { executeCreateTask } from "./actions/create-task";
import { executeNotifyUser } from "./actions/notify-user";
import { executeCreateDeal } from "./actions/create-deal";

export interface Enrollment {
  id: string;
  workflow_id: string;
  contact_id: string;
  status: "active" | "completed" | "exited" | "paused" | "failed";
  current_step_id: string | null;
  current_step_index: number;
  enrolled_at: string;
  completed_at: string | null;
  exited_at: string | null;
  next_step_at: string | null;
  trigger_data: Record<string, any>;
  step_history: StepExecution[];
}

export interface StepExecution {
  step_id: string;
  step_type: StepType;
  started_at: string;
  completed_at: string | null;
  status: "pending" | "completed" | "failed" | "skipped";
  result?: Record<string, any>;
  error?: string;
  branch_taken?: string;
}

export interface Contact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  job_title: string | null;
  type: string;
  status: string;
  assigned_to: string | null;
  tags: string[];
  custom_fields: Record<string, any>;
  [key: string]: any;
}

export interface ExecutionContext {
  enrollment: Enrollment;
  workflow: Workflow;
  contact: Contact;
  supabase: any;
}

export class WorkflowEngine {
  /**
   * Enroll a contact in a workflow
   */
  static async enrollContact(
    workflowId: string,
    contactId: string,
    triggerData: Record<string, any> = {}
  ): Promise<Enrollment | null> {
    const supabase = await createClient();

    // Fetch workflow
    const { data: workflow, error: workflowError } = await (supabase as any)
      .from("crm_workflows")
      .select("*")
      .eq("id", workflowId)
      .single();

    if (workflowError || !workflow) {
      console.error("Workflow not found:", workflowError);
      return null;
    }

    // Check if workflow is active
    if (workflow.status !== "active") {
      console.error("Workflow is not active");
      return null;
    }

    // Check enrollment limit
    if (
      workflow.settings?.enrollment_limit &&
      workflow.enrolled_count >= workflow.settings.enrollment_limit
    ) {
      console.error("Workflow enrollment limit reached");
      return null;
    }

    // Check if contact is already enrolled (unless re-enrollment is allowed)
    if (!workflow.settings?.allow_re_enrollment) {
      const { data: existing } = await (supabase as any)
        .from("crm_workflow_enrollments")
        .select("id")
        .eq("workflow_id", workflowId)
        .eq("contact_id", contactId)
        .in("status", ["active", "paused"])
        .single();

      if (existing) {
        console.error("Contact already enrolled in workflow");
        return null;
      }
    }

    // Get first step
    const firstStep = workflow.steps?.[0];
    if (!firstStep) {
      console.error("Workflow has no steps");
      return null;
    }

    // Calculate next step time
    const now = new Date();
    const nextStepAt = this.calculateNextStepTime(firstStep, now, workflow.settings);

    // Create enrollment
    const { data: enrollment, error: enrollError } = await (supabase as any)
      .from("crm_workflow_enrollments")
      .insert({
        workflow_id: workflowId,
        contact_id: contactId,
        status: "active",
        current_step_id: firstStep.id,
        current_step_index: 0,
        enrolled_at: now.toISOString(),
        next_step_at: nextStepAt.toISOString(),
        trigger_data: triggerData,
        step_history: [],
      })
      .select()
      .single();

    if (enrollError) {
      console.error("Error creating enrollment:", enrollError);
      return null;
    }

    // Update workflow enrolled count
    await (supabase as any)
      .from("crm_workflows")
      .update({
        enrolled_count: workflow.enrolled_count + 1,
        updated_at: now.toISOString(),
      })
      .eq("id", workflowId);

    return enrollment;
  }

  /**
   * Process the next step for an enrollment
   */
  static async processStep(enrollmentId: string): Promise<boolean> {
    const supabase = await createClient();

    // Fetch enrollment with workflow and contact
    const { data: enrollment, error: enrollError } = await (supabase as any)
      .from("crm_workflow_enrollments")
      .select("*")
      .eq("id", enrollmentId)
      .single();

    if (enrollError || !enrollment) {
      console.error("Enrollment not found:", enrollError);
      return false;
    }

    // Check if enrollment is active
    if (enrollment.status !== "active") {
      console.log("Enrollment is not active, skipping");
      return false;
    }

    // Fetch workflow
    const { data: workflow, error: workflowError } = await (supabase as any)
      .from("crm_workflows")
      .select("*")
      .eq("id", enrollment.workflow_id)
      .single();

    if (workflowError || !workflow) {
      console.error("Workflow not found:", workflowError);
      return false;
    }

    // Fetch contact
    const { data: contact, error: contactError } = await (supabase as any)
      .from("crm_contacts")
      .select("*")
      .eq("id", enrollment.contact_id)
      .single();

    if (contactError || !contact) {
      console.error("Contact not found:", contactError);
      await this.failEnrollment(supabase, enrollment, "Contact not found");
      return false;
    }

    // Get current step
    const currentStep = workflow.steps?.find(
      (s: WorkflowStep) => s.id === enrollment.current_step_id
    );

    if (!currentStep) {
      console.error("Current step not found");
      await this.failEnrollment(supabase, enrollment, "Step not found");
      return false;
    }

    const context: ExecutionContext = {
      enrollment,
      workflow,
      contact,
      supabase,
    };

    try {
      // Execute the step
      const result = await this.executeStep(currentStep, context);

      // Record step execution
      const stepExecution: StepExecution = {
        step_id: currentStep.id,
        step_type: currentStep.type,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        status: result.success ? "completed" : "failed",
        result: result.data,
        error: result.error,
        branch_taken: result.branchTaken,
      };

      const stepHistory = [...(enrollment.step_history || []), stepExecution];

      // Determine next step
      const nextStepInfo = this.getNextStep(currentStep, workflow, result.branchTaken);

      if (nextStepInfo) {
        // Move to next step
        const nextStepAt = this.calculateNextStepTime(
          nextStepInfo.step,
          new Date(),
          workflow.settings
        );

        await (supabase as any)
          .from("crm_workflow_enrollments")
          .update({
            current_step_id: nextStepInfo.step.id,
            current_step_index: nextStepInfo.index,
            next_step_at: nextStepAt.toISOString(),
            step_history: stepHistory,
            updated_at: new Date().toISOString(),
          })
          .eq("id", enrollmentId);
      } else {
        // Workflow completed
        await this.completeEnrollment(supabase, enrollment, stepHistory);
      }

      return true;
    } catch (error) {
      console.error("Error executing step:", error);
      await this.failEnrollment(
        supabase,
        enrollment,
        error instanceof Error ? error.message : "Unknown error"
      );
      return false;
    }
  }

  /**
   * Execute a single step
   */
  private static async executeStep(
    step: WorkflowStep,
    context: ExecutionContext
  ): Promise<{
    success: boolean;
    data?: Record<string, any>;
    error?: string;
    branchTaken?: string;
  }> {
    const { contact, supabase, workflow } = context;

    switch (step.type) {
      case "send_email":
        return executeSendEmail(step.config as SendEmailStepConfig, contact, workflow);

      case "send_sms":
        return executeSendSms(step.config as SendSmsStepConfig, contact, workflow);

      case "add_tag":
        return executeAddTag(step.config as AddTagStepConfig, contact, supabase);

      case "remove_tag":
        return executeRemoveTag(step.config as RemoveTagStepConfig, contact, supabase);

      case "update_field":
        return executeUpdateField(step.config as UpdateFieldStepConfig, contact, supabase);

      case "create_task":
        return executeCreateTask(step.config as CreateTaskStepConfig, contact, workflow, supabase);

      case "create_deal":
        return executeCreateDeal(step.config as CreateDealStepConfig, contact, workflow, supabase);

      case "send_notification":
        return executeNotifyUser(step.config as SendNotificationStepConfig, contact, workflow, supabase);

      case "wait":
        // Wait steps are handled by timing, just pass through
        return { success: true, data: { waited: true } };

      case "condition": {
        // Evaluate condition and return which branch to take
        const conditionConfig = step.config as ConditionStepConfig;
        const conditionMet = this.evaluateCondition(
          conditionConfig.conditions,
          conditionConfig.logic,
          contact
        );
        return {
          success: true,
          branchTaken: conditionMet ? "yes" : "no",
          data: { conditionMet },
        };
      }

      case "split": {
        // Random or percentage-based split
        const splitConfig = step.config as SplitStepConfig;
        const variant = this.selectSplitVariant(splitConfig);
        return {
          success: true,
          branchTaken: variant,
          data: { variant },
        };
      }

      case "go_to":
        // Go-to is handled in getNextStep
        return { success: true };

      case "end":
        // End step - workflow will complete
        return { success: true };

      default:
        console.warn(`Unknown step type: ${step.type}`);
        return { success: true };
    }
  }

  /**
   * Evaluate a condition against contact data
   */
  static evaluateCondition(
    conditions: BranchCondition[],
    logic: "and" | "or",
    contact: Contact
  ): boolean {
    if (!conditions || conditions.length === 0) {
      return true;
    }

    const results = conditions.map((condition) =>
      this.evaluateSingleCondition(condition, contact)
    );

    return logic === "and"
      ? results.every((r) => r)
      : results.some((r) => r);
  }

  private static evaluateSingleCondition(
    condition: BranchCondition,
    contact: Contact
  ): boolean {
    const value = this.getFieldValue(contact, condition.field);
    const compareValue = condition.value;
    const operator = condition.operator;

    switch (operator) {
      case "equals":
        return value == compareValue;

      case "not_equals":
        return value != compareValue;

      case "contains":
        return String(value).toLowerCase().includes(String(compareValue).toLowerCase());

      case "not_contains":
        return !String(value).toLowerCase().includes(String(compareValue).toLowerCase());

      case "starts_with":
        return String(value).toLowerCase().startsWith(String(compareValue).toLowerCase());

      case "ends_with":
        return String(value).toLowerCase().endsWith(String(compareValue).toLowerCase());

      case "greater_than":
        return Number(value) > Number(compareValue);

      case "less_than":
        return Number(value) < Number(compareValue);

      case "is_empty":
        return value === null || value === undefined || value === "";

      case "is_not_empty":
        return value !== null && value !== undefined && value !== "";

      case "in":
        if (Array.isArray(compareValue)) {
          return compareValue.includes(value);
        }
        return false;

      case "not_in":
        if (Array.isArray(compareValue)) {
          return !compareValue.includes(value);
        }
        return true;

      default:
        return false;
    }
  }

  private static getFieldValue(contact: Contact, field: string): any {
    // Handle nested fields like custom_fields.property_type
    const parts = field.split(".");
    let value: any = contact;

    for (const part of parts) {
      if (value === null || value === undefined) {
        return null;
      }
      value = value[part];
    }

    return value;
  }

  private static selectSplitVariant(config: any): string {
    const variants = config.variants || [];
    if (variants.length === 0) return "";

    if (config.split_type === "percentage") {
      const random = Math.random() * 100;
      let cumulative = 0;

      for (const variant of variants) {
        cumulative += variant.percentage || 0;
        if (random <= cumulative) {
          return variant.id;
        }
      }
      return variants[variants.length - 1].id;
    } else {
      // Random selection
      const index = Math.floor(Math.random() * variants.length);
      return variants[index].id;
    }
  }

  private static getNextStep(
    currentStep: WorkflowStep,
    workflow: Workflow,
    branchTaken?: string
  ): { step: WorkflowStep; index: number } | null {
    // Handle go_to step
    if (currentStep.type === "go_to") {
      const goToConfig = currentStep.config as GoToStepConfig;
      if (goToConfig.target_step_id) {
        const targetIndex = workflow.steps.findIndex(
          (s) => s.id === goToConfig.target_step_id
        );
        if (targetIndex >= 0) {
          return { step: workflow.steps[targetIndex], index: targetIndex };
        }
      }
    }

    // Handle end step
    if (currentStep.type === "end") {
      return null;
    }

    // Handle branches (condition/split)
    if (branchTaken && currentStep.branches) {
      const branch = currentStep.branches.find((b) => b.id === branchTaken);
      if (branch?.next_step_id) {
        const branchIndex = workflow.steps.findIndex(
          (s) => s.id === branch.next_step_id
        );
        if (branchIndex >= 0) {
          return { step: workflow.steps[branchIndex], index: branchIndex };
        }
      }
    }

    // Default: next step in sequence
    if (currentStep.next_step_id) {
      const nextIndex = workflow.steps.findIndex(
        (s) => s.id === currentStep.next_step_id
      );
      if (nextIndex >= 0) {
        return { step: workflow.steps[nextIndex], index: nextIndex };
      }
    }

    // Try sequential next step
    const currentIndex = workflow.steps.findIndex((s) => s.id === currentStep.id);
    if (currentIndex >= 0 && currentIndex < workflow.steps.length - 1) {
      return {
        step: workflow.steps[currentIndex + 1],
        index: currentIndex + 1,
      };
    }

    return null;
  }

  private static calculateNextStepTime(
    step: WorkflowStep,
    now: Date,
    settings: any
  ): Date {
    // Wait steps add their duration
    if (step.type === "wait") {
      const waitConfig = step.config as WaitStepConfig;
      const duration = waitConfig?.duration || 1;
      const unit = waitConfig?.unit || "days";

      const msPerUnit: Record<string, number> = {
        minutes: 60 * 1000,
        hours: 60 * 60 * 1000,
        days: 24 * 60 * 60 * 1000,
        weeks: 7 * 24 * 60 * 60 * 1000,
      };

      return new Date(now.getTime() + duration * (msPerUnit[unit] || msPerUnit.days));
    }

    // Other steps execute immediately
    return new Date(now.getTime() + 1000);
  }

  private static async completeEnrollment(
    supabase: any,
    enrollment: Enrollment,
    stepHistory: StepExecution[]
  ): Promise<void> {
    const now = new Date().toISOString();

    await supabase
      .from("crm_workflow_enrollments")
      .update({
        status: "completed",
        completed_at: now,
        current_step_id: null,
        next_step_at: null,
        step_history: stepHistory,
        updated_at: now,
      })
      .eq("id", enrollment.id);

    // Update workflow completed count
    const { data: workflow } = await supabase
      .from("crm_workflows")
      .select("completed_count")
      .eq("id", enrollment.workflow_id)
      .single();

    if (workflow) {
      await supabase
        .from("crm_workflows")
        .update({
          completed_count: (workflow.completed_count || 0) + 1,
          updated_at: now,
        })
        .eq("id", enrollment.workflow_id);
    }
  }

  private static async failEnrollment(
    supabase: any,
    enrollment: Enrollment,
    errorMessage: string
  ): Promise<void> {
    const now = new Date().toISOString();

    await supabase
      .from("crm_workflow_enrollments")
      .update({
        status: "failed",
        exited_at: now,
        next_step_at: null,
        error_message: errorMessage,
        updated_at: now,
      })
      .eq("id", enrollment.id);
  }

  /**
   * Exit a contact from a workflow
   */
  static async exitEnrollment(
    enrollmentId: string,
    reason: string = "Manual exit"
  ): Promise<boolean> {
    const supabase = await createClient();
    const now = new Date().toISOString();

    const { error } = await (supabase as any)
      .from("crm_workflow_enrollments")
      .update({
        status: "exited",
        exited_at: now,
        next_step_at: null,
        exit_reason: reason,
        updated_at: now,
      })
      .eq("id", enrollmentId)
      .eq("status", "active");

    return !error;
  }
}

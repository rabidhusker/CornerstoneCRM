import { z } from "zod";

// ============================================
// Enums
// ============================================

export const workflowStatusEnum = z.enum([
  "draft",
  "active",
  "paused",
  "archived",
]);

export const triggerTypeEnum = z.enum([
  "contact_created",
  "contact_updated",
  "tag_added",
  "tag_removed",
  "deal_stage_changed",
  "deal_created",
  "form_submitted",
  "date_based",
  "manual",
]);

export const stepTypeEnum = z.enum([
  "send_email",
  "send_sms",
  "add_tag",
  "remove_tag",
  "update_field",
  "create_task",
  "create_deal",
  "send_notification",
  "wait",
  "condition",
  "split",
  "go_to",
  "end",
]);

export const filterOperatorEnum = z.enum([
  "equals",
  "not_equals",
  "contains",
  "not_contains",
  "starts_with",
  "ends_with",
  "greater_than",
  "less_than",
  "is_empty",
  "is_not_empty",
  "in",
  "not_in",
]);

// ============================================
// Filter Schemas
// ============================================

export const filterValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
]);

export const contactFilterSchema = z.object({
  field: z.string().min(1, "Field is required"),
  operator: filterOperatorEnum,
  value: filterValueSchema,
});

export const dealFilterSchema = z.object({
  field: z.string().min(1, "Field is required"),
  operator: filterOperatorEnum,
  value: filterValueSchema,
});

// ============================================
// Trigger Config Schemas
// ============================================

export const contactCreatedTriggerConfigSchema = z.object({
  filters: z.array(contactFilterSchema).optional(),
});

export const contactUpdatedTriggerConfigSchema = z.object({
  fields: z.array(z.string()).optional(),
  filters: z.array(contactFilterSchema).optional(),
});

export const tagTriggerConfigSchema = z.object({
  tag_ids: z.array(z.string().uuid()).min(1, "Select at least one tag"),
  filters: z.array(contactFilterSchema).optional(),
});

export const dealStageTriggerConfigSchema = z.object({
  pipeline_id: z.string().uuid().optional(),
  from_stage_id: z.string().uuid().optional(),
  to_stage_id: z.string().uuid("Target stage is required"),
  filters: z.array(dealFilterSchema).optional(),
});

export const dealCreatedTriggerConfigSchema = z.object({
  pipeline_id: z.string().uuid().optional(),
  filters: z.array(dealFilterSchema).optional(),
});

export const formSubmittedTriggerConfigSchema = z.object({
  form_id: z.string().uuid("Form is required"),
});

export const dateBasedTriggerConfigSchema = z.object({
  date_field: z.string().min(1, "Date field is required"),
  offset_days: z.number().int(),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format"),
  filters: z.array(contactFilterSchema).optional(),
});

export const manualTriggerConfigSchema = z.object({});

export const triggerConfigSchema = z.union([
  contactCreatedTriggerConfigSchema,
  contactUpdatedTriggerConfigSchema,
  tagTriggerConfigSchema,
  dealStageTriggerConfigSchema,
  dealCreatedTriggerConfigSchema,
  formSubmittedTriggerConfigSchema,
  dateBasedTriggerConfigSchema,
  manualTriggerConfigSchema,
]);

// ============================================
// Step Config Schemas
// ============================================

export const sendEmailStepConfigSchema = z.object({
  template_id: z.string().uuid().optional(),
  subject: z.string().max(200).optional(),
  content_html: z.string().optional(),
  from_name: z.string().max(100).optional(),
  from_email: z.string().email().optional(),
});

export const sendSmsStepConfigSchema = z.object({
  message: z.string().min(1, "Message is required").max(1600),
});

export const addTagStepConfigSchema = z.object({
  tag_ids: z.array(z.string().uuid()).min(1, "Select at least one tag"),
});

export const removeTagStepConfigSchema = z.object({
  tag_ids: z.array(z.string().uuid()).min(1, "Select at least one tag"),
});

export const updateFieldStepConfigSchema = z.object({
  field: z.string().min(1, "Field is required"),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

export const createTaskStepConfigSchema = z.object({
  title: z.string().min(1, "Task title is required").max(200),
  description: z.string().max(1000).optional(),
  due_in_days: z.number().int().min(0).optional(),
  assigned_to: z.string().uuid().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
});

export const createDealStepConfigSchema = z.object({
  pipeline_id: z.string().uuid("Pipeline is required"),
  stage_id: z.string().uuid("Stage is required"),
  title: z.string().min(1, "Deal title is required").max(200),
  value: z.number().min(0).optional(),
  assigned_to: z.string().uuid().optional(),
});

export const sendNotificationStepConfigSchema = z.object({
  type: z.enum(["email", "in_app", "slack"]),
  recipients: z.array(z.string()).min(1, "Select at least one recipient"),
  subject: z.string().min(1, "Subject is required").max(200),
  message: z.string().min(1, "Message is required").max(2000),
});

export const waitStepConfigSchema = z.object({
  duration: z.number().int().min(1, "Duration must be at least 1"),
  unit: z.enum(["minutes", "hours", "days", "weeks"]),
});

export const branchConditionSchema = z.object({
  field: z.string().min(1),
  operator: filterOperatorEnum,
  value: filterValueSchema,
});

export const conditionStepConfigSchema = z.object({
  conditions: z.array(branchConditionSchema).min(1, "At least one condition is required"),
  logic: z.enum(["and", "or"]),
});

export const splitVariantSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Variant name is required"),
  percentage: z.number().min(0).max(100).optional(),
});

export const splitStepConfigSchema = z.object({
  split_type: z.enum(["percentage", "random"]),
  variants: z.array(splitVariantSchema).min(2, "At least two variants are required"),
});

export const goToStepConfigSchema = z.object({
  target_step_id: z.string().min(1, "Target step is required"),
});

export const endStepConfigSchema = z.object({});

export const stepConfigSchema = z.union([
  sendEmailStepConfigSchema,
  sendSmsStepConfigSchema,
  addTagStepConfigSchema,
  removeTagStepConfigSchema,
  updateFieldStepConfigSchema,
  createTaskStepConfigSchema,
  createDealStepConfigSchema,
  sendNotificationStepConfigSchema,
  waitStepConfigSchema,
  conditionStepConfigSchema,
  splitStepConfigSchema,
  goToStepConfigSchema,
  endStepConfigSchema,
]);

// ============================================
// Workflow Schemas
// ============================================

export const workflowTriggerSchema = z.object({
  type: triggerTypeEnum,
  config: triggerConfigSchema,
});

export const workflowBranchSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Branch name is required"),
  condition: branchConditionSchema.optional(),
  next_step_id: z.string().nullable().optional(),
});

export const workflowStepSchema = z.object({
  id: z.string(),
  type: stepTypeEnum,
  name: z.string().min(1, "Step name is required").max(100),
  config: stepConfigSchema,
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  next_step_id: z.string().nullable().optional(),
  branches: z.array(workflowBranchSchema).optional(),
});

export const workflowSettingsSchema = z.object({
  allow_re_enrollment: z.boolean().default(false),
  enrollment_limit: z.number().int().min(1).optional(),
  timezone: z.string().optional(),
  working_hours_only: z.boolean().optional(),
  working_hours: z
    .object({
      start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
      end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
      days: z.array(z.number().int().min(0).max(6)),
    })
    .optional(),
});

export const workflowFormSchema = z.object({
  name: z
    .string()
    .min(1, "Workflow name is required")
    .max(200, "Name must be less than 200 characters"),
  description: z.string().max(1000).optional(),
  trigger: workflowTriggerSchema,
  steps: z.array(workflowStepSchema),
  settings: workflowSettingsSchema.optional(),
});

export type WorkflowFormSchemaType = z.infer<typeof workflowFormSchema>;

// Full workflow schema (includes database fields)
export const workflowSchema = workflowFormSchema.extend({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  status: workflowStatusEnum,
  enrolled_count: z.number().int().min(0).default(0),
  completed_count: z.number().int().min(0).default(0),
  created_by: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type WorkflowSchemaType = z.infer<typeof workflowSchema>;

// ============================================
// Validation Helpers
// ============================================

export function validateTriggerConfig(
  type: string,
  config: unknown
): { valid: boolean; errors?: string[] } {
  try {
    switch (type) {
      case "contact_created":
        contactCreatedTriggerConfigSchema.parse(config);
        break;
      case "contact_updated":
        contactUpdatedTriggerConfigSchema.parse(config);
        break;
      case "tag_added":
      case "tag_removed":
        tagTriggerConfigSchema.parse(config);
        break;
      case "deal_stage_changed":
        dealStageTriggerConfigSchema.parse(config);
        break;
      case "deal_created":
        dealCreatedTriggerConfigSchema.parse(config);
        break;
      case "form_submitted":
        formSubmittedTriggerConfigSchema.parse(config);
        break;
      case "date_based":
        dateBasedTriggerConfigSchema.parse(config);
        break;
      case "manual":
        manualTriggerConfigSchema.parse(config);
        break;
      default:
        return { valid: false, errors: ["Unknown trigger type"] };
    }
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.issues.map((e) => e.message),
      };
    }
    return { valid: false, errors: ["Invalid configuration"] };
  }
}

export function validateStepConfig(
  type: string,
  config: unknown
): { valid: boolean; errors?: string[] } {
  try {
    switch (type) {
      case "send_email":
        sendEmailStepConfigSchema.parse(config);
        break;
      case "send_sms":
        sendSmsStepConfigSchema.parse(config);
        break;
      case "add_tag":
        addTagStepConfigSchema.parse(config);
        break;
      case "remove_tag":
        removeTagStepConfigSchema.parse(config);
        break;
      case "update_field":
        updateFieldStepConfigSchema.parse(config);
        break;
      case "create_task":
        createTaskStepConfigSchema.parse(config);
        break;
      case "create_deal":
        createDealStepConfigSchema.parse(config);
        break;
      case "send_notification":
        sendNotificationStepConfigSchema.parse(config);
        break;
      case "wait":
        waitStepConfigSchema.parse(config);
        break;
      case "condition":
        conditionStepConfigSchema.parse(config);
        break;
      case "split":
        splitStepConfigSchema.parse(config);
        break;
      case "go_to":
        goToStepConfigSchema.parse(config);
        break;
      case "end":
        endStepConfigSchema.parse(config);
        break;
      default:
        return { valid: false, errors: ["Unknown step type"] };
    }
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.issues.map((e) => e.message),
      };
    }
    return { valid: false, errors: ["Invalid configuration"] };
  }
}

// Helper to transform form data to database format
export function transformWorkflowFormToDb(
  data: WorkflowFormSchemaType,
  workspaceId: string,
  userId: string
) {
  return {
    workspace_id: workspaceId,
    name: data.name,
    description: data.description || null,
    status: "draft" as const,
    trigger: data.trigger,
    steps: data.steps,
    settings: data.settings || {
      allow_re_enrollment: false,
    },
    created_by: userId,
  };
}

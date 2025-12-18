import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/v1/workflows/[id]/activate - Activate a workflow
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch workflow
    const { data: workflow, error: fetchError } = await (supabase as any)
      .from("crm_workflows")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Workflow not found" },
          { status: 404 }
        );
      }
      throw fetchError;
    }

    // Validate current status
    if (workflow.status === "active") {
      return NextResponse.json(
        { error: "Workflow is already active" },
        { status: 400 }
      );
    }

    if (workflow.status === "archived") {
      return NextResponse.json(
        { error: "Cannot activate an archived workflow. Restore it first." },
        { status: 400 }
      );
    }

    // Validate workflow is complete
    const validationErrors = validateWorkflowForActivation(workflow);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: "Workflow validation failed",
          details: validationErrors,
        },
        { status: 400 }
      );
    }

    // Activate workflow
    const { data: updated, error: updateError } = await (supabase as any)
      .from("crm_workflows")
      .update({
        status: "active",
        activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      message: "Workflow activated successfully",
      workflow: updated,
    });
  } catch (error) {
    console.error("Error activating workflow:", error);
    return NextResponse.json(
      { error: "Failed to activate workflow" },
      { status: 500 }
    );
  }
}

// Validate workflow is ready for activation
function validateWorkflowForActivation(workflow: any): string[] {
  const errors: string[] = [];

  // Check for trigger
  if (!workflow.trigger || !workflow.trigger.type) {
    errors.push("Workflow must have a trigger configured");
  }

  // Check trigger config based on type
  if (workflow.trigger) {
    const triggerErrors = validateTriggerConfig(
      workflow.trigger.type,
      workflow.trigger.config
    );
    errors.push(...triggerErrors);
  }

  // Check for at least one step
  if (!workflow.steps || workflow.steps.length === 0) {
    errors.push("Workflow must have at least one action step");
  }

  // Validate each step
  if (workflow.steps) {
    for (const step of workflow.steps) {
      const stepErrors = validateStepConfig(step);
      errors.push(...stepErrors);
    }

    // Check for disconnected steps (no path from trigger)
    const connectedSteps = getConnectedSteps(workflow.steps);
    const disconnectedSteps = workflow.steps.filter(
      (s: any) => !connectedSteps.has(s.id)
    );
    if (disconnectedSteps.length > 0) {
      errors.push(
        `${disconnectedSteps.length} step(s) are not connected to the workflow`
      );
    }
  }

  return errors;
}

function validateTriggerConfig(type: string, config: any): string[] {
  const errors: string[] = [];

  switch (type) {
    case "tag_added":
    case "tag_removed":
      if (!config?.tag_ids || config.tag_ids.length === 0) {
        errors.push("Tag trigger requires at least one tag selected");
      }
      break;

    case "deal_stage_changed":
      if (!config?.to_stage_id) {
        errors.push("Deal stage trigger requires a target stage");
      }
      break;

    case "form_submitted":
      if (!config?.form_id) {
        errors.push("Form trigger requires a form selected");
      }
      break;

    case "date_based":
      if (!config?.date_field) {
        errors.push("Date-based trigger requires a date field");
      }
      if (!config?.time) {
        errors.push("Date-based trigger requires a time");
      }
      break;
  }

  return errors;
}

function validateStepConfig(step: any): string[] {
  const errors: string[] = [];
  const stepName = step.name || step.type;

  switch (step.type) {
    case "send_email":
      if (!step.config?.template_id && !step.config?.content_html) {
        errors.push(`${stepName}: Email requires a template or content`);
      }
      if (!step.config?.template_id && !step.config?.subject) {
        errors.push(`${stepName}: Email requires a subject line`);
      }
      break;

    case "send_sms":
      if (!step.config?.message) {
        errors.push(`${stepName}: SMS requires a message`);
      }
      break;

    case "add_tag":
    case "remove_tag":
      if (!step.config?.tag_ids || step.config.tag_ids.length === 0) {
        errors.push(`${stepName}: Requires at least one tag selected`);
      }
      break;

    case "create_task":
      if (!step.config?.title) {
        errors.push(`${stepName}: Task requires a title`);
      }
      break;

    case "create_deal":
      if (!step.config?.pipeline_id || !step.config?.stage_id) {
        errors.push(`${stepName}: Deal requires pipeline and stage`);
      }
      if (!step.config?.title) {
        errors.push(`${stepName}: Deal requires a title`);
      }
      break;

    case "send_notification":
      if (!step.config?.recipients || step.config.recipients.length === 0) {
        errors.push(`${stepName}: Notification requires recipients`);
      }
      if (!step.config?.message) {
        errors.push(`${stepName}: Notification requires a message`);
      }
      break;

    case "wait":
      if (!step.config?.duration || step.config.duration < 1) {
        errors.push(`${stepName}: Wait requires a valid duration`);
      }
      break;

    case "condition":
      if (!step.config?.conditions || step.config.conditions.length === 0) {
        errors.push(`${stepName}: Condition requires at least one rule`);
      }
      break;

    case "go_to":
      if (!step.config?.target_step_id) {
        errors.push(`${stepName}: Go-to requires a target step`);
      }
      break;
  }

  return errors;
}

function getConnectedSteps(steps: any[]): Set<string> {
  const connected = new Set<string>();
  const stepMap = new Map(steps.map((s) => [s.id, s]));

  // Start from first step (connected to trigger)
  if (steps.length > 0) {
    const queue = [steps[0].id];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (connected.has(currentId)) continue;

      connected.add(currentId);
      const step = stepMap.get(currentId);

      if (!step) continue;

      // Add next step
      if (step.next_step_id) {
        queue.push(step.next_step_id);
      }

      // Add branch targets
      if (step.branches) {
        for (const branch of step.branches) {
          if (branch.next_step_id) {
            queue.push(branch.next_step_id);
          }
        }
      }
    }
  }

  return connected;
}

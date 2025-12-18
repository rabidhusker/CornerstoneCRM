import type { Workflow } from "@/types/workflow";

interface CreateTaskConfig {
  title: string;
  description?: string;
  due_in_days?: number;
  assigned_to?: string;
  priority?: "low" | "medium" | "high";
}

interface Contact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  assigned_to: string | null;
  [key: string]: any;
}

interface ActionResult {
  success: boolean;
  data?: Record<string, any>;
  error?: string;
}

/**
 * Execute create task action
 */
export async function executeCreateTask(
  config: CreateTaskConfig,
  contact: Contact,
  workflow: Workflow,
  supabase: any
): Promise<ActionResult> {
  try {
    if (!config.title) {
      return {
        success: false,
        error: "Task title is required",
      };
    }

    // Personalize title and description
    const personalizationData = {
      first_name: contact.first_name || "",
      last_name: contact.last_name || "",
      full_name: `${contact.first_name || ""} ${contact.last_name || ""}`.trim(),
    };

    const title = parsePersonalizationTokens(config.title, personalizationData);
    const description = config.description
      ? parsePersonalizationTokens(config.description, personalizationData)
      : null;

    // Calculate due date
    let dueDate: string | null = null;
    if (config.due_in_days !== undefined) {
      const due = new Date();
      due.setDate(due.getDate() + config.due_in_days);
      dueDate = due.toISOString();
    }

    // Determine assignee (use config, contact owner, or workflow creator)
    const assignedTo =
      config.assigned_to === "owner"
        ? contact.assigned_to
        : config.assigned_to || contact.assigned_to || workflow.created_by;

    // Create task
    const { data: task, error } = await supabase
      .from("crm_tasks")
      .insert({
        workspace_id: workflow.workspace_id,
        contact_id: contact.id,
        title,
        description,
        status: "pending",
        priority: config.priority || "medium",
        due_at: dueDate,
        assigned_to: assignedTo,
        created_by: workflow.created_by,
        metadata: {
          source: "workflow",
          workflow_id: workflow.id,
          workflow_name: workflow.name,
        },
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      success: true,
      data: {
        task_id: task.id,
        title: task.title,
        assigned_to: task.assigned_to,
        due_at: task.due_at,
      },
    };
  } catch (error) {
    console.error("Error creating task:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create task",
    };
  }
}

function parsePersonalizationTokens(
  text: string,
  data: Record<string, string>
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] || match;
  });
}

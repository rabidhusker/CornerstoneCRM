import { createClient } from "@/lib/supabase/server";
import { WorkflowEngine } from "../workflow-engine";

interface ContactCreatedTriggerConfig {
  filters?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
}

interface Contact {
  id: string;
  workspace_id: string;
  [key: string]: any;
}

/**
 * Handle contact created trigger
 * Called when a new contact is created
 */
export async function handleContactCreated(contact: Contact): Promise<void> {
  try {
    const supabase = await createClient();

    // Find active workflows with contact_created trigger
    const { data: workflows, error } = await (supabase as any)
      .from("crm_workflows")
      .select("*")
      .eq("workspace_id", contact.workspace_id)
      .eq("status", "active")
      .eq("trigger->type", "contact_created");

    if (error) {
      console.error("Error fetching workflows:", error);
      return;
    }

    if (!workflows || workflows.length === 0) {
      return;
    }

    // Check each workflow
    for (const workflow of workflows) {
      const triggerConfig = workflow.trigger?.config as ContactCreatedTriggerConfig;

      // Check if contact matches filters
      if (triggerConfig?.filters && triggerConfig.filters.length > 0) {
        const matches = evaluateFilters(contact, triggerConfig.filters);
        if (!matches) {
          continue;
        }
      }

      // Enroll contact in workflow
      await WorkflowEngine.enrollContact(workflow.id, contact.id, {
        trigger: "contact_created",
        contact_data: {
          id: contact.id,
          email: contact.email,
          first_name: contact.first_name,
          last_name: contact.last_name,
        },
      });

      console.log(
        `Enrolled contact ${contact.id} in workflow ${workflow.id} (contact_created)`
      );
    }
  } catch (error) {
    console.error("Error handling contact_created trigger:", error);
  }
}

/**
 * Evaluate filters against contact
 */
function evaluateFilters(
  contact: Contact,
  filters: Array<{ field: string; operator: string; value: any }>
): boolean {
  for (const filter of filters) {
    const contactValue = getFieldValue(contact, filter.field);

    if (!evaluateCondition(contactValue, filter.operator, filter.value)) {
      return false;
    }
  }

  return true;
}

function getFieldValue(contact: Contact, field: string): any {
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

function evaluateCondition(value: any, operator: string, compareValue: any): boolean {
  switch (operator) {
    case "equals":
      return value == compareValue;
    case "not_equals":
      return value != compareValue;
    case "contains":
      return String(value).toLowerCase().includes(String(compareValue).toLowerCase());
    case "in":
      return Array.isArray(compareValue) && compareValue.includes(value);
    case "is_empty":
      return value === null || value === undefined || value === "";
    case "is_not_empty":
      return value !== null && value !== undefined && value !== "";
    default:
      return true;
  }
}

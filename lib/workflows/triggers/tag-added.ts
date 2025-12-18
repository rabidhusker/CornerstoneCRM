import { createClient } from "@/lib/supabase/server";
import { WorkflowEngine } from "../workflow-engine";

interface TagTriggerConfig {
  tag_ids: string[];
  filters?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
}

interface Contact {
  id: string;
  workspace_id: string;
  tags: string[];
  [key: string]: any;
}

/**
 * Handle tag added trigger
 * Called when a tag is added to a contact
 */
export async function handleTagAdded(
  contact: Contact,
  addedTagIds: string[]
): Promise<void> {
  try {
    const supabase = await createClient();

    // Find active workflows with tag_added trigger
    const { data: workflows, error } = await (supabase as any)
      .from("crm_workflows")
      .select("*")
      .eq("workspace_id", contact.workspace_id)
      .eq("status", "active")
      .eq("trigger->type", "tag_added");

    if (error) {
      console.error("Error fetching workflows:", error);
      return;
    }

    if (!workflows || workflows.length === 0) {
      return;
    }

    // Check each workflow
    for (const workflow of workflows) {
      const triggerConfig = workflow.trigger?.config as TagTriggerConfig;

      // Check if any added tags match the trigger config
      if (!triggerConfig?.tag_ids || triggerConfig.tag_ids.length === 0) {
        continue;
      }

      const matchingTags = addedTagIds.filter((t) =>
        triggerConfig.tag_ids.includes(t)
      );

      if (matchingTags.length === 0) {
        continue;
      }

      // Check additional filters if specified
      if (triggerConfig.filters && triggerConfig.filters.length > 0) {
        const matches = evaluateFilters(contact, triggerConfig.filters);
        if (!matches) {
          continue;
        }
      }

      // Enroll contact in workflow
      await WorkflowEngine.enrollContact(workflow.id, contact.id, {
        trigger: "tag_added",
        matching_tags: matchingTags,
        all_added_tags: addedTagIds,
      });

      console.log(
        `Enrolled contact ${contact.id} in workflow ${workflow.id} (tag_added)`
      );
    }
  } catch (error) {
    console.error("Error handling tag_added trigger:", error);
  }
}

/**
 * Handle tag removed trigger
 * Called when a tag is removed from a contact
 */
export async function handleTagRemoved(
  contact: Contact,
  removedTagIds: string[]
): Promise<void> {
  try {
    const supabase = await createClient();

    // Find active workflows with tag_removed trigger
    const { data: workflows, error } = await (supabase as any)
      .from("crm_workflows")
      .select("*")
      .eq("workspace_id", contact.workspace_id)
      .eq("status", "active")
      .eq("trigger->type", "tag_removed");

    if (error) {
      console.error("Error fetching workflows:", error);
      return;
    }

    if (!workflows || workflows.length === 0) {
      return;
    }

    // Check each workflow
    for (const workflow of workflows) {
      const triggerConfig = workflow.trigger?.config as TagTriggerConfig;

      // Check if any removed tags match the trigger config
      if (!triggerConfig?.tag_ids || triggerConfig.tag_ids.length === 0) {
        continue;
      }

      const matchingTags = removedTagIds.filter((t) =>
        triggerConfig.tag_ids.includes(t)
      );

      if (matchingTags.length === 0) {
        continue;
      }

      // Enroll contact in workflow
      await WorkflowEngine.enrollContact(workflow.id, contact.id, {
        trigger: "tag_removed",
        matching_tags: matchingTags,
        all_removed_tags: removedTagIds,
      });

      console.log(
        `Enrolled contact ${contact.id} in workflow ${workflow.id} (tag_removed)`
      );
    }
  } catch (error) {
    console.error("Error handling tag_removed trigger:", error);
  }
}

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

import { createClient } from "@/lib/supabase/server";
import { WorkflowEngine } from "../workflow-engine";

interface DealStageTriggerConfig {
  pipeline_id?: string;
  from_stage_id?: string;
  to_stage_id: string;
  filters?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
}

interface Deal {
  id: string;
  workspace_id: string;
  pipeline_id: string;
  stage_id: string;
  contact_id: string | null;
  title: string;
  value: number;
  [key: string]: any;
}

/**
 * Handle deal stage changed trigger
 * Called when a deal moves to a new stage
 */
export async function handleDealStageChanged(
  deal: Deal,
  fromStageId: string,
  toStageId: string
): Promise<void> {
  try {
    const supabase = await createClient();

    // Skip if no contact associated with deal
    if (!deal.contact_id) {
      return;
    }

    // Find active workflows with deal_stage_changed trigger
    const { data: workflows, error } = await (supabase as any)
      .from("crm_workflows")
      .select("*")
      .eq("workspace_id", deal.workspace_id)
      .eq("status", "active")
      .eq("trigger->type", "deal_stage_changed");

    if (error) {
      console.error("Error fetching workflows:", error);
      return;
    }

    if (!workflows || workflows.length === 0) {
      return;
    }

    // Fetch contact
    const { data: contact } = await (supabase as any)
      .from("crm_contacts")
      .select("*")
      .eq("id", deal.contact_id)
      .single();

    if (!contact) {
      return;
    }

    // Check each workflow
    for (const workflow of workflows) {
      const triggerConfig = workflow.trigger?.config as DealStageTriggerConfig;

      // Check pipeline match
      if (triggerConfig.pipeline_id && triggerConfig.pipeline_id !== deal.pipeline_id) {
        continue;
      }

      // Check to_stage match (required)
      if (triggerConfig.to_stage_id !== toStageId) {
        continue;
      }

      // Check from_stage match (optional)
      if (triggerConfig.from_stage_id && triggerConfig.from_stage_id !== fromStageId) {
        continue;
      }

      // Check deal filters
      if (triggerConfig.filters && triggerConfig.filters.length > 0) {
        const matches = evaluateFilters(deal, triggerConfig.filters);
        if (!matches) {
          continue;
        }
      }

      // Enroll contact in workflow
      await WorkflowEngine.enrollContact(workflow.id, deal.contact_id, {
        trigger: "deal_stage_changed",
        deal_id: deal.id,
        deal_title: deal.title,
        deal_value: deal.value,
        from_stage_id: fromStageId,
        to_stage_id: toStageId,
        pipeline_id: deal.pipeline_id,
      });

      console.log(
        `Enrolled contact ${deal.contact_id} in workflow ${workflow.id} (deal_stage_changed)`
      );
    }
  } catch (error) {
    console.error("Error handling deal_stage_changed trigger:", error);
  }
}

/**
 * Handle deal created trigger
 * Called when a new deal is created
 */
export async function handleDealCreated(deal: Deal): Promise<void> {
  try {
    const supabase = await createClient();

    // Skip if no contact associated with deal
    if (!deal.contact_id) {
      return;
    }

    // Find active workflows with deal_created trigger
    const { data: workflows, error } = await (supabase as any)
      .from("crm_workflows")
      .select("*")
      .eq("workspace_id", deal.workspace_id)
      .eq("status", "active")
      .eq("trigger->type", "deal_created");

    if (error) {
      console.error("Error fetching workflows:", error);
      return;
    }

    if (!workflows || workflows.length === 0) {
      return;
    }

    // Check each workflow
    for (const workflow of workflows) {
      const triggerConfig = workflow.trigger?.config;

      // Check pipeline match (optional)
      if (triggerConfig?.pipeline_id && triggerConfig.pipeline_id !== deal.pipeline_id) {
        continue;
      }

      // Check deal filters
      if (triggerConfig?.filters && triggerConfig.filters.length > 0) {
        const matches = evaluateFilters(deal, triggerConfig.filters);
        if (!matches) {
          continue;
        }
      }

      // Enroll contact in workflow
      await WorkflowEngine.enrollContact(workflow.id, deal.contact_id, {
        trigger: "deal_created",
        deal_id: deal.id,
        deal_title: deal.title,
        deal_value: deal.value,
        pipeline_id: deal.pipeline_id,
        stage_id: deal.stage_id,
      });

      console.log(
        `Enrolled contact ${deal.contact_id} in workflow ${workflow.id} (deal_created)`
      );
    }
  } catch (error) {
    console.error("Error handling deal_created trigger:", error);
  }
}

function evaluateFilters(
  data: Record<string, any>,
  filters: Array<{ field: string; operator: string; value: any }>
): boolean {
  for (const filter of filters) {
    const value = getFieldValue(data, filter.field);

    if (!evaluateCondition(value, filter.operator, filter.value)) {
      return false;
    }
  }

  return true;
}

function getFieldValue(data: Record<string, any>, field: string): any {
  const parts = field.split(".");
  let value: any = data;

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
    case "greater_than":
      return Number(value) > Number(compareValue);
    case "less_than":
      return Number(value) < Number(compareValue);
    case "is_empty":
      return value === null || value === undefined || value === "";
    case "is_not_empty":
      return value !== null && value !== undefined && value !== "";
    default:
      return true;
  }
}

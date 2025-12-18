import type { Workflow } from "@/types/workflow";

interface CreateDealConfig {
  pipeline_id: string;
  stage_id: string;
  title: string;
  value?: number;
  assigned_to?: string;
}

interface Contact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  assigned_to: string | null;
  [key: string]: any;
}

interface ActionResult {
  success: boolean;
  data?: Record<string, any>;
  error?: string;
}

/**
 * Execute create deal action
 */
export async function executeCreateDeal(
  config: CreateDealConfig,
  contact: Contact,
  workflow: Workflow,
  supabase: any
): Promise<ActionResult> {
  try {
    if (!config.pipeline_id || !config.stage_id) {
      return {
        success: false,
        error: "Pipeline and stage are required",
      };
    }

    if (!config.title) {
      return {
        success: false,
        error: "Deal title is required",
      };
    }

    // Personalize title
    const personalizationData = {
      first_name: contact.first_name || "",
      last_name: contact.last_name || "",
      full_name: `${contact.first_name || ""} ${contact.last_name || ""}`.trim(),
      company_name: contact.company_name || "",
    };

    const title = parsePersonalizationTokens(config.title, personalizationData);

    // Determine assignee
    const assignedTo =
      config.assigned_to === "owner"
        ? contact.assigned_to
        : config.assigned_to || contact.assigned_to || workflow.created_by;

    // Get current max position in stage
    const { data: existingDeals } = await supabase
      .from("crm_deals")
      .select("position")
      .eq("stage_id", config.stage_id)
      .order("position", { ascending: false })
      .limit(1);

    const position = existingDeals?.[0]?.position
      ? existingDeals[0].position + 1
      : 0;

    // Create deal
    const { data: deal, error } = await supabase
      .from("crm_deals")
      .insert({
        workspace_id: workflow.workspace_id,
        pipeline_id: config.pipeline_id,
        stage_id: config.stage_id,
        contact_id: contact.id,
        title,
        value: config.value || 0,
        position,
        status: "open",
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

    // Create activity log
    await supabase.from("crm_activities").insert({
      contact_id: contact.id,
      deal_id: deal.id,
      workspace_id: workflow.workspace_id,
      type: "deal_created",
      title: `Deal created: ${title}`,
      description: `Deal created by workflow: ${workflow.name}`,
      created_by: workflow.created_by,
    });

    return {
      success: true,
      data: {
        deal_id: deal.id,
        title: deal.title,
        value: deal.value,
        pipeline_id: deal.pipeline_id,
        stage_id: deal.stage_id,
      },
    };
  } catch (error) {
    console.error("Error creating deal:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create deal",
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

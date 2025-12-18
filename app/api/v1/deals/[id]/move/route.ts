import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/v1/deals/[id]/move - Move a deal to a different stage
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetStageId, status } = body;

    if (!targetStageId) {
      return NextResponse.json(
        { error: "targetStageId is required" },
        { status: 400 }
      );
    }

    // Verify the target stage exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: targetStage, error: stageError } = await (supabase as any)
      .from("crm_pipeline_stages")
      .select("id, is_won_stage, is_lost_stage")
      .eq("id", targetStageId)
      .single();

    if (stageError || !targetStage) {
      return NextResponse.json(
        { error: "Target stage not found" },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      stage_id: targetStageId,
    };

    // Determine the new status based on stage type or explicit status
    let newStatus: "open" | "won" | "lost" = "open";

    if (status) {
      newStatus = status;
    } else if (targetStage.is_won_stage) {
      newStatus = "won";
    } else if (targetStage.is_lost_stage) {
      newStatus = "lost";
    }

    updateData.status = newStatus;

    // Add status-specific fields
    if (newStatus === "won") {
      updateData.won_date = new Date().toISOString();
      updateData.actual_close_date = new Date().toISOString();
      updateData.lost_date = null;
      updateData.lost_reason = null;
    } else if (newStatus === "lost") {
      updateData.lost_date = new Date().toISOString();
      updateData.won_date = null;
      if (body.lostReason) {
        updateData.lost_reason = body.lostReason;
      }
    } else {
      // Reopening a deal
      updateData.won_date = null;
      updateData.lost_date = null;
      updateData.actual_close_date = null;
    }

    // Get the current deal to track the previous stage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: currentDeal, error: currentDealError } = await (supabase as any)
      .from("crm_deals")
      .select("stage_id")
      .eq("id", id)
      .single();

    if (currentDealError) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    const previousStageId = currentDeal.stage_id;

    // Update the deal
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: deal, error: updateError } = await (supabase as any)
      .from("crm_deals")
      .update(updateData)
      .eq("id", id)
      .select(
        `
        *,
        pipeline:crm_pipelines!crm_deals_pipeline_id_fkey(id, name),
        stage:crm_pipeline_stages!crm_deals_stage_id_fkey(id, name, color, is_won_stage, is_lost_stage),
        contact:crm_contacts!crm_deals_contact_id_fkey(id, first_name, last_name, email)
      `
      )
      .single();

    if (updateError) {
      console.error("Error moving deal:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deal,
      previousStageId,
      newStageId: targetStageId,
      statusChanged: previousStageId !== targetStageId,
    });
  } catch (error) {
    console.error("Error in POST /api/v1/deals/[id]/move:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

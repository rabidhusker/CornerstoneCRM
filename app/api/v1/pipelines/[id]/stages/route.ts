import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface StageInput {
  id?: string;
  name: string;
  position: number;
  color?: string;
  probability?: number;
  is_won_stage?: boolean;
  is_lost_stage?: boolean;
}

// POST /api/v1/pipelines/[id]/stages - Add a new stage
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: pipelineId } = await params;
    const body = await request.json();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, position, color, probability, is_won_stage, is_lost_stage } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Stage name is required" },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: stage, error } = await (supabase as any)
      .from("crm_pipeline_stages")
      .insert({
        pipeline_id: pipelineId,
        name,
        position: position ?? 0,
        color: color || "#6366f1",
        probability: probability ?? null,
        is_won_stage: is_won_stage || false,
        is_lost_stage: is_lost_stage || false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating stage:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ stage }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/v1/pipelines/[id]/stages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/pipelines/[id]/stages - Update/reorder stages
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: pipelineId } = await params;
    const body = await request.json();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { stages } = body as { stages: StageInput[] };

    if (!stages || !Array.isArray(stages)) {
      return NextResponse.json(
        { error: "Stages array is required" },
        { status: 400 }
      );
    }

    // Get existing stages to determine what to delete
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingStages } = await (supabase as any)
      .from("crm_pipeline_stages")
      .select("id")
      .eq("pipeline_id", pipelineId);

    const existingIds = new Set<string>(existingStages?.map((s: { id: string }) => s.id) || []);
    const incomingIds = new Set<string | undefined>(stages.filter((s) => s.id && !s.id.startsWith("new-")).map((s) => s.id));

    // Delete stages that are not in the incoming list
    const idsToDelete = Array.from(existingIds).filter((id) => !incomingIds.has(id));

    if (idsToDelete.length > 0) {
      // Check if any deals are in these stages
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: dealsInStages } = await (supabase as any)
        .from("crm_deals")
        .select("id")
        .in("stage_id", idsToDelete)
        .limit(1);

      if (dealsInStages && dealsInStages.length > 0) {
        return NextResponse.json(
          { error: "Cannot delete stages that contain deals. Please move or delete the deals first." },
          { status: 400 }
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("crm_pipeline_stages")
        .delete()
        .in("id", idsToDelete);
    }

    // Upsert stages
    const updatedStages = [];

    for (const stage of stages) {
      const stageData = {
        pipeline_id: pipelineId,
        name: stage.name,
        position: stage.position,
        color: stage.color || "#6366f1",
        probability: stage.probability ?? null,
        is_won_stage: stage.is_won_stage || false,
        is_lost_stage: stage.is_lost_stage || false,
      };

      if (stage.id && !stage.id.startsWith("new-")) {
        // Update existing stage
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: updated, error } = await (supabase as any)
          .from("crm_pipeline_stages")
          .update(stageData)
          .eq("id", stage.id)
          .select()
          .single();

        if (error) {
          console.error("Error updating stage:", error);
          throw new Error(error.message);
        }
        updatedStages.push(updated);
      } else {
        // Create new stage
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: created, error } = await (supabase as any)
          .from("crm_pipeline_stages")
          .insert(stageData)
          .select()
          .single();

        if (error) {
          console.error("Error creating stage:", error);
          throw new Error(error.message);
        }
        updatedStages.push(created);
      }
    }

    return NextResponse.json({ stages: updatedStages });
  } catch (error) {
    console.error("Error in PATCH /api/v1/pipelines/[id]/stages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

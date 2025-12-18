import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/v1/pipelines - List pipelines
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pipelines, error } = await (supabase as any)
      .from("crm_pipelines")
      .select(
        `
        *,
        stages:crm_pipeline_stages(id, name, position, color, probability, is_won_stage, is_lost_stage)
      `
      )
      .eq("is_active", true)
      .order("is_default", { ascending: false })
      .order("name");

    if (error) {
      console.error("Error fetching pipelines:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Sort stages by position
    const pipelinesWithSortedStages = pipelines?.map((pipeline: {
      stages: Array<{ position: number; [key: string]: unknown }>;
      [key: string]: unknown;
    }) => ({
      ...pipeline,
      stages: pipeline.stages?.sort((a: { position: number }, b: { position: number }) => a.position - b.position),
    }));

    return NextResponse.json({ pipelines: pipelinesWithSortedStages });
  } catch (error) {
    console.error("Error in GET /api/v1/pipelines:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/v1/pipelines - Create a new pipeline
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's workspace
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: workspaceMemberData } = await (supabase as any)
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    const workspaceMember = workspaceMemberData as { workspace_id: string } | null;

    if (!workspaceMember) {
      return NextResponse.json({ error: "No workspace found" }, { status: 400 });
    }

    const { name, description, isDefault = false, stages } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Pipeline name is required" },
        { status: 400 }
      );
    }

    // If this is going to be the default, unset any existing default
    if (isDefault) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("crm_pipelines")
        .update({ is_default: false })
        .eq("workspace_id", workspaceMember.workspace_id)
        .eq("is_default", true);
    }

    // Create pipeline
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pipeline, error: pipelineError } = await (supabase as any)
      .from("crm_pipelines")
      .insert({
        workspace_id: workspaceMember.workspace_id,
        name,
        description: description || null,
        is_default: isDefault,
        is_active: true,
      })
      .select()
      .single();

    if (pipelineError) {
      console.error("Error creating pipeline:", pipelineError);
      return NextResponse.json({ error: pipelineError.message }, { status: 500 });
    }

    // Create default stages if none provided
    const defaultStages = stages || [
      { name: "New Lead", position: 0, color: "#6366f1", probability: 10 },
      { name: "Contacted", position: 1, color: "#8b5cf6", probability: 20 },
      { name: "Qualified", position: 2, color: "#a855f7", probability: 40 },
      { name: "Proposal", position: 3, color: "#f59e0b", probability: 60 },
      { name: "Negotiation", position: 4, color: "#f97316", probability: 80 },
      { name: "Closed Won", position: 5, color: "#22c55e", probability: 100, isWonStage: true },
      { name: "Closed Lost", position: 6, color: "#ef4444", probability: 0, isLostStage: true },
    ];

    const stageInserts = defaultStages.map((stage: {
      name: string;
      position: number;
      color?: string;
      probability?: number;
      isWonStage?: boolean;
      isLostStage?: boolean;
    }) => ({
      pipeline_id: pipeline.id,
      name: stage.name,
      position: stage.position,
      color: stage.color || "#6366f1",
      probability: stage.probability ?? null,
      is_won_stage: stage.isWonStage || false,
      is_lost_stage: stage.isLostStage || false,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: createdStages, error: stagesError } = await (supabase as any)
      .from("crm_pipeline_stages")
      .insert(stageInserts)
      .select();

    if (stagesError) {
      console.error("Error creating pipeline stages:", stagesError);
      // Delete the pipeline if stages fail
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("crm_pipelines").delete().eq("id", pipeline.id);
      return NextResponse.json({ error: stagesError.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        pipeline: {
          ...pipeline,
          stages: createdStages,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/v1/pipelines:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/v1/pipelines/[id] - Get a single pipeline with stages
export async function GET(
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pipeline, error } = await (supabase as any)
      .from("crm_pipelines")
      .select(
        `
        *,
        stages:crm_pipeline_stages(id, name, position, color, probability, is_won_stage, is_lost_stage)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Pipeline not found" }, { status: 404 });
      }
      console.error("Error fetching pipeline:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Sort stages by position
    if (pipeline.stages) {
      pipeline.stages.sort((a: { position: number }, b: { position: number }) => a.position - b.position);
    }

    return NextResponse.json({ pipeline });
  } catch (error) {
    console.error("Error in GET /api/v1/pipelines/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/pipelines/[id] - Update a pipeline
export async function PATCH(
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

    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description || null;
    if (body.isDefault !== undefined) updateData.is_default = body.isDefault;
    if (body.isActive !== undefined) updateData.is_active = body.isActive;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // If setting as default, unset any existing default
    if (body.isDefault) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: currentPipeline } = await (supabase as any)
        .from("crm_pipelines")
        .select("workspace_id")
        .eq("id", id)
        .single();

      if (currentPipeline) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from("crm_pipelines")
          .update({ is_default: false })
          .eq("workspace_id", currentPipeline.workspace_id)
          .eq("is_default", true)
          .neq("id", id);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pipeline, error } = await (supabase as any)
      .from("crm_pipelines")
      .update(updateData)
      .eq("id", id)
      .select(
        `
        *,
        stages:crm_pipeline_stages(id, name, position, color, probability, is_won_stage, is_lost_stage)
      `
      )
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Pipeline not found" }, { status: 404 });
      }
      console.error("Error updating pipeline:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Sort stages by position
    if (pipeline.stages) {
      pipeline.stages.sort((a: { position: number }, b: { position: number }) => a.position - b.position);
    }

    return NextResponse.json({ pipeline });
  } catch (error) {
    console.error("Error in PATCH /api/v1/pipelines/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/pipelines/[id] - Soft delete a pipeline
export async function DELETE(
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

    // Soft delete by setting is_active to false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("crm_pipelines")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      console.error("Error deleting pipeline:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/v1/pipelines/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

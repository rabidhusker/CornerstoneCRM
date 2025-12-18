import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/v1/workflows/[id] - Get a single workflow
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

    // Fetch workflow
    const { data: workflow, error } = await (supabase as any)
      .from("crm_workflows")
      .select(
        `
        *,
        creator:created_by(
          id,
          full_name,
          avatar_url
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Workflow not found" },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json(workflow);
  } catch (error) {
    console.error("Error fetching workflow:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflow" },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/workflows/[id] - Update a workflow
export async function PATCH(
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

    const body = await request.json();
    const { name, description, trigger, steps, settings } = body;

    // Build update object
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (trigger !== undefined) updates.trigger = trigger;
    if (steps !== undefined) updates.steps = steps;
    if (settings !== undefined) updates.settings = settings;

    // Update workflow
    const { data: workflow, error } = await (supabase as any)
      .from("crm_workflows")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Workflow not found" },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json(workflow);
  } catch (error) {
    console.error("Error updating workflow:", error);
    return NextResponse.json(
      { error: "Failed to update workflow" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/workflows/[id] - Delete a workflow
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

    // Delete workflow
    const { error } = await (supabase as any)
      .from("crm_workflows")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting workflow:", error);
    return NextResponse.json(
      { error: "Failed to delete workflow" },
      { status: 500 }
    );
  }
}

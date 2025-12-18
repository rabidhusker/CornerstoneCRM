import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/v1/workflows/[id]/status - Update workflow status
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
    const { status } = body;

    // Validate status
    const validStatuses = ["draft", "active", "paused", "archived"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be one of: draft, active, paused, archived" },
        { status: 400 }
      );
    }

    // Fetch current workflow to validate state transitions
    const { data: workflow, error: fetchError } = await (supabase as any)
      .from("crm_workflows")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Workflow not found" },
          { status: 404 }
        );
      }
      throw fetchError;
    }

    // Validate state transitions
    const currentStatus = workflow.status;
    const validTransitions: Record<string, string[]> = {
      draft: ["active", "archived"],
      active: ["paused", "archived"],
      paused: ["active", "archived"],
      archived: ["draft"],
    };

    if (!validTransitions[currentStatus]?.includes(status)) {
      return NextResponse.json(
        {
          error: `Cannot transition from '${currentStatus}' to '${status}'`,
        },
        { status: 400 }
      );
    }

    // If activating, validate workflow has required elements
    if (status === "active") {
      if (!workflow.trigger) {
        return NextResponse.json(
          { error: "Workflow must have a trigger to be activated" },
          { status: 400 }
        );
      }
      if (!workflow.steps || workflow.steps.length === 0) {
        return NextResponse.json(
          { error: "Workflow must have at least one step to be activated" },
          { status: 400 }
        );
      }
    }

    // Update status
    const { data: updated, error: updateError } = await (supabase as any)
      .from("crm_workflows")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating workflow status:", error);
    return NextResponse.json(
      { error: "Failed to update workflow status" },
      { status: 500 }
    );
  }
}

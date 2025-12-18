import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/v1/workflows/[id]/duplicate - Duplicate a workflow
export async function POST(
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

    // Fetch original workflow
    const { data: original, error: fetchError } = await (supabase as any)
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

    // Create duplicate
    const { data: duplicate, error: createError } = await (supabase as any)
      .from("crm_workflows")
      .insert({
        workspace_id: original.workspace_id,
        name: `${original.name} (Copy)`,
        description: original.description,
        status: "draft",
        trigger: original.trigger,
        steps: original.steps,
        settings: original.settings,
        enrolled_count: 0,
        completed_count: 0,
        created_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    return NextResponse.json(duplicate, { status: 201 });
  } catch (error) {
    console.error("Error duplicating workflow:", error);
    return NextResponse.json(
      { error: "Failed to duplicate workflow" },
      { status: 500 }
    );
  }
}

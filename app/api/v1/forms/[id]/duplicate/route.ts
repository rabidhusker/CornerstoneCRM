import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/v1/forms/[id]/duplicate - Duplicate a form
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

    // Get original form
    const { data: originalForm, error: fetchError } = await (supabase as any)
      .from("crm_forms")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !originalForm) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Create duplicate
    const { data: newForm, error: createError } = await (supabase as any)
      .from("crm_forms")
      .insert({
        workspace_id: originalForm.workspace_id,
        created_by: user.id,
        name: `${originalForm.name} (Copy)`,
        description: originalForm.description,
        status: "draft",
        config: originalForm.config,
        settings: originalForm.settings,
        styles: originalForm.styles,
        submissions_count: 0,
        views_count: 0,
        conversion_rate: 0,
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    return NextResponse.json({ form: newForm }, { status: 201 });
  } catch (error) {
    console.error("Error duplicating form:", error);
    return NextResponse.json(
      { error: "Failed to duplicate form" },
      { status: 500 }
    );
  }
}

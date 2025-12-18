import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/v1/templates/[id]/duplicate - Duplicate a template
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

    // Fetch original template
    const { data: original, error: fetchError } = await (supabase as any)
      .from("crm_email_templates")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 }
        );
      }
      throw fetchError;
    }

    // Create duplicate template
    const duplicateData = {
      workspace_id: original.workspace_id,
      created_by: user.id,
      name: `${original.name} (Copy)`,
      description: original.description,
      category: original.category,
      subject_line: original.subject_line,
      content_html: original.content_html,
      content_text: original.content_text,
      thumbnail_url: original.thumbnail_url,
      is_default: false, // Never duplicate as default
    };

    const { data: template, error } = await (supabase as any)
      .from("crm_email_templates")
      .insert(duplicateData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("Error duplicating template:", error);
    return NextResponse.json(
      { error: "Failed to duplicate template" },
      { status: 500 }
    );
  }
}

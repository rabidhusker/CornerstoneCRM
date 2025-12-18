import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/v1/templates/[id] - Get single template
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

    // Fetch template with creator info
    const { data: template, error } = await (supabase as any)
      .from("crm_email_templates")
      .select(`
        *,
        creator:created_by(
          id,
          full_name,
          avatar_url
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Error fetching template:", error);
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/templates/[id] - Update template
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

    // Build update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Only update provided fields
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.subject_line !== undefined) updateData.subject_line = body.subject_line;
    if (body.content_html !== undefined) updateData.content_html = body.content_html;
    if (body.content_text !== undefined) updateData.content_text = body.content_text;
    if (body.thumbnail_url !== undefined) updateData.thumbnail_url = body.thumbnail_url;
    if (body.is_default !== undefined) updateData.is_default = body.is_default;

    const { data: template, error } = await (supabase as any)
      .from("crm_email_templates")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Error updating template:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/templates/[id] - Delete template
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

    // Check if template exists
    const { data: existing, error: fetchError } = await (supabase as any)
      .from("crm_email_templates")
      .select("id, is_default")
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

    // Prevent deleting default templates
    if (existing.is_default) {
      return NextResponse.json(
        { error: "Cannot delete default templates" },
        { status: 400 }
      );
    }

    // Delete template
    const { error } = await (supabase as any)
      .from("crm_email_templates")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}

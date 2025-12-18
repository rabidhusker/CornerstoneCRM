import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/v1/templates - List email templates
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    // Build query
    let query = (supabase as any)
      .from("crm_email_templates")
      .select(`
        *,
        creator:created_by(
          id,
          full_name,
          avatar_url
        )
      `)
      .order("updated_at", { ascending: false });

    // Apply category filter
    if (category) {
      query = query.eq("category", category);
    }

    // Apply search filter
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.or(
        `name.ilike.${searchTerm},description.ilike.${searchTerm},subject_line.ilike.${searchTerm}`
      );
    }

    const { data: templates, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      templates: templates || [],
    });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// POST /api/v1/templates - Create new template
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

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: "Template name is required" },
        { status: 400 }
      );
    }

    // Create template
    const insertData = {
      workspace_id: workspaceMember.workspace_id,
      created_by: user.id,
      name: body.name,
      description: body.description || null,
      category: body.category || "other",
      subject_line: body.subject_line || null,
      content_html: body.content_html || null,
      content_text: body.content_text || null,
      thumbnail_url: body.thumbnail_url || null,
      is_default: body.is_default || false,
    };

    const { data: template, error } = await (supabase as any)
      .from("crm_email_templates")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}

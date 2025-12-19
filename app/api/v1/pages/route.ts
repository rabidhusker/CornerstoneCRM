import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";
import { defaultPageSettings, generateSlug } from "@/types/page";

// GET /api/v1/pages - List pages with filtering
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
    const status = searchParams.getAll("status");
    const search = searchParams.get("search");

    // Build query
    let query = (supabase as any)
      .from("crm_landing_pages")
      .select(`
        *,
        creator:created_by(
          id,
          full_name,
          avatar_url
        )
      `)
      .order("updated_at", { ascending: false });

    // Apply status filter
    if (status.length > 0) {
      query = query.in("status", status);
    }

    // Apply search filter
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm},slug.ilike.${searchTerm}`);
    }

    const { data: pages, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      pages: pages || [],
    });
  } catch (error) {
    console.error("Error fetching pages:", error);
    return NextResponse.json(
      { error: "Failed to fetch pages" },
      { status: 500 }
    );
  }
}

// POST /api/v1/pages - Create new page
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
    if (!body.title) {
      return NextResponse.json(
        { error: "Page title is required" },
        { status: 400 }
      );
    }

    // Generate slug if not provided
    let slug = body.slug || generateSlug(body.title);

    // Ensure slug is unique
    const { data: existingPage } = await (supabase as any)
      .from("crm_landing_pages")
      .select("id")
      .eq("workspace_id", workspaceMember.workspace_id)
      .eq("slug", slug)
      .single();

    if (existingPage) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // Create page
    const insertData = {
      workspace_id: workspaceMember.workspace_id,
      created_by: user.id,
      title: body.title,
      slug,
      description: body.description || null,
      status: body.status || "draft",
      config: (body.config || { blocks: [] }) as Json,
      settings: (body.settings || defaultPageSettings) as Json,
      views_count: 0,
      conversions_count: 0,
      conversion_rate: 0,
    };

    const { data: page, error } = await (supabase as any)
      .from("crm_landing_pages")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ page }, { status: 201 });
  } catch (error) {
    console.error("Error creating page:", error);
    return NextResponse.json(
      { error: "Failed to create page" },
      { status: 500 }
    );
  }
}

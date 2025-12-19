import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";
import { defaultFormSettings, defaultFormStyles } from "@/types/form";

// GET /api/v1/forms - List forms with filtering
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
      .from("crm_forms")
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
      query = query.or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`);
    }

    const { data: forms, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      forms: forms || [],
    });
  } catch (error) {
    console.error("Error fetching forms:", error);
    return NextResponse.json(
      { error: "Failed to fetch forms" },
      { status: 500 }
    );
  }
}

// POST /api/v1/forms - Create new form
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
        { error: "Form name is required" },
        { status: 400 }
      );
    }

    // Create form
    const insertData = {
      workspace_id: workspaceMember.workspace_id,
      created_by: user.id,
      name: body.name,
      description: body.description || null,
      status: body.status || "draft",
      config: (body.config || { fields: [] }) as Json,
      settings: (body.settings || defaultFormSettings) as Json,
      styles: (body.styles || defaultFormStyles) as Json,
      submissions_count: 0,
      views_count: 0,
      conversion_rate: 0,
    };

    const { data: form, error } = await (supabase as any)
      .from("crm_forms")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ form }, { status: 201 });
  } catch (error) {
    console.error("Error creating form:", error);
    return NextResponse.json(
      { error: "Failed to create form" },
      { status: 500 }
    );
  }
}

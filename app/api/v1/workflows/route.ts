import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/v1/workflows - List all workflows
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
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    // Build query
    let query = (supabase as any)
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
      .order("updated_at", { ascending: false });

    // Apply status filter
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: workflows, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      workflows: workflows || [],
      total: workflows?.length || 0,
    });
  } catch (error) {
    console.error("Error fetching workflows:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflows" },
      { status: 500 }
    );
  }
}

// POST /api/v1/workflows - Create a new workflow
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, trigger, steps, settings } = body;

    // Validate required fields
    if (!name || !trigger) {
      return NextResponse.json(
        { error: "Name and trigger are required" },
        { status: 400 }
      );
    }

    // Get user's workspace
    const { data: profile } = await (supabase as any)
      .from("profiles")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    if (!profile?.workspace_id) {
      return NextResponse.json(
        { error: "User workspace not found" },
        { status: 400 }
      );
    }

    // Create workflow
    const { data: workflow, error } = await (supabase as any)
      .from("crm_workflows")
      .insert({
        workspace_id: profile.workspace_id,
        name,
        description: description || null,
        status: "draft",
        trigger,
        steps: steps || [],
        settings: settings || { allow_re_enrollment: false },
        enrolled_count: 0,
        completed_count: 0,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(workflow, { status: 201 });
  } catch (error) {
    console.error("Error creating workflow:", error);
    return NextResponse.json(
      { error: "Failed to create workflow" },
      { status: 500 }
    );
  }
}

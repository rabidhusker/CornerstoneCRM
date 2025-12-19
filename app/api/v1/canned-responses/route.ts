import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/v1/canned-responses - List canned responses
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    // Fetch responses (user's own + shared ones from workspace)
    const { data: responses, error } = await (supabase as any)
      .from("crm_canned_responses")
      .select("*")
      .eq("workspace_id", workspaceMember.workspace_id)
      .or(`created_by.eq.${user.id},is_shared.eq.true`)
      .order("usage_count", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ responses: responses || [] });
  } catch (error) {
    console.error("Error fetching canned responses:", error);
    return NextResponse.json(
      { error: "Failed to fetch canned responses" },
      { status: 500 }
    );
  }
}

// POST /api/v1/canned-responses - Create canned response
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
    if (!body.name || !body.content) {
      return NextResponse.json(
        { error: "Name and content are required" },
        { status: 400 }
      );
    }

    // Create canned response
    const insertData = {
      workspace_id: workspaceMember.workspace_id,
      created_by: user.id,
      name: body.name,
      shortcut: body.shortcut || null,
      content: body.content,
      category: body.category || null,
      is_shared: body.is_shared || false,
      usage_count: 0,
    };

    const { data: response, error } = await (supabase as any)
      .from("crm_canned_responses")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ response }, { status: 201 });
  } catch (error) {
    console.error("Error creating canned response:", error);
    return NextResponse.json(
      { error: "Failed to create canned response" },
      { status: 500 }
    );
  }
}

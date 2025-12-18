import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

// GET /api/v1/campaigns - List campaigns with filtering
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
    const type = searchParams.get("type");
    const status = searchParams.getAll("status");
    const search = searchParams.get("search");

    // Build query
    let query = (supabase as any)
      .from("crm_campaigns")
      .select(`
        *,
        creator:created_by(
          id,
          full_name,
          avatar_url
        )
      `)
      .order("updated_at", { ascending: false });

    // Apply type filter
    if (type) {
      query = query.eq("type", type);
    }

    // Apply status filter
    if (status.length > 0) {
      query = query.in("status", status);
    }

    // Apply search filter
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`);
    }

    const { data: campaigns, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      campaigns: campaigns || [],
    });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

// POST /api/v1/campaigns - Create new campaign
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
        { error: "Campaign name is required" },
        { status: 400 }
      );
    }

    if (!body.type || !["email", "sms", "drip"].includes(body.type)) {
      return NextResponse.json(
        { error: "Valid campaign type is required (email, sms, or drip)" },
        { status: 400 }
      );
    }

    // Create campaign
    const insertData = {
      workspace_id: workspaceMember.workspace_id,
      created_by: user.id,
      name: body.name,
      description: body.description || null,
      type: body.type,
      status: "draft",
      subject_line: body.subject_line || null,
      content_html: body.content_html || null,
      content_text: body.content_text || null,
      settings: (body.settings || {}) as Json,
      scheduled_at: body.scheduled_at || null,
      recipients_count: 0,
      sent_count: 0,
      delivered_count: 0,
      opened_count: 0,
      clicked_count: 0,
      bounced_count: 0,
      unsubscribed_count: 0,
    };

    const { data: campaign, error } = await (supabase as any)
      .from("crm_campaigns")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/v1/conversations - List conversations with filters
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
    const channels = searchParams.getAll("channel");
    const statuses = searchParams.getAll("status");
    const assignedTo = searchParams.get("assigned_to");
    const search = searchParams.get("search");

    // Build query
    let query = (supabase as any)
      .from("crm_conversations")
      .select(`
        *,
        contact:contact_id(
          id,
          first_name,
          last_name,
          email,
          phone,
          company_name
        ),
        assigned_user:assigned_to(
          id,
          full_name,
          avatar_url
        )
      `)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    // Apply channel filter
    if (channels.length > 0) {
      query = query.in("channel", channels);
    }

    // Apply status filter
    if (statuses.length > 0) {
      query = query.in("status", statuses);
    }

    // Apply assigned_to filter
    if (assignedTo) {
      query = query.eq("assigned_to", assignedTo);
    }

    // Apply search filter (search in subject and last_message_preview)
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.or(
        `subject.ilike.${searchTerm},last_message_preview.ilike.${searchTerm}`
      );
    }

    const { data: conversations, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      conversations: conversations || [],
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

// POST /api/v1/conversations - Create a new conversation
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
    if (!body.contact_id) {
      return NextResponse.json(
        { error: "Contact ID is required" },
        { status: 400 }
      );
    }

    if (!body.channel || !["email", "sms"].includes(body.channel)) {
      return NextResponse.json(
        { error: "Valid channel is required" },
        { status: 400 }
      );
    }

    // Create conversation
    const insertData = {
      workspace_id: workspaceMember.workspace_id,
      contact_id: body.contact_id,
      channel: body.channel,
      status: body.status || "open",
      subject: body.subject || null,
      assigned_to: body.assigned_to || user.id,
      unread_count: 0,
      metadata: {},
    };

    const { data: conversation, error } = await (supabase as any)
      .from("crm_conversations")
      .insert(insertData)
      .select(`
        *,
        contact:contact_id(
          id,
          first_name,
          last_name,
          email,
          phone,
          company_name
        ),
        assigned_user:assigned_to(
          id,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}

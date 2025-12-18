import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/v1/contacts/[id]/activities - Fetch activities for a contact
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { id: contactId } = await params;
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const type = searchParams.get("type");

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Build query
    let query = supabase
      .from("crm_activities")
      .select(
        `
        *,
        user:users!crm_activities_user_id_fkey(id, full_name, avatar_url)
      `,
        { count: "exact" }
      )
      .eq("contact_id", contactId);

    // Filter by type if provided
    if (type) {
      query = query.eq("type", type);
    }

    // Order by created_at descending
    query = query.order("created_at", { ascending: false });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: activities, error, count } = await (query as any);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      activities: activities || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}

// POST /api/v1/contacts/[id]/activities - Create new activity
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { id: contactId } = await params;
    const body = await request.json();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's workspace
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    if (!body.type || !body.title) {
      return NextResponse.json(
        { error: "Type and title are required" },
        { status: 400 }
      );
    }

    // Create activity
    const insertData = {
      workspace_id: workspaceMember.workspace_id,
      user_id: user.id,
      contact_id: contactId,
      type: body.type,
      title: body.title,
      description: body.description || null,
      due_date: body.dueDate || null,
      outcome: body.outcome || null,
      deal_id: body.dealId || null,
      metadata: (body.metadata || {}) as Json,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: activity, error } = await (supabase as any)
      .from("crm_activities")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update contact's last_contacted_at if it's a communication activity
    const communicationTypes = ["call", "email", "meeting"];
    if (communicationTypes.includes(body.type)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("crm_contacts")
        .update({
          last_contacted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", contactId);
    }

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json(
      { error: "Failed to create activity" },
      { status: 500 }
    );
  }
}

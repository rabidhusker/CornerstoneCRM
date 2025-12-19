import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

// GET /api/v1/appointments - List appointments with filters
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const contactId = searchParams.get("contactId");
    const dealId = searchParams.get("dealId");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build query
    let query = (supabase as any)
      .from("crm_appointments")
      .select(`
        *,
        contact:contact_id(
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        deal:deal_id(
          id,
          title,
          value
        ),
        user:user_id(
          id,
          full_name,
          avatar_url
        )
      `)
      .eq("workspace_id", workspaceMember.workspace_id);

    // Apply filters
    if (userId && userId !== "all") {
      query = query.eq("user_id", userId === "me" ? user.id : userId);
    }

    if (contactId) {
      query = query.eq("contact_id", contactId);
    }

    if (dealId) {
      query = query.eq("deal_id", dealId);
    }

    if (status) {
      const statusArray = status.split(",");
      query = query.in("status", statusArray);
    }

    if (type) {
      const typeArray = type.split(",");
      query = query.in("showing_type", typeArray);
    }

    if (startDate) {
      query = query.gte("start_time", startDate);
    }

    if (endDate) {
      query = query.lte("start_time", endDate);
    }

    // Order by start time
    query = query.order("start_time", { ascending: true });

    const { data: appointments, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ appointments: appointments || [] });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}

// POST /api/v1/appointments - Create a new appointment
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
    if (!body.title || !body.start_time || !body.end_time) {
      return NextResponse.json(
        { error: "Title, start_time, and end_time are required" },
        { status: 400 }
      );
    }

    // Validate times
    const startTime = new Date(body.start_time);
    const endTime = new Date(body.end_time);

    if (startTime >= endTime) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    // Build insert data
    const insertData = {
      workspace_id: workspaceMember.workspace_id,
      user_id: user.id,
      title: body.title,
      description: body.description || null,
      contact_id: body.contact_id || null,
      deal_id: body.deal_id || null,
      start_time: body.start_time,
      end_time: body.end_time,
      all_day: body.all_day || false,
      timezone: body.timezone || "America/New_York",
      location: body.location || null,
      showing_type: body.showing_type || "meeting",
      status: "scheduled",
      reminder_minutes: body.reminder_minutes || [30],
      reminder_sent: false,
      metadata: (body.metadata || {}) as Json,
    };

    const { data: appointment, error } = await (supabase as any)
      .from("crm_appointments")
      .insert(insertData)
      .select(`
        *,
        contact:contact_id(
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        deal:deal_id(
          id,
          title,
          value
        ),
        user:user_id(
          id,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    // Create activity record for the contact
    if (body.contact_id) {
      await (supabase as any).from("crm_activities").insert({
        workspace_id: workspaceMember.workspace_id,
        user_id: user.id,
        contact_id: body.contact_id,
        deal_id: body.deal_id || null,
        type: "meeting",
        title: `Appointment scheduled: ${body.title}`,
        description: body.description || null,
        scheduled_at: body.start_time,
        is_completed: false,
      });
    }

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 }
    );
  }
}

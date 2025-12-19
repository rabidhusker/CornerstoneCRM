import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

// GET /api/v1/appointments/[id] - Get single appointment
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

    const { data: appointment, error } = await (supabase as any)
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
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Appointment not found" },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointment" },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/appointments/[id] - Update appointment
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

    // Validate times if both provided
    if (body.start_time && body.end_time) {
      const startTime = new Date(body.start_time);
      const endTime = new Date(body.end_time);

      if (startTime >= endTime) {
        return NextResponse.json(
          { error: "End time must be after start time" },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.contact_id !== undefined) updateData.contact_id = body.contact_id;
    if (body.deal_id !== undefined) updateData.deal_id = body.deal_id;
    if (body.start_time !== undefined) updateData.start_time = body.start_time;
    if (body.end_time !== undefined) updateData.end_time = body.end_time;
    if (body.all_day !== undefined) updateData.all_day = body.all_day;
    if (body.timezone !== undefined) updateData.timezone = body.timezone;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.showing_type !== undefined) updateData.showing_type = body.showing_type;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.reminder_minutes !== undefined) updateData.reminder_minutes = body.reminder_minutes;
    if (body.showing_feedback !== undefined) updateData.showing_feedback = body.showing_feedback;
    if (body.metadata !== undefined) updateData.metadata = body.metadata as Json;

    const { data: appointment, error } = await (supabase as any)
      .from("crm_appointments")
      .update(updateData)
      .eq("id", id)
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

    // Create activity for status changes
    if (body.status && (body.status === "completed" || body.status === "no_show" || body.status === "cancelled")) {
      const statusLabels: Record<string, string> = {
        completed: "completed",
        no_show: "marked as no-show",
        cancelled: "cancelled",
      };
      const statusLabel = statusLabels[body.status as string];

      // Get workspace from appointment
      const { data: apt } = await (supabase as any)
        .from("crm_appointments")
        .select("workspace_id, contact_id, deal_id, title")
        .eq("id", id)
        .single();

      if (apt && apt.contact_id) {
        await (supabase as any).from("crm_activities").insert({
          workspace_id: apt.workspace_id,
          user_id: user.id,
          contact_id: apt.contact_id,
          deal_id: apt.deal_id,
          type: "note",
          title: `Appointment ${statusLabel}: ${apt.title}`,
          is_completed: true,
          completed_at: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { error: "Failed to update appointment" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/appointments/[id] - Cancel/delete appointment
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

    // Get appointment details for activity log
    const { data: apt } = await (supabase as any)
      .from("crm_appointments")
      .select("workspace_id, contact_id, deal_id, title")
      .eq("id", id)
      .single();

    // Update status to cancelled instead of deleting
    const { error } = await (supabase as any)
      .from("crm_appointments")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      throw error;
    }

    // Create activity for cancellation
    if (apt && apt.contact_id) {
      await (supabase as any).from("crm_activities").insert({
        workspace_id: apt.workspace_id,
        user_id: user.id,
        contact_id: apt.contact_id,
        deal_id: apt.deal_id,
        type: "note",
        title: `Appointment cancelled: ${apt.title}`,
        is_completed: true,
        completed_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return NextResponse.json(
      { error: "Failed to cancel appointment" },
      { status: 500 }
    );
  }
}

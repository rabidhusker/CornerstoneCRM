import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/v1/conversations/[id] - Get single conversation
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

    const { data: conversation, error } = await (supabase as any)
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
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/conversations/[id] - Update conversation
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

    // Build update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.status !== undefined) {
      if (!["open", "closed", "snoozed"].includes(body.status)) {
        return NextResponse.json(
          { error: "Invalid status" },
          { status: 400 }
        );
      }
      updateData.status = body.status;
    }

    if (body.assigned_to !== undefined) {
      updateData.assigned_to = body.assigned_to;
    }

    if (body.subject !== undefined) {
      updateData.subject = body.subject;
    }

    if (body.snoozed_until !== undefined) {
      updateData.snoozed_until = body.snoozed_until;
    }

    const { data: conversation, error } = await (supabase as any)
      .from("crm_conversations")
      .update(updateData)
      .eq("id", id)
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

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error("Error updating conversation:", error);
    return NextResponse.json(
      { error: "Failed to update conversation" },
      { status: 500 }
    );
  }
}

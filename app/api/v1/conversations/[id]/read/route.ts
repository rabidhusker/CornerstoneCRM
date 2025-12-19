import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/v1/conversations/[id]/read - Mark conversation as read
export async function POST(
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

    // Reset unread count
    const { error: convError } = await (supabase as any)
      .from("crm_conversations")
      .update({
        unread_count: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (convError) {
      throw convError;
    }

    // Mark all inbound messages as read
    const { error: msgError } = await (supabase as any)
      .from("crm_conversation_messages")
      .update({
        status: "read",
        read_at: new Date().toISOString(),
      })
      .eq("conversation_id", id)
      .eq("direction", "inbound")
      .neq("status", "read");

    if (msgError) {
      throw msgError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking conversation as read:", error);
    return NextResponse.json(
      { error: "Failed to mark conversation as read" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

// GET /api/v1/conversations/[id]/messages - Get messages in conversation
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

    // Fetch messages
    const { data: messages, error } = await (supabase as any)
      .from("crm_conversation_messages")
      .select(`
        *,
        sender:sender_id(
          id,
          full_name,
          avatar_url
        )
      `)
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST /api/v1/conversations/[id]/messages - Send a new message
export async function POST(
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

    // Validate content
    if (!body.content || !body.content.trim()) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    // Get conversation to determine channel
    const { data: conversation, error: convError } = await (supabase as any)
      .from("crm_conversations")
      .select("channel, contact_id")
      .eq("id", id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const channel = body.channel || conversation.channel;

    // Create message
    const messageData = {
      conversation_id: id,
      sender_id: user.id,
      direction: "outbound",
      channel,
      subject: body.subject || null,
      content: body.content.trim(),
      content_html: body.content_html || null,
      status: "pending",
      attachments: (body.attachments || []) as Json,
      metadata: {} as Json,
    };

    const { data: message, error: msgError } = await (supabase as any)
      .from("crm_conversation_messages")
      .insert(messageData)
      .select(`
        *,
        sender:sender_id(
          id,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (msgError) {
      throw msgError;
    }

    // Update conversation with last message info
    const preview = body.content.trim().substring(0, 100);
    await (supabase as any)
      .from("crm_conversations")
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: preview,
        status: "open", // Reopen if closed
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    // TODO: Actually send the message via email/SMS service
    // For now, we'll just mark it as sent
    await (supabase as any)
      .from("crm_conversation_messages")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", message.id);

    // Update contact's last_contacted_at
    await (supabase as any)
      .from("crm_contacts")
      .update({
        last_contacted_at: new Date().toISOString(),
      })
      .eq("id", conversation.contact_id);

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

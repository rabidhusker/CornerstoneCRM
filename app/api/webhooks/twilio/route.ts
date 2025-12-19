import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

// POST /api/webhooks/twilio - Handle inbound SMS from Twilio
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Parse form data from Twilio
    const formData = await request.formData();

    const messageSid = formData.get("MessageSid") as string;
    const from = formData.get("From") as string;
    const to = formData.get("To") as string;
    const body = formData.get("Body") as string;
    const numMedia = parseInt((formData.get("NumMedia") as string) || "0");

    // Validate required fields
    if (!messageSid || !from || !to || body === null) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Normalize phone numbers
    const fromNumber = normalizePhone(from);
    const toNumber = normalizePhone(to);

    // Find contact by phone number
    let contact = await findContactByPhone(supabase, fromNumber);

    // If no contact found, create one
    if (!contact) {
      contact = await createContact(supabase, fromNumber);
    }

    if (!contact) {
      console.error("Failed to find or create contact for phone:", fromNumber);
      return NextResponse.json(
        { error: "Failed to process contact" },
        { status: 500 }
      );
    }

    // Find or create conversation
    let conversation = await findConversation(
      supabase,
      contact.id,
      contact.workspace_id
    );

    if (!conversation) {
      conversation = await createConversation(
        supabase,
        contact.id,
        contact.workspace_id
      );
    }

    if (!conversation) {
      console.error("Failed to find or create conversation");
      return NextResponse.json(
        { error: "Failed to process conversation" },
        { status: 500 }
      );
    }

    // Collect media attachments
    const attachments: string[] = [];
    for (let i = 0; i < numMedia; i++) {
      const mediaUrl = formData.get(`MediaUrl${i}`) as string;
      if (mediaUrl) {
        attachments.push(mediaUrl);
      }
    }

    // Create message
    const messageData = {
      conversation_id: conversation.id,
      sender_id: null, // Inbound from contact
      direction: "inbound",
      channel: "sms",
      content: body,
      status: "delivered",
      external_id: messageSid,
      attachments: attachments as Json,
      metadata: {
        from: from,
        to: to,
        twilio_sid: messageSid,
      } as Json,
      delivered_at: new Date().toISOString(),
    };

    const { data: message, error: msgError } = await (supabase as any)
      .from("crm_conversation_messages")
      .insert(messageData)
      .select()
      .single();

    if (msgError) {
      console.error("Failed to create message:", msgError);
      throw msgError;
    }

    // Update conversation with last message info
    const preview = body.substring(0, 100);
    await (supabase as any)
      .from("crm_conversations")
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: preview,
        unread_count: (conversation.unread_count || 0) + 1,
        status: "open", // Reopen if closed
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversation.id);

    // Update contact's last_contacted_at
    await (supabase as any)
      .from("crm_contacts")
      .update({
        last_contacted_at: new Date().toISOString(),
      })
      .eq("id", contact.id);

    // TODO: Notify assigned user (via email, push notification, etc.)

    // Return TwiML response (empty response acknowledges receipt)
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        headers: {
          "Content-Type": "text/xml",
        },
      }
    );
  } catch (error) {
    console.error("Error processing Twilio webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

// Helper function to normalize phone numbers
function normalizePhone(phone: string): string {
  // Remove all non-digit characters except leading +
  const cleaned = phone.replace(/[^\d+]/g, "");

  // If starts with +1, keep it; otherwise add +1 for US numbers
  if (cleaned.startsWith("+")) {
    return cleaned;
  }

  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }

  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `+${cleaned}`;
  }

  return `+${cleaned}`;
}

// Find contact by phone number
async function findContactByPhone(supabase: any, phone: string) {
  // Try exact match first
  const { data: contact, error } = await supabase
    .from("crm_contacts")
    .select("id, workspace_id")
    .eq("phone", phone)
    .limit(1)
    .single();

  if (contact) {
    return contact;
  }

  // Try without country code
  const phoneWithoutCode = phone.replace(/^\+1/, "");
  const { data: contact2 } = await supabase
    .from("crm_contacts")
    .select("id, workspace_id")
    .eq("phone", phoneWithoutCode)
    .limit(1)
    .single();

  return contact2 || null;
}

// Create a new contact from phone number
async function createContact(supabase: any, phone: string) {
  // Get a default workspace (this should be configured per-account in production)
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .limit(1)
    .single();

  if (!workspace) {
    console.error("No workspace found for creating contact");
    return null;
  }

  const { data: contact, error } = await supabase
    .from("crm_contacts")
    .insert({
      workspace_id: workspace.id,
      first_name: "Unknown",
      last_name: phone,
      phone: phone,
      type: "other",
      status: "active",
      source: "sms",
      source_detail: "Inbound SMS",
    })
    .select("id, workspace_id")
    .single();

  if (error) {
    console.error("Failed to create contact:", error);
    return null;
  }

  return contact;
}

// Find existing conversation
async function findConversation(
  supabase: any,
  contactId: string,
  workspaceId: string
) {
  const { data: conversation } = await supabase
    .from("crm_conversations")
    .select("id, unread_count")
    .eq("contact_id", contactId)
    .eq("workspace_id", workspaceId)
    .eq("channel", "sms")
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return conversation || null;
}

// Create new conversation
async function createConversation(
  supabase: any,
  contactId: string,
  workspaceId: string
) {
  const { data: conversation, error } = await supabase
    .from("crm_conversations")
    .insert({
      workspace_id: workspaceId,
      contact_id: contactId,
      channel: "sms",
      status: "open",
      unread_count: 0,
      metadata: {},
    })
    .select("id, unread_count")
    .single();

  if (error) {
    console.error("Failed to create conversation:", error);
    return null;
  }

  return conversation;
}

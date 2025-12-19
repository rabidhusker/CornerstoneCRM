import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail, sendEmailWithRetry } from "@/lib/email/send-email";
import { queueEmail } from "@/lib/email/email-queue";
import { renderTemplate, type EmailTemplateType, type TemplateVariables } from "@/lib/email/email-templates";
import type { Json } from "@/types/database";

// POST /api/v1/messages/email - Send an email
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
    if (!body.to) {
      return NextResponse.json(
        { error: "Recipient email (to) is required" },
        { status: 400 }
      );
    }

    if (!body.subject) {
      return NextResponse.json(
        { error: "Subject is required" },
        { status: 400 }
      );
    }

    // Build email content
    let html = body.html;
    let text = body.text;
    let subject = body.subject;

    // If template specified, render it
    if (body.template) {
      const templateType = body.template as EmailTemplateType;
      const templateVars = (body.templateVariables || {}) as TemplateVariables;
      const rendered = renderTemplate(templateType, templateVars);

      html = html || rendered.html;
      text = text || rendered.text;
      subject = subject || rendered.subject;
    }

    if (!html && !text) {
      return NextResponse.json(
        { error: "Email body (html or text) or template is required" },
        { status: 400 }
      );
    }

    // Check if this should be queued for later
    const shouldQueue = body.queue === true || body.scheduledAt;

    if (shouldQueue) {
      // Queue the email
      const queueResult = await queueEmail({
        workspaceId: workspaceMember.workspace_id,
        conversationId: body.conversationId,
        contactId: body.contactId,
        to: body.to,
        from: body.from,
        replyTo: body.replyTo,
        subject,
        html,
        text,
        attachments: body.attachments,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
        metadata: body.metadata,
      });

      if (!queueResult.success) {
        return NextResponse.json(
          { error: queueResult.error || "Failed to queue email" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        queued: true,
        queueId: queueResult.queueId,
        message: body.scheduledAt
          ? `Email scheduled for ${body.scheduledAt}`
          : "Email queued for sending",
      });
    }

    // Send immediately
    const emailResult = await sendEmailWithRetry({
      to: body.to,
      from: body.from,
      replyTo: body.replyTo,
      subject,
      html,
      text,
      attachments: body.attachments,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: emailResult.error || "Failed to send email" },
        { status: 500 }
      );
    }

    // If linked to a conversation, create/update message record
    if (body.conversationId) {
      await createConversationMessage(
        supabase,
        body.conversationId,
        user.id,
        subject,
        text || html,
        html,
        emailResult.messageId
      );
    }

    // If linked to a contact, update last_contacted_at
    if (body.contactId) {
      await (supabase as any)
        .from("crm_contacts")
        .update({
          last_contacted_at: new Date().toISOString(),
        })
        .eq("id", body.contactId);
    }

    return NextResponse.json({
      success: true,
      messageId: emailResult.messageId,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}

// Helper to create conversation message
async function createConversationMessage(
  supabase: any,
  conversationId: string,
  senderId: string,
  subject: string,
  content: string,
  contentHtml: string | undefined,
  externalId: string | undefined
) {
  try {
    const messageData = {
      conversation_id: conversationId,
      sender_id: senderId,
      direction: "outbound",
      channel: "email",
      subject,
      content,
      content_html: contentHtml,
      status: "sent",
      external_id: externalId,
      sent_at: new Date().toISOString(),
      attachments: [] as Json,
      metadata: {} as Json,
    };

    const { data: message, error } = await supabase
      .from("crm_conversation_messages")
      .insert(messageData)
      .select()
      .single();

    if (error) {
      console.error("Failed to create conversation message:", error);
      return;
    }

    // Update conversation
    await supabase
      .from("crm_conversations")
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: content.substring(0, 100),
        status: "open",
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    return message;
  } catch (error) {
    console.error("Error creating conversation message:", error);
  }
}

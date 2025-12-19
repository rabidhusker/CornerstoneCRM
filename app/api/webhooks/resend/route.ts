import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

// Resend webhook event types
type ResendEventType =
  | "email.sent"
  | "email.delivered"
  | "email.delivery_delayed"
  | "email.complained"
  | "email.bounced"
  | "email.opened"
  | "email.clicked";

// Resend webhook payload
interface ResendWebhookPayload {
  type: ResendEventType;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    // Additional fields for specific events
    click?: {
      link: string;
      timestamp: string;
    };
    bounce?: {
      message: string;
    };
  };
}

// POST /api/webhooks/resend - Handle Resend webhook events
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("svix-signature");
    const timestamp = request.headers.get("svix-timestamp");
    const webhookId = request.headers.get("svix-id");

    // Verify webhook signature (optional but recommended)
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (webhookSecret && signature && timestamp) {
      const isValid = verifyWebhookSignature(
        body,
        signature,
        timestamp,
        webhookSecret
      );
      if (!isValid) {
        console.error("Invalid webhook signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    const payload: ResendWebhookPayload = JSON.parse(body);
    const { type, data } = payload;

    console.log(`Received Resend webhook: ${type} for email ${data.email_id}`);

    const supabase = await createClient();

    // Map Resend event to our status
    const statusMap: Record<ResendEventType, string> = {
      "email.sent": "sent",
      "email.delivered": "delivered",
      "email.delivery_delayed": "pending",
      "email.complained": "failed",
      "email.bounced": "failed",
      "email.opened": "read",
      "email.clicked": "read",
    };

    const newStatus = statusMap[type] || "sent";

    // Update email queue status if exists
    await updateEmailQueueStatus(supabase, data.email_id, type, newStatus, payload);

    // Update conversation message status if linked
    await updateConversationMessageStatus(supabase, data.email_id, type, newStatus, payload);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing Resend webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

// Verify Resend webhook signature using Svix
function verifyWebhookSignature(
  body: string,
  signature: string,
  timestamp: string,
  secret: string
): boolean {
  try {
    // Parse the secret (remove whsec_ prefix if present)
    const secretKey = secret.startsWith("whsec_")
      ? secret.slice(6)
      : secret;

    // Create the signed content
    const signedContent = `${timestamp}.${body}`;

    // Parse signature header to get the v1 signature
    const signatureParts = signature.split(",");
    const v1Signature = signatureParts
      .find((part) => part.startsWith("v1,"))
      ?.slice(3);

    if (!v1Signature) {
      return false;
    }

    // Calculate expected signature
    const hmac = crypto.createHmac("sha256", Buffer.from(secretKey, "base64"));
    hmac.update(signedContent);
    const expectedSignature = hmac.digest("base64");

    // Compare signatures
    return crypto.timingSafeEqual(
      Buffer.from(v1Signature, "base64"),
      Buffer.from(expectedSignature, "base64")
    );
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

// Update email queue status
async function updateEmailQueueStatus(
  supabase: any,
  emailId: string,
  eventType: ResendEventType,
  status: string,
  payload: ResendWebhookPayload
) {
  try {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Map status for queue table
    if (status === "delivered" || status === "read") {
      updateData.status = "sent";
    } else if (status === "failed") {
      updateData.status = "failed";
      updateData.error = payload.data.bounce?.message || `Email ${eventType.replace("email.", "")}`;
    }

    if (eventType === "email.delivered") {
      updateData.sent_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("crm_email_queue")
      .update(updateData)
      .eq("external_id", emailId);

    if (error) {
      console.error("Failed to update email queue:", error);
    }
  } catch (error) {
    console.error("Error updating email queue status:", error);
  }
}

// Update conversation message status
async function updateConversationMessageStatus(
  supabase: any,
  emailId: string,
  eventType: ResendEventType,
  status: string,
  payload: ResendWebhookPayload
) {
  try {
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    // Add timestamp for specific events
    switch (eventType) {
      case "email.delivered":
        updateData.delivered_at = new Date().toISOString();
        break;
      case "email.opened":
        updateData.read_at = new Date().toISOString();
        break;
      case "email.bounced":
      case "email.complained":
        updateData.metadata = {
          error: payload.data.bounce?.message || "Email delivery failed",
          event: eventType,
        };
        break;
    }

    const { error } = await supabase
      .from("crm_conversation_messages")
      .update(updateData)
      .eq("external_id", emailId);

    if (error) {
      console.error("Failed to update conversation message:", error);
    }
  } catch (error) {
    console.error("Error updating conversation message status:", error);
  }
}

// GET handler for webhook verification (if needed)
export async function GET(request: NextRequest) {
  return NextResponse.json({ status: "Resend webhook endpoint active" });
}

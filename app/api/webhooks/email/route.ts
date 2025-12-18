import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Email Provider Webhook Handler
 *
 * Handles webhook events from email providers (SendGrid, Resend, etc.)
 * Updates campaign_contacts table and campaign stats based on events.
 *
 * Supported events:
 * - delivered: Email was delivered to recipient
 * - opened: Recipient opened the email
 * - clicked: Recipient clicked a link
 * - bounced: Email bounced
 * - unsubscribed: Recipient unsubscribed
 * - dropped: Email was dropped/not sent
 * - spam_report: Recipient marked as spam
 */

// Event types we handle
type EmailEventType =
  | "delivered"
  | "opened"
  | "clicked"
  | "bounced"
  | "unsubscribed"
  | "dropped"
  | "spam_report";

interface EmailEvent {
  type: EmailEventType;
  email: string;
  timestamp: string;
  campaign_id?: string;
  contact_id?: string;
  link_url?: string;
  bounce_reason?: string;
  user_agent?: string;
  ip_address?: string;
}

// POST /api/webhooks/email - Handle email provider webhooks
export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature (implementation depends on provider)
    // For SendGrid, check X-Twilio-Email-Event-Webhook-Signature header
    // For Resend, check svix-signature header
    const isValid = await verifyWebhookSignature(request);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = await request.json();
    const events = normalizeEvents(body);

    if (!events || events.length === 0) {
      return NextResponse.json({ success: true, processed: 0 });
    }

    const supabase = await createClient();
    let processedCount = 0;

    for (const event of events) {
      try {
        await processEmailEvent(supabase, event);
        processedCount++;
      } catch (error) {
        console.error(`Error processing event:`, error);
        // Continue processing other events
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedCount,
      total: events.length,
    });
  } catch (error) {
    console.error("Error processing email webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

// Verify webhook signature based on provider
async function verifyWebhookSignature(request: NextRequest): Promise<boolean> {
  // Get provider from query param or header
  const provider = request.headers.get("x-email-provider") || "sendgrid";

  switch (provider) {
    case "sendgrid": {
      // SendGrid webhook verification
      const signature = request.headers.get("x-twilio-email-event-webhook-signature");
      const timestamp = request.headers.get("x-twilio-email-event-webhook-timestamp");

      // In production, verify using SendGrid's SDK or manual verification
      // For now, allow if we have the headers (development mode)
      if (process.env.NODE_ENV === "development") {
        return true;
      }

      return !!signature && !!timestamp;
    }

    case "resend": {
      // Resend webhook verification using Svix
      const svixId = request.headers.get("svix-id");
      const svixTimestamp = request.headers.get("svix-timestamp");
      const svixSignature = request.headers.get("svix-signature");

      // In production, verify using @svix/webhook package
      if (process.env.NODE_ENV === "development") {
        return true;
      }

      return !!svixId && !!svixTimestamp && !!svixSignature;
    }

    default:
      // Allow in development, deny in production
      return process.env.NODE_ENV === "development";
  }
}

// Normalize events from different providers into common format
function normalizeEvents(body: any): EmailEvent[] {
  // Handle array of events (SendGrid format)
  if (Array.isArray(body)) {
    return body
      .map(normalizeSendGridEvent)
      .filter((event): event is EmailEvent => event !== null);
  }

  // Handle single event object (Resend format)
  if (body.type) {
    const event = normalizeResendEvent(body);
    return event ? [event] : [];
  }

  // Handle wrapped events
  if (body.events) {
    return body.events
      .map(normalizeSendGridEvent)
      .filter((event: EmailEvent | null): event is EmailEvent => event !== null);
  }

  return [];
}

// Normalize SendGrid event format
function normalizeSendGridEvent(event: any): EmailEvent | null {
  if (!event.event || !event.email) {
    return null;
  }

  const eventMap: Record<string, EmailEventType> = {
    delivered: "delivered",
    open: "opened",
    click: "clicked",
    bounce: "bounced",
    unsubscribe: "unsubscribed",
    dropped: "dropped",
    spamreport: "spam_report",
  };

  const type = eventMap[event.event];
  if (!type) {
    return null;
  }

  return {
    type,
    email: event.email,
    timestamp: event.timestamp
      ? new Date(event.timestamp * 1000).toISOString()
      : new Date().toISOString(),
    campaign_id: event.campaign_id || event.sg_message_id,
    contact_id: event.contact_id,
    link_url: event.url,
    bounce_reason: event.reason || event.response,
    user_agent: event.useragent,
    ip_address: event.ip,
  };
}

// Normalize Resend event format
function normalizeResendEvent(event: any): EmailEvent | null {
  const eventMap: Record<string, EmailEventType> = {
    "email.delivered": "delivered",
    "email.opened": "opened",
    "email.clicked": "clicked",
    "email.bounced": "bounced",
    "email.unsubscribed": "unsubscribed",
    "email.complained": "spam_report",
  };

  const type = eventMap[event.type];
  if (!type) {
    return null;
  }

  const data = event.data || {};
  return {
    type,
    email: data.to?.[0] || data.email,
    timestamp: event.created_at || new Date().toISOString(),
    campaign_id: data.tags?.campaign_id,
    contact_id: data.tags?.contact_id,
    link_url: data.click?.link,
    bounce_reason: data.bounce?.message,
  };
}

// Process a single email event
async function processEmailEvent(supabase: any, event: EmailEvent) {
  if (!event.campaign_id && !event.contact_id) {
    // Can't process without campaign or contact reference
    return;
  }

  // Find campaign contact record
  let query = supabase.from("crm_campaign_contacts").select("*");

  if (event.campaign_id) {
    query = query.eq("campaign_id", event.campaign_id);
  }

  // Find by email if we don't have contact_id
  if (event.contact_id) {
    query = query.eq("contact_id", event.contact_id);
  } else {
    // Need to find contact by email
    const { data: contacts } = await supabase
      .from("crm_contacts")
      .select("id")
      .eq("email", event.email)
      .limit(1);

    if (contacts && contacts.length > 0) {
      query = query.eq("contact_id", contacts[0].id);
    } else {
      return; // Can't find contact
    }
  }

  const { data: campaignContact, error } = await query.single();

  if (error || !campaignContact) {
    return;
  }

  // Update campaign contact based on event type
  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  switch (event.type) {
    case "delivered":
      updates.status = "delivered";
      updates.delivered_at = event.timestamp;
      break;

    case "opened":
      // Only update status if not already clicked
      if (campaignContact.status !== "clicked") {
        updates.status = "opened";
      }
      if (!campaignContact.opened_at) {
        updates.opened_at = event.timestamp;
      }
      updates.open_count = (campaignContact.open_count || 0) + 1;
      break;

    case "clicked":
      updates.status = "clicked";
      if (!campaignContact.clicked_at) {
        updates.clicked_at = event.timestamp;
      }
      updates.click_count = (campaignContact.click_count || 0) + 1;

      // Track link click if URL provided
      if (event.link_url) {
        await trackLinkClick(supabase, campaignContact.campaign_id, event.link_url);
      }
      break;

    case "bounced":
      updates.status = "bounced";
      updates.bounced_at = event.timestamp;
      updates.bounce_reason = event.bounce_reason;
      break;

    case "unsubscribed":
      updates.status = "unsubscribed";

      // Also update contact's subscription status
      await supabase
        .from("crm_contacts")
        .update({ email_opt_in: false })
        .eq("id", campaignContact.contact_id);
      break;

    case "spam_report":
      updates.status = "bounced";
      updates.bounce_reason = "Marked as spam";
      break;
  }

  // Update campaign contact
  await supabase
    .from("crm_campaign_contacts")
    .update(updates)
    .eq("campaign_id", campaignContact.campaign_id)
    .eq("contact_id", campaignContact.contact_id);

  // Update campaign aggregate stats
  await updateCampaignStats(supabase, campaignContact.campaign_id, event.type);
}

// Track link click for click map
async function trackLinkClick(
  supabase: any,
  campaignId: string,
  linkUrl: string
) {
  // Check if link already exists
  const { data: existing } = await supabase
    .from("crm_campaign_link_clicks")
    .select("*")
    .eq("campaign_id", campaignId)
    .eq("url", linkUrl)
    .single();

  if (existing) {
    // Increment click count
    await supabase
      .from("crm_campaign_link_clicks")
      .update({
        clicks: existing.clicks + 1,
        last_click: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    // Create new link tracking record
    await supabase.from("crm_campaign_link_clicks").insert({
      campaign_id: campaignId,
      url: linkUrl,
      text: null, // Would need to parse from email content
      clicks: 1,
      unique_clicks: 1,
      first_click: new Date().toISOString(),
      last_click: new Date().toISOString(),
    });
  }
}

// Update campaign aggregate statistics
async function updateCampaignStats(
  supabase: any,
  campaignId: string,
  eventType: EmailEventType
) {
  const statField = getStatFieldForEvent(eventType);
  if (!statField) return;

  // Get current campaign
  const { data: campaign } = await supabase
    .from("crm_campaigns")
    .select(statField)
    .eq("id", campaignId)
    .single();

  if (!campaign) return;

  // Increment the appropriate stat
  await supabase
    .from("crm_campaigns")
    .update({
      [statField]: (campaign[statField] || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", campaignId);
}

function getStatFieldForEvent(eventType: EmailEventType): string | null {
  const mapping: Record<EmailEventType, string> = {
    delivered: "delivered_count",
    opened: "opened_count",
    clicked: "clicked_count",
    bounced: "bounced_count",
    unsubscribed: "unsubscribed_count",
    dropped: "bounced_count",
    spam_report: "bounced_count",
  };

  return mapping[eventType] || null;
}

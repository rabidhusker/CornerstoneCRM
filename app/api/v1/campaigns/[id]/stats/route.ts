import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/v1/campaigns/[id]/stats - Get detailed campaign statistics
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

    // Fetch campaign
    const { data: campaign, error: campaignError } = await (supabase as any)
      .from("crm_campaigns")
      .select("*")
      .eq("id", id)
      .single();

    if (campaignError) {
      if (campaignError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Campaign not found" },
          { status: 404 }
        );
      }
      throw campaignError;
    }

    // Calculate stats from campaign data
    const sent = campaign.sent_count || 0;
    const delivered = campaign.delivered_count || 0;
    const opened = campaign.opened_count || 0;
    const clicked = campaign.clicked_count || 0;
    const bounced = campaign.bounced_count || 0;
    const unsubscribed = campaign.unsubscribed_count || 0;

    const stats = {
      recipients_count: campaign.recipients_count || 0,
      sent_count: sent,
      delivered_count: delivered,
      opened_count: opened,
      clicked_count: clicked,
      bounced_count: bounced,
      unsubscribed_count: unsubscribed,
      delivery_rate: sent > 0 ? (delivered / sent) * 100 : 0,
      open_rate: delivered > 0 ? (opened / delivered) * 100 : 0,
      click_rate: delivered > 0 ? (clicked / delivered) * 100 : 0,
      click_to_open_rate: opened > 0 ? (clicked / opened) * 100 : 0,
      bounce_rate: sent > 0 ? (bounced / sent) * 100 : 0,
      unsubscribe_rate: delivered > 0 ? (unsubscribed / delivered) * 100 : 0,
    };

    // Fetch link click data
    const { data: linkClicks, error: linkError } = await (supabase as any)
      .from("crm_campaign_link_clicks")
      .select("*")
      .eq("campaign_id", id)
      .order("clicks", { ascending: false });

    // Fetch time-series engagement data (hourly for last 7 days)
    // In production, this would be aggregated from actual events
    const engagementData = generateMockEngagementData(campaign);

    // Build timeline events
    const timelineEvents = buildTimelineEvents(campaign);

    return NextResponse.json({
      stats,
      linkClicks: linkClicks || [],
      engagementData,
      timelineEvents,
    });
  } catch (error) {
    console.error("Error fetching campaign stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign stats" },
      { status: 500 }
    );
  }
}

// Generate mock engagement data based on campaign
function generateMockEngagementData(campaign: any) {
  if (!campaign.started_at) {
    return [];
  }

  const startDate = new Date(campaign.started_at);
  const endDate = campaign.completed_at
    ? new Date(campaign.completed_at)
    : new Date();

  const data = [];
  const totalOpens = campaign.opened_count || 0;
  const totalClicks = campaign.clicked_count || 0;

  // Generate hourly data points
  let currentDate = new Date(startDate);
  const hoursElapsed = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
  );
  const pointCount = Math.min(hoursElapsed, 168); // Max 7 days of hourly data

  for (let i = 0; i < pointCount; i++) {
    // Simulate engagement curve (higher at start, tapering off)
    const hourFactor = Math.exp(-i / 24);
    const randomFactor = 0.5 + Math.random();

    data.push({
      timestamp: currentDate.toISOString(),
      opens: Math.round((totalOpens / pointCount) * hourFactor * randomFactor * 2),
      clicks: Math.round((totalClicks / pointCount) * hourFactor * randomFactor * 2),
    });

    currentDate = new Date(currentDate.getTime() + 60 * 60 * 1000);
  }

  return data;
}

// Build timeline events from campaign data
function buildTimelineEvents(campaign: any) {
  const events = [];

  if (campaign.created_at) {
    events.push({
      id: `created-${campaign.id}`,
      type: "created",
      timestamp: campaign.created_at,
      details: "Campaign created",
    });
  }

  if (campaign.started_at) {
    events.push({
      id: `started-${campaign.id}`,
      type: "started",
      timestamp: campaign.started_at,
      count: campaign.recipients_count,
      details: `Started sending to ${campaign.recipients_count} recipients`,
    });
  }

  if (campaign.sent_count > 0) {
    events.push({
      id: `sent-${campaign.id}`,
      type: "sent",
      timestamp: campaign.started_at || campaign.updated_at,
      count: campaign.sent_count,
      details: `${campaign.sent_count} emails sent`,
    });
  }

  if (campaign.delivered_count > 0) {
    events.push({
      id: `delivered-${campaign.id}`,
      type: "delivered",
      timestamp: campaign.updated_at,
      count: campaign.delivered_count,
    });
  }

  if (campaign.opened_count > 0) {
    events.push({
      id: `opened-${campaign.id}`,
      type: "opened",
      timestamp: campaign.updated_at,
      count: campaign.opened_count,
    });
  }

  if (campaign.clicked_count > 0) {
    events.push({
      id: `clicked-${campaign.id}`,
      type: "clicked",
      timestamp: campaign.updated_at,
      count: campaign.clicked_count,
    });
  }

  if (campaign.bounced_count > 0) {
    events.push({
      id: `bounced-${campaign.id}`,
      type: "bounced",
      timestamp: campaign.updated_at,
      count: campaign.bounced_count,
    });
  }

  if (campaign.status === "completed" && campaign.completed_at) {
    events.push({
      id: `completed-${campaign.id}`,
      type: "completed",
      timestamp: campaign.completed_at,
      details: "Campaign completed",
    });
  }

  if (campaign.status === "paused") {
    events.push({
      id: `paused-${campaign.id}`,
      type: "paused",
      timestamp: campaign.updated_at,
      details: "Campaign paused",
    });
  }

  return events;
}

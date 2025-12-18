import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/v1/campaigns/[id]/recipients - Get campaign recipients with status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "25", 10);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    // Check if campaign exists
    const { data: campaign, error: campaignError } = await (supabase as any)
      .from("crm_campaigns")
      .select("id")
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

    // Build query for campaign contacts
    let query = (supabase as any)
      .from("crm_campaign_contacts")
      .select(
        `
        contact_id,
        status,
        sent_at,
        delivered_at,
        opened_at,
        clicked_at,
        bounced_at,
        bounce_reason,
        open_count,
        click_count,
        contact:contact_id(
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `,
        { count: "exact" }
      )
      .eq("campaign_id", id)
      .order("sent_at", { ascending: false, nullsFirst: false });

    // Apply status filter
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    // Apply search filter
    if (search) {
      // Search in related contact fields
      const searchTerm = `%${search}%`;
      query = query.or(
        `contact.first_name.ilike.${searchTerm},contact.last_name.ilike.${searchTerm},contact.email.ilike.${searchTerm}`
      );
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data: recipients, error, count } = await query;

    if (error) {
      throw error;
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    // Calculate status counts for filters
    const { data: statusCounts } = await (supabase as any)
      .from("crm_campaign_contacts")
      .select("status")
      .eq("campaign_id", id);

    const statusBreakdown: Record<string, number> = {};
    if (statusCounts) {
      for (const row of statusCounts) {
        statusBreakdown[row.status] = (statusBreakdown[row.status] || 0) + 1;
      }
    }

    return NextResponse.json({
      recipients: recipients || [],
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
      statusBreakdown,
    });
  } catch (error) {
    console.error("Error fetching campaign recipients:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign recipients" },
      { status: 500 }
    );
  }
}

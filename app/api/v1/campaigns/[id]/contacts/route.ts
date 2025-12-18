import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/v1/campaigns/[id]/contacts - Get campaign contacts
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

    // Fetch campaign contacts
    const { data: contacts, error } = await (supabase as any)
      .from("crm_campaign_contacts")
      .select(`
        contact_id,
        status,
        sent_at,
        opened_at,
        clicked_at,
        contact:contact_id(
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq("campaign_id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ contacts: contacts || [] });
  } catch (error) {
    console.error("Error fetching campaign contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign contacts" },
      { status: 500 }
    );
  }
}

// POST /api/v1/campaigns/[id]/contacts - Add contacts to campaign
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

    // Validate contact IDs
    if (!body.contactIds || !Array.isArray(body.contactIds) || body.contactIds.length === 0) {
      return NextResponse.json(
        { error: "Contact IDs are required" },
        { status: 400 }
      );
    }

    // Check campaign exists and is draft
    const { data: campaign, error: campaignError } = await (supabase as any)
      .from("crm_campaigns")
      .select("status")
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

    if (!["draft", "scheduled"].includes(campaign.status)) {
      return NextResponse.json(
        { error: "Can only add contacts to draft or scheduled campaigns" },
        { status: 400 }
      );
    }

    // Prepare campaign contacts data
    const campaignContacts = body.contactIds.map((contactId: string) => ({
      campaign_id: id,
      contact_id: contactId,
      status: "pending",
    }));

    // Insert campaign contacts (using upsert to handle duplicates)
    const { error: insertError } = await (supabase as any)
      .from("crm_campaign_contacts")
      .upsert(campaignContacts, {
        onConflict: "campaign_id,contact_id",
        ignoreDuplicates: true,
      });

    if (insertError) {
      throw insertError;
    }

    // Update campaign recipients count
    const { count } = await (supabase as any)
      .from("crm_campaign_contacts")
      .select("*", { count: "exact", head: true })
      .eq("campaign_id", id);

    await (supabase as any)
      .from("crm_campaigns")
      .update({
        recipients_count: count || 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    return NextResponse.json({
      success: true,
      added: body.contactIds.length,
      total: count || 0,
    });
  } catch (error) {
    console.error("Error adding contacts to campaign:", error);
    return NextResponse.json(
      { error: "Failed to add contacts to campaign" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/campaigns/[id]/contacts - Remove contacts from campaign
export async function DELETE(
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

    // Validate contact IDs
    if (!body.contactIds || !Array.isArray(body.contactIds) || body.contactIds.length === 0) {
      return NextResponse.json(
        { error: "Contact IDs are required" },
        { status: 400 }
      );
    }

    // Check campaign exists and is draft
    const { data: campaign, error: campaignError } = await (supabase as any)
      .from("crm_campaigns")
      .select("status")
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

    if (!["draft", "scheduled"].includes(campaign.status)) {
      return NextResponse.json(
        { error: "Can only remove contacts from draft or scheduled campaigns" },
        { status: 400 }
      );
    }

    // Delete campaign contacts
    const { error: deleteError } = await (supabase as any)
      .from("crm_campaign_contacts")
      .delete()
      .eq("campaign_id", id)
      .in("contact_id", body.contactIds);

    if (deleteError) {
      throw deleteError;
    }

    // Update campaign recipients count
    const { count } = await (supabase as any)
      .from("crm_campaign_contacts")
      .select("*", { count: "exact", head: true })
      .eq("campaign_id", id);

    await (supabase as any)
      .from("crm_campaigns")
      .update({
        recipients_count: count || 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    return NextResponse.json({
      success: true,
      removed: body.contactIds.length,
      total: count || 0,
    });
  } catch (error) {
    console.error("Error removing contacts from campaign:", error);
    return NextResponse.json(
      { error: "Failed to remove contacts from campaign" },
      { status: 500 }
    );
  }
}

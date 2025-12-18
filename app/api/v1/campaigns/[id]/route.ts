import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

// GET /api/v1/campaigns/[id] - Get single campaign
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

    // Fetch campaign with creator info
    const { data: campaign, error } = await (supabase as any)
      .from("crm_campaigns")
      .select(`
        *,
        creator:created_by(
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
          { error: "Campaign not found" },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign" },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/campaigns/[id] - Update campaign
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

    // Only update provided fields
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.subject_line !== undefined) updateData.subject_line = body.subject_line;
    if (body.content_html !== undefined) updateData.content_html = body.content_html;
    if (body.content_text !== undefined) updateData.content_text = body.content_text;
    if (body.settings !== undefined) updateData.settings = body.settings as Json;
    if (body.scheduled_at !== undefined) updateData.scheduled_at = body.scheduled_at;
    if (body.status !== undefined) updateData.status = body.status;

    const { data: campaign, error } = await (supabase as any)
      .from("crm_campaigns")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Campaign not found" },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/campaigns/[id] - Delete campaign
export async function DELETE(
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

    // Check if campaign exists and is deletable (not active)
    const { data: existing, error: fetchError } = await (supabase as any)
      .from("crm_campaigns")
      .select("status")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Campaign not found" },
          { status: 404 }
        );
      }
      throw fetchError;
    }

    if (existing.status === "active") {
      return NextResponse.json(
        { error: "Cannot delete an active campaign. Pause it first." },
        { status: 400 }
      );
    }

    // Delete campaign contacts first
    await (supabase as any)
      .from("crm_campaign_contacts")
      .delete()
      .eq("campaign_id", id);

    // Delete campaign
    const { error } = await (supabase as any)
      .from("crm_campaigns")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return NextResponse.json(
      { error: "Failed to delete campaign" },
      { status: 500 }
    );
  }
}

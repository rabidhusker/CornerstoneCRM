import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/v1/campaigns/[id]/start - Start a campaign
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

    // Check if campaign exists and can be started
    const { data: existing, error: fetchError } = await (supabase as any)
      .from("crm_campaigns")
      .select("*")
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

    // Only draft or scheduled campaigns can be started
    if (!["draft", "scheduled", "paused"].includes(existing.status)) {
      return NextResponse.json(
        { error: `Cannot start a campaign with status: ${existing.status}` },
        { status: 400 }
      );
    }

    // Validate campaign has content
    if (existing.type === "email" && !existing.content_html) {
      return NextResponse.json(
        { error: "Campaign must have content before starting" },
        { status: 400 }
      );
    }

    if (existing.type === "sms" && !existing.content_text) {
      return NextResponse.json(
        { error: "Campaign must have message content before starting" },
        { status: 400 }
      );
    }

    // Update campaign status to active
    const { data: campaign, error } = await (supabase as any)
      .from("crm_campaigns")
      .update({
        status: "active",
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // In production, this would trigger the actual sending process
    // via a background job or message queue

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error("Error starting campaign:", error);
    return NextResponse.json(
      { error: "Failed to start campaign" },
      { status: 500 }
    );
  }
}

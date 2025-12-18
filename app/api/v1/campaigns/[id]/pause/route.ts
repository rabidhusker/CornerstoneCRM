import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/v1/campaigns/[id]/pause - Pause an active campaign
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

    // Check if campaign exists and can be paused
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

    // Only active campaigns can be paused
    if (existing.status !== "active") {
      return NextResponse.json(
        { error: `Cannot pause a campaign with status: ${existing.status}` },
        { status: 400 }
      );
    }

    // Update campaign status to paused
    const { data: campaign, error } = await (supabase as any)
      .from("crm_campaigns")
      .update({
        status: "paused",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error("Error pausing campaign:", error);
    return NextResponse.json(
      { error: "Failed to pause campaign" },
      { status: 500 }
    );
  }
}

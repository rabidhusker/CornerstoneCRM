import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/v1/campaigns/[id]/duplicate - Duplicate a campaign
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

    // Fetch original campaign
    const { data: original, error: fetchError } = await (supabase as any)
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

    // Create duplicate campaign
    const duplicateData = {
      workspace_id: original.workspace_id,
      created_by: user.id,
      name: `${original.name} (Copy)`,
      description: original.description,
      type: original.type,
      status: "draft", // Always start as draft
      subject_line: original.subject_line,
      content_html: original.content_html,
      content_text: original.content_text,
      settings: original.settings,
      scheduled_at: null, // Clear scheduled time
      recipients_count: 0,
      sent_count: 0,
      delivered_count: 0,
      opened_count: 0,
      clicked_count: 0,
      bounced_count: 0,
      unsubscribed_count: 0,
    };

    const { data: campaign, error } = await (supabase as any)
      .from("crm_campaigns")
      .insert(duplicateData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error("Error duplicating campaign:", error);
    return NextResponse.json(
      { error: "Failed to duplicate campaign" },
      { status: 500 }
    );
  }
}

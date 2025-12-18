import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/v1/deals/[id]/activities - Get activities for a deal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: dealId } = await params;

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: activities, error } = await (supabase as any)
      .from("crm_activities")
      .select("*")
      .eq("deal_id", dealId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching deal activities:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ activities });
  } catch (error) {
    console.error("Error in GET /api/v1/deals/[id]/activities:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/v1/deals/[id]/activities - Add activity to a deal
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: dealId } = await params;
    const body = await request.json();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's workspace via the deal
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: deal, error: dealError } = await (supabase as any)
      .from("crm_deals")
      .select("workspace_id, contact_id")
      .eq("id", dealId)
      .single();

    if (dealError || !deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    const { type, title, description, dueDate, outcome } = body;

    if (!type || !title) {
      return NextResponse.json(
        { error: "Type and title are required" },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: activity, error } = await (supabase as any)
      .from("crm_activities")
      .insert({
        workspace_id: deal.workspace_id,
        user_id: user.id,
        deal_id: dealId,
        contact_id: deal.contact_id, // Also link to the deal's contact
        type,
        title,
        description: description || null,
        due_date: dueDate || null,
        outcome: outcome || null,
        metadata: {},
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating activity:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ activity }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/v1/deals/[id]/activities:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

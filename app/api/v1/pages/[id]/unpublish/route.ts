import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/v1/pages/[id]/unpublish - Unpublish a page
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

    // Update page status to draft
    const { data: page, error } = await (supabase as any)
      .from("crm_landing_pages")
      .update({
        status: "draft",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ page });
  } catch (error) {
    console.error("Error unpublishing page:", error);
    return NextResponse.json(
      { error: "Failed to unpublish page" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/v1/canned-responses/[id] - Get single canned response
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

    const { data: response, error } = await (supabase as any)
      .from("crm_canned_responses")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Canned response not found" },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Error fetching canned response:", error);
    return NextResponse.json(
      { error: "Failed to fetch canned response" },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/canned-responses/[id] - Update canned response
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

    if (body.name !== undefined) updateData.name = body.name;
    if (body.shortcut !== undefined) updateData.shortcut = body.shortcut;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.is_shared !== undefined) updateData.is_shared = body.is_shared;

    const { data: response, error } = await (supabase as any)
      .from("crm_canned_responses")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Error updating canned response:", error);
    return NextResponse.json(
      { error: "Failed to update canned response" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/canned-responses/[id] - Delete canned response
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

    const { error } = await (supabase as any)
      .from("crm_canned_responses")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting canned response:", error);
    return NextResponse.json(
      { error: "Failed to delete canned response" },
      { status: 500 }
    );
  }
}

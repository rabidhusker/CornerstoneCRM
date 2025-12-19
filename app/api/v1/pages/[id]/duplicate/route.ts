import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

// POST /api/v1/pages/[id]/duplicate - Duplicate a page
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

    // Get the original page
    const { data: originalPage, error: fetchError } = await (supabase as any)
      .from("crm_landing_pages")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json({ error: "Page not found" }, { status: 404 });
      }
      throw fetchError;
    }

    // Generate a new unique slug
    const baseSlug = `${originalPage.slug}-copy`;
    let newSlug = baseSlug;
    let counter = 1;

    // Check if slug already exists and increment counter
    while (true) {
      const { data: existingPage } = await (supabase as any)
        .from("crm_landing_pages")
        .select("id")
        .eq("workspace_id", originalPage.workspace_id)
        .eq("slug", newSlug)
        .single();

      if (!existingPage) break;

      counter++;
      newSlug = `${baseSlug}-${counter}`;
    }

    // Create the duplicate
    const insertData = {
      workspace_id: originalPage.workspace_id,
      created_by: user.id,
      title: `${originalPage.title} (Copy)`,
      slug: newSlug,
      description: originalPage.description,
      status: "draft",
      config: originalPage.config as Json,
      settings: originalPage.settings as Json,
      views_count: 0,
      conversions_count: 0,
      conversion_rate: 0,
    };

    const { data: newPage, error: insertError } = await (supabase as any)
      .from("crm_landing_pages")
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({ page: newPage }, { status: 201 });
  } catch (error) {
    console.error("Error duplicating page:", error);
    return NextResponse.json(
      { error: "Failed to duplicate page" },
      { status: 500 }
    );
  }
}

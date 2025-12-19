import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/v1/forms/[id]/public - Get public form configuration
// No authentication required
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data: form, error } = await (supabase as any)
      .from("crm_forms")
      .select("id, name, description, status, config, settings, styles")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Form not found" }, { status: 404 });
      }
      throw error;
    }

    // Only return active forms
    if (form.status !== "active") {
      return NextResponse.json(
        { error: "Form is not available" },
        { status: 404 }
      );
    }

    // Increment view count
    await (supabase as any)
      .from("crm_forms")
      .update({
        views_count: (form.views_count || 0) + 1,
      })
      .eq("id", id);

    // Remove sensitive settings from public response
    const publicSettings = { ...form.settings };
    delete publicSettings.notificationEmail;
    delete publicSettings.notificationSubject;
    delete publicSettings.autoResponseSubject;
    delete publicSettings.autoResponseMessage;
    delete publicSettings.triggerWorkflowId;

    return NextResponse.json({
      form: {
        id: form.id,
        name: form.name,
        description: form.description,
        config: form.config,
        settings: publicSettings,
        styles: form.styles,
      },
    });
  } catch (error) {
    console.error("Error fetching public form:", error);
    return NextResponse.json(
      { error: "Failed to fetch form" },
      { status: 500 }
    );
  }
}

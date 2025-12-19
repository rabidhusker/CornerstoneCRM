import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { BrandingSettings, BrandingFormData } from "@/types/branding";
import { defaultBranding } from "@/types/branding";

// GET /api/v1/settings/branding - Get branding settings
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's workspace and role
    const { data: profile } = await (supabase as any)
      .from("profiles")
      .select("workspace_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.workspace_id) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Check if user can edit (owner or admin)
    const canEdit = profile.role === "owner" || profile.role === "admin";

    // Get branding settings
    const { data: branding, error } = await (supabase as any)
      .from("crm_branding_settings")
      .select("*")
      .eq("workspace_id", profile.workspace_id)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    // Get workspace name for default organization_name
    const { data: workspace } = await (supabase as any)
      .from("workspaces")
      .select("name")
      .eq("id", profile.workspace_id)
      .single();

    // Return existing branding or defaults
    const result: BrandingSettings = branding || {
      id: "",
      workspace_id: profile.workspace_id,
      ...defaultBranding,
      organization_name: workspace?.name || defaultBranding.organization_name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json({ branding: result, canEdit });
  } catch (error) {
    console.error("Error fetching branding:", error);
    return NextResponse.json(
      { error: "Failed to fetch branding settings" },
      { status: 500 }
    );
  }
}

// PUT /api/v1/settings/branding - Update branding settings
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's workspace and role
    const { data: profile } = await (supabase as any)
      .from("profiles")
      .select("workspace_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.workspace_id) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Check if user can edit (owner or admin)
    if (profile.role !== "owner" && profile.role !== "admin") {
      return NextResponse.json(
        { error: "Permission denied. Only owners and admins can edit branding." },
        { status: 403 }
      );
    }

    const body: Partial<BrandingFormData> = await request.json();

    // Check if branding record exists
    const { data: existing } = await (supabase as any)
      .from("crm_branding_settings")
      .select("id")
      .eq("workspace_id", profile.workspace_id)
      .single();

    let result: BrandingSettings;

    if (existing) {
      // Update existing record
      const { data, error } = await (supabase as any)
        .from("crm_branding_settings")
        .update({
          ...body,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new record
      const { data, error } = await (supabase as any)
        .from("crm_branding_settings")
        .insert({
          workspace_id: profile.workspace_id,
          ...defaultBranding,
          ...body,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating branding:", error);
    return NextResponse.json(
      { error: "Failed to update branding settings" },
      { status: 500 }
    );
  }
}

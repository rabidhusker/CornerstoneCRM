import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { OrganizationSettings } from "@/types/settings";

// GET /api/v1/settings/organization - Get organization settings
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

    // Get user's workspace
    const { data: profile } = await (supabase as any)
      .from("profiles")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    if (!profile?.workspace_id) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Get workspace/organization settings
    const { data: workspace, error } = await (supabase as any)
      .from("workspaces")
      .select("*")
      .eq("id", profile.workspace_id)
      .single();

    if (error) {
      // If workspace doesn't exist, return defaults
      if (error.code === "PGRST116") {
        const defaultSettings: OrganizationSettings = {
          id: profile.workspace_id,
          name: "My Organization",
          slug: "my-org",
          timezone: "America/New_York",
          date_format: "MM/DD/YYYY",
          time_format: "12h",
          currency: "USD",
          fiscal_year_start: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return NextResponse.json({ organization: defaultSettings });
      }
      throw error;
    }

    const organization: OrganizationSettings = {
      id: workspace.id,
      name: workspace.name || "My Organization",
      slug: workspace.slug || "my-org",
      logo_url: workspace.logo_url,
      website: workspace.website,
      industry: workspace.industry,
      size: workspace.size,
      address: workspace.address,
      phone: workspace.phone,
      email: workspace.email,
      timezone: workspace.timezone || "America/New_York",
      date_format: workspace.date_format || "MM/DD/YYYY",
      time_format: workspace.time_format || "12h",
      currency: workspace.currency || "USD",
      fiscal_year_start: workspace.fiscal_year_start || 1,
      created_at: workspace.created_at,
      updated_at: workspace.updated_at,
    };

    return NextResponse.json({ organization });
  } catch (error) {
    console.error("Error fetching organization settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch organization settings" },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/settings/organization - Update organization settings
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's workspace
    const { data: profile } = await (supabase as any)
      .from("profiles")
      .select("workspace_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.workspace_id) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Check if user has permission (owner or admin)
    const role = profile.role || "member";
    if (!["owner", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "You don't have permission to update organization settings" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Build update object with allowed fields
    const allowedFields = [
      "name",
      "slug",
      "logo_url",
      "website",
      "industry",
      "size",
      "address",
      "phone",
      "email",
      "timezone",
      "date_format",
      "time_format",
      "currency",
      "fiscal_year_start",
    ];

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    // Update workspace
    const { data: workspace, error } = await (supabase as any)
      .from("workspaces")
      .update(updates)
      .eq("id", profile.workspace_id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    const organization: OrganizationSettings = {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      logo_url: workspace.logo_url,
      website: workspace.website,
      industry: workspace.industry,
      size: workspace.size,
      address: workspace.address,
      phone: workspace.phone,
      email: workspace.email,
      timezone: workspace.timezone,
      date_format: workspace.date_format,
      time_format: workspace.time_format,
      currency: workspace.currency,
      fiscal_year_start: workspace.fiscal_year_start,
      created_at: workspace.created_at,
      updated_at: workspace.updated_at,
    };

    return NextResponse.json({ organization });
  } catch (error) {
    console.error("Error updating organization settings:", error);
    return NextResponse.json(
      { error: "Failed to update organization settings" },
      { status: 500 }
    );
  }
}

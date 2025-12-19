import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ConnectedIntegration, IntegrationProvider } from "@/types/integration";

// GET /api/v1/settings/integrations - List connected integrations
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

    // Get connected integrations
    const { data: integrations, error } = await (supabase as any)
      .from("crm_integrations")
      .select("*")
      .eq("workspace_id", profile.workspace_id)
      .order("connected_at", { ascending: false });

    if (error && error.code !== "42P01") {
      // Ignore if table doesn't exist
      throw error;
    }

    const connectedIntegrations: ConnectedIntegration[] = (integrations || []).map(
      (i: any) => ({
        id: i.id,
        provider: i.provider,
        status: i.status,
        config: i.config || {},
        connected_at: i.connected_at,
        last_sync_at: i.last_sync_at,
        error_message: i.error_message,
        metadata: i.metadata,
      })
    );

    return NextResponse.json({ integrations: connectedIntegrations });
  } catch (error) {
    console.error("Error fetching integrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch integrations" },
      { status: 500 }
    );
  }
}

// POST /api/v1/settings/integrations - Connect a new integration
export async function POST(request: NextRequest) {
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

    // Check permissions
    const role = profile.role || "member";
    if (![" owner", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "You don't have permission to manage integrations" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { provider, config } = body as {
      provider: IntegrationProvider;
      config?: Record<string, any>;
    };

    if (!provider) {
      return NextResponse.json(
        { error: "Provider is required" },
        { status: 400 }
      );
    }

    // Check if already connected
    const { data: existing } = await (supabase as any)
      .from("crm_integrations")
      .select("id")
      .eq("workspace_id", profile.workspace_id)
      .eq("provider", provider)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "This integration is already connected" },
        { status: 400 }
      );
    }

    // Create integration record
    const { data: integration, error } = await (supabase as any)
      .from("crm_integrations")
      .insert({
        workspace_id: profile.workspace_id,
        provider,
        status: config ? "connected" : "pending",
        config: config || {},
        connected_at: new Date().toISOString(),
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json(
          { error: "Integrations table not found. Please run migrations." },
          { status: 500 }
        );
      }
      throw error;
    }

    const connectedIntegration: ConnectedIntegration = {
      id: integration.id,
      provider: integration.provider,
      status: integration.status,
      config: integration.config,
      connected_at: integration.connected_at,
      last_sync_at: integration.last_sync_at,
      error_message: integration.error_message,
      metadata: integration.metadata,
    };

    return NextResponse.json(
      { integration: connectedIntegration },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error connecting integration:", error);
    return NextResponse.json(
      { error: "Failed to connect integration" },
      { status: 500 }
    );
  }
}

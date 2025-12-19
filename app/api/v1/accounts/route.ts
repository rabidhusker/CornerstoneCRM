import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSubAccount, getSubAccounts } from "@/lib/accounts/account-management";
import type { CreateAccountData } from "@/types/account";

// GET /api/v1/accounts - List sub-accounts
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

    // Get user's profile and workspace
    const { data: profile } = await (supabase as any)
      .from("profiles")
      .select("workspace_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.workspace_id) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Check if user can manage accounts (owner or admin of parent org)
    if (profile.role !== "owner" && profile.role !== "admin") {
      return NextResponse.json(
        { accounts: [], canManage: false },
        { status: 200 }
      );
    }

    // Check if workspace has sub-account capability
    const { data: workspace } = await (supabase as any)
      .from("workspaces")
      .select("parent_id, feature_flags, settings")
      .eq("id", profile.workspace_id)
      .single();

    // If this is a sub-account, return empty (sub-accounts can't have sub-accounts)
    if (workspace?.parent_id) {
      return NextResponse.json(
        { accounts: [], canManage: false },
        { status: 200 }
      );
    }

    // Check if white-label feature is enabled
    const featureFlags = workspace?.feature_flags || {};
    if (!featureFlags.white_label) {
      return NextResponse.json(
        { accounts: [], canManage: false },
        { status: 200 }
      );
    }

    // Get sub-accounts
    const accounts = await getSubAccounts(profile.workspace_id);

    return NextResponse.json({ accounts, canManage: true });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}

// POST /api/v1/accounts - Create sub-account
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

    // Get user's profile and workspace
    const { data: profile } = await (supabase as any)
      .from("profiles")
      .select("workspace_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.workspace_id) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Check if user can manage accounts
    if (profile.role !== "owner" && profile.role !== "admin") {
      return NextResponse.json(
        { error: "Permission denied. Only owners and admins can create accounts." },
        { status: 403 }
      );
    }

    // Check workspace capabilities
    const { data: workspace } = await (supabase as any)
      .from("workspaces")
      .select("parent_id, feature_flags, settings")
      .eq("id", profile.workspace_id)
      .single();

    if (workspace?.parent_id) {
      return NextResponse.json(
        { error: "Sub-accounts cannot create sub-accounts" },
        { status: 403 }
      );
    }

    const featureFlags = workspace?.feature_flags || {};
    if (!featureFlags.white_label) {
      return NextResponse.json(
        { error: "White-label feature not enabled" },
        { status: 403 }
      );
    }

    // Check sub-account limits
    const settings = workspace?.settings || {};
    if (settings.max_sub_accounts) {
      const { count } = await (supabase as any)
        .from("workspaces")
        .select("*", { count: "exact", head: true })
        .eq("parent_id", profile.workspace_id)
        .neq("status", "cancelled");

      if (count >= settings.max_sub_accounts) {
        return NextResponse.json(
          { error: `Maximum number of sub-accounts (${settings.max_sub_accounts}) reached` },
          { status: 403 }
        );
      }
    }

    // Parse request body
    const body: CreateAccountData = await request.json();

    // Validate required fields
    if (!body.name || !body.admin_email || !body.subscription_tier) {
      return NextResponse.json(
        { error: "Name, admin email, and subscription tier are required" },
        { status: 400 }
      );
    }

    // Create the sub-account
    const result = await createSubAccount(
      profile.workspace_id,
      body,
      user.id
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to create account" },
        { status: 400 }
      );
    }

    return NextResponse.json(result.account, { status: 201 });
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}

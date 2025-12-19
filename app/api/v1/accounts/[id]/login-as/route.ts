import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { ACCOUNT_SESSION_KEY, PARENT_SESSION_KEY } from "@/lib/accounts/account-management";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/v1/accounts/[id]/login-as - Switch to a sub-account
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: targetAccountId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile
    const { data: profile } = await (supabase as any)
      .from("profiles")
      .select("workspace_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.workspace_id) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Check if user can switch accounts (owner or admin)
    if (profile.role !== "owner" && profile.role !== "admin") {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    // Get current workspace info
    const { data: currentWorkspace } = await (supabase as any)
      .from("workspaces")
      .select("id, name, parent_id")
      .eq("id", profile.workspace_id)
      .single();

    // Get target workspace info
    const { data: targetWorkspace } = await (supabase as any)
      .from("workspaces")
      .select("id, name, parent_id, status")
      .eq("id", targetAccountId)
      .single();

    if (!targetWorkspace) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Check if target account is accessible
    let isAccessible = false;
    let parentAccountId: string | null = null;

    // Case 1: Switching from parent to sub-account
    if (!currentWorkspace.parent_id && targetWorkspace.parent_id === profile.workspace_id) {
      isAccessible = true;
      parentAccountId = profile.workspace_id;
    }

    // Case 2: Switching from sub-account back to parent
    if (currentWorkspace.parent_id === targetAccountId) {
      isAccessible = true;
      parentAccountId = null;
    }

    // Case 3: Switching to same account
    if (targetAccountId === profile.workspace_id) {
      isAccessible = true;
    }

    if (!isAccessible) {
      return NextResponse.json(
        { error: "Access denied. You can only access your own sub-accounts." },
        { status: 403 }
      );
    }

    // Check if target account is active
    if (targetWorkspace.status === "cancelled") {
      return NextResponse.json(
        { error: "Cannot access cancelled account" },
        { status: 403 }
      );
    }

    // Log the login-as action
    await (supabase as any)
      .from("crm_account_audit_log")
      .insert({
        parent_org_id: parentAccountId || currentWorkspace.parent_id,
        account_id: targetAccountId,
        user_id: user.id,
        action: "login_as",
        details: {
          from_account: profile.workspace_id,
          to_account: targetAccountId,
        },
        created_at: new Date().toISOString(),
      });

    // Set session cookies for account switching
    const cookieStore = await cookies();

    // Store current account session
    cookieStore.set(ACCOUNT_SESSION_KEY, targetAccountId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    // Store parent account if switching to sub-account
    if (parentAccountId) {
      cookieStore.set(PARENT_SESSION_KEY, parentAccountId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24, // 24 hours
      });
    } else {
      // Clear parent session if switching back to parent
      cookieStore.delete(PARENT_SESSION_KEY);
    }

    // Update user's profile to point to new workspace (temporary switch)
    // Note: In a production system, you might want to use session-based switching
    // instead of updating the profile directly
    await (supabase as any)
      .from("profiles")
      .update({
        workspace_id: targetAccountId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    return NextResponse.json({
      success: true,
      account_id: targetAccountId,
      account_name: targetWorkspace.name,
      parent_account_id: parentAccountId,
      redirect_url: "/dashboard",
    });
  } catch (error) {
    console.error("Error switching account:", error);
    return NextResponse.json(
      { error: "Failed to switch account" },
      { status: 500 }
    );
  }
}

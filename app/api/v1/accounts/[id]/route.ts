import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getSubAccount,
  updateSubAccount,
  deleteSubAccount,
  canAccessAccount,
} from "@/lib/accounts/account-management";
import type { UpdateAccountData } from "@/types/account";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/accounts/[id] - Get account details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: accountId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user can access this account
    const hasAccess = await canAccessAccount(user.id, accountId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get account details
    const account = await getSubAccount(accountId);

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error("Error fetching account:", error);
    return NextResponse.json(
      { error: "Failed to fetch account" },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/accounts/[id] - Update account
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: accountId } = await params;
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

    // Check if user can manage accounts
    if (profile.role !== "owner" && profile.role !== "admin") {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    // Verify this is a sub-account of user's workspace
    const { data: targetWorkspace } = await (supabase as any)
      .from("workspaces")
      .select("parent_id")
      .eq("id", accountId)
      .single();

    if (!targetWorkspace || targetWorkspace.parent_id !== profile.workspace_id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Parse update data
    const body: UpdateAccountData = await request.json();

    // Update the account
    const result = await updateSubAccount(accountId, body, user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update account" },
        { status: 400 }
      );
    }

    // Get updated account
    const updatedAccount = await getSubAccount(accountId);

    return NextResponse.json(updatedAccount);
  } catch (error) {
    console.error("Error updating account:", error);
    return NextResponse.json(
      { error: "Failed to update account" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/accounts/[id] - Delete account
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: accountId } = await params;
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

    // Check if user can manage accounts (only owners can delete)
    if (profile.role !== "owner") {
      return NextResponse.json(
        { error: "Permission denied. Only owners can delete accounts." },
        { status: 403 }
      );
    }

    // Verify this is a sub-account of user's workspace
    const { data: targetWorkspace } = await (supabase as any)
      .from("workspaces")
      .select("parent_id")
      .eq("id", accountId)
      .single();

    if (!targetWorkspace || targetWorkspace.parent_id !== profile.workspace_id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Delete the account (soft delete)
    const result = await deleteSubAccount(accountId, user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to delete account" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}

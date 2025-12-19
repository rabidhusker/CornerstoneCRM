import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { OrganizationUser, UserStatus } from "@/types/settings";

// PATCH /api/v1/settings/users/[id] - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Check if user has permission to update users
    const currentRole = profile.role || "member";
    if (!["owner", "admin"].includes(currentRole)) {
      return NextResponse.json(
        { error: "You don't have permission to update users" },
        { status: 403 }
      );
    }

    // Get target user
    const { data: targetUser, error: fetchError } = await (supabase as any)
      .from("profiles")
      .select("*")
      .eq("id", id)
      .eq("workspace_id", profile.workspace_id)
      .single();

    if (fetchError || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent modifying owner unless you're the owner
    if (targetUser.role === "owner" && currentRole !== "owner") {
      return NextResponse.json(
        { error: "You cannot modify the organization owner" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { role, status } = body as { role?: string; status?: UserStatus };

    // Build update object
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (role !== undefined) {
      // Only owner can assign owner role
      if (role === "owner" && currentRole !== "owner") {
        return NextResponse.json(
          { error: "Only the owner can transfer ownership" },
          { status: 403 }
        );
      }
      updates.role = role;
    }

    if (status !== undefined) {
      // Cannot deactivate owner
      if (status === "deactivated" && targetUser.role === "owner") {
        return NextResponse.json(
          { error: "Cannot deactivate the organization owner" },
          { status: 400 }
        );
      }
      updates.status = status;
    }

    // Update user
    const { data: updatedUser, error } = await (supabase as any)
      .from("profiles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    const responseUser: OrganizationUser = {
      id: updatedUser.id,
      email: updatedUser.email,
      first_name: updatedUser.first_name,
      last_name: updatedUser.last_name,
      avatar_url: updatedUser.avatar_url,
      role: updatedUser.role,
      status: updatedUser.status,
      last_active_at: updatedUser.last_active_at,
      invited_at: updatedUser.invited_at,
      joined_at: updatedUser.created_at,
    };

    return NextResponse.json({ user: responseUser });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/settings/users/[id] - Remove user from organization
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Check if user has permission to remove users
    const currentRole = profile.role || "member";
    if (!["owner", "admin"].includes(currentRole)) {
      return NextResponse.json(
        { error: "You don't have permission to remove users" },
        { status: 403 }
      );
    }

    // Prevent removing yourself
    if (id === user.id) {
      return NextResponse.json(
        { error: "You cannot remove yourself from the organization" },
        { status: 400 }
      );
    }

    // Get target user
    const { data: targetUser, error: fetchError } = await (supabase as any)
      .from("profiles")
      .select("role")
      .eq("id", id)
      .eq("workspace_id", profile.workspace_id)
      .single();

    if (fetchError || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Cannot remove owner
    if (targetUser.role === "owner") {
      return NextResponse.json(
        { error: "Cannot remove the organization owner" },
        { status: 400 }
      );
    }

    // Remove user from workspace (or delete if invited)
    // Option 1: Delete the profile entirely
    // Option 2: Set workspace_id to null
    // Using Option 2 to preserve the user account

    const { error } = await (supabase as any)
      .from("profiles")
      .update({
        workspace_id: null,
        status: "removed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing user:", error);
    return NextResponse.json(
      { error: "Failed to remove user" },
      { status: 500 }
    );
  }
}

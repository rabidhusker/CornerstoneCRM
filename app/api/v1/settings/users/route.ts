import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { OrganizationUser, UserInvitation } from "@/types/settings";

// GET /api/v1/settings/users - List organization users
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

    // Get all users in the workspace
    const { data: profiles, error } = await (supabase as any)
      .from("profiles")
      .select("*")
      .eq("workspace_id", profile.workspace_id)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    // Transform to OrganizationUser type
    const users: OrganizationUser[] = (profiles || []).map((p: any) => ({
      id: p.id,
      email: p.email || "",
      first_name: p.first_name,
      last_name: p.last_name,
      avatar_url: p.avatar_url,
      role: p.role || "member",
      status: p.status || "active",
      last_active_at: p.last_active_at,
      invited_at: p.invited_at,
      joined_at: p.created_at,
      invited_by: p.invited_by,
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST /api/v1/settings/users - Invite new user
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

    // Check if user has permission to invite
    const role = profile.role || "member";
    if (!["owner", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "You don't have permission to invite users" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, role: inviteRole, message } = body as UserInvitation;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user already exists in workspace
    const { data: existingUser } = await (supabase as any)
      .from("profiles")
      .select("id")
      .eq("workspace_id", profile.workspace_id)
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "User is already a member of this organization" },
        { status: 400 }
      );
    }

    // Create invitation record (or use Supabase auth invite)
    // For now, create a pending profile
    const { data: invitation, error } = await (supabase as any)
      .from("profiles")
      .insert({
        email,
        role: inviteRole || "member",
        status: "invited",
        workspace_id: profile.workspace_id,
        invited_by: user.id,
        invited_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "This email has already been invited" },
          { status: 400 }
        );
      }
      throw error;
    }

    // TODO: Send invitation email
    // In production, use a service like Resend or SendGrid

    const invitedUser: OrganizationUser = {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: "invited",
      invited_at: invitation.invited_at,
      invited_by: user.id,
    };

    return NextResponse.json({ user: invitedUser }, { status: 201 });
  } catch (error) {
    console.error("Error inviting user:", error);
    return NextResponse.json(
      { error: "Failed to invite user" },
      { status: 500 }
    );
  }
}

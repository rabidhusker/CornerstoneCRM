import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Role, RolePermissions } from "@/types/settings";
import { defaultRolePermissions } from "@/types/settings";

// Default system roles
const systemRoles: Role[] = [
  {
    id: "owner",
    name: "owner",
    description: "Full control over organization, billing, and all data",
    is_system: true,
    permissions: defaultRolePermissions.owner,
    user_count: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "admin",
    name: "admin",
    description: "Full access to all features and user management",
    is_system: true,
    permissions: defaultRolePermissions.admin,
    user_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "manager",
    name: "manager",
    description: "Can manage team members and view team data",
    is_system: true,
    permissions: defaultRolePermissions.manager,
    user_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "member",
    name: "member",
    description: "Standard access to create and manage own work",
    is_system: true,
    permissions: defaultRolePermissions.member,
    user_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "viewer",
    name: "viewer",
    description: "Read-only access to view data",
    is_system: true,
    permissions: defaultRolePermissions.viewer,
    user_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// GET /api/v1/settings/roles - List roles
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

    // Get user counts per role
    const { data: roleCounts } = await (supabase as any)
      .from("profiles")
      .select("role")
      .eq("workspace_id", profile.workspace_id);

    const roleCountMap: Record<string, number> = {};
    (roleCounts || []).forEach((p: any) => {
      const role = p.role || "member";
      roleCountMap[role] = (roleCountMap[role] || 0) + 1;
    });

    // Add user counts to system roles
    const rolesWithCounts = systemRoles.map((role) => ({
      ...role,
      user_count: roleCountMap[role.name] || 0,
    }));

    // Get custom roles from database
    const { data: customRoles, error } = await (supabase as any)
      .from("crm_roles")
      .select("*")
      .eq("workspace_id", profile.workspace_id)
      .order("created_at", { ascending: true });

    if (error && error.code !== "42P01") {
      // Ignore if table doesn't exist
      throw error;
    }

    // Transform custom roles
    const formattedCustomRoles: Role[] = (customRoles || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      is_system: false,
      permissions: r.permissions || defaultRolePermissions.member,
      user_count: roleCountMap[r.name] || 0,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));

    return NextResponse.json({
      roles: [...rolesWithCounts, ...formattedCustomRoles],
    });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 }
    );
  }
}

// POST /api/v1/settings/roles - Create custom role
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

    // Check if user has permission to create roles
    const currentRole = profile.role || "member";
    if (!["owner", "admin"].includes(currentRole)) {
      return NextResponse.json(
        { error: "You don't have permission to create roles" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, permissions } = body as {
      name: string;
      description?: string;
      permissions: RolePermissions;
    };

    if (!name) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 });
    }

    // Check if name conflicts with system roles
    if (systemRoles.some((r) => r.name.toLowerCase() === name.toLowerCase())) {
      return NextResponse.json(
        { error: "Cannot use a system role name" },
        { status: 400 }
      );
    }

    // Create role
    const { data: role, error } = await (supabase as any)
      .from("crm_roles")
      .insert({
        name,
        description,
        permissions: permissions || defaultRolePermissions.member,
        workspace_id: profile.workspace_id,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json(
          { error: "Roles table not found. Please run migrations." },
          { status: 500 }
        );
      }
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A role with this name already exists" },
          { status: 400 }
        );
      }
      throw error;
    }

    const createdRole: Role = {
      id: role.id,
      name: role.name,
      description: role.description,
      is_system: false,
      permissions: role.permissions,
      user_count: 0,
      created_at: role.created_at,
      updated_at: role.updated_at,
    };

    return NextResponse.json({ role: createdRole }, { status: 201 });
  } catch (error) {
    console.error("Error creating role:", error);
    return NextResponse.json(
      { error: "Failed to create role" },
      { status: 500 }
    );
  }
}

import { createClient } from "@/lib/supabase/server";
import type {
  SubAccount,
  CreateAccountData,
  UpdateAccountData,
  AccountContext,
  AccountSwitchOption,
  SubscriptionTier,
  defaultFeatureFlags,
  defaultUsageLimits,
  generateAccountSlug,
} from "@/types/account";
import {
  defaultFeatureFlags as featureFlags,
  defaultUsageLimits as usageLimits,
  generateAccountSlug as generateSlug,
} from "@/types/account";

// Cookie name for account switching
export const ACCOUNT_SESSION_KEY = "crm_current_account";
export const PARENT_SESSION_KEY = "crm_parent_account";

/**
 * Create a new sub-account under a parent organization
 */
export async function createSubAccount(
  parentOrgId: string,
  data: CreateAccountData,
  createdByUserId: string
): Promise<{ success: boolean; account?: SubAccount; error?: string }> {
  const supabase = await createClient();

  try {
    // Generate unique slug
    let slug = generateSlug(data.name);
    let slugCounter = 0;
    let slugExists = true;

    while (slugExists) {
      const testSlug = slugCounter === 0 ? slug : `${slug}-${slugCounter}`;
      const { data: existing } = await (supabase as any)
        .from("workspaces")
        .select("id")
        .eq("slug", testSlug)
        .single();

      if (!existing) {
        slug = testSlug;
        slugExists = false;
      } else {
        slugCounter++;
      }
    }

    // Get parent organization branding if copy_branding is true
    let branding = null;
    if (data.copy_branding) {
      const { data: parentBranding } = await (supabase as any)
        .from("crm_branding_settings")
        .select("*")
        .eq("workspace_id", parentOrgId)
        .single();

      if (parentBranding) {
        branding = { ...parentBranding };
        delete branding.id;
        delete branding.workspace_id;
        delete branding.created_at;
        delete branding.updated_at;
      }
    }

    // Determine feature flags and limits based on tier
    const tierFeatureFlags = {
      ...featureFlags[data.subscription_tier],
      ...(data.custom_feature_flags || {}),
    };

    const tierUsageLimits = {
      ...usageLimits[data.subscription_tier],
      ...(data.custom_usage_limits || {}),
    };

    // Create the workspace (sub-account)
    const { data: workspace, error: workspaceError } = await (supabase as any)
      .from("workspaces")
      .insert({
        name: data.name,
        slug,
        parent_id: parentOrgId,
        status: "pending",
        subscription_tier: data.subscription_tier,
        settings: {
          inherit_branding: data.copy_branding || false,
          ...data.custom_settings,
        },
        feature_flags: tierFeatureFlags,
        usage_limits: tierUsageLimits,
        created_by: createdByUserId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (workspaceError) throw workspaceError;

    // Copy branding to new workspace if requested
    if (branding) {
      await (supabase as any)
        .from("crm_branding_settings")
        .insert({
          workspace_id: workspace.id,
          ...branding,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
    }

    // Create default pipeline for the sub-account
    await (supabase as any)
      .from("crm_pipelines")
      .insert({
        workspace_id: workspace.id,
        name: "Sales Pipeline",
        description: "Default sales pipeline",
        is_default: true,
        stages: [
          { id: "lead", name: "Lead", order: 0, color: "#6366f1" },
          { id: "qualified", name: "Qualified", order: 1, color: "#8b5cf6" },
          { id: "proposal", name: "Proposal", order: 2, color: "#a855f7" },
          { id: "negotiation", name: "Negotiation", order: 3, color: "#d946ef" },
          { id: "closed_won", name: "Closed Won", order: 4, color: "#22c55e" },
          { id: "closed_lost", name: "Closed Lost", order: 5, color: "#ef4444" },
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    // Create invitation for admin user
    const invitationCode = generateInvitationCode();
    const { error: inviteError } = await (supabase as any)
      .from("crm_user_invitations")
      .insert({
        workspace_id: workspace.id,
        email: data.admin_email,
        role: "owner",
        invitation_code: invitationCode,
        invited_by: createdByUserId,
        status: "pending",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        created_at: new Date().toISOString(),
      });

    if (inviteError) {
      console.error("Failed to create invitation:", inviteError);
    }

    // Log the account creation
    await logAccountAction(parentOrgId, workspace.id, createdByUserId, "create", {
      name: data.name,
      admin_email: data.admin_email,
      subscription_tier: data.subscription_tier,
    });

    // Return the created account
    const account: SubAccount = {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      parent_id: parentOrgId,
      status: "pending",
      subscription_tier: data.subscription_tier,
      settings: workspace.settings,
      feature_flags: tierFeatureFlags,
      usage_limits: tierUsageLimits,
      admin_email: data.admin_email,
      created_at: workspace.created_at,
      updated_at: workspace.updated_at,
      created_by: createdByUserId,
    };

    return { success: true, account };
  } catch (error) {
    console.error("Error creating sub-account:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create sub-account",
    };
  }
}

/**
 * Get sub-accounts for a parent organization
 */
export async function getSubAccounts(parentOrgId: string): Promise<SubAccount[]> {
  const supabase = await createClient();

  const { data: workspaces, error } = await (supabase as any)
    .from("workspaces")
    .select("*")
    .eq("parent_id", parentOrgId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching sub-accounts:", error);
    return [];
  }

  // Get counts for each sub-account
  const accounts = await Promise.all(
    (workspaces || []).map(async (workspace: any) => {
      const [contactCount, dealCount, userCount] = await Promise.all([
        getCount(supabase, "crm_contacts", workspace.id),
        getCount(supabase, "crm_deals", workspace.id),
        getCount(supabase, "profiles", workspace.id),
      ]);

      return {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        parent_id: workspace.parent_id,
        logo_url: workspace.logo_url,
        status: workspace.status || "active",
        subscription_tier: workspace.subscription_tier || "starter",
        contact_count: contactCount,
        deal_count: dealCount,
        user_count: userCount,
        settings: workspace.settings || {},
        feature_flags: workspace.feature_flags || featureFlags.starter,
        usage_limits: workspace.usage_limits || usageLimits.starter,
        created_at: workspace.created_at,
        updated_at: workspace.updated_at,
        created_by: workspace.created_by,
      } as SubAccount;
    })
  );

  return accounts;
}

/**
 * Get a single sub-account by ID
 */
export async function getSubAccount(accountId: string): Promise<SubAccount | null> {
  const supabase = await createClient();

  const { data: workspace, error } = await (supabase as any)
    .from("workspaces")
    .select("*")
    .eq("id", accountId)
    .single();

  if (error || !workspace) {
    return null;
  }

  const [contactCount, dealCount, userCount] = await Promise.all([
    getCount(supabase, "crm_contacts", accountId),
    getCount(supabase, "crm_deals", accountId),
    getCount(supabase, "profiles", accountId),
  ]);

  // Get admin user info
  const { data: adminUser } = await (supabase as any)
    .from("profiles")
    .select("email, first_name, last_name")
    .eq("workspace_id", accountId)
    .eq("role", "owner")
    .single();

  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    parent_id: workspace.parent_id,
    logo_url: workspace.logo_url,
    status: workspace.status || "active",
    subscription_tier: workspace.subscription_tier || "starter",
    contact_count: contactCount,
    deal_count: dealCount,
    user_count: userCount,
    settings: workspace.settings || {},
    feature_flags: workspace.feature_flags || featureFlags.starter,
    usage_limits: workspace.usage_limits || usageLimits.starter,
    admin_email: adminUser?.email,
    admin_name: adminUser ? `${adminUser.first_name || ""} ${adminUser.last_name || ""}`.trim() : undefined,
    created_at: workspace.created_at,
    updated_at: workspace.updated_at,
    created_by: workspace.created_by,
  };
}

/**
 * Update a sub-account
 */
export async function updateSubAccount(
  accountId: string,
  data: UpdateAccountData,
  updatedByUserId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    // Get current account data
    const { data: current } = await (supabase as any)
      .from("workspaces")
      .select("*")
      .eq("id", accountId)
      .single();

    if (!current) {
      return { success: false, error: "Account not found" };
    }

    // Merge updates
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (data.name) updates.name = data.name;
    if (data.status) updates.status = data.status;
    if (data.subscription_tier) {
      updates.subscription_tier = data.subscription_tier;
      // Update feature flags and limits based on new tier
      updates.feature_flags = {
        ...featureFlags[data.subscription_tier],
        ...(data.feature_flags || {}),
      };
      updates.usage_limits = {
        ...usageLimits[data.subscription_tier],
        ...(data.usage_limits || {}),
      };
    } else {
      if (data.feature_flags) {
        updates.feature_flags = { ...(current.feature_flags || {}), ...data.feature_flags };
      }
      if (data.usage_limits) {
        updates.usage_limits = { ...(current.usage_limits || {}), ...data.usage_limits };
      }
    }
    if (data.settings) {
      updates.settings = { ...(current.settings || {}), ...data.settings };
    }

    const { error } = await (supabase as any)
      .from("workspaces")
      .update(updates)
      .eq("id", accountId);

    if (error) throw error;

    // Log the update
    await logAccountAction(current.parent_id, accountId, updatedByUserId, "update", data);

    return { success: true };
  } catch (error) {
    console.error("Error updating sub-account:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update sub-account",
    };
  }
}

/**
 * Delete a sub-account (soft delete by setting status to cancelled)
 */
export async function deleteSubAccount(
  accountId: string,
  deletedByUserId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    const { data: account } = await (supabase as any)
      .from("workspaces")
      .select("parent_id")
      .eq("id", accountId)
      .single();

    if (!account) {
      return { success: false, error: "Account not found" };
    }

    // Soft delete - set status to cancelled
    const { error } = await (supabase as any)
      .from("workspaces")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", accountId);

    if (error) throw error;

    // Log the deletion
    await logAccountAction(account.parent_id, accountId, deletedByUserId, "delete", {});

    return { success: true };
  } catch (error) {
    console.error("Error deleting sub-account:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete sub-account",
    };
  }
}

/**
 * Get account context for the current user (for account switching)
 */
export async function getAccountContext(userId: string): Promise<AccountContext | null> {
  const supabase = await createClient();

  // Get user's profile with workspace info
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("workspace_id, role")
    .eq("id", userId)
    .single();

  if (!profile?.workspace_id) {
    return null;
  }

  // Get current workspace
  const { data: currentWorkspace } = await (supabase as any)
    .from("workspaces")
    .select("*")
    .eq("id", profile.workspace_id)
    .single();

  if (!currentWorkspace) {
    return null;
  }

  const isSubAccount = !!currentWorkspace.parent_id;
  const canManageAccounts = profile.role === "owner" || profile.role === "admin";

  // Get available accounts for switching
  const availableAccounts: AccountSwitchOption[] = [];

  // If this is a sub-account and user has parent access, add parent
  if (isSubAccount && currentWorkspace.parent_id) {
    const { data: parentWorkspace } = await (supabase as any)
      .from("workspaces")
      .select("id, name, logo_url")
      .eq("id", currentWorkspace.parent_id)
      .single();

    if (parentWorkspace) {
      availableAccounts.push({
        id: parentWorkspace.id,
        name: parentWorkspace.name,
        logo_url: parentWorkspace.logo_url,
        is_current: false,
        is_parent: true,
        type: "parent",
      });
    }
  }

  // Add current account
  availableAccounts.push({
    id: currentWorkspace.id,
    name: currentWorkspace.name,
    logo_url: currentWorkspace.logo_url,
    is_current: true,
    is_parent: !isSubAccount,
    type: isSubAccount ? "sub" : "self",
  });

  // If user can manage accounts and this is a parent org, add sub-accounts
  if (canManageAccounts && !isSubAccount) {
    const { data: subAccounts } = await (supabase as any)
      .from("workspaces")
      .select("id, name, logo_url")
      .eq("parent_id", currentWorkspace.id)
      .neq("status", "cancelled")
      .order("name");

    if (subAccounts) {
      subAccounts.forEach((sub: any) => {
        availableAccounts.push({
          id: sub.id,
          name: sub.name,
          logo_url: sub.logo_url,
          is_current: false,
          is_parent: false,
          type: "sub",
        });
      });
    }
  }

  // Get parent info if sub-account
  let parentAccountId = null;
  let parentAccountName = null;
  if (isSubAccount && currentWorkspace.parent_id) {
    const { data: parent } = await (supabase as any)
      .from("workspaces")
      .select("id, name")
      .eq("id", currentWorkspace.parent_id)
      .single();

    if (parent) {
      parentAccountId = parent.id;
      parentAccountName = parent.name;
    }
  }

  return {
    current_account_id: currentWorkspace.id,
    current_account_name: currentWorkspace.name,
    parent_account_id: parentAccountId,
    parent_account_name: parentAccountName,
    is_sub_account: isSubAccount,
    can_switch_accounts: availableAccounts.length > 1,
    available_accounts: availableAccounts,
  };
}

/**
 * Check if user can access a specific account
 */
export async function canAccessAccount(
  userId: string,
  targetAccountId: string
): Promise<boolean> {
  const supabase = await createClient();

  // Get user's workspace
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("workspace_id, role")
    .eq("id", userId)
    .single();

  if (!profile?.workspace_id) {
    return false;
  }

  // If same workspace, allow
  if (profile.workspace_id === targetAccountId) {
    return true;
  }

  // Only owners and admins can access other accounts
  if (profile.role !== "owner" && profile.role !== "admin") {
    return false;
  }

  // Check if target is a sub-account of user's workspace
  const { data: targetWorkspace } = await (supabase as any)
    .from("workspaces")
    .select("parent_id")
    .eq("id", targetAccountId)
    .single();

  if (targetWorkspace?.parent_id === profile.workspace_id) {
    return true;
  }

  // Check if user's workspace is a sub-account and target is the parent
  const { data: userWorkspace } = await (supabase as any)
    .from("workspaces")
    .select("parent_id")
    .eq("id", profile.workspace_id)
    .single();

  if (userWorkspace?.parent_id === targetAccountId) {
    return true;
  }

  return false;
}

/**
 * Log account action for audit trail
 */
async function logAccountAction(
  parentOrgId: string | null,
  accountId: string,
  userId: string,
  action: "create" | "update" | "delete" | "login_as" | "switch",
  details: Record<string, any>
): Promise<void> {
  const supabase = await createClient();

  try {
    await (supabase as any)
      .from("crm_account_audit_log")
      .insert({
        parent_org_id: parentOrgId,
        account_id: accountId,
        user_id: userId,
        action,
        details,
        created_at: new Date().toISOString(),
      });
  } catch (error) {
    console.error("Failed to log account action:", error);
  }
}

/**
 * Helper: Get count from a table for a workspace
 */
async function getCount(supabase: any, table: string, workspaceId: string): Promise<number> {
  const { count } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);

  return count || 0;
}

/**
 * Generate a random invitation code
 */
function generateInvitationCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 32; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

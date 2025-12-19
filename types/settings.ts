// Organization settings
export interface OrganizationSettings {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  website?: string;
  industry?: string;
  size?: OrganizationSize;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  phone?: string;
  email?: string;
  timezone: string;
  date_format: DateFormat;
  time_format: TimeFormat;
  currency: string;
  fiscal_year_start: number; // Month 1-12
  created_at: string;
  updated_at: string;
}

export type OrganizationSize = "1-10" | "11-50" | "51-200" | "201-500" | "501-1000" | "1000+";

export type DateFormat = "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";

export type TimeFormat = "12h" | "24h";

// User in organization
export interface OrganizationUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  role: UserRole;
  status: UserStatus;
  last_active_at?: string;
  invited_at?: string;
  joined_at?: string;
  invited_by?: string;
}

export type UserRole = "owner" | "admin" | "manager" | "member" | "viewer" | string;

export type UserStatus = "active" | "invited" | "deactivated";

// Role definition
export interface Role {
  id: string;
  name: string;
  description?: string;
  is_system: boolean; // System roles can't be deleted
  permissions: RolePermissions;
  user_count?: number;
  created_at: string;
  updated_at: string;
}

// Permission resources
export type PermissionResource =
  | "contacts"
  | "deals"
  | "pipelines"
  | "campaigns"
  | "templates"
  | "workflows"
  | "forms"
  | "pages"
  | "conversations"
  | "appointments"
  | "reports"
  | "settings"
  | "users"
  | "roles"
  | "integrations"
  | "billing";

// Permission actions
export type PermissionAction = "view" | "create" | "edit" | "delete" | "manage";

// Permission level
export type PermissionLevel = "none" | "own" | "team" | "all";

// Resource permission
export interface ResourcePermission {
  view: PermissionLevel;
  create: boolean;
  edit: PermissionLevel;
  delete: PermissionLevel;
  manage?: boolean; // For resources that have special management permissions
}

// Full permissions object
export type RolePermissions = {
  [K in PermissionResource]?: ResourcePermission;
};

// User invitation
export interface UserInvitation {
  email: string;
  role: UserRole;
  message?: string;
}

// Common timezones
export const commonTimezones = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Phoenix", label: "Arizona (MST)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HST)" },
  { value: "UTC", label: "UTC" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Europe/Berlin", label: "Berlin (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
  { value: "Australia/Melbourne", label: "Melbourne (AEST)" },
];

// Default permissions by role
export const defaultRolePermissions: Record<string, RolePermissions> = {
  owner: {
    contacts: { view: "all", create: true, edit: "all", delete: "all", manage: true },
    deals: { view: "all", create: true, edit: "all", delete: "all", manage: true },
    pipelines: { view: "all", create: true, edit: "all", delete: "all", manage: true },
    campaigns: { view: "all", create: true, edit: "all", delete: "all", manage: true },
    templates: { view: "all", create: true, edit: "all", delete: "all", manage: true },
    workflows: { view: "all", create: true, edit: "all", delete: "all", manage: true },
    forms: { view: "all", create: true, edit: "all", delete: "all", manage: true },
    pages: { view: "all", create: true, edit: "all", delete: "all", manage: true },
    conversations: { view: "all", create: true, edit: "all", delete: "all", manage: true },
    appointments: { view: "all", create: true, edit: "all", delete: "all", manage: true },
    reports: { view: "all", create: true, edit: "all", delete: "all", manage: true },
    settings: { view: "all", create: true, edit: "all", delete: "all", manage: true },
    users: { view: "all", create: true, edit: "all", delete: "all", manage: true },
    roles: { view: "all", create: true, edit: "all", delete: "all", manage: true },
    integrations: { view: "all", create: true, edit: "all", delete: "all", manage: true },
    billing: { view: "all", create: true, edit: "all", delete: "all", manage: true },
  },
  admin: {
    contacts: { view: "all", create: true, edit: "all", delete: "all" },
    deals: { view: "all", create: true, edit: "all", delete: "all" },
    pipelines: { view: "all", create: true, edit: "all", delete: "all" },
    campaigns: { view: "all", create: true, edit: "all", delete: "all" },
    templates: { view: "all", create: true, edit: "all", delete: "all" },
    workflows: { view: "all", create: true, edit: "all", delete: "all" },
    forms: { view: "all", create: true, edit: "all", delete: "all" },
    pages: { view: "all", create: true, edit: "all", delete: "all" },
    conversations: { view: "all", create: true, edit: "all", delete: "all" },
    appointments: { view: "all", create: true, edit: "all", delete: "all" },
    reports: { view: "all", create: true, edit: "all", delete: "all" },
    settings: { view: "all", create: true, edit: "all", delete: "none" },
    users: { view: "all", create: true, edit: "all", delete: "all" },
    roles: { view: "all", create: true, edit: "all", delete: "none" },
    integrations: { view: "all", create: true, edit: "all", delete: "all" },
    billing: { view: "all", create: false, edit: "none", delete: "none" },
  },
  manager: {
    contacts: { view: "team", create: true, edit: "team", delete: "own" },
    deals: { view: "team", create: true, edit: "team", delete: "own" },
    pipelines: { view: "all", create: false, edit: "none", delete: "none" },
    campaigns: { view: "team", create: true, edit: "team", delete: "own" },
    templates: { view: "all", create: true, edit: "own", delete: "own" },
    workflows: { view: "team", create: true, edit: "own", delete: "own" },
    forms: { view: "team", create: true, edit: "own", delete: "own" },
    pages: { view: "team", create: true, edit: "own", delete: "own" },
    conversations: { view: "team", create: true, edit: "team", delete: "none" },
    appointments: { view: "team", create: true, edit: "team", delete: "own" },
    reports: { view: "team", create: true, edit: "own", delete: "own" },
    settings: { view: "own", create: false, edit: "none", delete: "none" },
    users: { view: "team", create: false, edit: "none", delete: "none" },
    roles: { view: "none", create: false, edit: "none", delete: "none" },
    integrations: { view: "all", create: false, edit: "none", delete: "none" },
    billing: { view: "none", create: false, edit: "none", delete: "none" },
  },
  member: {
    contacts: { view: "own", create: true, edit: "own", delete: "own" },
    deals: { view: "own", create: true, edit: "own", delete: "own" },
    pipelines: { view: "all", create: false, edit: "none", delete: "none" },
    campaigns: { view: "own", create: true, edit: "own", delete: "own" },
    templates: { view: "all", create: false, edit: "none", delete: "none" },
    workflows: { view: "own", create: true, edit: "own", delete: "own" },
    forms: { view: "own", create: true, edit: "own", delete: "own" },
    pages: { view: "own", create: true, edit: "own", delete: "own" },
    conversations: { view: "own", create: true, edit: "own", delete: "none" },
    appointments: { view: "own", create: true, edit: "own", delete: "own" },
    reports: { view: "own", create: true, edit: "own", delete: "own" },
    settings: { view: "own", create: false, edit: "none", delete: "none" },
    users: { view: "none", create: false, edit: "none", delete: "none" },
    roles: { view: "none", create: false, edit: "none", delete: "none" },
    integrations: { view: "none", create: false, edit: "none", delete: "none" },
    billing: { view: "none", create: false, edit: "none", delete: "none" },
  },
  viewer: {
    contacts: { view: "all", create: false, edit: "none", delete: "none" },
    deals: { view: "all", create: false, edit: "none", delete: "none" },
    pipelines: { view: "all", create: false, edit: "none", delete: "none" },
    campaigns: { view: "all", create: false, edit: "none", delete: "none" },
    templates: { view: "all", create: false, edit: "none", delete: "none" },
    workflows: { view: "all", create: false, edit: "none", delete: "none" },
    forms: { view: "all", create: false, edit: "none", delete: "none" },
    pages: { view: "all", create: false, edit: "none", delete: "none" },
    conversations: { view: "all", create: false, edit: "none", delete: "none" },
    appointments: { view: "all", create: false, edit: "none", delete: "none" },
    reports: { view: "all", create: false, edit: "none", delete: "none" },
    settings: { view: "none", create: false, edit: "none", delete: "none" },
    users: { view: "none", create: false, edit: "none", delete: "none" },
    roles: { view: "none", create: false, edit: "none", delete: "none" },
    integrations: { view: "none", create: false, edit: "none", delete: "none" },
    billing: { view: "none", create: false, edit: "none", delete: "none" },
  },
};

// Resource labels
export const resourceLabels: Record<PermissionResource, string> = {
  contacts: "Contacts",
  deals: "Deals",
  pipelines: "Pipelines",
  campaigns: "Campaigns",
  templates: "Templates",
  workflows: "Workflows",
  forms: "Forms",
  pages: "Pages",
  conversations: "Conversations",
  appointments: "Appointments",
  reports: "Reports",
  settings: "Settings",
  users: "Users",
  roles: "Roles",
  integrations: "Integrations",
  billing: "Billing",
};

// Permission level labels
export const permissionLevelLabels: Record<PermissionLevel, string> = {
  none: "None",
  own: "Own Only",
  team: "Team",
  all: "All",
};

// Role labels
export const roleLabels: Record<string, string> = {
  owner: "Owner",
  admin: "Administrator",
  manager: "Manager",
  member: "Member",
  viewer: "Viewer",
};

// Get role label
export function getRoleLabel(role: string): string {
  return roleLabels[role] || role;
}

// Get user display name
export function getUserDisplayName(user: OrganizationUser): string {
  if (user.first_name || user.last_name) {
    return `${user.first_name || ""} ${user.last_name || ""}`.trim();
  }
  return user.email;
}

// Get user initials
export function getUserInitials(user: OrganizationUser): string {
  if (user.first_name && user.last_name) {
    return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
  }
  if (user.first_name) {
    return user.first_name.substring(0, 2).toUpperCase();
  }
  return user.email.substring(0, 2).toUpperCase();
}

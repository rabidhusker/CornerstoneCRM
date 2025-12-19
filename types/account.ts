// Sub-account/Agency types

export interface SubAccount {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  logo_url?: string;
  status: AccountStatus;
  subscription_tier: SubscriptionTier;

  // Counts for display
  contact_count?: number;
  deal_count?: number;
  user_count?: number;

  // Settings
  settings: AccountSettings;
  feature_flags: FeatureFlags;
  usage_limits: UsageLimits;

  // Admin info
  admin_email?: string;
  admin_name?: string;

  // Metadata
  created_at: string;
  updated_at: string;
  created_by: string;
}

export type AccountStatus = "active" | "suspended" | "pending" | "cancelled";

export type SubscriptionTier = "free" | "starter" | "professional" | "enterprise" | "custom";

export interface AccountSettings {
  // Branding inheritance
  inherit_branding?: boolean;
  custom_domain?: string;

  // Communication
  default_from_email?: string;
  default_from_name?: string;

  // Features
  allow_sub_accounts?: boolean;
  max_sub_accounts?: number;
}

export interface FeatureFlags {
  // Core modules
  contacts: boolean;
  deals: boolean;
  pipelines: boolean;

  // Communication
  email_campaigns: boolean;
  sms_campaigns: boolean;
  conversations: boolean;

  // Automation
  workflows: boolean;
  forms: boolean;
  landing_pages: boolean;

  // Calendar
  appointments: boolean;
  booking_pages: boolean;

  // Reporting
  reports: boolean;
  custom_reports: boolean;

  // Integrations
  integrations: boolean;
  api_access: boolean;
  webhooks: boolean;

  // White-label
  white_label: boolean;
  custom_domain: boolean;
  remove_branding: boolean;
}

export interface UsageLimits {
  // Contacts
  max_contacts: number;
  max_contacts_per_import: number;

  // Users
  max_users: number;

  // Deals
  max_deals: number;
  max_pipelines: number;

  // Campaigns
  max_emails_per_month: number;
  max_sms_per_month: number;

  // Storage
  max_storage_gb: number;

  // Automation
  max_workflows: number;
  max_forms: number;
  max_landing_pages: number;

  // API
  api_requests_per_minute: number;
}

// Default feature flags by tier
export const defaultFeatureFlags: Record<SubscriptionTier, FeatureFlags> = {
  free: {
    contacts: true,
    deals: true,
    pipelines: true,
    email_campaigns: false,
    sms_campaigns: false,
    conversations: true,
    workflows: false,
    forms: true,
    landing_pages: false,
    appointments: true,
    booking_pages: true,
    reports: true,
    custom_reports: false,
    integrations: false,
    api_access: false,
    webhooks: false,
    white_label: false,
    custom_domain: false,
    remove_branding: false,
  },
  starter: {
    contacts: true,
    deals: true,
    pipelines: true,
    email_campaigns: true,
    sms_campaigns: false,
    conversations: true,
    workflows: true,
    forms: true,
    landing_pages: true,
    appointments: true,
    booking_pages: true,
    reports: true,
    custom_reports: false,
    integrations: true,
    api_access: false,
    webhooks: false,
    white_label: false,
    custom_domain: false,
    remove_branding: false,
  },
  professional: {
    contacts: true,
    deals: true,
    pipelines: true,
    email_campaigns: true,
    sms_campaigns: true,
    conversations: true,
    workflows: true,
    forms: true,
    landing_pages: true,
    appointments: true,
    booking_pages: true,
    reports: true,
    custom_reports: true,
    integrations: true,
    api_access: true,
    webhooks: true,
    white_label: false,
    custom_domain: false,
    remove_branding: false,
  },
  enterprise: {
    contacts: true,
    deals: true,
    pipelines: true,
    email_campaigns: true,
    sms_campaigns: true,
    conversations: true,
    workflows: true,
    forms: true,
    landing_pages: true,
    appointments: true,
    booking_pages: true,
    reports: true,
    custom_reports: true,
    integrations: true,
    api_access: true,
    webhooks: true,
    white_label: true,
    custom_domain: true,
    remove_branding: true,
  },
  custom: {
    contacts: true,
    deals: true,
    pipelines: true,
    email_campaigns: true,
    sms_campaigns: true,
    conversations: true,
    workflows: true,
    forms: true,
    landing_pages: true,
    appointments: true,
    booking_pages: true,
    reports: true,
    custom_reports: true,
    integrations: true,
    api_access: true,
    webhooks: true,
    white_label: true,
    custom_domain: true,
    remove_branding: true,
  },
};

// Default usage limits by tier
export const defaultUsageLimits: Record<SubscriptionTier, UsageLimits> = {
  free: {
    max_contacts: 500,
    max_contacts_per_import: 100,
    max_users: 2,
    max_deals: 100,
    max_pipelines: 1,
    max_emails_per_month: 0,
    max_sms_per_month: 0,
    max_storage_gb: 1,
    max_workflows: 0,
    max_forms: 3,
    max_landing_pages: 0,
    api_requests_per_minute: 0,
  },
  starter: {
    max_contacts: 2500,
    max_contacts_per_import: 500,
    max_users: 5,
    max_deals: 500,
    max_pipelines: 3,
    max_emails_per_month: 5000,
    max_sms_per_month: 0,
    max_storage_gb: 5,
    max_workflows: 5,
    max_forms: 10,
    max_landing_pages: 5,
    api_requests_per_minute: 0,
  },
  professional: {
    max_contacts: 15000,
    max_contacts_per_import: 2000,
    max_users: 15,
    max_deals: 5000,
    max_pipelines: 10,
    max_emails_per_month: 25000,
    max_sms_per_month: 1000,
    max_storage_gb: 25,
    max_workflows: 25,
    max_forms: 50,
    max_landing_pages: 25,
    api_requests_per_minute: 60,
  },
  enterprise: {
    max_contacts: 100000,
    max_contacts_per_import: 10000,
    max_users: 100,
    max_deals: 50000,
    max_pipelines: 50,
    max_emails_per_month: 100000,
    max_sms_per_month: 10000,
    max_storage_gb: 100,
    max_workflows: 100,
    max_forms: 200,
    max_landing_pages: 100,
    api_requests_per_minute: 300,
  },
  custom: {
    max_contacts: -1, // Unlimited
    max_contacts_per_import: -1,
    max_users: -1,
    max_deals: -1,
    max_pipelines: -1,
    max_emails_per_month: -1,
    max_sms_per_month: -1,
    max_storage_gb: -1,
    max_workflows: -1,
    max_forms: -1,
    max_landing_pages: -1,
    api_requests_per_minute: -1,
  },
};

// Form data for creating/updating accounts
export interface CreateAccountData {
  name: string;
  admin_email: string;
  admin_first_name?: string;
  admin_last_name?: string;
  subscription_tier: SubscriptionTier;
  copy_branding?: boolean;
  custom_settings?: Partial<AccountSettings>;
  custom_feature_flags?: Partial<FeatureFlags>;
  custom_usage_limits?: Partial<UsageLimits>;
}

export interface UpdateAccountData {
  name?: string;
  status?: AccountStatus;
  subscription_tier?: SubscriptionTier;
  settings?: Partial<AccountSettings>;
  feature_flags?: Partial<FeatureFlags>;
  usage_limits?: Partial<UsageLimits>;
}

// Account context for switching
export interface AccountContext {
  current_account_id: string;
  current_account_name: string;
  parent_account_id: string | null;
  parent_account_name: string | null;
  is_sub_account: boolean;
  can_switch_accounts: boolean;
  available_accounts: AccountSwitchOption[];
}

export interface AccountSwitchOption {
  id: string;
  name: string;
  logo_url?: string;
  is_current: boolean;
  is_parent: boolean;
  type: "parent" | "sub" | "self";
}

// Subscription tier labels
export const subscriptionTierLabels: Record<SubscriptionTier, string> = {
  free: "Free",
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
  custom: "Custom",
};

// Account status configuration
export const accountStatusConfig: Record<AccountStatus, { label: string; color: string; bgColor: string }> = {
  active: {
    label: "Active",
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  pending: {
    label: "Pending",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  suspended: {
    label: "Suspended",
    color: "text-red-600",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-gray-600",
    bgColor: "bg-gray-100 dark:bg-gray-800",
  },
};

// Generate slug from name
export function generateAccountSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

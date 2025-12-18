import type { Database } from "./database";

// Re-export base types from database
export type Campaign = Database["public"]["Tables"]["crm_campaigns"]["Row"];
export type CampaignInsert = Database["public"]["Tables"]["crm_campaigns"]["Insert"];
export type CampaignUpdate = Database["public"]["Tables"]["crm_campaigns"]["Update"];

export type CampaignContact = Database["public"]["Tables"]["crm_campaign_contacts"]["Row"];
export type CampaignContactInsert = Database["public"]["Tables"]["crm_campaign_contacts"]["Insert"];

// Campaign types
export type CampaignType = "email" | "sms" | "drip";
export type CampaignStatus = "draft" | "scheduled" | "active" | "paused" | "completed";

// Campaign type configuration
export const campaignTypeConfig: Record<
  CampaignType,
  { label: string; description: string; icon: string }
> = {
  email: {
    label: "Email Campaign",
    description: "Send a one-time email to your contacts",
    icon: "mail",
  },
  sms: {
    label: "SMS Campaign",
    description: "Send a text message to your contacts",
    icon: "smartphone",
  },
  drip: {
    label: "Email Sequence",
    description: "Automated series of emails over time",
    icon: "git-branch",
  },
};

// Campaign status configuration
export const campaignStatusConfig: Record<
  CampaignStatus,
  { label: string; color: string; bgColor: string }
> = {
  draft: {
    label: "Draft",
    color: "text-gray-600",
    bgColor: "bg-gray-100 dark:bg-gray-800",
  },
  scheduled: {
    label: "Scheduled",
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  active: {
    label: "Active",
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  paused: {
    label: "Paused",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  completed: {
    label: "Completed",
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
};

// Campaign with creator info
export interface CampaignWithCreator extends Campaign {
  creator?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

// Campaign settings type
export interface CampaignSettings {
  // Email settings
  from_name?: string;
  from_email?: string;
  reply_to?: string;

  // SMS settings
  sender_id?: string;

  // Audience settings
  audience_type?: "all" | "tags" | "lifecycle" | "custom";
  audience_tags?: string[];
  audience_lifecycle_stages?: string[];
  audience_filter?: Record<string, unknown>;
  exclude_unsubscribed?: boolean;
  exclude_bounced?: boolean;

  // Drip/Sequence settings
  sequence_steps?: SequenceStep[];

  // Scheduling
  send_timezone?: string;
  send_time_optimization?: boolean;
}

// Sequence step for drip campaigns
export interface SequenceStep {
  id: string;
  position: number;
  name: string;
  delay_days: number;
  delay_hours: number;
  subject_line?: string;
  content_html?: string;
  content_text?: string;
}

// Campaign stats
export interface CampaignStats {
  recipients_count: number;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  unsubscribed_count: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
  unsubscribe_rate: number;
}

// Calculate campaign stats from campaign data
export function calculateCampaignStats(campaign: Campaign): CampaignStats {
  const sent = campaign.sent_count || 0;
  const delivered = campaign.delivered_count || 0;
  const opened = campaign.opened_count || 0;
  const clicked = campaign.clicked_count || 0;
  const bounced = campaign.bounced_count || 0;
  const unsubscribed = campaign.unsubscribed_count || 0;

  return {
    recipients_count: campaign.recipients_count || 0,
    sent_count: sent,
    delivered_count: delivered,
    opened_count: opened,
    clicked_count: clicked,
    bounced_count: bounced,
    unsubscribed_count: unsubscribed,
    delivery_rate: sent > 0 ? (delivered / sent) * 100 : 0,
    open_rate: delivered > 0 ? (opened / delivered) * 100 : 0,
    click_rate: delivered > 0 ? (clicked / delivered) * 100 : 0,
    bounce_rate: sent > 0 ? (bounced / sent) * 100 : 0,
    unsubscribe_rate: delivered > 0 ? (unsubscribed / delivered) * 100 : 0,
  };
}

// Form data for creating/updating campaigns
export interface CampaignFormData {
  name: string;
  description?: string;
  type: CampaignType;
  subject_line?: string;
  content_html?: string;
  content_text?: string;
  settings?: CampaignSettings;
  scheduled_at?: string;
}

// Personalization tokens
export const personalizationTokens = [
  { token: "{{first_name}}", label: "First Name", description: "Contact's first name" },
  { token: "{{last_name}}", label: "Last Name", description: "Contact's last name" },
  { token: "{{full_name}}", label: "Full Name", description: "Contact's full name" },
  { token: "{{email}}", label: "Email", description: "Contact's email address" },
  { token: "{{phone}}", label: "Phone", description: "Contact's phone number" },
  { token: "{{company}}", label: "Company", description: "Contact's company name" },
  { token: "{{address}}", label: "Address", description: "Contact's address" },
  { token: "{{city}}", label: "City", description: "Contact's city" },
  { token: "{{state}}", label: "State", description: "Contact's state" },
];

// Filters for campaigns
export interface CampaignFilters {
  type?: CampaignType;
  status?: CampaignStatus[];
  search?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

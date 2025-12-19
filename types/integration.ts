// Integration provider types
export type IntegrationProvider =
  | "google"
  | "twilio"
  | "resend"
  | "sendgrid"
  | "stripe"
  | "slack"
  | "zoom"
  | "calendly"
  | "zapier"
  | "hubspot"
  | "salesforce"
  | "mailchimp";

// Integration categories
export type IntegrationCategory =
  | "email"
  | "calendar"
  | "communication"
  | "productivity"
  | "payment"
  | "crm"
  | "marketing";

// Integration status
export type IntegrationStatus = "connected" | "disconnected" | "error" | "pending";

// Integration definition
export interface IntegrationDefinition {
  id: IntegrationProvider;
  name: string;
  description: string;
  category: IntegrationCategory;
  logo: string;
  website: string;
  features: string[];
  requiresOAuth?: boolean;
  configFields?: IntegrationConfigField[];
  comingSoon?: boolean;
}

// Configuration field for integrations
export interface IntegrationConfigField {
  name: string;
  label: string;
  type: "text" | "password" | "email" | "select";
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  helpText?: string;
}

// Connected integration
export interface ConnectedIntegration {
  id: string;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  config: Record<string, any>;
  connected_at: string;
  last_sync_at?: string;
  error_message?: string;
  metadata?: Record<string, any>;
}

// API key
export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  permissions: string[];
  last_used_at?: string;
  created_at: string;
  expires_at?: string;
  is_active: boolean;
}

// Webhook configuration
export interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  is_active: boolean;
  created_at: string;
  last_triggered_at?: string;
  failure_count: number;
}

// API usage stats
export interface ApiUsageStats {
  period: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  average_latency_ms: number;
  requests_by_endpoint: Record<string, number>;
  requests_by_day: { date: string; count: number }[];
}

// Available integrations
export const availableIntegrations: IntegrationDefinition[] = [
  {
    id: "google",
    name: "Google",
    description: "Connect Google Calendar and Gmail for seamless scheduling and email",
    category: "calendar",
    logo: "/integrations/google.svg",
    website: "https://google.com",
    features: [
      "Two-way calendar sync",
      "Schedule meetings from CRM",
      "Email tracking",
      "Contact sync",
    ],
    requiresOAuth: true,
  },
  {
    id: "twilio",
    name: "Twilio",
    description: "Send SMS messages and make calls directly from your CRM",
    category: "communication",
    logo: "/integrations/twilio.svg",
    website: "https://twilio.com",
    features: [
      "SMS messaging",
      "Voice calls",
      "WhatsApp integration",
      "Message templates",
    ],
    configFields: [
      {
        name: "account_sid",
        label: "Account SID",
        type: "text",
        placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        required: true,
      },
      {
        name: "auth_token",
        label: "Auth Token",
        type: "password",
        placeholder: "Your Twilio auth token",
        required: true,
      },
      {
        name: "phone_number",
        label: "Phone Number",
        type: "text",
        placeholder: "+1234567890",
        required: true,
        helpText: "Your Twilio phone number for sending messages",
      },
    ],
  },
  {
    id: "resend",
    name: "Resend",
    description: "Modern email API for transactional and marketing emails",
    category: "email",
    logo: "/integrations/resend.svg",
    website: "https://resend.com",
    features: [
      "Transactional emails",
      "Email templates",
      "Delivery tracking",
      "Analytics",
    ],
    configFields: [
      {
        name: "api_key",
        label: "API Key",
        type: "password",
        placeholder: "re_xxxxxxxxxxxx",
        required: true,
      },
      {
        name: "from_email",
        label: "Default From Email",
        type: "email",
        placeholder: "noreply@yourdomain.com",
        required: true,
      },
      {
        name: "from_name",
        label: "Default From Name",
        type: "text",
        placeholder: "Your Company",
        required: false,
      },
    ],
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    description: "Reliable email delivery for transactional and marketing emails",
    category: "email",
    logo: "/integrations/sendgrid.svg",
    website: "https://sendgrid.com",
    features: [
      "Email campaigns",
      "Transactional emails",
      "Email templates",
      "Advanced analytics",
    ],
    configFields: [
      {
        name: "api_key",
        label: "API Key",
        type: "password",
        placeholder: "SG.xxxxxxxxxxxx",
        required: true,
      },
      {
        name: "from_email",
        label: "Default From Email",
        type: "email",
        placeholder: "noreply@yourdomain.com",
        required: true,
      },
      {
        name: "from_name",
        label: "Default From Name",
        type: "text",
        placeholder: "Your Company",
        required: false,
      },
    ],
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Accept payments and manage subscriptions",
    category: "payment",
    logo: "/integrations/stripe.svg",
    website: "https://stripe.com",
    features: [
      "Payment processing",
      "Subscription management",
      "Invoice generation",
      "Payment links",
    ],
    comingSoon: true,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Get notifications and updates in your Slack workspace",
    category: "productivity",
    logo: "/integrations/slack.svg",
    website: "https://slack.com",
    features: [
      "Deal notifications",
      "Task reminders",
      "Team updates",
      "Activity alerts",
    ],
    comingSoon: true,
  },
  {
    id: "zoom",
    name: "Zoom",
    description: "Schedule and join video meetings from your CRM",
    category: "communication",
    logo: "/integrations/zoom.svg",
    website: "https://zoom.us",
    features: [
      "Video meetings",
      "Webinar hosting",
      "Meeting scheduling",
      "Recording integration",
    ],
    comingSoon: true,
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Connect with 5,000+ apps through automated workflows",
    category: "productivity",
    logo: "/integrations/zapier.svg",
    website: "https://zapier.com",
    features: [
      "Workflow automation",
      "App connections",
      "Trigger actions",
      "Data sync",
    ],
    comingSoon: true,
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    description: "Sync contacts and manage email marketing campaigns",
    category: "marketing",
    logo: "/integrations/mailchimp.svg",
    website: "https://mailchimp.com",
    features: [
      "Contact sync",
      "Email campaigns",
      "Audience management",
      "Marketing automation",
    ],
    comingSoon: true,
  },
];

// Get integrations by category
export function getIntegrationsByCategory(
  category: IntegrationCategory
): IntegrationDefinition[] {
  return availableIntegrations.filter((i) => i.category === category);
}

// Get integration by provider
export function getIntegrationByProvider(
  provider: IntegrationProvider
): IntegrationDefinition | undefined {
  return availableIntegrations.find((i) => i.id === provider);
}

// Category labels
export const categoryLabels: Record<IntegrationCategory, string> = {
  email: "Email",
  calendar: "Calendar",
  communication: "Communication",
  productivity: "Productivity",
  payment: "Payment",
  crm: "CRM",
  marketing: "Marketing",
};

// Category icons (as string identifiers)
export const categoryIcons: Record<IntegrationCategory, string> = {
  email: "Mail",
  calendar: "Calendar",
  communication: "MessageSquare",
  productivity: "Zap",
  payment: "CreditCard",
  crm: "Users",
  marketing: "Megaphone",
};

// Webhook events
export const webhookEvents = [
  { value: "contact.created", label: "Contact Created" },
  { value: "contact.updated", label: "Contact Updated" },
  { value: "contact.deleted", label: "Contact Deleted" },
  { value: "deal.created", label: "Deal Created" },
  { value: "deal.updated", label: "Deal Updated" },
  { value: "deal.won", label: "Deal Won" },
  { value: "deal.lost", label: "Deal Lost" },
  { value: "appointment.created", label: "Appointment Created" },
  { value: "appointment.updated", label: "Appointment Updated" },
  { value: "appointment.cancelled", label: "Appointment Cancelled" },
  { value: "form.submitted", label: "Form Submitted" },
  { value: "campaign.sent", label: "Campaign Sent" },
];

// API key permissions
export const apiKeyPermissions = [
  { value: "contacts:read", label: "Read Contacts" },
  { value: "contacts:write", label: "Write Contacts" },
  { value: "deals:read", label: "Read Deals" },
  { value: "deals:write", label: "Write Deals" },
  { value: "campaigns:read", label: "Read Campaigns" },
  { value: "campaigns:write", label: "Write Campaigns" },
  { value: "reports:read", label: "Read Reports" },
  { value: "webhooks:manage", label: "Manage Webhooks" },
];

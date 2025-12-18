// Email Template Types

export interface EmailTemplate {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  category: TemplateCategory;
  subject_line: string | null;
  content_html: string | null;
  content_text: string | null;
  thumbnail_url: string | null;
  is_default: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplateInsert {
  workspace_id: string;
  name: string;
  description?: string | null;
  category?: TemplateCategory;
  subject_line?: string | null;
  content_html?: string | null;
  content_text?: string | null;
  thumbnail_url?: string | null;
  is_default?: boolean;
  created_by: string;
}

export interface EmailTemplateUpdate {
  name?: string;
  description?: string | null;
  category?: TemplateCategory;
  subject_line?: string | null;
  content_html?: string | null;
  content_text?: string | null;
  thumbnail_url?: string | null;
  is_default?: boolean;
}

export type TemplateCategory =
  | "newsletter"
  | "promotional"
  | "transactional"
  | "welcome"
  | "follow-up"
  | "announcement"
  | "event"
  | "other";

export const templateCategoryConfig: Record<
  TemplateCategory,
  { label: string; description: string; color: string }
> = {
  newsletter: {
    label: "Newsletter",
    description: "Regular updates and news",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  promotional: {
    label: "Promotional",
    description: "Sales and special offers",
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  },
  transactional: {
    label: "Transactional",
    description: "Receipts and confirmations",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
  welcome: {
    label: "Welcome",
    description: "New subscriber greetings",
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  },
  "follow-up": {
    label: "Follow-up",
    description: "Check-ins and reminders",
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  },
  announcement: {
    label: "Announcement",
    description: "Important updates",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  },
  event: {
    label: "Event",
    description: "Event invitations and updates",
    color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  },
  other: {
    label: "Other",
    description: "Miscellaneous templates",
    color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
};

export interface EmailTemplateWithCreator extends EmailTemplate {
  creator?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface TemplateFormData {
  name: string;
  description?: string;
  category?: TemplateCategory;
  subject_line?: string;
  content_html?: string;
  content_text?: string;
}

export interface TemplateFilters {
  category?: TemplateCategory;
  search?: string;
}

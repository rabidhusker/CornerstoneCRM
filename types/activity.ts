import type { Database } from "./database";

// Re-export the database activity type
export type Activity = Database["public"]["Tables"]["crm_activities"]["Row"];
export type ActivityInsert = Database["public"]["Tables"]["crm_activities"]["Insert"];
export type ActivityUpdate = Database["public"]["Tables"]["crm_activities"]["Update"];

// Activity types
export type ActivityType = "call" | "email" | "meeting" | "note" | "task" | "other";

// Activity type configuration
export const activityTypeConfig: Record<
  ActivityType,
  { label: string; icon: string; color: string }
> = {
  call: { label: "Call", icon: "Phone", color: "bg-green-500" },
  email: { label: "Email", icon: "Mail", color: "bg-blue-500" },
  meeting: { label: "Meeting", icon: "Calendar", color: "bg-purple-500" },
  note: { label: "Note", icon: "FileText", color: "bg-yellow-500" },
  task: { label: "Task", icon: "CheckSquare", color: "bg-orange-500" },
  other: { label: "Other", icon: "Activity", color: "bg-gray-500" },
};

// Activity with user info
export interface ActivityWithUser extends Activity {
  user?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

// Form data for creating activities
export interface ActivityFormData {
  type: ActivityType;
  title: string;
  description?: string;
  dueDate?: string;
  outcome?: string;
  contactId?: string;
  dealId?: string;
  metadata?: Record<string, unknown>;
}

// Filters for activities
export interface ActivityFilters {
  type?: ActivityType[];
  contactId?: string;
  dealId?: string;
  completed?: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

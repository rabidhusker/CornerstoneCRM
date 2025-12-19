import type { Database } from "./database";

// Re-export base types from database
export type Appointment = Database["public"]["Tables"]["crm_appointments"]["Row"];
export type AppointmentInsert = Database["public"]["Tables"]["crm_appointments"]["Insert"];
export type AppointmentUpdate = Database["public"]["Tables"]["crm_appointments"]["Update"];

// Appointment status
export type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "no_show";

// Appointment types for color coding
export type AppointmentType =
  | "meeting"
  | "call"
  | "showing"
  | "follow_up"
  | "consultation"
  | "closing"
  | "other";

// Extended appointment with relations
export interface AppointmentWithDetails extends Appointment {
  contact?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
  };
  deal?: {
    id: string;
    title: string;
    value: number | null;
  };
  user?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

// Calendar view types
export type CalendarView = "month" | "week" | "day" | "agenda";

// Appointment form data
export interface AppointmentFormData {
  title: string;
  type: AppointmentType;
  description?: string;
  contact_id?: string;
  deal_id?: string;
  start_time: Date;
  end_time: Date;
  all_day: boolean;
  location?: string;
  meeting_link?: string;
  reminder_minutes: number[];
  notes?: string;
}

// Date range for queries
export interface DateRange {
  start: Date;
  end: Date;
}

// Time slot for availability
export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

// Appointment filters
export interface AppointmentFilters {
  userId?: string;
  contactId?: string;
  dealId?: string;
  status?: AppointmentStatus[];
  type?: AppointmentType[];
  dateRange?: DateRange;
}

// Status configuration
export const appointmentStatusConfig: Record<
  AppointmentStatus,
  { label: string; color: string; bgColor: string }
> = {
  scheduled: {
    label: "Scheduled",
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  completed: {
    label: "Completed",
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-gray-600",
    bgColor: "bg-gray-100 dark:bg-gray-800",
  },
  no_show: {
    label: "No Show",
    color: "text-red-600",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
};

// Type configuration for colors
export const appointmentTypeConfig: Record<
  AppointmentType,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  meeting: {
    label: "Meeting",
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    borderColor: "border-purple-500",
  },
  call: {
    label: "Phone Call",
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    borderColor: "border-blue-500",
  },
  showing: {
    label: "Property Showing",
    color: "text-orange-600",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    borderColor: "border-orange-500",
  },
  follow_up: {
    label: "Follow Up",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    borderColor: "border-yellow-500",
  },
  consultation: {
    label: "Consultation",
    color: "text-teal-600",
    bgColor: "bg-teal-100 dark:bg-teal-900/30",
    borderColor: "border-teal-500",
  },
  closing: {
    label: "Closing",
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    borderColor: "border-green-500",
  },
  other: {
    label: "Other",
    color: "text-gray-600",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    borderColor: "border-gray-500",
  },
};

// Reminder options
export const reminderOptions = [
  { value: 0, label: "At time of event" },
  { value: 5, label: "5 minutes before" },
  { value: 15, label: "15 minutes before" },
  { value: 30, label: "30 minutes before" },
  { value: 60, label: "1 hour before" },
  { value: 120, label: "2 hours before" },
  { value: 1440, label: "1 day before" },
  { value: 2880, label: "2 days before" },
];

// Duration options (in minutes)
export const durationOptions = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
  { value: 180, label: "3 hours" },
  { value: 240, label: "4 hours" },
];

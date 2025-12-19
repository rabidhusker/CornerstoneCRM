import type { Json } from "./database";

// Booking page configuration
export interface BookingPage {
  id: string;
  workspace_id: string;
  user_id: string;
  slug: string;
  name: string;
  description: string | null;
  is_active: boolean;
  branding: BookingBranding;
  availability: BookingAvailability;
  settings: BookingSettings;
  appointment_types: BookingAppointmentType[];
  created_at: string;
  updated_at: string;
}

// Branding options
export interface BookingBranding {
  logo_url?: string;
  primary_color?: string;
  background_color?: string;
  text_color?: string;
  show_powered_by?: boolean;
}

// Availability configuration
export interface BookingAvailability {
  timezone: string;
  schedule: {
    sunday: DaySchedule;
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
  };
  date_overrides?: DateOverride[];
}

export interface DaySchedule {
  enabled: boolean;
  slots: TimeSlotRange[];
}

export interface TimeSlotRange {
  start: string; // "09:00"
  end: string; // "17:00"
}

export interface DateOverride {
  date: string; // "2024-12-25"
  enabled: boolean;
  slots?: TimeSlotRange[];
  reason?: string;
}

// Booking settings
export interface BookingSettings {
  buffer_before: number; // minutes
  buffer_after: number; // minutes
  minimum_notice: number; // hours (converted to minutes in API)
  booking_window: number; // days in advance
  slot_interval: number; // minutes between slot start times
  confirmation_message?: string;
  custom_questions?: CustomQuestion[];
  require_phone: boolean;
  collect_notes: boolean;
  auto_confirm: boolean;
  send_reminders: boolean;
  reminder_times: number[]; // minutes before
}

export interface CustomQuestion {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "checkbox";
  required: boolean;
  options?: string[];
}

// Appointment type for booking
export interface BookingAppointmentType {
  id: string;
  slug: string;
  name: string;
  description?: string;
  duration: number; // minutes
  color: string;
  price?: number;
  is_active: boolean;
  location_type: "in_person" | "phone" | "video" | "custom";
  location?: string;
  video_link?: string;
  phone_number?: string;
  buffer_before: number; // minutes
  buffer_after: number; // minutes
  custom_availability?: BookingAvailability;
}

// Available slot for booking
export interface AvailableSlot {
  start: string;
  end: string;
  available: boolean;
}

// Booking request data
export interface BookingRequest {
  appointment_type_id: string;
  start_time: string;
  end_time: string;
  contact: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  notes?: string;
  custom_answers?: Record<string, string>;
}

// Booking confirmation
export interface BookingConfirmation {
  appointment_id: string;
  confirmation_code: string;
  message: string;
  calendar_links: {
    google?: string;
    outlook?: string;
    ical?: string;
  };
}

// Default availability
export const defaultBookingAvailability: BookingAvailability = {
  timezone: "America/New_York",
  schedule: {
    sunday: { enabled: false, slots: [] },
    monday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
    tuesday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
    wednesday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
    thursday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
    friday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
    saturday: { enabled: false, slots: [] },
  },
};

// Default booking settings
export const defaultBookingSettings: BookingSettings = {
  buffer_before: 0,
  buffer_after: 15,
  minimum_notice: 24,
  booking_window: 60,
  slot_interval: 30, // 30 minute slots
  require_phone: false,
  collect_notes: true,
  auto_confirm: true,
  send_reminders: true,
  reminder_times: [1440, 60], // 24 hours and 1 hour before
};

// Default appointment types
export const defaultAppointmentTypes: BookingAppointmentType[] = [
  {
    id: "meeting-30",
    slug: "30-minute-meeting",
    name: "30 Minute Meeting",
    description: "A quick 30 minute call or video meeting",
    duration: 30,
    color: "#3b82f6",
    is_active: true,
    location_type: "video",
    buffer_before: 0,
    buffer_after: 15,
  },
  {
    id: "meeting-60",
    slug: "60-minute-meeting",
    name: "60 Minute Meeting",
    description: "An in-depth 60 minute consultation",
    duration: 60,
    color: "#8b5cf6",
    is_active: true,
    location_type: "video",
    buffer_before: 0,
    buffer_after: 15,
  },
];

// Location type labels
export const locationTypeLabels: Record<BookingAppointmentType["location_type"], string> = {
  in_person: "In Person",
  phone: "Phone Call",
  video: "Video Call",
  custom: "Custom Location",
};

// Generate calendar links
export function generateCalendarLinks(
  title: string,
  description: string,
  location: string,
  startTime: Date,
  endTime: Date
): { google: string; outlook: string; ical: string } {
  const formatDate = (date: Date) =>
    date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const start = formatDate(startTime);
  const end = formatDate(endTime);

  // Google Calendar
  const googleParams = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${start}/${end}`,
    details: description,
    location: location,
  });
  const google = `https://calendar.google.com/calendar/render?${googleParams.toString()}`;

  // Outlook
  const outlookParams = new URLSearchParams({
    subject: title,
    startdt: startTime.toISOString(),
    enddt: endTime.toISOString(),
    body: description,
    location: location,
  });
  const outlook = `https://outlook.live.com/calendar/0/deeplink/compose?${outlookParams.toString()}`;

  // iCal (data URL)
  const icalContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\n");
  const ical = `data:text/calendar;charset=utf-8,${encodeURIComponent(icalContent)}`;

  return { google, outlook, ical };
}

// Generate confirmation code
export function generateConfirmationCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

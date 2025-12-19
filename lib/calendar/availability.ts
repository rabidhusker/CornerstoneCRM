import {
  addMinutes,
  setHours,
  setMinutes,
  startOfDay,
  endOfDay,
  isWithinInterval,
  areIntervalsOverlapping,
  format,
  parseISO,
  isSameDay,
  getDay,
} from "date-fns";
import type { TimeSlot } from "@/types/appointment";

// Default working hours (can be overridden per user)
export interface WorkingHours {
  start: number; // Hour (0-23)
  end: number; // Hour (0-23)
}

export interface DaySchedule {
  enabled: boolean;
  hours: WorkingHours;
}

export interface UserAvailability {
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
  bufferBefore: number; // minutes before appointments
  bufferAfter: number; // minutes after appointments
  minimumNotice: number; // minimum hours in advance
}

// Default availability settings
export const defaultAvailability: UserAvailability = {
  timezone: "America/New_York",
  schedule: {
    sunday: { enabled: false, hours: { start: 9, end: 17 } },
    monday: { enabled: true, hours: { start: 9, end: 17 } },
    tuesday: { enabled: true, hours: { start: 9, end: 17 } },
    wednesday: { enabled: true, hours: { start: 9, end: 17 } },
    thursday: { enabled: true, hours: { start: 9, end: 17 } },
    friday: { enabled: true, hours: { start: 9, end: 17 } },
    saturday: { enabled: false, hours: { start: 9, end: 17 } },
  },
  bufferBefore: 0,
  bufferAfter: 15,
  minimumNotice: 24,
};

// Existing appointment type for availability checking
export interface ExistingAppointment {
  start_time: string;
  end_time: string;
}

// Get day name from date
function getDayName(date: Date): keyof UserAvailability["schedule"] {
  const days: (keyof UserAvailability["schedule"])[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return days[getDay(date)];
}

/**
 * Get available time slots for a specific date
 */
export function getAvailableSlots(
  date: Date,
  durationMinutes: number,
  existingAppointments: ExistingAppointment[],
  availability: UserAvailability = defaultAvailability,
  slotIntervalMinutes: number = 30
): TimeSlot[] {
  const dayName = getDayName(date);
  const daySchedule = availability.schedule[dayName];

  // If day is not enabled, return empty
  if (!daySchedule.enabled) {
    return [];
  }

  const slots: TimeSlot[] = [];
  const now = new Date();

  // Filter appointments for this day
  const dayAppointments = existingAppointments.filter((apt) =>
    isSameDay(parseISO(apt.start_time), date)
  );

  // Generate time slots
  const dayStart = setMinutes(setHours(startOfDay(date), daySchedule.hours.start), 0);
  const dayEnd = setMinutes(setHours(startOfDay(date), daySchedule.hours.end), 0);

  let currentSlot = dayStart;

  while (currentSlot < dayEnd) {
    const slotEnd = addMinutes(currentSlot, durationMinutes);

    // Check if slot would extend past working hours
    if (slotEnd > dayEnd) {
      break;
    }

    // Check minimum notice
    const minimumNoticeDate = addMinutes(now, availability.minimumNotice * 60);
    if (currentSlot < minimumNoticeDate) {
      currentSlot = addMinutes(currentSlot, slotIntervalMinutes);
      continue;
    }

    // Check for conflicts with existing appointments (including buffers)
    const hasConflict = dayAppointments.some((apt) => {
      const aptStart = addMinutes(parseISO(apt.start_time), -availability.bufferBefore);
      const aptEnd = addMinutes(parseISO(apt.end_time), availability.bufferAfter);

      return areIntervalsOverlapping(
        { start: currentSlot, end: slotEnd },
        { start: aptStart, end: aptEnd }
      );
    });

    slots.push({
      start: new Date(currentSlot),
      end: slotEnd,
      available: !hasConflict,
    });

    currentSlot = addMinutes(currentSlot, slotIntervalMinutes);
  }

  return slots;
}

/**
 * Check if a specific time slot is available
 */
export function isSlotAvailable(
  startTime: Date,
  endTime: Date,
  existingAppointments: ExistingAppointment[],
  availability: UserAvailability = defaultAvailability,
  excludeAppointmentId?: string
): boolean {
  const dayName = getDayName(startTime);
  const daySchedule = availability.schedule[dayName];

  // Check if day is enabled
  if (!daySchedule.enabled) {
    return false;
  }

  // Check if within working hours
  const dayStart = setMinutes(setHours(startOfDay(startTime), daySchedule.hours.start), 0);
  const dayEnd = setMinutes(setHours(startOfDay(startTime), daySchedule.hours.end), 0);

  if (startTime < dayStart || endTime > dayEnd) {
    return false;
  }

  // Check minimum notice
  const now = new Date();
  const minimumNoticeDate = addMinutes(now, availability.minimumNotice * 60);
  if (startTime < minimumNoticeDate) {
    return false;
  }

  // Filter out the appointment being edited (if any)
  const appointments = existingAppointments.filter(
    (apt) => !excludeAppointmentId || apt.start_time !== excludeAppointmentId
  );

  // Check for conflicts
  const hasConflict = appointments.some((apt) => {
    const aptStart = addMinutes(parseISO(apt.start_time), -availability.bufferBefore);
    const aptEnd = addMinutes(parseISO(apt.end_time), availability.bufferAfter);

    return areIntervalsOverlapping(
      { start: startTime, end: endTime },
      { start: aptStart, end: aptEnd }
    );
  });

  return !hasConflict;
}

/**
 * Get next available slot
 */
export function getNextAvailableSlot(
  afterDate: Date,
  durationMinutes: number,
  existingAppointments: ExistingAppointment[],
  availability: UserAvailability = defaultAvailability,
  maxDaysToSearch: number = 30
): TimeSlot | null {
  let currentDate = startOfDay(afterDate);

  for (let i = 0; i < maxDaysToSearch; i++) {
    const slots = getAvailableSlots(
      currentDate,
      durationMinutes,
      existingAppointments,
      availability
    );

    const availableSlot = slots.find((slot) => slot.available && slot.start >= afterDate);

    if (availableSlot) {
      return availableSlot;
    }

    currentDate = addMinutes(currentDate, 24 * 60);
  }

  return null;
}

/**
 * Format time slot for display
 */
export function formatTimeSlot(slot: TimeSlot): string {
  return `${format(slot.start, "h:mm a")} - ${format(slot.end, "h:mm a")}`;
}

/**
 * Get busy times for a date range
 */
export function getBusyTimes(
  appointments: ExistingAppointment[],
  startDate: Date,
  endDate: Date
): { start: Date; end: Date }[] {
  return appointments
    .filter((apt) => {
      const aptStart = parseISO(apt.start_time);
      return isWithinInterval(aptStart, { start: startDate, end: endDate });
    })
    .map((apt) => ({
      start: parseISO(apt.start_time),
      end: parseISO(apt.end_time),
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

/**
 * Calculate availability percentage for a day
 */
export function getDayAvailabilityPercentage(
  date: Date,
  existingAppointments: ExistingAppointment[],
  availability: UserAvailability = defaultAvailability
): number {
  const dayName = getDayName(date);
  const daySchedule = availability.schedule[dayName];

  if (!daySchedule.enabled) {
    return 0;
  }

  const totalMinutes = (daySchedule.hours.end - daySchedule.hours.start) * 60;
  const slots = getAvailableSlots(date, 30, existingAppointments, availability, 30);

  const availableMinutes = slots.filter((s) => s.available).length * 30;

  return Math.round((availableMinutes / totalMinutes) * 100);
}

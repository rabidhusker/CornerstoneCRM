import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { BookingPage, BookingAppointmentType, BookingAvailability, AvailableSlot } from "@/types/booking";
import { format, parseISO, addMinutes, isBefore, isAfter, startOfDay, endOfDay } from "date-fns";

// Day name mapping
const dayNameMap: Record<number, keyof BookingAvailability["schedule"]> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

// Parse time string (HH:mm) to minutes from midnight
function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

// Generate time slots for a given date based on availability
function generateSlots(
  date: Date,
  availability: BookingAvailability,
  duration: number,
  bufferBefore: number,
  bufferAfter: number,
  slotInterval: number
): { start: Date; end: Date }[] {
  const dayOfWeek = date.getDay();
  const dayName = dayNameMap[dayOfWeek];
  const daySchedule = availability.schedule[dayName];

  if (!daySchedule.enabled) {
    return [];
  }

  // Check date overrides
  const dateStr = format(date, "yyyy-MM-dd");
  const override = availability.date_overrides?.find((o) => o.date === dateStr);

  if (override && !override.enabled) {
    return [];
  }

  // Use override slots if available, otherwise use day schedule
  const timeSlots = override?.slots || daySchedule.slots;
  const slots: { start: Date; end: Date }[] = [];

  for (const slot of timeSlots) {
    const startMinutes = parseTimeToMinutes(slot.start);
    const endMinutes = parseTimeToMinutes(slot.end);

    // Generate slots within this time window
    let currentMinutes = startMinutes;

    while (currentMinutes + duration <= endMinutes) {
      const slotStart = new Date(date);
      slotStart.setHours(Math.floor(currentMinutes / 60), currentMinutes % 60, 0, 0);

      const slotEnd = addMinutes(slotStart, duration);

      slots.push({ start: slotStart, end: slotEnd });

      // Move to next slot based on interval
      currentMinutes += slotInterval;
    }
  }

  return slots;
}

// Check if a slot conflicts with existing appointments
function isSlotAvailable(
  slotStart: Date,
  slotEnd: Date,
  existingAppointments: { start_time: string; end_time: string }[],
  bufferBefore: number,
  bufferAfter: number
): boolean {
  const bufferedStart = addMinutes(slotStart, -bufferBefore);
  const bufferedEnd = addMinutes(slotEnd, bufferAfter);

  for (const appointment of existingAppointments) {
    const appointmentStart = parseISO(appointment.start_time);
    const appointmentEnd = parseISO(appointment.end_time);

    // Check for overlap
    if (
      (isBefore(bufferedStart, appointmentEnd) && isAfter(bufferedEnd, appointmentStart)) ||
      (isBefore(appointmentStart, bufferedEnd) && isAfter(appointmentEnd, bufferedStart))
    ) {
      return false;
    }
  }

  return true;
}

// GET /api/v1/appointments/availability - Get available slots (public endpoint)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bookingPageId = searchParams.get("bookingPageId");
    const appointmentTypeId = searchParams.get("appointmentTypeId");
    const dateStr = searchParams.get("date");

    if (!bookingPageId || !appointmentTypeId || !dateStr) {
      return NextResponse.json(
        { error: "Missing required parameters: bookingPageId, appointmentTypeId, date" },
        { status: 400 }
      );
    }

    // Parse date
    const date = parseISO(dateStr);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    // Don't allow booking in the past
    const today = startOfDay(new Date());
    if (isBefore(date, today)) {
      return NextResponse.json({ slots: [] });
    }

    const supabase = await createClient();

    // Fetch booking page
    const { data: bookingPage, error: pageError } = await (supabase as any)
      .from("crm_booking_pages")
      .select("*")
      .eq("id", bookingPageId)
      .eq("is_active", true)
      .single();

    if (pageError || !bookingPage) {
      return NextResponse.json(
        { error: "Booking page not found" },
        { status: 404 }
      );
    }

    // Find the appointment type
    const typedBookingPage = bookingPage as BookingPage;
    const appointmentType = typedBookingPage.appointment_types.find(
      (t) => t.id === appointmentTypeId && t.is_active
    );

    if (!appointmentType) {
      return NextResponse.json(
        { error: "Appointment type not found" },
        { status: 404 }
      );
    }

    // Use custom availability or default to booking page availability
    const availability = appointmentType.custom_availability || typedBookingPage.availability;
    const settings = typedBookingPage.settings;

    // Fetch existing appointments for the user on this date
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const { data: existingAppointments } = await (supabase as any)
      .from("crm_appointments")
      .select("start_time, end_time")
      .eq("user_id", typedBookingPage.user_id)
      .gte("start_time", dayStart.toISOString())
      .lte("start_time", dayEnd.toISOString())
      .in("status", ["scheduled", "confirmed"]);

    // Generate slots
    const potentialSlots = generateSlots(
      date,
      availability,
      appointmentType.duration,
      appointmentType.buffer_before,
      appointmentType.buffer_after,
      settings.slot_interval
    );

    // Check availability for each slot
    const now = new Date();
    const minimumNotice = settings.minimum_notice || 0;

    const availableSlots: AvailableSlot[] = potentialSlots.map((slot) => {
      // Check minimum notice
      const minimumNoticeTime = addMinutes(now, minimumNotice);
      if (isBefore(slot.start, minimumNoticeTime)) {
        return {
          start: slot.start.toISOString(),
          end: slot.end.toISOString(),
          available: false,
        };
      }

      // Check against existing appointments
      const available = isSlotAvailable(
        slot.start,
        slot.end,
        existingAppointments || [],
        appointmentType.buffer_before,
        appointmentType.buffer_after
      );

      return {
        start: slot.start.toISOString(),
        end: slot.end.toISOString(),
        available,
      };
    });

    return NextResponse.json({
      slots: availableSlots,
      date: dateStr,
      appointmentType: {
        id: appointmentType.id,
        name: appointmentType.name,
        duration: appointmentType.duration,
      },
    });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}

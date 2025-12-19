import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { BookingPage, BookingAppointmentType, BookingAvailability } from "@/types/booking";
import { generateConfirmationCode } from "@/types/booking";
import { format, parseISO, addMinutes, isBefore, isAfter, startOfDay, endOfDay } from "date-fns";
import { sendAppointmentConfirmationEmail, sendAppointmentNotificationEmail } from "@/lib/email/appointment-emails";

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

// Validate that the slot is within available hours
function isSlotInAvailableHours(
  slotStart: Date,
  slotEnd: Date,
  availability: BookingAvailability
): boolean {
  const dayOfWeek = slotStart.getDay();
  const dayName = dayNameMap[dayOfWeek];
  const daySchedule = availability.schedule[dayName];

  if (!daySchedule.enabled) {
    return false;
  }

  // Check date overrides
  const dateStr = format(slotStart, "yyyy-MM-dd");
  const override = availability.date_overrides?.find((o) => o.date === dateStr);

  if (override && !override.enabled) {
    return false;
  }

  // Use override slots if available, otherwise use day schedule
  const timeSlots = override?.slots || daySchedule.slots;

  // Convert slot times to minutes
  const slotStartMinutes = slotStart.getHours() * 60 + slotStart.getMinutes();
  const slotEndMinutes = slotEnd.getHours() * 60 + slotEnd.getMinutes();

  // Check if slot falls within any available time window
  for (const slot of timeSlots) {
    const [startHour, startMin] = slot.start.split(":").map(Number);
    const [endHour, endMin] = slot.end.split(":").map(Number);
    const windowStart = startHour * 60 + startMin;
    const windowEnd = endHour * 60 + endMin;

    if (slotStartMinutes >= windowStart && slotEndMinutes <= windowEnd) {
      return true;
    }
  }

  return false;
}

// Check for conflicts with existing appointments
async function checkForConflicts(
  supabase: any,
  userId: string,
  startTime: Date,
  endTime: Date,
  bufferBefore: number,
  bufferAfter: number
): Promise<boolean> {
  const bufferedStart = addMinutes(startTime, -bufferBefore);
  const bufferedEnd = addMinutes(endTime, bufferAfter);

  const { data: existingAppointments } = await supabase
    .from("crm_appointments")
    .select("id")
    .eq("user_id", userId)
    .in("status", ["scheduled", "confirmed"])
    .or(
      `and(start_time.lt.${bufferedEnd.toISOString()},end_time.gt.${bufferedStart.toISOString()})`
    );

  return (existingAppointments?.length || 0) > 0;
}

// POST /api/v1/appointments/book - Book an appointment (public endpoint)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      booking_page_id,
      appointment_type_id,
      start_time,
      end_time,
      contact,
      notes,
    } = body;

    // Validate required fields
    if (!booking_page_id || !appointment_type_id || !start_time || !end_time || !contact) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!contact.first_name || !contact.last_name || !contact.email) {
      return NextResponse.json(
        { error: "Contact must include first_name, last_name, and email" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contact.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch booking page
    const { data: bookingPage, error: pageError } = await (supabase as any)
      .from("crm_booking_pages")
      .select("*")
      .eq("id", booking_page_id)
      .eq("is_active", true)
      .single();

    if (pageError || !bookingPage) {
      return NextResponse.json(
        { error: "Booking page not found" },
        { status: 404 }
      );
    }

    const typedBookingPage = bookingPage as BookingPage;

    // Find the appointment type
    const appointmentType = typedBookingPage.appointment_types.find(
      (t) => t.id === appointment_type_id && t.is_active
    );

    if (!appointmentType) {
      return NextResponse.json(
        { error: "Appointment type not found" },
        { status: 404 }
      );
    }

    // Parse times
    const startDateTime = parseISO(start_time);
    const endDateTime = parseISO(end_time);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    // Validate slot duration matches appointment type
    const expectedDuration = appointmentType.duration;
    const actualDuration = Math.round(
      (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60)
    );

    if (actualDuration !== expectedDuration) {
      return NextResponse.json(
        { error: "Slot duration does not match appointment type" },
        { status: 400 }
      );
    }

    // Don't allow booking in the past
    const now = new Date();
    const minimumNotice = typedBookingPage.settings.minimum_notice || 0;
    const minimumNoticeTime = addMinutes(now, minimumNotice);

    if (isBefore(startDateTime, minimumNoticeTime)) {
      return NextResponse.json(
        { error: "Cannot book appointments with less than minimum notice" },
        { status: 400 }
      );
    }

    // Check booking window
    const bookingWindow = typedBookingPage.settings.booking_window;
    const maxDate = addMinutes(now, bookingWindow * 24 * 60);

    if (isAfter(startDateTime, maxDate)) {
      return NextResponse.json(
        { error: "Cannot book appointments beyond the booking window" },
        { status: 400 }
      );
    }

    // Validate slot is within available hours
    const availability =
      appointmentType.custom_availability || typedBookingPage.availability;

    if (!isSlotInAvailableHours(startDateTime, endDateTime, availability)) {
      return NextResponse.json(
        { error: "Selected time is not within available hours" },
        { status: 400 }
      );
    }

    // Check for conflicts
    const hasConflict = await checkForConflicts(
      supabase,
      typedBookingPage.user_id,
      startDateTime,
      endDateTime,
      appointmentType.buffer_before,
      appointmentType.buffer_after
    );

    if (hasConflict) {
      return NextResponse.json(
        { error: "This time slot is no longer available" },
        { status: 409 }
      );
    }

    // Find or create contact
    let contactId: string;

    // First try to find existing contact
    const { data: existingContact } = await (supabase as any)
      .from("crm_contacts")
      .select("id")
      .eq("workspace_id", typedBookingPage.workspace_id)
      .eq("email", contact.email)
      .single();

    if (existingContact) {
      contactId = existingContact.id;

      // Update contact info if provided
      await (supabase as any)
        .from("crm_contacts")
        .update({
          first_name: contact.first_name,
          last_name: contact.last_name,
          phone: contact.phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", contactId);
    } else {
      // Create new contact
      const { data: newContact, error: contactError } = await (supabase as any)
        .from("crm_contacts")
        .insert({
          workspace_id: typedBookingPage.workspace_id,
          first_name: contact.first_name,
          last_name: contact.last_name,
          email: contact.email,
          phone: contact.phone || null,
          source: "booking_page",
        })
        .select("id")
        .single();

      if (contactError || !newContact) {
        console.error("Failed to create contact:", contactError);
        return NextResponse.json(
          { error: "Failed to create contact" },
          { status: 500 }
        );
      }

      contactId = newContact.id;
    }

    // Generate confirmation code
    const confirmationCode = generateConfirmationCode();

    // Create the appointment
    const { data: appointment, error: appointmentError } = await (supabase as any)
      .from("crm_appointments")
      .insert({
        workspace_id: typedBookingPage.workspace_id,
        user_id: typedBookingPage.user_id,
        contact_id: contactId,
        title: appointmentType.name,
        description: notes || null,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        type: "meeting",
        status: typedBookingPage.settings.auto_confirm ? "confirmed" : "scheduled",
        location: appointmentType.location || null,
        video_link: appointmentType.location_type === "video" ? appointmentType.video_link : null,
        phone_number: appointmentType.location_type === "phone" ? appointmentType.phone_number : null,
        notes: notes || null,
        reminders: [],
        metadata: {
          booking_page_id: typedBookingPage.id,
          appointment_type_id: appointmentType.id,
          confirmation_code: confirmationCode,
          booked_via: "public_booking_page",
        },
      })
      .select("*")
      .single();

    if (appointmentError || !appointment) {
      console.error("Failed to create appointment:", appointmentError);
      return NextResponse.json(
        { error: "Failed to create appointment" },
        { status: 500 }
      );
    }

    // Fetch user details for emails
    const { data: user } = await (supabase as any)
      .from("users")
      .select("email, full_name")
      .eq("id", typedBookingPage.user_id)
      .single();

    // Send confirmation email to contact (fire and forget)
    sendAppointmentConfirmationEmail({
      to: contact.email,
      contactName: `${contact.first_name} ${contact.last_name}`,
      appointmentType: appointmentType.name,
      hostName: typedBookingPage.name,
      startTime: startDateTime,
      endTime: endDateTime,
      location: appointmentType.location || appointmentType.location_type,
      confirmationCode,
      bookingPageSlug: typedBookingPage.slug,
    }).catch((err) => console.error("Failed to send confirmation email:", err));

    // Send notification email to host (fire and forget)
    if (user?.email) {
      sendAppointmentNotificationEmail({
        to: user.email,
        hostName: user.full_name || "Host",
        contactName: `${contact.first_name} ${contact.last_name}`,
        contactEmail: contact.email,
        appointmentType: appointmentType.name,
        startTime: startDateTime,
        endTime: endDateTime,
        notes: notes || undefined,
      }).catch((err) => console.error("Failed to send notification email:", err));
    }

    return NextResponse.json({
      appointment: {
        id: appointment.id,
        title: appointment.title,
        start_time: appointment.start_time,
        end_time: appointment.end_time,
        status: appointment.status,
      },
      confirmationCode,
      message: "Appointment booked successfully",
    });
  } catch (error) {
    console.error("Error booking appointment:", error);
    return NextResponse.json(
      { error: "Failed to book appointment" },
      { status: 500 }
    );
  }
}

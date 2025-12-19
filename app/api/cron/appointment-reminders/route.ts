import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendAppointmentReminderEmail } from "@/lib/email/appointment-emails";
import { format, addMinutes, subMinutes, subHours, isWithinInterval } from "date-fns";

// Reminder types and their time offsets (in minutes before appointment)
const REMINDER_OFFSETS: Record<string, number> = {
  "24h": 24 * 60,
  "1h": 60,
  "15m": 15,
};

// Cron job window (how many minutes to look ahead for reminders)
const CRON_WINDOW_MINUTES = 5;

/**
 * Cron job to send appointment reminders
 * This should be called periodically (e.g., every 5 minutes)
 */
export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const now = new Date();
    const results = {
      processed: 0,
      sent: 0,
      errors: 0,
      details: [] as { appointmentId: string; reminderType: string; status: string; error?: string }[],
    };

    // For each reminder type, find appointments that need reminders
    for (const [reminderType, offsetMinutes] of Object.entries(REMINDER_OFFSETS)) {
      // Calculate the time window for this reminder type
      // We look for appointments where:
      // - start_time is exactly offsetMinutes from now (within the cron window)
      const targetTime = addMinutes(now, offsetMinutes);
      const windowStart = subMinutes(targetTime, CRON_WINDOW_MINUTES / 2);
      const windowEnd = addMinutes(targetTime, CRON_WINDOW_MINUTES / 2);

      // Fetch appointments that need this reminder
      const { data: appointments, error: fetchError } = await (supabase as any)
        .from("crm_appointments")
        .select(`
          *,
          contact:contact_id(
            first_name,
            last_name,
            email
          ),
          user:user_id(
            full_name
          )
        `)
        .in("status", ["scheduled", "confirmed"])
        .gte("start_time", windowStart.toISOString())
        .lte("start_time", windowEnd.toISOString());

      if (fetchError) {
        console.error(`Error fetching appointments for ${reminderType}:`, fetchError);
        continue;
      }

      for (const appointment of appointments || []) {
        results.processed++;

        // Check if this reminder was already sent
        const reminders = appointment.reminders || [];
        const reminderAlreadySent = reminders.some(
          (r: { type: string; sent_at: string }) => r.type === reminderType
        );

        if (reminderAlreadySent) {
          results.details.push({
            appointmentId: appointment.id,
            reminderType,
            status: "skipped",
            error: "Already sent",
          });
          continue;
        }

        // Get contact email
        const contact = appointment.contact;
        if (!contact?.email) {
          results.details.push({
            appointmentId: appointment.id,
            reminderType,
            status: "skipped",
            error: "No contact email",
          });
          continue;
        }

        // Get appointment metadata
        const metadata = appointment.metadata || {};
        const confirmationCode = metadata.confirmation_code || "N/A";

        // Determine location
        let location = appointment.location || "To be determined";
        if (appointment.video_link) {
          location = `Video call: ${appointment.video_link}`;
        } else if (appointment.phone_number) {
          location = `Phone: ${appointment.phone_number}`;
        }

        // Send reminder email
        try {
          await sendAppointmentReminderEmail({
            to: contact.email,
            contactName: `${contact.first_name} ${contact.last_name}`,
            appointmentType: appointment.title,
            hostName: appointment.user?.full_name || "Host",
            startTime: new Date(appointment.start_time),
            endTime: new Date(appointment.end_time),
            location,
            reminderType: reminderType as "24h" | "1h" | "15m",
            confirmationCode,
          });

          // Update appointment to mark reminder as sent
          const updatedReminders = [
            ...reminders,
            { type: reminderType, sent_at: now.toISOString() },
          ];

          await (supabase as any)
            .from("crm_appointments")
            .update({ reminders: updatedReminders })
            .eq("id", appointment.id);

          results.sent++;
          results.details.push({
            appointmentId: appointment.id,
            reminderType,
            status: "sent",
          });
        } catch (emailError) {
          console.error(`Error sending reminder for appointment ${appointment.id}:`, emailError);
          results.errors++;
          results.details.push({
            appointmentId: appointment.id,
            reminderType,
            status: "error",
            error: emailError instanceof Error ? emailError.message : "Unknown error",
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Also support POST for flexibility with different cron providers
export async function POST(request: NextRequest) {
  return GET(request);
}

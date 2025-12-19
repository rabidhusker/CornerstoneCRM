import { sendEmail } from "./send-email";
import { format } from "date-fns";

// Base styles for email templates
const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
  .content { background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; }
  .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 8px 8px; }
  .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 15px 0; }
  .details-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
  .detail-row { display: flex; align-items: center; margin: 10px 0; }
  .detail-label { font-weight: 500; color: #666; width: 100px; }
  .detail-value { color: #333; }
  h1 { margin: 0; font-size: 24px; }
  h2 { color: #333; font-size: 20px; margin: 0 0 15px 0; }
  p { margin: 0 0 15px 0; }
  .confirmation-code { font-family: monospace; font-size: 18px; font-weight: bold; background: #f0f0f0; padding: 8px 16px; border-radius: 4px; display: inline-block; }
  .calendar-links { margin-top: 20px; }
  .calendar-links a { display: inline-block; margin: 5px; padding: 8px 16px; background: #f0f0f0; color: #333; text-decoration: none; border-radius: 4px; font-size: 14px; }
  .calendar-links a:hover { background: #e0e0e0; }
`;

/**
 * Generate HTML email wrapper
 */
function wrapHtml(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    ${content}
  </div>
</body>
</html>
`.trim();
}

// Confirmation email parameters
export interface AppointmentConfirmationParams {
  to: string;
  contactName: string;
  appointmentType: string;
  hostName: string;
  startTime: Date;
  endTime: Date;
  location: string;
  confirmationCode: string;
  bookingPageSlug: string;
  googleCalendarLink?: string;
  outlookCalendarLink?: string;
  icalLink?: string;
}

/**
 * Send appointment confirmation email to the contact
 */
export async function sendAppointmentConfirmationEmail(
  params: AppointmentConfirmationParams
) {
  const {
    to,
    contactName,
    appointmentType,
    hostName,
    startTime,
    endTime,
    location,
    confirmationCode,
    googleCalendarLink,
    outlookCalendarLink,
    icalLink,
  } = params;

  const dateStr = format(startTime, "EEEE, MMMM d, yyyy");
  const timeStr = `${format(startTime, "h:mm a")} - ${format(endTime, "h:mm a")}`;

  const html = wrapHtml(
    `
    <div class="header">
      <h1>Appointment Confirmed</h1>
    </div>
    <div class="content">
      <h2>Hi ${contactName},</h2>
      <p>Your appointment has been confirmed! Here are the details:</p>

      <div class="details-box">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666; width: 120px;">What:</td>
            <td style="padding: 8px 0; font-weight: 500;">${appointmentType}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">With:</td>
            <td style="padding: 8px 0;">${hostName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Date:</td>
            <td style="padding: 8px 0;">${dateStr}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Time:</td>
            <td style="padding: 8px 0;">${timeStr}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Location:</td>
            <td style="padding: 8px 0;">${location}</td>
          </tr>
        </table>
      </div>

      <p style="text-align: center;">
        <span style="color: #666;">Confirmation code:</span><br>
        <span class="confirmation-code">${confirmationCode}</span>
      </p>

      ${
        googleCalendarLink || outlookCalendarLink || icalLink
          ? `
        <div class="calendar-links" style="text-align: center;">
          <p style="color: #666; margin-bottom: 10px;">Add to your calendar:</p>
          ${googleCalendarLink ? `<a href="${googleCalendarLink}" target="_blank">Google Calendar</a>` : ""}
          ${outlookCalendarLink ? `<a href="${outlookCalendarLink}" target="_blank">Outlook</a>` : ""}
          ${icalLink ? `<a href="${icalLink}" download="appointment.ics">iCal</a>` : ""}
        </div>
      `
          : ""
      }

      <p style="margin-top: 20px; font-size: 14px; color: #666;">
        Need to make changes? Please contact us to reschedule or cancel your appointment.
      </p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Cornerstone CRM. All rights reserved.</p>
    </div>
  `,
    "Appointment Confirmed"
  );

  const text = `
Hi ${contactName},

Your appointment has been confirmed! Here are the details:

What: ${appointmentType}
With: ${hostName}
Date: ${dateStr}
Time: ${timeStr}
Location: ${location}

Confirmation code: ${confirmationCode}

Need to make changes? Please contact us to reschedule or cancel your appointment.

© ${new Date().getFullYear()} Cornerstone CRM. All rights reserved.
`.trim();

  return sendEmail({
    to,
    subject: `Appointment Confirmed: ${appointmentType} on ${format(startTime, "MMM d")}`,
    html,
    text,
  });
}

// Notification email parameters
export interface AppointmentNotificationParams {
  to: string;
  hostName: string;
  contactName: string;
  contactEmail: string;
  appointmentType: string;
  startTime: Date;
  endTime: Date;
  notes?: string;
}

/**
 * Send appointment notification email to the host
 */
export async function sendAppointmentNotificationEmail(
  params: AppointmentNotificationParams
) {
  const {
    to,
    hostName,
    contactName,
    contactEmail,
    appointmentType,
    startTime,
    endTime,
    notes,
  } = params;

  const dateStr = format(startTime, "EEEE, MMMM d, yyyy");
  const timeStr = `${format(startTime, "h:mm a")} - ${format(endTime, "h:mm a")}`;

  const html = wrapHtml(
    `
    <div class="header">
      <h1>New Appointment Booked</h1>
    </div>
    <div class="content">
      <h2>Hi ${hostName},</h2>
      <p>A new appointment has been booked with you:</p>

      <div class="details-box">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666; width: 120px;">What:</td>
            <td style="padding: 8px 0; font-weight: 500;">${appointmentType}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">With:</td>
            <td style="padding: 8px 0;">${contactName} (${contactEmail})</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Date:</td>
            <td style="padding: 8px 0;">${dateStr}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Time:</td>
            <td style="padding: 8px 0;">${timeStr}</td>
          </tr>
          ${
            notes
              ? `
          <tr>
            <td style="padding: 8px 0; color: #666; vertical-align: top;">Notes:</td>
            <td style="padding: 8px 0;">${notes}</td>
          </tr>
          `
              : ""
          }
        </table>
      </div>

      <p style="text-align: center;">
        <a href="/dashboard/calendar" class="button">View in Calendar</a>
      </p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Cornerstone CRM. All rights reserved.</p>
    </div>
  `,
    "New Appointment Booked"
  );

  const text = `
Hi ${hostName},

A new appointment has been booked with you:

What: ${appointmentType}
With: ${contactName} (${contactEmail})
Date: ${dateStr}
Time: ${timeStr}
${notes ? `Notes: ${notes}` : ""}

View in your calendar to manage this appointment.

© ${new Date().getFullYear()} Cornerstone CRM. All rights reserved.
`.trim();

  return sendEmail({
    to,
    subject: `New Appointment: ${contactName} - ${appointmentType} on ${format(startTime, "MMM d")}`,
    html,
    text,
  });
}

// Reminder email parameters
export interface AppointmentReminderParams {
  to: string;
  contactName: string;
  appointmentType: string;
  hostName: string;
  startTime: Date;
  endTime: Date;
  location: string;
  reminderType: "24h" | "1h" | "15m";
  confirmationCode: string;
}

/**
 * Send appointment reminder email
 */
export async function sendAppointmentReminderEmail(
  params: AppointmentReminderParams
) {
  const {
    to,
    contactName,
    appointmentType,
    hostName,
    startTime,
    endTime,
    location,
    reminderType,
    confirmationCode,
  } = params;

  const dateStr = format(startTime, "EEEE, MMMM d, yyyy");
  const timeStr = `${format(startTime, "h:mm a")} - ${format(endTime, "h:mm a")}`;

  const reminderLabels: Record<string, string> = {
    "24h": "in 24 hours",
    "1h": "in 1 hour",
    "15m": "in 15 minutes",
  };

  const reminderText = reminderLabels[reminderType] || "soon";

  const html = wrapHtml(
    `
    <div class="header">
      <h1>Appointment Reminder</h1>
    </div>
    <div class="content">
      <h2>Hi ${contactName},</h2>
      <p>This is a reminder that your appointment is coming up ${reminderText}:</p>

      <div class="details-box">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666; width: 120px;">What:</td>
            <td style="padding: 8px 0; font-weight: 500;">${appointmentType}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">With:</td>
            <td style="padding: 8px 0;">${hostName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Date:</td>
            <td style="padding: 8px 0;">${dateStr}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Time:</td>
            <td style="padding: 8px 0;">${timeStr}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Location:</td>
            <td style="padding: 8px 0;">${location}</td>
          </tr>
        </table>
      </div>

      <p style="text-align: center;">
        <span style="color: #666;">Confirmation code:</span><br>
        <span class="confirmation-code">${confirmationCode}</span>
      </p>

      <p style="margin-top: 20px; font-size: 14px; color: #666;">
        Need to make changes? Please contact us as soon as possible.
      </p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Cornerstone CRM. All rights reserved.</p>
    </div>
  `,
    "Appointment Reminder"
  );

  const text = `
Hi ${contactName},

This is a reminder that your appointment is coming up ${reminderText}:

What: ${appointmentType}
With: ${hostName}
Date: ${dateStr}
Time: ${timeStr}
Location: ${location}

Confirmation code: ${confirmationCode}

Need to make changes? Please contact us as soon as possible.

© ${new Date().getFullYear()} Cornerstone CRM. All rights reserved.
`.trim();

  return sendEmail({
    to,
    subject: `Reminder: ${appointmentType} ${reminderText}`,
    html,
    text,
  });
}

// Cancellation email parameters
export interface AppointmentCancellationParams {
  to: string;
  contactName: string;
  appointmentType: string;
  hostName: string;
  startTime: Date;
  endTime: Date;
  reason?: string;
  rebookUrl?: string;
}

/**
 * Send appointment cancellation email
 */
export async function sendAppointmentCancellationEmail(
  params: AppointmentCancellationParams
) {
  const {
    to,
    contactName,
    appointmentType,
    hostName,
    startTime,
    endTime,
    reason,
    rebookUrl,
  } = params;

  const dateStr = format(startTime, "EEEE, MMMM d, yyyy");
  const timeStr = `${format(startTime, "h:mm a")} - ${format(endTime, "h:mm a")}`;

  const html = wrapHtml(
    `
    <div class="header" style="background: #ef4444;">
      <h1>Appointment Cancelled</h1>
    </div>
    <div class="content">
      <h2>Hi ${contactName},</h2>
      <p>Your appointment has been cancelled:</p>

      <div class="details-box">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666; width: 120px;">What:</td>
            <td style="padding: 8px 0; font-weight: 500; text-decoration: line-through;">${appointmentType}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">With:</td>
            <td style="padding: 8px 0; text-decoration: line-through;">${hostName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Date:</td>
            <td style="padding: 8px 0; text-decoration: line-through;">${dateStr}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Time:</td>
            <td style="padding: 8px 0; text-decoration: line-through;">${timeStr}</td>
          </tr>
          ${
            reason
              ? `
          <tr>
            <td style="padding: 8px 0; color: #666; vertical-align: top;">Reason:</td>
            <td style="padding: 8px 0;">${reason}</td>
          </tr>
          `
              : ""
          }
        </table>
      </div>

      ${
        rebookUrl
          ? `
        <p style="text-align: center;">
          <a href="${rebookUrl}" class="button">Book Another Appointment</a>
        </p>
      `
          : ""
      }

      <p style="margin-top: 20px; font-size: 14px; color: #666;">
        If you have any questions, please don't hesitate to contact us.
      </p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Cornerstone CRM. All rights reserved.</p>
    </div>
  `,
    "Appointment Cancelled"
  );

  const text = `
Hi ${contactName},

Your appointment has been cancelled:

What: ${appointmentType}
With: ${hostName}
Date: ${dateStr}
Time: ${timeStr}
${reason ? `Reason: ${reason}` : ""}

${rebookUrl ? `Book another appointment: ${rebookUrl}` : ""}

If you have any questions, please don't hesitate to contact us.

© ${new Date().getFullYear()} Cornerstone CRM. All rights reserved.
`.trim();

  return sendEmail({
    to,
    subject: `Appointment Cancelled: ${appointmentType} on ${format(startTime, "MMM d")}`,
    html,
    text,
  });
}

// Reschedule email parameters
export interface AppointmentRescheduleParams {
  to: string;
  contactName: string;
  appointmentType: string;
  hostName: string;
  oldStartTime: Date;
  oldEndTime: Date;
  newStartTime: Date;
  newEndTime: Date;
  location: string;
  confirmationCode: string;
}

/**
 * Send appointment reschedule email
 */
export async function sendAppointmentRescheduleEmail(
  params: AppointmentRescheduleParams
) {
  const {
    to,
    contactName,
    appointmentType,
    hostName,
    oldStartTime,
    newStartTime,
    newEndTime,
    location,
    confirmationCode,
  } = params;

  const oldDateStr = format(oldStartTime, "EEEE, MMMM d, yyyy 'at' h:mm a");
  const newDateStr = format(newStartTime, "EEEE, MMMM d, yyyy");
  const newTimeStr = `${format(newStartTime, "h:mm a")} - ${format(newEndTime, "h:mm a")}`;

  const html = wrapHtml(
    `
    <div class="header">
      <h1>Appointment Rescheduled</h1>
    </div>
    <div class="content">
      <h2>Hi ${contactName},</h2>
      <p>Your appointment has been rescheduled. Here are the updated details:</p>

      <p style="color: #666; font-size: 14px; margin-bottom: 5px;">
        <span style="text-decoration: line-through;">Previously: ${oldDateStr}</span>
      </p>

      <div class="details-box">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666; width: 120px;">What:</td>
            <td style="padding: 8px 0; font-weight: 500;">${appointmentType}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">With:</td>
            <td style="padding: 8px 0;">${hostName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">New Date:</td>
            <td style="padding: 8px 0; font-weight: 500; color: #059669;">${newDateStr}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">New Time:</td>
            <td style="padding: 8px 0; font-weight: 500; color: #059669;">${newTimeStr}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Location:</td>
            <td style="padding: 8px 0;">${location}</td>
          </tr>
        </table>
      </div>

      <p style="text-align: center;">
        <span style="color: #666;">Confirmation code:</span><br>
        <span class="confirmation-code">${confirmationCode}</span>
      </p>

      <p style="margin-top: 20px; font-size: 14px; color: #666;">
        Need to make more changes? Please contact us to reschedule or cancel.
      </p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Cornerstone CRM. All rights reserved.</p>
    </div>
  `,
    "Appointment Rescheduled"
  );

  const text = `
Hi ${contactName},

Your appointment has been rescheduled.

Previously: ${oldDateStr}

New Details:
What: ${appointmentType}
With: ${hostName}
New Date: ${newDateStr}
New Time: ${newTimeStr}
Location: ${location}

Confirmation code: ${confirmationCode}

Need to make more changes? Please contact us to reschedule or cancel.

© ${new Date().getFullYear()} Cornerstone CRM. All rights reserved.
`.trim();

  return sendEmail({
    to,
    subject: `Appointment Rescheduled: ${appointmentType} - New Time ${format(newStartTime, "MMM d 'at' h:mm a")}`,
    html,
    text,
  });
}

import { google, calendar_v3 } from "googleapis";
import { createClient } from "@/lib/supabase/server";

// Google OAuth configuration
export const GOOGLE_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

// Types
export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  attendees?: { email: string; name?: string; responseStatus?: string }[];
  htmlLink?: string;
  status?: string;
  recurringEventId?: string;
}

export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  primary: boolean;
  timeZone?: string;
  accessRole?: string;
}

export interface SyncResult {
  created: number;
  updated: number;
  deleted: number;
  errors: string[];
}

// Create OAuth2 client
export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
  );
}

// Get authorization URL
export function getAuthorizationUrl(state?: string): string {
  const oauth2Client = createOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: GOOGLE_OAUTH_SCOPES,
    prompt: "consent",
    state,
  });
}

// Exchange code for tokens
export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
}> {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return {
    access_token: tokens.access_token!,
    refresh_token: tokens.refresh_token || undefined,
    expiry_date: tokens.expiry_date || undefined,
  };
}

// Create authenticated calendar client
export async function getCalendarClient(
  accessToken: string,
  refreshToken?: string
): Promise<calendar_v3.Calendar> {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return google.calendar({ version: "v3", auth: oauth2Client });
}

// Get user info from Google
export async function getUserInfo(accessToken: string): Promise<{
  email: string;
  name?: string;
  picture?: string;
}> {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });

  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();

  return {
    email: data.email!,
    name: data.name || undefined,
    picture: data.picture || undefined,
  };
}

// List user's calendars
export async function listCalendars(
  accessToken: string,
  refreshToken?: string
): Promise<GoogleCalendar[]> {
  const calendar = await getCalendarClient(accessToken, refreshToken);

  const response = await calendar.calendarList.list({
    minAccessRole: "writer",
  });

  return (response.data.items || []).map((cal) => ({
    id: cal.id!,
    summary: cal.summary || "Unnamed Calendar",
    description: cal.description || undefined,
    primary: cal.primary || false,
    timeZone: cal.timeZone || undefined,
    accessRole: cal.accessRole || undefined,
  }));
}

// Get events from a calendar
export async function getCalendarEvents(
  accessToken: string,
  refreshToken?: string,
  calendarId: string = "primary",
  timeMin?: Date,
  timeMax?: Date,
  maxResults: number = 250
): Promise<GoogleCalendarEvent[]> {
  const calendar = await getCalendarClient(accessToken, refreshToken);

  const response = await calendar.events.list({
    calendarId,
    timeMin: (timeMin || new Date()).toISOString(),
    timeMax: timeMax?.toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: "startTime",
  });

  return (response.data.items || []).map((event) => ({
    id: event.id!,
    summary: event.summary || "Untitled",
    description: event.description || undefined,
    start: new Date(
      event.start?.dateTime || event.start?.date || new Date()
    ),
    end: new Date(event.end?.dateTime || event.end?.date || new Date()),
    location: event.location || undefined,
    attendees: (event.attendees || []).map((a) => ({
      email: a.email!,
      name: a.displayName || undefined,
      responseStatus: a.responseStatus || undefined,
    })),
    htmlLink: event.htmlLink || undefined,
    status: event.status || undefined,
    recurringEventId: event.recurringEventId || undefined,
  }));
}

// Create a calendar event
export async function createCalendarEvent(
  accessToken: string,
  refreshToken: string | undefined,
  calendarId: string,
  event: {
    summary: string;
    description?: string;
    start: Date;
    end: Date;
    location?: string;
    attendees?: string[];
    sendUpdates?: "all" | "externalOnly" | "none";
  }
): Promise<GoogleCalendarEvent> {
  const calendar = await getCalendarClient(accessToken, refreshToken);

  const response = await calendar.events.insert({
    calendarId,
    sendUpdates: event.sendUpdates || "none",
    requestBody: {
      summary: event.summary,
      description: event.description,
      location: event.location,
      start: {
        dateTime: event.start.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: event.end.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      attendees: event.attendees?.map((email) => ({ email })),
    },
  });

  const created = response.data;
  return {
    id: created.id!,
    summary: created.summary || "Untitled",
    description: created.description || undefined,
    start: new Date(
      created.start?.dateTime || created.start?.date || new Date()
    ),
    end: new Date(created.end?.dateTime || created.end?.date || new Date()),
    location: created.location || undefined,
    htmlLink: created.htmlLink || undefined,
  };
}

// Update a calendar event
export async function updateCalendarEvent(
  accessToken: string,
  refreshToken: string | undefined,
  calendarId: string,
  eventId: string,
  updates: {
    summary?: string;
    description?: string;
    start?: Date;
    end?: Date;
    location?: string;
    attendees?: string[];
    sendUpdates?: "all" | "externalOnly" | "none";
  }
): Promise<GoogleCalendarEvent> {
  const calendar = await getCalendarClient(accessToken, refreshToken);

  const requestBody: calendar_v3.Schema$Event = {};
  if (updates.summary !== undefined) requestBody.summary = updates.summary;
  if (updates.description !== undefined)
    requestBody.description = updates.description;
  if (updates.location !== undefined) requestBody.location = updates.location;
  if (updates.start !== undefined) {
    requestBody.start = {
      dateTime: updates.start.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }
  if (updates.end !== undefined) {
    requestBody.end = {
      dateTime: updates.end.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }
  if (updates.attendees !== undefined) {
    requestBody.attendees = updates.attendees.map((email) => ({ email }));
  }

  const response = await calendar.events.patch({
    calendarId,
    eventId,
    sendUpdates: updates.sendUpdates || "none",
    requestBody,
  });

  const updated = response.data;
  return {
    id: updated.id!,
    summary: updated.summary || "Untitled",
    description: updated.description || undefined,
    start: new Date(
      updated.start?.dateTime || updated.start?.date || new Date()
    ),
    end: new Date(updated.end?.dateTime || updated.end?.date || new Date()),
    location: updated.location || undefined,
    htmlLink: updated.htmlLink || undefined,
  };
}

// Delete a calendar event
export async function deleteCalendarEvent(
  accessToken: string,
  refreshToken: string | undefined,
  calendarId: string,
  eventId: string,
  sendUpdates?: "all" | "externalOnly" | "none"
): Promise<void> {
  const calendar = await getCalendarClient(accessToken, refreshToken);

  await calendar.events.delete({
    calendarId,
    eventId,
    sendUpdates: sendUpdates || "none",
  });
}

// Sync CRM appointments to Google Calendar
export async function syncAppointmentsToGoogle(
  workspaceId: string,
  accessToken: string,
  refreshToken?: string,
  calendarId: string = "primary"
): Promise<SyncResult> {
  const supabase = await createClient();
  const result: SyncResult = {
    created: 0,
    updated: 0,
    deleted: 0,
    errors: [],
  };

  try {
    // Get all appointments that need syncing
    const { data: appointments, error } = await (supabase as any)
      .from("crm_appointments")
      .select("*")
      .eq("workspace_id", workspaceId)
      .or("google_event_id.is.null,updated_at.gt.synced_at");

    if (error) throw error;

    for (const appointment of appointments || []) {
      try {
        if (appointment.google_event_id) {
          // Update existing event
          await updateCalendarEvent(
            accessToken,
            refreshToken,
            calendarId,
            appointment.google_event_id,
            {
              summary: appointment.title,
              description: appointment.description,
              start: new Date(appointment.start_time),
              end: new Date(appointment.end_time),
              location: appointment.location,
            }
          );
          result.updated++;
        } else {
          // Create new event
          const event = await createCalendarEvent(
            accessToken,
            refreshToken,
            calendarId,
            {
              summary: appointment.title,
              description: appointment.description,
              start: new Date(appointment.start_time),
              end: new Date(appointment.end_time),
              location: appointment.location,
            }
          );

          // Update appointment with Google event ID
          await (supabase as any)
            .from("crm_appointments")
            .update({
              google_event_id: event.id,
              synced_at: new Date().toISOString(),
            })
            .eq("id", appointment.id);

          result.created++;
        }

        // Update synced_at
        await (supabase as any)
          .from("crm_appointments")
          .update({ synced_at: new Date().toISOString() })
          .eq("id", appointment.id);
      } catch (err) {
        result.errors.push(
          `Failed to sync appointment ${appointment.id}: ${err}`
        );
      }
    }
  } catch (err) {
    result.errors.push(`Sync failed: ${err}`);
  }

  return result;
}

// Sync Google Calendar events to CRM
export async function syncGoogleToCRM(
  workspaceId: string,
  userId: string,
  accessToken: string,
  refreshToken?: string,
  calendarId: string = "primary"
): Promise<SyncResult> {
  const supabase = await createClient();
  const result: SyncResult = {
    created: 0,
    updated: 0,
    deleted: 0,
    errors: [],
  };

  try {
    // Get events from Google Calendar
    const now = new Date();
    const threeMonthsLater = new Date(
      now.getTime() + 90 * 24 * 60 * 60 * 1000
    );
    const events = await getCalendarEvents(
      accessToken,
      refreshToken,
      calendarId,
      now,
      threeMonthsLater
    );

    // Get existing appointments with Google event IDs
    const { data: existingAppointments } = await (supabase as any)
      .from("crm_appointments")
      .select("id, google_event_id")
      .eq("workspace_id", workspaceId)
      .not("google_event_id", "is", null);

    const existingEventIds = new Set(
      (existingAppointments || []).map((a: any) => a.google_event_id)
    );

    for (const event of events) {
      try {
        if (existingEventIds.has(event.id)) {
          // Update existing appointment
          await (supabase as any)
            .from("crm_appointments")
            .update({
              title: event.summary,
              description: event.description,
              start_time: event.start.toISOString(),
              end_time: event.end.toISOString(),
              location: event.location,
              synced_at: new Date().toISOString(),
            })
            .eq("google_event_id", event.id);

          result.updated++;
        } else {
          // Create new appointment
          await (supabase as any).from("crm_appointments").insert({
            workspace_id: workspaceId,
            user_id: userId,
            title: event.summary,
            description: event.description,
            start_time: event.start.toISOString(),
            end_time: event.end.toISOString(),
            location: event.location,
            google_event_id: event.id,
            synced_at: new Date().toISOString(),
            status: "scheduled",
          });

          result.created++;
        }
      } catch (err) {
        result.errors.push(`Failed to sync event ${event.id}: ${err}`);
      }
    }
  } catch (err) {
    result.errors.push(`Sync from Google failed: ${err}`);
  }

  return result;
}

// Full two-way sync
export async function performFullSync(
  workspaceId: string,
  userId: string,
  accessToken: string,
  refreshToken?: string,
  calendarId: string = "primary"
): Promise<{
  toGoogle: SyncResult;
  fromGoogle: SyncResult;
}> {
  // First sync CRM to Google
  const toGoogle = await syncAppointmentsToGoogle(
    workspaceId,
    accessToken,
    refreshToken,
    calendarId
  );

  // Then sync Google to CRM
  const fromGoogle = await syncGoogleToCRM(
    workspaceId,
    userId,
    accessToken,
    refreshToken,
    calendarId
  );

  return { toGoogle, fromGoogle };
}

// Refresh access token if needed
export async function refreshAccessToken(
  refreshToken: string
): Promise<{ access_token: string; expiry_date?: number }> {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const { credentials } = await oauth2Client.refreshAccessToken();
  return {
    access_token: credentials.access_token!,
    expiry_date: credentials.expiry_date || undefined,
  };
}

// Check if token needs refresh
export function tokenNeedsRefresh(expiryDate?: number): boolean {
  if (!expiryDate) return true;
  // Refresh if token expires in less than 5 minutes
  return Date.now() > expiryDate - 5 * 60 * 1000;
}

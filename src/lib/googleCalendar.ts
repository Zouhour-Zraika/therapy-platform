import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

type GoogleConnection = {
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
};

type CreateGoogleMeetParams = {
  therapistId: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  timeZone?: string;
  attendeeEmail?: string | null;
};

type CreateGoogleCalendarEventParams = {
  therapistId: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  timeZone?: string;
  attendeeEmail?: string | null;
  location?: string | null;
};

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_EVENTS_URL =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error("Supabase server configuration is missing.");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function refreshGoogleAccessToken(
  therapistId: string,
  refreshToken: string,
) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth configuration is missing.");
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    console.error("Google access token refresh failed:", data);
    throw new Error("Unable to refresh Google access token.");
  }

  const expiresAt =
    typeof data.expires_in === "number"
      ? new Date(Date.now() + data.expires_in * 1000).toISOString()
      : null;

  const { error } = await getSupabaseAdmin()
    .from("therapist_google_connections")
    .update({
      access_token: data.access_token,
      token_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("therapist_id", therapistId);

  if (error) throw error;

  return data.access_token as string;
}

async function getGoogleAccessToken(therapistId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("therapist_google_connections")
    .select("access_token, refresh_token, token_expires_at")
    .eq("therapist_id", therapistId)
    .maybeSingle<GoogleConnection>();

  if (error) throw error;

  if (!data) {
    throw new Error("The specialist has not connected a Google account.");
  }

  const expiresAt = data.token_expires_at
    ? new Date(data.token_expires_at).getTime()
    : 0;

  if (data.access_token && expiresAt > Date.now() + 60_000) {
    return data.access_token;
  }

  if (!data.refresh_token) {
    throw new Error("The specialist Google connection must be renewed.");
  }

  return refreshGoogleAccessToken(therapistId, data.refresh_token);
}

export async function createGoogleMeetForBooking({
  therapistId,
  summary,
  description,
  start,
  end,
  timeZone = "Asia/Beirut",
  attendeeEmail,
}: CreateGoogleMeetParams) {
  const accessToken = await getGoogleAccessToken(therapistId);

  const response = await fetch(
    `${GOOGLE_CALENDAR_EVENTS_URL}?conferenceDataVersion=1&sendUpdates=all`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary,
        description:
          description ||
          "Online appointment booked through AAN Psychotherapy.",
        start: { dateTime: start, timeZone },
        end: { dateTime: end, timeZone },
        attendees: attendeeEmail ? [{ email: attendeeEmail }] : undefined,
        conferenceData: {
          createRequest: {
            requestId: crypto.randomUUID(),
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      }),
    },
  );

  const event = await response.json();

  if (!response.ok || !event.id) {
    console.error("Google Calendar event creation failed:", event);
    throw new Error("Unable to create the Google Calendar event.");
  }

  const meetingUrl =
    event.hangoutLink ||
    event.conferenceData?.entryPoints?.find(
      (entryPoint: { entryPointType?: string; uri?: string }) =>
        entryPoint.entryPointType === "video",
    )?.uri ||
    null;

  if (!meetingUrl) {
    throw new Error("No Google Meet link was returned.");
  }

  return {
    provider: "google_meet" as const,
    meetingUrl,
    calendarEventId: event.id as string,
    calendarEventUrl: event.htmlLink || null,
  };
}

export async function createGoogleCalendarEventForBooking({
  therapistId,
  summary,
  description,
  start,
  end,
  timeZone = "Asia/Beirut",
  attendeeEmail,
  location,
}: CreateGoogleCalendarEventParams) {
  const accessToken = await getGoogleAccessToken(therapistId);

  const response = await fetch(
    `${GOOGLE_CALENDAR_EVENTS_URL}?sendUpdates=all`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary,
        description:
          description ||
          "Online appointment booked through AAN Psychotherapy.",
        location: location || undefined,
        start: { dateTime: start, timeZone },
        end: { dateTime: end, timeZone },
        attendees: attendeeEmail ? [{ email: attendeeEmail }] : undefined,
      }),
    },
  );

  const event = await response.json();

  if (!response.ok || !event.id) {
    console.error("Google Calendar event creation failed:", event);
    throw new Error("Unable to create the Google Calendar event.");
  }

  return {
    calendarEventId: event.id as string,
    calendarEventUrl: event.htmlLink || null,
  };
}

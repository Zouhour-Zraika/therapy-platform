import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import {
  createGoogleCalendarEventForBooking,
  createGoogleMeetContinuationForBooking,
  createGoogleMeetForBooking,
} from "@/lib/googleCalendar";

import { createZoomMeetingForBooking } from "@/lib/zoomMeetings";

export const runtime = "nodejs";

type Booking = {
  id: string;
  status: string;
  manual_payment_status: string | null;
  therapist_id: string | null;
  therapist_name: string | null;
  patient_email: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  service_type: string | null;
  meeting_provider: string | null;
  meeting_url: string | null;
  zoom_join_url: string | null;
  zoom_start_url: string | null;
  calendar_event_id: string | null;
  backup_join_url: string | null;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function respondError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let lockContext: {
    db: ReturnType<typeof createClient>;
    bookingId: string;
    lockToken: string;
  } | null = null;

  try {
    const authorization = request.headers.get("authorization") ?? "";

    if (!authorization.startsWith("Bearer ")) {
      return respondError("Authentication required", 401);
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error("Supabase configuration missing");
    }

    const db = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const token = authorization.slice(7).trim();
    const { data: auth, error: authError } = await db.auth.getUser(token);

    if (authError || !auth.user) {
      return respondError("Invalid session", 401);
    }

    const { data: profile, error: profileError } = await db
      .from("profiles")
      .select("role")
      .eq("id", auth.user.id)
      .maybeSingle();

    if (profileError || profile?.role !== "admin") {
      return respondError("Administrator required", 403);
    }

    const body = await request.json().catch(() => null);
    const bookingId = body?.bookingId;

    if (typeof bookingId !== "string" || !UUID_PATTERN.test(bookingId)) {
      return respondError("Valid bookingId required", 400);
    }

    // The database claim is atomic. Only one preparation owns this booking.
    const lockToken = crypto.randomUUID();
    const { data: claimed, error: claimError } = await db.rpc(
      "claim_omt_meeting_preparation",
      {
        p_booking_id: bookingId,
        p_lock_token: lockToken,
      },
    );

    if (claimError) {
      throw claimError;
    }

    if (claimed !== true) {
      return respondError(
        "Booking is not eligible or meeting preparation is already running",
        409,
      );
    }

    lockContext = { db: db as any, bookingId, lockToken };

    async function assertLockOwnership() {
      const { data: owned, error } = await db
        .from("bookings")
        .select("id")
        .eq("id", bookingId)
        .eq("omt_meeting_lock_token", lockToken)
        .gt("omt_meeting_lock_until", new Date().toISOString())
        .eq("status", "pending")
        .eq("manual_payment_status", "approved")
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!owned) {
        throw new Error("OMT meeting preparation lock has expired or changed");
      }
    }

    const { data: booking, error: bookingError } = await db
      .from("bookings")
      .select(
        [
          "id",
          "status",
          "manual_payment_status",
          "therapist_id",
          "therapist_name",
          "patient_email",
          "scheduled_start",
          "scheduled_end",
          "service_type",
          "meeting_provider",
          "meeting_url",
          "zoom_join_url",
          "zoom_start_url",
          "calendar_event_id",
          "backup_join_url",
        ].join(","),
      )
      .eq("id", bookingId)
      .maybeSingle<Booking>();

    if (bookingError) {
      throw bookingError;
    }

    if (
      !booking ||
      booking.status !== "pending" ||
      booking.manual_payment_status !== "approved"
    ) {
      return respondError("Booking is not an approved pending OMT booking", 409);
    }

    const { data: payment, error: paymentError } = await db
      .from("payments")
      .select("id")
      .eq("booking_id", bookingId)
      .eq("provider", "omt")
      .eq("status", "paid")
      .maybeSingle();

    if (paymentError) {
      throw paymentError;
    }

    const { data: receipt, error: receiptError } = await db
      .from("payment_receipts")
      .select("id")
      .eq("booking_id", bookingId)
      .eq("payment_provider", "omt")
      .eq("receipt_type", "payment")
      .eq("status", "paid")
      .maybeSingle();

    if (receiptError) {
      throw receiptError;
    }

    if (!payment || !receipt) {
      return respondError("Prepare OMT payment and receipt first", 409);
    }

    if (
      !booking.therapist_id ||
      !booking.scheduled_start ||
      !booking.scheduled_end
    ) {
      return respondError("Booking schedule or therapist missing", 409);
    }

    const therapistId = booking.therapist_id;
    const therapistName = booking.therapist_name || "Specialist";
    const start = booking.scheduled_start;
    const end = booking.scheduled_end;

    const { data: therapist, error: therapistError } = await db
      .from("therapists")
      .select("preferred_meeting_provider")
      .eq("id", therapistId)
      .maybeSingle();

    if (therapistError) {
      throw therapistError;
    }

    const { data: google, error: googleError } = await db
      .from("therapist_google_connections")
      .select("calendar_enabled,meet_enabled")
      .eq("therapist_id", therapistId)
      .maybeSingle();

    if (googleError) {
      throw googleError;
    }

    const { data: zoom, error: zoomError } = await db
      .from("therapist_zoom_connections")
      .select("therapist_id")
      .eq("therapist_id", therapistId)
      .maybeSingle();

    if (zoomError) {
      throw zoomError;
    }

    const googleEnabled = google?.meet_enabled === true;
    const zoomEnabled = Boolean(zoom);
    const preferredProvider = therapist?.preferred_meeting_provider;

    let provider: "zoom" | "google_meet" | null = null;

    if (booking.meeting_provider === "zoom") {
      provider = "zoom";
    } else if (booking.meeting_provider === "google_meet") {
      provider = "google_meet";
    } else if (preferredProvider === "zoom" && zoomEnabled) {
      provider = "zoom";
    } else if (preferredProvider === "google_meet" && googleEnabled) {
      provider = "google_meet";
    } else if (googleEnabled) {
      provider = "google_meet";
    } else if (zoomEnabled) {
      provider = "zoom";
    }

    if (!provider) {
      return respondError("No connected meeting provider", 409);
    }

    const serviceType = (booking.service_type || "").trim().toLowerCase();
    const continuationServices = [
      "couple",
      "couples",
      "family",
      "famille",
      "group",
      "groupe",
    ];
    const needsContinuation =
      provider === "zoom" || continuationServices.includes(serviceType);

    let mainCreated = false;
    let backupCreated = false;

    if (provider === "zoom" && !booking.zoom_join_url) {
      await assertLockOwnership();

      const meeting = await createZoomMeetingForBooking({
        therapistId,
        therapistName,
        start,
        end,
        supabaseAdmin: db,
      });

      const { data: updated, error } = await db
        .from("bookings")
        .update({
          meeting_provider: "zoom",
          meeting_url: meeting.joinUrl,
          zoom_join_url: meeting.joinUrl,
          zoom_start_url: meeting.startUrl,
        })
        .eq("id", bookingId)
        .eq("status", "pending")
        .eq("manual_payment_status", "approved")
        .eq("omt_meeting_lock_token", lockToken)
        .gt("omt_meeting_lock_until", new Date().toISOString())
        .is("zoom_join_url", null)
        .select("id")
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!updated) {
        throw new Error("OMT main meeting could not be saved under the lock");
      }

      mainCreated = true;
    }

    if (provider === "google_meet" && !booking.meeting_url) {
      await assertLockOwnership();

      const meeting = await createGoogleMeetForBooking({
        therapistId,
        summary: `AAN Psychotherapy — ${therapistName}`,
        description: `AAN booking ${bookingId}`,
        start,
        end,
        timeZone: "Asia/Beirut",
        attendeeEmail: booking.patient_email,
      });

      const { data: updated, error } = await db
        .from("bookings")
        .update({
          meeting_provider: "google_meet",
          meeting_url: meeting.meetingUrl,
          calendar_event_id: meeting.calendarEventId,
        })
        .eq("id", bookingId)
        .eq("status", "pending")
        .eq("manual_payment_status", "approved")
        .eq("omt_meeting_lock_token", lockToken)
        .gt("omt_meeting_lock_until", new Date().toISOString())
        .is("meeting_url", null)
        .select("id")
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!updated) {
        throw new Error("OMT main meeting could not be saved under the lock");
      }

      mainCreated = true;
    }

    const { data: current, error: currentError } = await db
      .from("bookings")
      .select(
        "meeting_provider,meeting_url,zoom_join_url,zoom_start_url,backup_join_url,calendar_event_id",
      )
      .eq("id", bookingId)
      .single();

    if (currentError) {
      throw currentError;
    }

    const joinUrl =
      provider === "zoom" ? current.zoom_join_url : current.meeting_url;

    if (!joinUrl) {
      throw new Error("Main meeting link was not persisted");
    }

    if (
      provider === "zoom" &&
      google?.calendar_enabled === true &&
      !current.calendar_event_id
    ) {
      try {
        await assertLockOwnership();

        const event = await createGoogleCalendarEventForBooking({
          therapistId,
          summary: `AAN Psychotherapy — ${therapistName}`,
          description: `AAN booking ${bookingId}\nPlatform: Zoom\nJoin Zoom: ${joinUrl}`,
          start,
          end,
          timeZone: "Asia/Beirut",
          attendeeEmail: booking.patient_email,
          location: joinUrl,
        });

        const { error } = await db
          .from("bookings")
          .update({ calendar_event_id: event.calendarEventId })
          .eq("id", bookingId)
          .eq("omt_meeting_lock_token", lockToken)
          .gt("omt_meeting_lock_until", new Date().toISOString())
          .is("calendar_event_id", null);

        if (error) {
          throw error;
        }
      } catch (error) {
        await assertLockOwnership();
        console.error("Optional OMT Calendar synchronization failed", error);
      }
    }

    if (needsContinuation && !current.backup_join_url) {
      if (provider === "zoom") {
        await assertLockOwnership();

        const backup = await createZoomMeetingForBooking({
          therapistId,
          therapistName,
          start,
          end,
          supabaseAdmin: db,
          continuation: true,
        });

        const { data: updated, error } = await db
          .from("bookings")
          .update({
            backup_meeting_provider: "zoom",
            backup_join_url: backup.joinUrl,
            backup_host_url: backup.startUrl,
            backup_calendar_event_id: null,
          })
          .eq("id", bookingId)
          .eq("status", "pending")
          .eq("manual_payment_status", "approved")
          .eq("omt_meeting_lock_token", lockToken)
          .gt("omt_meeting_lock_until", new Date().toISOString())
          .is("backup_join_url", null)
          .select("id")
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!updated) {
          throw new Error("OMT continuation meeting could not be saved under the lock");
        }

        backupCreated = true;
      } else {
        await assertLockOwnership();

        const backup = await createGoogleMeetContinuationForBooking({
          therapistId,
          summary: `AAN Psychotherapy — ${therapistName}`,
          description: `AAN booking ${bookingId} — continuation`,
          start,
          end,
          timeZone: "Asia/Beirut",
        });

        const { data: updated, error } = await db
          .from("bookings")
          .update({
            backup_meeting_provider: "google_meet",
            backup_join_url: backup.meetingUrl,
            backup_calendar_event_id: backup.calendarEventId,
          })
          .eq("id", bookingId)
          .eq("status", "pending")
          .eq("manual_payment_status", "approved")
          .eq("omt_meeting_lock_token", lockToken)
          .gt("omt_meeting_lock_until", new Date().toISOString())
          .is("backup_join_url", null)
          .select("id")
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!updated) {
          throw new Error("OMT continuation meeting could not be saved under the lock");
        }

        backupCreated = true;
      }
    }

    await assertLockOwnership();

    return NextResponse.json({
      success: true,
      bookingId,
      provider,
      mainCreated,
      backupCreated,
      bookingConfirmed: false,
      emailsSent: false,
      nextStep: "omt_booking_confirmation",
    });
  } catch (error) {
    console.error("OMT meeting preparation failed", error);
    return respondError("Unable to prepare OMT meeting", 500);
  } finally {
    if (lockContext) {
      const { db, bookingId, lockToken } = lockContext;

      // A request must never release a newer request's lock.
      try {
        const { error } = await (db.from("bookings") as any)
            .update({
                omt_meeting_lock_token: null,
                omt_meeting_lock_until: null,
            })
            .eq("id", bookingId)
            .eq("omt_meeting_lock_token", lockToken);

        if (error) {
          console.error("Unable to release OMT meeting lock", error);
        }
      } catch (releaseError) {
        console.error("Unable to release OMT meeting lock", releaseError);
      }
    }
  }
}

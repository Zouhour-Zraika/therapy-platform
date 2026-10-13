import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ConfirmedBooking = {
  booking_id: string;
  booking_status: string;
  manual_payment_status: string;
  payment_provider: string;
  meeting_url: string;
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function POST(request: Request) {
  try {
    // This route must only be called by an authenticated administrator.
    const authorization = request.headers.get("authorization") ?? "";

    if (!authorization.startsWith("Bearer ")) {
      return jsonError("Authentication required", 401);
    }

    const accessToken = authorization.slice("Bearer ".length).trim();

    if (!accessToken) {
      return jsonError("Authentication required", 401);
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey =
      process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("OMT confirmation: Supabase server configuration missing");
      return jsonError("Server configuration error", 500);
    }

    const db = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: authData, error: authError } =
      await db.auth.getUser(accessToken);

    if (authError || !authData.user) {
      return jsonError("Invalid session", 401);
    }

    const { data: profile, error: profileError } = await db
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError) {
      console.error("OMT confirmation: administrator lookup failed", profileError);
      return jsonError("Unable to verify administrator", 500);
    }

    if (profile?.role !== "admin") {
      return jsonError("Administrator required", 403);
    }

    const body: unknown = await request.json().catch(() => null);
    const bookingId =
      body && typeof body === "object" && "bookingId" in body
        ? (body as { bookingId?: unknown }).bookingId
        : null;

    if (typeof bookingId !== "string" || !UUID_PATTERN.test(bookingId)) {
      return jsonError("Valid bookingId required", 400);
    }

    // Avoid confirming while a meeting preparation is still in progress.
    // The SQL RPC remains the authority for payment and receipt validation.
    const { data: booking, error: bookingError } = await db
      .from("bookings")
      .select(
        "id,status,manual_payment_status,omt_meeting_lock_until,meeting_provider,meeting_url"
      )
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError) {
      console.error("OMT confirmation: booking lookup failed", bookingError);
      return jsonError("Unable to check booking", 500);
    }

    if (!booking) {
      return jsonError("Booking not found", 404);
    }

    if (
      booking.status !== "pending" &&
      booking.status !== "paid"
    ) {
      return jsonError("Booking is not eligible for OMT confirmation", 409);
    }

    if (booking.manual_payment_status !== "approved") {
      return jsonError("OMT payment has not been approved", 409);
    }

    const lockUntil = booking.omt_meeting_lock_until;

    if (lockUntil && new Date(lockUntil).getTime() > Date.now()) {
      return jsonError("Meeting preparation is still in progress", 409);
    }

    // The database function performs the final checks atomically:
    // approved declaration, payment, receipt, meeting, and booking state.
    const { data: confirmedRows, error: confirmError } = await db.rpc(
      "confirm_fulfilled_omt_booking",
      { p_booking_id: bookingId }
    );

    if (confirmError) {
      console.error("OMT confirmation RPC rejected booking", {
        bookingId,
        code: confirmError.code,
        message: confirmError.message,
      });

      return jsonError(
        "OMT confirmation refused: verify the approved payment, receipt and meeting",
        409
      );
    }

    const confirmed = (confirmedRows as ConfirmedBooking[] | null)?.[0];

    if (
      !confirmed ||
      confirmed.booking_id !== bookingId ||
      confirmed.booking_status !== "paid" ||
      confirmed.manual_payment_status !== "approved" ||
      confirmed.payment_provider !== "omt" ||
      !confirmed.meeting_url
    ) {
      console.error("OMT confirmation returned an unexpected result", {
        bookingId,
      });

      return jsonError("Unexpected confirmation result", 500);
    }

    // Associate the patient with the therapist after SQL confirmation.
    // A conflicting active therapist requires manual intervention.
    const { data: assignment, error: assignmentError } = await db.rpc(
      "assign_omt_booking_therapist",
      { p_booking_id: bookingId },
    );

    if (assignmentError) {
      console.error("OMT assignment failed after booking confirmation", {
        bookingId,
        code: assignmentError.code,
        message: assignmentError.message,
      });

      return NextResponse.json(
        {
          success: false,
          bookingId,
          bookingConfirmed: true,
          assignmentCompleted: false,
          emailsSent: false,
          manualReviewRequired: true,
          error: assignmentError.message.includes("ACTIVE_THERAPIST_CONFLICT")
            ? "Another therapist is already active in this care domain"
            : "Therapist assignment failed after payment confirmation",
        },
        { status: 409 },
      );
    }

    if (assignment !== "assigned" && assignment !== "already_assigned") {
      return NextResponse.json(
        {
          success: false,
          bookingId,
          bookingConfirmed: true,
          assignmentCompleted: false,
          emailsSent: false,
          error: "Unexpected therapist assignment result",
        },
        { status: 500 },
      );
    }

    // Do not claim emails have been sent.
    // The separate /api/admin/omt-notifications route uses atomic claims.
    // Its three notification types must be processed independently.
    const { data: notificationRows, error: notificationError } = await db
      .from("omt_notification_deliveries")
      .select("notification_type,status")
      .eq("booking_id", bookingId);

    if (notificationError) {
      console.error("OMT notification tracking lookup failed", notificationError);
      return NextResponse.json(
        {
          success: false,
          bookingId,
          bookingConfirmed: true,
          assignmentCompleted: true,
          emailsSent: false,
          error: "Unable to check notification delivery status",
        },
        { status: 500 },
      );
    }

    const requiredNotifications = [
      "patient_confirmation",
      "therapist_confirmation",
      "payment_receipt",
    ];

    const sentNotifications = requiredNotifications.filter((type) =>
      (notificationRows ?? []).some(
        (row) => row.notification_type === type && row.status === "sent",
      ),
    );

    const pendingNotifications = requiredNotifications.filter(
      (type) => !sentNotifications.includes(type),
    );

    return NextResponse.json({
      success: true,
      bookingId: confirmed.booking_id,
      bookingStatus: confirmed.booking_status,
      paymentProvider: confirmed.payment_provider,
      meetingReady: true,
      bookingConfirmed: true,
      assignmentCompleted: true,
      assignmentStatus: assignment,
      emailsSent: pendingNotifications.length === 0,
      sentNotifications,
      pendingNotifications,
      nextStep: pendingNotifications.length
        ? "omt_notifications"
        : "complete",
    });
  } catch (error) {
    console.error("OMT booking confirmation failed", error);
    return jsonError("Unable to confirm OMT booking", 500);
  }
}

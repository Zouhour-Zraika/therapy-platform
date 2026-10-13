import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    const authorization = request.headers.get("authorization") ?? "";
    if (!authorization.startsWith("Bearer ")) return jsonError("Authentication required", 401);

    const accessToken = authorization.slice("Bearer ".length).trim();
    if (!accessToken) return jsonError("Authentication required", 401);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Whish confirmation: Supabase server configuration missing");
      return jsonError("Server configuration error", 500);
    }

    const db = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: authData, error: authError } = await db.auth.getUser(accessToken);
    if (authError || !authData.user) return jsonError("Invalid session", 401);

    const { data: profile, error: profileError } = await db
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Whish confirmation: administrator lookup failed", profileError);
      return jsonError("Unable to verify administrator", 500);
    }
    if (profile?.role !== "admin") return jsonError("Administrator required", 403);

    const body: unknown = await request.json().catch(() => null);
    const bookingId = body && typeof body === "object" && "bookingId" in body
      ? (body as { bookingId?: unknown }).bookingId
      : null;

    if (typeof bookingId !== "string" || !UUID_PATTERN.test(bookingId)) {
      return jsonError("Valid bookingId required", 400);
    }

    const { data: booking, error: bookingError } = await db
      .from("bookings")
      .select("id,status,manual_payment_status,whish_meeting_lock_until")
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError) {
      console.error("Whish confirmation: booking lookup failed", bookingError);
      return jsonError("Unable to check booking", 500);
    }
    if (!booking) return jsonError("Booking not found", 404);
    if (booking.status !== "pending" && booking.status !== "paid") {
      return jsonError("Booking is not eligible for Whish confirmation", 409);
    }
    if (booking.manual_payment_status !== "approved") {
      return jsonError("Whish payment has not been approved", 409);
    }

    const lockUntil = booking.whish_meeting_lock_until;
    if (lockUntil && new Date(lockUntil).getTime() > Date.now()) {
      return jsonError("Meeting preparation is still in progress", 409);
    }

    // The SQL function validates the Whish declaration, payment, receipt, meeting and booking.
    const { data: confirmedRows, error: confirmError } = await db.rpc(
      "confirm_fulfilled_whish_booking",
      { p_booking_id: bookingId },
    );

    if (confirmError) {
      console.error("Whish confirmation RPC rejected booking", {
        bookingId, code: confirmError.code, message: confirmError.message,
      });
      return jsonError("Whish confirmation refused: verify payment, receipt and meeting", 409);
    }

    const confirmed = (confirmedRows as ConfirmedBooking[] | null)?.[0];
    if (!confirmed || confirmed.booking_id !== bookingId || confirmed.booking_status !== "paid" ||
        confirmed.manual_payment_status !== "approved" || confirmed.payment_provider !== "whish" ||
        !confirmed.meeting_url) {
      console.error("Whish confirmation returned an unexpected result", { bookingId });
      return jsonError("Unexpected confirmation result", 500);
    }

    const { data: assignment, error: assignmentError } = await db.rpc(
      "assign_whish_booking_therapist",
      { p_booking_id: bookingId },
    );

    if (assignmentError) {
      console.error("Whish assignment failed after booking confirmation", {
        bookingId, code: assignmentError.code, message: assignmentError.message,
      });
      return NextResponse.json({
        success: false,
        bookingId,
        bookingConfirmed: true,
        assignmentCompleted: false,
        emailsSent: false,
        manualReviewRequired: true,
        error: assignmentError.message.includes("ACTIVE_THERAPIST_CONFLICT")
          ? "Another therapist is already active in this care domain"
          : "Therapist assignment failed after payment confirmation",
      }, { status: 409 });
    }

    if (assignment !== "assigned" && assignment !== "already_assigned") {
      return NextResponse.json({
        success: false,
        bookingId,
        bookingConfirmed: true,
        assignmentCompleted: false,
        emailsSent: false,
        error: "Unexpected therapist assignment result",
      }, { status: 500 });
    }

    // Whish notification tracking is implemented in a separate workflow.
    return NextResponse.json({
      success: true,
      bookingId: confirmed.booking_id,
      bookingStatus: confirmed.booking_status,
      paymentProvider: confirmed.payment_provider,
      meetingReady: true,
      bookingConfirmed: true,
      assignmentCompleted: true,
      assignmentStatus: assignment,
      emailsSent: false,
      pendingNotifications: ["patient_confirmation", "therapist_confirmation", "payment_receipt"],
      nextStep: "whish_notifications",
    });
  } catch (error) {
    console.error("Whish booking confirmation failed", error);
    return jsonError("Unable to confirm Whish booking", 500);
  }
}

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type AssignmentResult = "assigned" | "already_assigned";

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { success: false, error: message },
    { status },
  );
}

export async function POST(request: Request) {
  try {
    // 1. Require an authenticated administrator.
    const authorization = request.headers.get("authorization") ?? "";
    const match = /^Bearer\s+(.+)$/i.exec(authorization);
    const accessToken = match?.[1]?.trim();

    if (!accessToken) {
      return jsonError("Authentication required", 401);
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey =
      process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonError("Supabase server configuration missing", 500);
    }

    const db = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const { data: auth, error: authError } =
      await db.auth.getUser(accessToken);

    if (authError || !auth.user) {
      return jsonError("Invalid session", 401);
    }

    const { data: profile, error: profileError } = await db
      .from("profiles")
      .select("role")
      .eq("id", auth.user.id)
      .maybeSingle();

    if (profileError) {
      console.error("OMT assignment: profile lookup failed", profileError);
      return jsonError("Unable to verify administrator", 500);
    }

    if (profile?.role !== "admin") {
      return jsonError("Administrator required", 403);
    }

    // 2. Validate the booking identifier.
    const body: unknown = await request.json().catch(() => null);
    const bookingId =
      body && typeof body === "object" && "bookingId" in body
        ? (body as { bookingId?: unknown }).bookingId
        : null;

    if (
      typeof bookingId !== "string" ||
      !UUID_PATTERN.test(bookingId)
    ) {
      return jsonError("Valid bookingId required", 400);
    }

    // 3. The SQL function atomically verifies the paid OMT booking,
    //    checks the care domain, and protects existing assignments.
    const { data, error } = await db.rpc(
      "assign_omt_booking_therapist",
      { p_booking_id: bookingId },
    );

    if (error) {
      console.error("OMT assignment RPC failed", {
        bookingId,
        code: error.code,
        message: error.message,
      });

      if (error.message.includes("ACTIVE_THERAPIST_CONFLICT")) {
        return jsonError(
          "Patient already has a different active therapist in this care domain. Manual review required.",
          409,
        );
      }

      if (
        error.message.includes("OMT_BOOKING_NOT_CONFIRMED") ||
        error.message.includes("THERAPIST_CARE_DOMAIN_MISSING") ||
        error.message.includes("MISSING_PATIENT_OR_THERAPIST")
      ) {
        return jsonError("Booking not eligible for assignment", 409);
      }

      return jsonError("Unable to complete therapist assignment", 500);
    }

    const result = data as AssignmentResult | null;

    if (result !== "assigned" && result !== "already_assigned") {
      return jsonError("Unexpected assignment result", 500);
    }

    return NextResponse.json({
      success: true,
      bookingId,
      assignmentCompleted: true,
      assignmentStatus: result,
      emailsSent: false,
    });
  } catch (error) {
    console.error("OMT assignment failed", error);
    return jsonError("Unable to complete OMT assignment", 500);
  }
}

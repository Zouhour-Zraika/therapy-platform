// OMT booking finalization and email notifications.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const NOTIFICATIONS = [
  "patient_confirmation",
  "therapist_confirmation",
  "payment_receipt",
] as const;

type NotificationType = (typeof NOTIFICATIONS)[number];

type StepResult = {
  success?: boolean;
  bookingConfirmed?: boolean;
  assignmentCompleted?: boolean;
  sent?: boolean;
  skipped?: boolean;
  error?: string;
  reason?: string;
};

function fail(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

async function invoke(
  origin: string,
  path: string,
  token: string,
  payload: Record<string, string>,
): Promise<{ ok: boolean; status: number; result: StepResult }> {
  const response = await fetch(`${origin}${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const result = (await response.json().catch(() => ({}))) as StepResult;

  return {
    ok: response.ok,
    status: response.status,
    result,
  };
}

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization") ?? "";
    const match = /^Bearer\s+(.+)$/i.exec(authorization);
    const token = match?.[1]?.trim();

    if (!token) return fail("Authentication required", 401);

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) return fail("Server configuration missing", 500);

    const db = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: auth, error: authError } = await db.auth.getUser(token);
    if (authError || !auth.user) return fail("Invalid session", 401);

    const { data: profile, error: profileError } = await db
      .from("profiles")
      .select("role")
      .eq("id", auth.user.id)
      .maybeSingle();

    if (profileError) return fail("Administrator lookup failed", 500);
    if (profile?.role !== "admin") return fail("Administrator required", 403);

    const body: unknown = await request.json().catch(() => null);
    const bookingId =
      body && typeof body === "object" && "bookingId" in body
        ? (body as { bookingId?: unknown }).bookingId
        : null;

    if (typeof bookingId !== "string" || !UUID.test(bookingId)) {
      return fail("Valid bookingId required", 400);
    }

    // A fixed configured origin avoids trusting the incoming Host header.
    const configuredOrigin = process.env.OMT_INTERNAL_ORIGIN;
    if (!configuredOrigin) {
      return fail("OMT_INTERNAL_ORIGIN must be configured", 500);
    }

    let origin: string;
    try {
      const parsed = new URL(configuredOrigin);
      if (
        !["https:", "http:"].includes(parsed.protocol) ||
        parsed.username ||
        parsed.password ||
        parsed.pathname !== "/" ||
        parsed.search ||
        parsed.hash
      ) {
        return fail("Invalid OMT_INTERNAL_ORIGIN", 500);
      }
      origin = parsed.origin;
    } catch {
      return fail("Invalid OMT_INTERNAL_ORIGIN", 500);
    }

    // Confirm and associate the patient first.
    const confirmation = await invoke(
      origin,
      "/api/admin/omt-confirm",
      token,
      { bookingId },
    );

    if (
      !confirmation.ok ||
      confirmation.result.success !== true ||
      confirmation.result.bookingConfirmed !== true ||
      confirmation.result.assignmentCompleted !== true
    ) {
      return NextResponse.json(
        {
          success: false,
          bookingId,
          bookingConfirmed: confirmation.result.bookingConfirmed === true,
          assignmentCompleted: confirmation.result.assignmentCompleted === true,
          notificationsStarted: false,
          error: confirmation.result.error || "OMT confirmation incomplete",
        },
        { status: 409 },
      );
    }

    const notificationResults: Array<{
      type: NotificationType;
      status: "sent" | "already_sent" | "manual_review";
    }> = [];

    // Each email has its own atomic SQL claim. Never interpret a skipped
    // notification as sent without checking its database state.
    for (const type of NOTIFICATIONS) {
      const notification = await invoke(
        origin,
        "/api/admin/omt-notifications",
        token,
        { bookingId, notificationType: type },
      );

      if (notification.ok && notification.result.sent === true) {
        notificationResults.push({ type, status: "sent" });
        continue;
      }

      if (notification.ok && notification.result.skipped === true) {
        const { data: delivery, error: deliveryError } = await db
          .from("omt_notification_deliveries")
          .select("status")
          .eq("booking_id", bookingId)
          .eq("notification_type", type)
          .maybeSingle();

        if (!deliveryError && delivery?.status === "sent") {
          notificationResults.push({ type, status: "already_sent" });
          continue;
        }
      }

      notificationResults.push({ type, status: "manual_review" });

      // Stop immediately: an uncertain delivery must not be retried.
      return NextResponse.json(
        {
          success: false,
          bookingId,
          bookingConfirmed: true,
          assignmentCompleted: true,
          manualReviewRequired: true,
          notificationResults,
          error: notification.result.error ||
            "Notification not confirmed; manual review required",
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      success: true,
      bookingId,
      bookingConfirmed: true,
      assignmentCompleted: true,
      notificationsComplete: true,
      notificationResults,
    });
  } catch (error) {
    console.error("OMT finalization failed", error);
    return fail("OMT finalization interrupted; inspect delivery states", 500);
  }
}

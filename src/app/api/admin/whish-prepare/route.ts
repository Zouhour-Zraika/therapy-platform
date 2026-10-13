import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RequestBody = { bookingId?: unknown };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) throw new Error("Supabase server configuration is missing.");

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const token = authorization.slice(7).trim();
    if (!token) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const supabase = createSupabaseAdmin();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid or expired session." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle<{ role: string | null }>();

    if (profileError) {
      console.error("Whish administrator lookup failed:", profileError);
      return NextResponse.json({ error: "Unable to verify administrator." }, { status: 500 });
    }
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    let body: RequestBody;
    try {
      body = (await request.json()) as RequestBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    if (!body || typeof body !== "object" || Array.isArray(body) ||
        typeof body.bookingId !== "string" || !UUID_PATTERN.test(body.bookingId)) {
      return NextResponse.json({ error: "Invalid booking identifier." }, { status: 400 });
    }

    const bookingId = body.bookingId;
    // SQL verifies an approved Whish declaration and locks the booking.
    const { data: paymentRows, error: paymentError } = await supabase.rpc(
      "record_approved_whish_payment",
      { p_booking_id: bookingId },
    );

    if (paymentError) {
      console.error("Whish payment recording failed:", paymentError);
      return NextResponse.json(
        { error: "Unable to record approved Whish payment." },
        { status: 409 },
      );
    }

    // Receipt creation can be retried if payment recording already succeeded.
    const { data: receiptRows, error: receiptError } = await supabase.rpc(
      "create_approved_whish_payment_receipt",
      { p_booking_id: bookingId },
    );

    if (receiptError) {
      console.error("Whish receipt creation failed:", receiptError);
      return NextResponse.json(
        { error: "Whish payment recorded, receipt pending.", retryable: true },
        { status: 503 },
      );
    }

    const payment = Array.isArray(paymentRows) ? paymentRows[0] : null;
    const receipt = Array.isArray(receiptRows) ? receiptRows[0] : null;
    if (!payment || !receipt) {
      return NextResponse.json(
        { error: "Whish preparation result is incomplete.", retryable: true },
        { status: 503 },
      );
    }

    return NextResponse.json({
      success: true,
      bookingId,
      payment,
      receipt,
      bookingConfirmed: false,
      meetingPrepared: false,
      emailsSent: false,
      nextStep: "whish_booking_fulfillment",
    });
  } catch (error) {
    console.error("Whish preparation unexpected error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// File: src/app/api/manual-payment/declare/route.ts
// OMT and Whish declarations only. Stripe and patient packs are untouched.
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Provider = "omt" | "whish";
type Booking = {
  id: string;
  patient_id: string | null;
  status: string | null;
  price: number | null;
  hold_expires_at: string | null;
  manual_payment_status: string | null;
  payment_provider: string | null;
  payment_transaction_id: string | null;
  patient_pack_id: string | null;
  payment_source: string | null;
};

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error("Supabase server configuration is missing.");
  }
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
    const supabase = adminClient();
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Patient authentication required." }, { status: 401 });
    }
    const token = authorization.slice(7).trim();
    if (!token) {
      return NextResponse.json(
        { error: "Patient authentication required." },
        { status: 401 },
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Patient authentication required." }, { status: 401 });
    }
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle<{ role: string | null }>();
    if (profileError) throw profileError;
    if (profile?.role !== "patient") {
      return NextResponse.json({ error: "Patient account required." }, { status: 403 });
    }

    let body: Record<string, unknown>;
    try {
      const parsed: unknown = await request.json();
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Invalid body");
      }
      body = parsed as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const bookingId = typeof body.bookingId === "string" ? body.bookingId.trim() : "";
    // Missing provider preserves compatibility with existing OMT clients.
    const provider: Provider | null =
      body.provider === undefined || body.provider === "omt"
        ? "omt"
        : body.provider === "whish"
          ? "whish"
          : null;
    const reference =
      typeof body.transactionReference === "string"
        ? body.transactionReference.trim()
        : "";
    const note = typeof body.patientNote === "string" ? body.patientNote.trim() : "";
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidPattern.test(bookingId)) {
      return NextResponse.json({ error: "Invalid booking identifier." }, { status: 400 });
    }
    if (!provider) {
      return NextResponse.json({ error: "Unsupported manual payment provider." }, { status: 400 });
    }
    if (!reference || reference.length > 200 || note.length > 2000) {
      return NextResponse.json({
        error: "A transaction reference (1–200 characters) is required; note maximum is 2000 characters.",
      }, { status: 400 });
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(
        "id, patient_id, status, price, hold_expires_at, " +
        "manual_payment_status, payment_provider, payment_transaction_id, " +
        "patient_pack_id, payment_source",
      )
      .eq("id", bookingId)
      .maybeSingle<Booking>();
    if (bookingError) throw bookingError;
    if (!booking || booking.patient_id !== user.id) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }
    if (
      booking.status !== "pending" ||
      booking.manual_payment_status !== null ||
      booking.payment_provider ||
      booking.payment_transaction_id ||
      booking.patient_pack_id ||
      booking.payment_source === "patient_pack"
    ) {
      return NextResponse.json({ error: "This booking cannot accept a manual transfer declaration." }, { status: 409 });
    }
    const amount = Number(booking.price);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Booking amount is invalid." }, { status: 409 });
    }
    const deadline = booking.hold_expires_at ? Date.parse(booking.hold_expires_at) : NaN;
    if (!Number.isFinite(deadline) || deadline <= Date.now()) {
      return NextResponse.json({
        error: "The 10-minute payment window has expired.", code: "HOLD_EXPIRED",
      }, { status: 409 });
    }

    const functionName =
      provider === "omt"
        ? "submit_omt_payment_declaration"
        : "submit_whish_payment_declaration";
    const { data: result, error: declarationError } = await supabase.rpc(functionName, {
      p_booking_id: booking.id,
      p_patient_id: user.id,
      p_transaction_reference: reference,
      p_patient_note: note || null,
    });

    if (declarationError) {
      const knownErrors: Record<string, string> = {
        INVALID_IDENTIFIERS: "Invalid booking identifier.",
        INVALID_DECLARATION: "Invalid transfer reference or note.",
        BOOKING_NOT_FOUND: "Booking not found.",
        BOOKING_NOT_ELIGIBLE: "This booking cannot accept a manual transfer declaration.",
        HOLD_EXPIRED: "The 10-minute payment window has expired.",
        INVALID_BOOKING_AMOUNT: "Booking amount is invalid.",
        REFERENCE_ALREADY_DECLARED: `This ${provider.toUpperCase()} transaction reference has already been declared.`,
      };
      const errorCode = Object.keys(knownErrors).find((code) =>
        declarationError.message.includes(code),
      );
      if (errorCode) {
        return NextResponse.json({ error: knownErrors[errorCode], code: errorCode }, {
          status: errorCode === "BOOKING_NOT_FOUND" ? 404 : 409,
        });
      }
      console.error(`${provider.toUpperCase()} declaration failed:`, declarationError);
      return NextResponse.json({
        error: "Could not record the transfer declaration. Please contact AAN support if you already sent money.",
      }, { status: 500 });
    }

    const declaration = (result as Array<{
      declaration_id: string;
      declaration_status: string;
      declaration_submitted_at: string;
    }> | null)?.[0];
    if (!declaration) {
      console.error(`${provider.toUpperCase()} declaration returned no row.`);
      return NextResponse.json({ error: "Unable to retrieve the transfer declaration." }, { status: 500 });
    }
    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      declarationId: declaration.declaration_id,
      provider,
      status: "under_review",
      submittedAt: declaration.declaration_submitted_at,
      paymentConfirmed: false,
    }, { status: 201 });
  } catch (error) {
    console.error("Manual payment declaration error:", error);
    return NextResponse.json({ error: "Unable to submit manual payment declaration." }, { status: 500 });
  }
}

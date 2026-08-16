import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const stripeSecretKey =
    process.env.STRIPE_SECRET_KEY;

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseServerKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !stripeSecretKey ||
    !supabaseUrl ||
    !supabaseServerKey
  ) {
    return NextResponse.json(
      {
        error:
          "Server configuration is incomplete.",
      },
      { status: 500 },
    );
  }

  try {
    const url = new URL(request.url);

    const sessionId =
      url.searchParams.get("session_id");

    const requestedBookingId =
      url.searchParams.get("bookingId");

    if (!sessionId) {
      return NextResponse.json(
        {
          error:
            "Stripe session ID is missing.",
        },
        { status: 400 },
      );
    }

    const stripe =
      new Stripe(stripeSecretKey);

    const session =
      await stripe.checkout.sessions.retrieve(
        sessionId,
      );

    const bookingId =
      session.metadata?.bookingId;

    if (!bookingId) {
      return NextResponse.json(
        {
          error:
            "Booking ID was not found in Stripe metadata.",
        },
        { status: 400 },
      );
    }

    if (
      requestedBookingId &&
      requestedBookingId !== bookingId
    ) {
      return NextResponse.json(
        {
          error:
            "Booking ID does not match the Stripe session.",
        },
        { status: 400 },
      );
    }

    const supabaseAdmin =
      createClient(
        supabaseUrl,
        supabaseServerKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        },
      );

    const {
      data: booking,
      error: bookingError,
    } = await supabaseAdmin
      .from("bookings")
      .select(
        `
          id,
          status,
          therapist_name,
          slot_day,
          slot_time,
          scheduled_start,
          scheduled_end,
          meeting_url,
          meeting_provider,
          calendar_event_id
        `,
      )
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError) {
      throw bookingError;
    }

    if (!booking) {
      return NextResponse.json(
        {
          error:
            "Booking was not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      paymentStatus:
        session.payment_status,

      checkoutStatus:
        session.status,

      booking,
    });
  } catch (error) {
    console.error(
      "Payment status error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to verify payment.",
      },
      { status: 500 },
    );
  }
}
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

type BookingStatus = {
  id: string;
  status: string;

  price: number;

  therapist_name: string | null;

  slot_day: string | null;
  slot_time: string | null;

  scheduled_start: string | null;
  scheduled_end: string | null;

  meeting_url: string | null;
  meeting_provider: string | null;
  calendar_event_id: string | null;

  payment_provider: string | null;
  payment_method: string | null;
  payment_transaction_id: string | null;
};

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
      {
        status: 500,
      },
    );
  }

  try {
    const url =
      new URL(request.url);

    const sessionId =
      url.searchParams.get(
        "session_id",
      );

    const requestedBookingId =
      url.searchParams.get(
        "bookingId",
      );

    if (!sessionId) {
      return NextResponse.json(
        {
          error:
            "Stripe session ID is missing.",
        },
        {
          status: 400,
        },
      );
    }

    const stripe =
      new Stripe(
        stripeSecretKey,
      );

    /*
     * On demande directement à Stripe
     * l'état réel de la Checkout Session.
     */
    const session =
      await stripe.checkout.sessions.retrieve(
        sessionId,
      );

    const bookingId =
      session.metadata?.bookingId?.trim();

    if (!bookingId) {
      return NextResponse.json(
        {
          error:
            "Booking ID was not found in Stripe metadata.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Protection supplémentaire :
     * le bookingId présent dans l'URL
     * doit correspondre à celui enregistré
     * chez Stripe.
     */
    if (
      requestedBookingId &&
      requestedBookingId !==
        bookingId
    ) {
      return NextResponse.json(
        {
          error:
            "Booking ID does not match the Stripe session.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * On vérifie également que cette
     * Checkout Session appartient bien
     * au provider Stripe.
     */
    const paymentProvider =
      session.metadata
        ?.paymentProvider;

    if (
      paymentProvider &&
      paymentProvider !==
        "stripe"
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid payment provider.",
        },
        {
          status: 400,
        },
      );
    }

    const supabaseAdmin =
      createClient(
        supabaseUrl,
        supabaseServerKey,
        {
          auth: {
            autoRefreshToken:
              false,

            persistSession:
              false,

            detectSessionInUrl:
              false,
          },
        },
      );

    /*
     * On récupère l'état actuel
     * de la réservation.
     *
     * Le webhook Stripe reste responsable
     * du passage définitif à "paid".
     */
    const {
      data: booking,
      error: bookingError,
    } = await supabaseAdmin
      .from("bookings")
      .select(
        `
          id,
          status,
          price,
          therapist_name,
          slot_day,
          slot_time,
          scheduled_start,
          scheduled_end,
          meeting_url,
          meeting_provider,
          calendar_event_id,
          payment_provider,
          payment_method,
          payment_transaction_id
        `,
      )
      .eq(
        "id",
        bookingId,
      )
      .maybeSingle<BookingStatus>();

    if (bookingError) {
      throw bookingError;
    }

    if (!booking) {
      return NextResponse.json(
        {
          error:
            "Booking was not found.",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * Vérification supplémentaire du montant.
     *
     * Normalement le webhook effectue déjà
     * ce contrôle avant de passer la
     * réservation à paid.
     */
    const stripeAmount =
      typeof session.amount_total ===
      "number"
        ? session.amount_total /
          100
        : null;

    const bookingPrice =
      Number(
        booking.price,
      );

    const amountMatches =
      stripeAmount !== null &&
      Number.isFinite(
        bookingPrice,
      ) &&
      Math.abs(
        stripeAmount -
          bookingPrice,
      ) <= 0.001;

    if (
      session.payment_status ===
        "paid" &&
      !amountMatches
    ) {
      console.error(
        "Payment status amount mismatch:",
        {
          sessionId,
          bookingId,
          stripeAmount,
          bookingPrice,
        },
      );

      return NextResponse.json(
        {
          error:
            "Payment amount does not match the booking price.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Attention :
     *
     * Stripe peut déjà indiquer "paid"
     * alors que le webhook n'a pas encore
     * terminé la mise à jour Supabase.
     *
     * C'est précisément pour cette raison
     * que /success effectue plusieurs essais.
     */
    return NextResponse.json({
      provider: "stripe",

      paymentStatus:
        session.payment_status,

      checkoutStatus:
        session.status,

      amount:
        stripeAmount,

      currency:
        session.currency?.toUpperCase() ||
        "USD",

      booking,

      bookingConfirmed:
        booking.status ===
        "paid",
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
      {
        status: 500,
      },
    );
  }
}
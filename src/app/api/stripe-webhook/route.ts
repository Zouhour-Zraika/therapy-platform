import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

type BookingRecord = {
  id: string;
  status: string;
};

export async function POST(request: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Accepte l’ancien nom ou le nouveau secret Supabase.
  const supabaseServerKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY is missing." },
      { status: 500 },
    );
  }

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is missing." },
      { status: 500 },
    );
  }

  if (!supabaseUrl || !supabaseServerKey) {
    return NextResponse.json(
      { error: "Supabase server configuration is missing." },
      { status: 500 },
    );
  }

  const stripe = new Stripe(stripeSecretKey);

  const supabaseAdmin = createClient(
    supabaseUrl,
    supabaseServerKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    },
  );

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Stripe signature is missing." },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    /*
     * Stripe exige le corps brut pour vérifier la signature.
     * Ne remplace pas request.text() par request.json().
     */
    const rawBody = await request.text();

    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );
  } catch (error) {
    console.error("Stripe webhook signature error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Invalid Stripe webhook signature.",
      },
      { status: 400 },
    );
  }

  try {
    const isSuccessfulCheckout =
      event.type === "checkout.session.completed" ||
      event.type ===
        "checkout.session.async_payment_succeeded";

    if (!isSuccessfulCheckout) {
      return NextResponse.json({
        received: true,
        ignored: true,
      });
    }

    const session =
      event.data.object as Stripe.Checkout.Session;

    /*
     * Avec les cartes Stripe, la session doit être réellement payée.
     * Cela évite de confirmer une réservation incomplète.
     */
    if (session.payment_status !== "paid") {
      console.log(
        "Stripe session received but not paid:",
        session.id,
        session.payment_status,
      );

      return NextResponse.json({
        received: true,
        ignored: true,
        reason: "Payment is not paid yet.",
      });
    }

    const bookingId =
      session.metadata?.bookingId?.trim();

    const therapist =
      session.metadata?.therapist?.trim() ||
      "Therapist";

    const slot =
      session.metadata?.slot?.trim() || "";

    const language =
      session.metadata?.language === "ar"
        ? "ar"
        : "en";

    const customerEmail =
      session.customer_details?.email ||
      session.customer_email ||
      session.metadata?.email ||
      "";

    if (!bookingId) {
      console.error(
        "Stripe session does not contain bookingId:",
        session.id,
      );

      return NextResponse.json(
        { error: "Booking identifier is missing." },
        { status: 400 },
      );
    }

    const {
      data: existingBooking,
      error: bookingReadError,
    } = await supabaseAdmin
      .from("bookings")
      .select("id, status")
      .eq("id", bookingId)
      .maybeSingle<BookingRecord>();

    if (bookingReadError) {
      throw bookingReadError;
    }

    if (!existingBooking) {
      console.error("Booking not found:", bookingId);

      return NextResponse.json(
        { error: "Booking not found." },
        { status: 404 },
      );
    }

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    /*
     * Utilise l’identifiant du PaymentIntent lorsqu’il existe.
     * Sinon, utilise l’identifiant de Checkout Session.
     */
    const transactionId =
      paymentIntentId || session.id;

    const amount =
      typeof session.amount_total === "number"
        ? session.amount_total / 100
        : 0;

    const currency =
      session.currency?.toUpperCase() || "USD";

    /*
     * Upsert idempotent :
     * si Stripe renvoie l’événement, aucune deuxième ligne
     * de paiement n’est créée.
     */
    const { error: paymentError } =
      await supabaseAdmin
        .from("payments")
        .upsert(
          {
            booking_id: bookingId,
            provider: "stripe",
            amount,
            currency,
            status: "paid",
            transaction_id: transactionId,
          },
          {
            onConflict: "transaction_id",
            ignoreDuplicates: false,
          },
        );

    if (paymentError) {
      throw paymentError;
    }

    const bookingWasAlreadyPaid =
      existingBooking.status === "paid";

    if (!bookingWasAlreadyPaid) {
      const { error: updateError } =
        await supabaseAdmin
          .from("bookings")
          .update({
            status: "paid",
          })
          .eq("id", bookingId);

      if (updateError) {
        throw updateError;
      }

      /*
       * Envoi de l’e-mail une seule fois,
       * lors du passage réel à paid.
       */
      if (customerEmail) {
        const siteUrl =
          process.env.NEXT_PUBLIC_SITE_URL?.replace(
            /\/$/,
            "",
          ) || new URL(request.url).origin;

        try {
          const emailResponse = await fetch(
            `${siteUrl}/api/send-booking-email`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: customerEmail,
                therapist,
                slot,
                price: amount,
                language,
                bookingId,
                paymentProvider: "stripe",
                transactionId,
              }),
            },
          );

          if (!emailResponse.ok) {
            console.error(
              "Booking confirmation email failed:",
              emailResponse.status,
              await emailResponse.text(),
            );
          }
        } catch (emailError) {
          /*
           * Le paiement reste validé même si l’e-mail échoue.
           */
          console.error(
            "Booking confirmation email request failed:",
            emailError,
          );
        }
      }
    }

    return NextResponse.json({
      received: true,
      bookingId,
      paymentStatus: "paid",
      transactionId,
      alreadyProcessed: bookingWasAlreadyPaid,
    });
  } catch (error) {
    console.error(
      "Stripe webhook processing error:",
      error,
    );

    /*
     * Le statut 500 permet à Stripe de réessayer.
     */
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to process Stripe webhook.",
      },
      { status: 500 },
    );
  }
}
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

type Language = "en" | "fr" | "ar";

type BookingRecord = {
  id: string;
  status: string;
  price: number;
};

export async function POST(request: Request) {
  const stripeSecretKey =
    process.env.STRIPE_SECRET_KEY;

  const webhookSecret =
    process.env.STRIPE_WEBHOOK_SECRET;

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseServerKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecretKey) {
    return NextResponse.json(
      {
        error:
          "STRIPE_SECRET_KEY is missing.",
      },
      {
        status: 500,
      },
    );
  }

  if (!webhookSecret) {
    return NextResponse.json(
      {
        error:
          "STRIPE_WEBHOOK_SECRET is missing.",
      },
      {
        status: 500,
      },
    );
  }

  if (!supabaseUrl || !supabaseServerKey) {
    return NextResponse.json(
      {
        error:
          "Supabase server configuration is missing.",
      },
      {
        status: 500,
      },
    );
  }

  const stripe =
    new Stripe(stripeSecretKey);

  const supabaseAdmin =
    createClient(
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

  const signature =
    request.headers.get(
      "stripe-signature",
    );

  if (!signature) {
    return NextResponse.json(
      {
        error:
          "Stripe signature is missing.",
      },
      {
        status: 400,
      },
    );
  }

  let event: Stripe.Event;

  try {
    /*
     * Stripe exige le corps brut afin de
     * vérifier correctement la signature.
     */
    const rawBody =
      await request.text();

    event =
      stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
  } catch (error) {
    console.error(
      "Stripe webhook signature error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Invalid Stripe webhook signature.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const isSuccessfulCheckout =
      event.type ===
        "checkout.session.completed" ||
      event.type ===
        "checkout.session.async_payment_succeeded";

    if (!isSuccessfulCheckout) {
      return NextResponse.json({
        received: true,
        ignored: true,
      });
    }

    const session =
      event.data
        .object as Stripe.Checkout.Session;

    /*
     * La réservation n'est confirmée
     * que lorsque Stripe indique réellement
     * que le paiement est payé.
     */
    if (
      session.payment_status !== "paid"
    ) {
      console.log(
        "Stripe session received but not paid:",
        session.id,
        session.payment_status,
      );

      return NextResponse.json({
        received: true,
        ignored: true,
        reason:
          "Payment is not paid yet.",
      });
    }

    const bookingId =
      session.metadata?.bookingId?.trim();

    const therapist =
      session.metadata?.therapist?.trim() ||
      "Specialist";

    const slot =
      session.metadata?.slot?.trim() ||
      "";

    const language: Language =
      session.metadata?.language === "ar"
        ? "ar"
        : session.metadata?.language ===
            "fr"
          ? "fr"
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
        {
          error:
            "Booking identifier is missing.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * On récupère aussi le prix officiel
     * enregistré dans la réservation.
     */
    const {
      data: existingBooking,
      error: bookingReadError,
    } = await supabaseAdmin
      .from("bookings")
      .select(
        `
          id,
          status,
          price
        `,
      )
      .eq("id", bookingId)
      .maybeSingle<BookingRecord>();

    if (bookingReadError) {
      throw bookingReadError;
    }

    if (!existingBooking) {
      console.error(
        "Booking not found:",
        bookingId,
      );

      return NextResponse.json(
        {
          error:
            "Booking not found.",
        },
        {
          status: 404,
        },
      );
    }

    const paymentIntentId =
      typeof session.payment_intent ===
      "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    /*
     * PaymentIntent est préféré comme
     * référence de transaction.
     */
    const transactionId =
      paymentIntentId ||
      session.id;

    const amount =
      typeof session.amount_total ===
      "number"
        ? session.amount_total / 100
        : 0;

    const currency =
      session.currency?.toUpperCase() ||
      "USD";

    /*
     * Sécurité :
     * le montant Stripe doit correspondre
     * au prix officiel de la réservation.
     */
    const bookingPrice =
      Number(existingBooking.price);

    if (
      !Number.isFinite(bookingPrice) ||
      bookingPrice <= 0
    ) {
      console.error(
        "Invalid booking price:",
        bookingId,
        existingBooking.price,
      );

      return NextResponse.json(
        {
          error:
            "Booking price is invalid.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      Math.abs(
        amount - bookingPrice,
      ) > 0.001
    ) {
      console.error(
        "Stripe payment amount mismatch:",
        {
          bookingId,
          expectedAmount:
            bookingPrice,
          paidAmount: amount,
          sessionId:
            session.id,
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
     * Paiement enregistré de manière
     * idempotente.
     *
     * Si Stripe renvoie le même webhook,
     * transaction_id évite la création
     * d'un deuxième paiement.
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
            transaction_id:
              transactionId,
          },
          {
            onConflict:
              "transaction_id",
            ignoreDuplicates: false,
          },
        );

    if (paymentError) {
      throw paymentError;
    }

    const bookingWasAlreadyPaid =
      existingBooking.status ===
      "paid";

    /*
     * On renseigne également directement
     * la réservation.
     *
     * Ces colonnes seront utilisées plus tard
     * de la même façon pour Stripe, Whish et OMT.
     */
    const { error: updateError } =
      await supabaseAdmin
        .from("bookings")
        .update({
          status: "paid",

          payment_provider:
            "stripe",

          payment_method:
            "card",

          payment_transaction_id:
            transactionId,
        })
        .eq("id", bookingId);

    if (updateError) {
      throw updateError;
    }

    /*
     * L'e-mail est envoyé uniquement
     * lors du premier passage à paid.
     *
     * Un webhook Stripe répété
     * ne renverra donc pas l'e-mail.
     */
    if (
      !bookingWasAlreadyPaid &&
      customerEmail
    ) {
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL?.replace(
          /\/$/,
          "",
        ) ||
        new URL(request.url).origin;

      try {
        const emailResponse =
          await fetch(
            `${siteUrl}/api/send-booking-email`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                email:
                  customerEmail,

                therapist,

                slot,

                price: amount,

                language,

                bookingId,

                paymentProvider:
                  "stripe",

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
         * Un problème d'e-mail
         * ne doit jamais annuler
         * un paiement déjà réussi.
         */
        console.error(
          "Booking confirmation email request failed:",
          emailError,
        );
      }
    }

    return NextResponse.json({
      received: true,

      bookingId,

      paymentStatus:
        "paid",

      paymentProvider:
        "stripe",

      paymentMethod:
        "card",

      transactionId,

      amount,

      currency,

      alreadyProcessed:
        bookingWasAlreadyPaid,
    });
  } catch (error) {
    console.error(
      "Stripe webhook processing error:",
      error,
    );

    /*
     * 500 indique à Stripe qu'il doit
     * réessayer ultérieurement le webhook.
     */
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to process Stripe webhook.",
      },
      {
        status: 500,
      },
    );
  }
}
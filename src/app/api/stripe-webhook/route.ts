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
  const supabaseServiceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecretKey) {
    console.error("STRIPE_SECRET_KEY is missing.");

    return NextResponse.json(
      { error: "Stripe configuration is missing." },
      { status: 500 },
    );
  }

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is missing.");

    return NextResponse.json(
      { error: "Stripe webhook configuration is missing." },
      { status: 500 },
    );
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("Supabase server configuration is missing.");

    return NextResponse.json(
      { error: "Database configuration is missing." },
      { status: 500 },
    );
  }

  const stripe = new Stripe(stripeSecretKey);

  const supabaseAdmin = createClient(
    supabaseUrl,
    supabaseServiceRoleKey,
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
     * Stripe doit recevoir le corps brut de la requête.
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
    if (
      event.type === "checkout.session.completed" ||
      event.type ===
        "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;

      const bookingId = session.metadata?.bookingId?.trim();
      const therapist = session.metadata?.therapist?.trim();
      const slot = session.metadata?.slot?.trim();
      const language =
        session.metadata?.language === "ar" ? "ar" : "en";

      const customerEmail =
        session.customer_details?.email ||
        session.customer_email ||
        session.metadata?.email ||
        "";

      if (!bookingId) {
        console.error(
          "Stripe session does not contain bookingId metadata.",
          session.id,
        );

        return NextResponse.json(
          { error: "Booking identifier is missing." },
          { status: 400 },
        );
      }

      /*
       * Vérifier l'état avant la mise à jour évite d'envoyer
       * plusieurs emails si Stripe renvoie le même événement.
       */
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

      if (existingBooking.status !== "paid") {
        const { error: updateError } = await supabaseAdmin
          .from("bookings")
          .update({
            status: "paid",
          })
          .eq("id", bookingId);

        if (updateError) {
          throw updateError;
        }

        /*
         * L'email est envoyé seulement après confirmation Stripe.
         */
        if (customerEmail) {
          const siteUrl =
            process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
            new URL(request.url).origin;

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
                  therapist: therapist || "Therapist",
                  slot: slot || "",
                  price:
                    typeof session.amount_total === "number"
                      ? session.amount_total / 100
                      : 0,
                  language,
                  bookingId,
                  paymentProvider: "stripe",
                }),
              },
            );

            if (!emailResponse.ok) {
              const emailError = await emailResponse.text();

              console.error(
                "Booking confirmation email failed:",
                emailResponse.status,
                emailError,
              );
            }
          } catch (emailError) {
            /*
             * On ne retourne pas une erreur Stripe ici :
             * le paiement est déjà confirmé et la réservation est payée.
             */
            console.error(
              "Booking email request failed:",
              emailError,
            );
          }
        }
      }
    }

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error("Stripe webhook processing error:", error);

    /*
     * Le statut 500 indique à Stripe qu'il peut réessayer l'événement.
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
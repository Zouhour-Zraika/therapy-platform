import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

type Language = "en" | "fr" | "ar";

type CheckoutRequest = {
  bookingId?: string;
  language?: Language;
};

type BookingRecord = {
  id: string;
  status: string;
  price: number;
  therapist_name: string | null;
  slot_day: string | null;
  slot_time: string | null;
  scheduled_start: string | null;
  patient_email: string | null;
};

export async function POST(request: Request) {
  try {
    const stripeSecretKey =
      process.env.STRIPE_SECRET_KEY;

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

    if (
      !supabaseUrl ||
      !supabaseServerKey
    ) {
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

    const body =
      (await request.json()) as CheckoutRequest;

    const bookingId =
      body.bookingId?.trim();

    const language: Language =
      body.language === "ar"
        ? "ar"
        : body.language === "fr"
          ? "fr"
          : "en";

    if (!bookingId) {
      const errorMessage =
        language === "ar"
          ? "معرّف الحجز غير موجود."
          : language === "fr"
            ? "L’identifiant de réservation est manquant."
            : "The booking identifier is missing.";

      return NextResponse.json(
        {
          error: errorMessage,
        },
        {
          status: 400,
        },
      );
    }

    /*
     * IMPORTANT :
     * On récupère désormais toutes les informations
     * officielles directement depuis Supabase.
     *
     * Le navigateur ne décide plus du prix.
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
          patient_email
        `,
      )
      .eq("id", bookingId)
      .maybeSingle<BookingRecord>();

    if (bookingError) {
      throw bookingError;
    }

    if (!booking) {
      const errorMessage =
        language === "ar"
          ? "لم يتم العثور على الحجز."
          : language === "fr"
            ? "La réservation est introuvable."
            : "The booking was not found.";

      return NextResponse.json(
        {
          error: errorMessage,
        },
        {
          status: 404,
        },
      );
    }

    /*
     * Une réservation déjà payée ne doit pas
     * générer une nouvelle Checkout Session.
     */
    if (booking.status === "paid") {
      const errorMessage =
        language === "ar"
          ? "تم دفع هذه الجلسة بالفعل."
          : language === "fr"
            ? "Cette réservation a déjà été payée."
            : "This booking has already been paid.";

      return NextResponse.json(
        {
          error: errorMessage,
          alreadyPaid: true,
        },
        {
          status: 409,
        },
      );
    }

    const numericPrice =
      Number(booking.price);

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice <= 0
    ) {
      console.error(
        "Invalid booking price:",
        {
          bookingId,
          price: booking.price,
        },
      );

      const errorMessage =
        language === "ar"
          ? "سعر الحجز غير صالح."
          : language === "fr"
            ? "Le prix de la réservation est invalide."
            : "The booking price is invalid.";

      return NextResponse.json(
        {
          error: errorMessage,
        },
        {
          status: 400,
        },
      );
    }

    const therapist =
      booking.therapist_name?.trim() ||
      (language === "ar"
        ? "المختص"
        : language === "fr"
          ? "Spécialiste"
          : "Specialist");

    const email =
      booking.patient_email?.trim();

    if (!email) {
      const errorMessage =
        language === "ar"
          ? "البريد الإلكتروني للمريض غير موجود."
          : language === "fr"
            ? "L’adresse e-mail du patient est manquante."
            : "The patient email address is missing.";

      return NextResponse.json(
        {
          error: errorMessage,
        },
        {
          status: 400,
        },
      );
    }

    /*
     * On construit la description du rendez-vous
     * depuis les informations enregistrées
     * dans bookings.
     */
    let slot = "";

    if (booking.scheduled_start) {
      try {
        slot =
          new Intl.DateTimeFormat(
            language === "fr"
              ? "fr-FR"
              : language === "ar"
                ? "ar-LB"
                : "en-GB",
            {
              dateStyle: "full",
              timeStyle: "short",
              timeZone:
                "Asia/Beirut",
            },
          ).format(
            new Date(
              booking.scheduled_start,
            ),
          );
      } catch {
        slot =
          booking.scheduled_start;
      }
    } else {
      slot = [
        booking.slot_day,
        booking.slot_time,
      ]
        .filter(Boolean)
        .join(" ");
    }

    if (!slot) {
      slot =
        language === "ar"
          ? "جلسة محجوزة"
          : language === "fr"
            ? "Séance réservée"
            : "Booked session";
    }

    const requestOrigin =
      new URL(request.url).origin;

    const publicSiteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(
        /\/$/,
        "",
      ) || requestOrigin;

    const successUrl =
      `${publicSiteUrl}/success` +
      `?bookingId=${encodeURIComponent(
        bookingId,
      )}` +
      `&session_id={CHECKOUT_SESSION_ID}`;

    const cancelUrl =
      `${publicSiteUrl}/payment` +
      `?bookingId=${encodeURIComponent(
        bookingId,
      )}` +
      `&therapist=${encodeURIComponent(
        therapist,
      )}` +
      `&price=${encodeURIComponent(
        String(numericPrice),
      )}` +
      `&slot=${encodeURIComponent(
        slot,
      )}`;

    const productName =
      language === "ar"
        ? `جلسة مع ${therapist}`
        : language === "fr"
          ? `Séance avec ${therapist}`
          : `Session with ${therapist}`;

    const stripeLocale =
      language === "fr"
        ? "fr"
        : language === "en"
          ? "en"
          : "auto";

    console.log(
      "STRIPE CHECKOUT DEBUG:",
      {
        requestOrigin,
        publicSiteUrl,
        bookingId,
        databasePrice:
          numericPrice,
        therapist,
        email,
        slot,
        successUrl,
      },
    );

    /*
     * Le montant envoyé à Stripe provient
     * maintenant exclusivement de Supabase.
     */
    const session =
      await stripe.checkout.sessions.create({
        mode: "payment",

        customer_email: email,

        locale: stripeLocale,

        payment_method_types: [
          "card",
        ],

        line_items: [
          {
            quantity: 1,

            price_data: {
              currency: "usd",

              unit_amount:
                Math.round(
                  numericPrice * 100,
                ),

              product_data: {
                name: productName,
                description: slot,
              },
            },
          },
        ],

        metadata: {
          bookingId,
          therapist,
          slot,
          language,
          email,
          paymentProvider:
            "stripe",
        },

        payment_intent_data: {
          metadata: {
            bookingId,
            paymentProvider:
              "stripe",
          },
        },

        success_url: successUrl,

        cancel_url: cancelUrl,
      });

    console.log(
      "STRIPE SESSION CREATED:",
      {
        id: session.id,
        bookingId,
        amount:
          numericPrice,
        success_url:
          session.success_url,
        url: session.url,
      },
    );

    if (!session.url) {
      return NextResponse.json(
        {
          error:
            "Stripe did not return a checkout URL.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      provider: "stripe",
      sessionId: session.id,
      bookingId,
      amount: numericPrice,
      currency: "USD",
      url: session.url,
    });
  } catch (error) {
    console.error(
      "Stripe checkout session error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create the Stripe checkout session.",
      },
      {
        status: 500,
      },
    );
  }
}
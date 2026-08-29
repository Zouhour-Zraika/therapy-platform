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
  patient_id: string | null;
  created_at: string;
};

const PAYMENT_HOLD_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const stripeSecretKey =
      process.env.STRIPE_SECRET_KEY;

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
      !supabaseAnonKey ||
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

    const authHeader =
      request.headers.get("authorization");

    if (
      !authHeader ||
      !authHeader
        .toLowerCase()
        .startsWith("bearer ")
    ) {
      return NextResponse.json(
        {
          error:
            "Authentication is required.",
        },
        {
          status: 401,
        },
      );
    }

    const accessToken =
      authHeader.slice(7).trim();

    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            "Authentication is required.",
        },
        {
          status: 401,
        },
      );
    }

    const supabaseAuth =
      createClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false,
          },
          global: {
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
            },
          },
        },
      );

    const {
      data: {
        user,
      },
      error:
        userError,
    } =
      await supabaseAuth.auth.getUser(
        accessToken,
      );

    if (
      userError ||
      !user
    ) {
      return NextResponse.json(
        {
          error:
            "Authentication is required.",
        },
        {
          status: 401,
        },
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

    const {
      data: booking,
      error: bookingError,
    } =
      await supabaseAdmin
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
            patient_email,
            patient_id,
            created_at
          `,
        )
        .eq(
          "id",
          bookingId,
        )
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
     * SECURITY:
     * this booking must belong to the currently authenticated patient.
     * Because this route uses the service-role client below, ownership
     * must be verified explicitly here.
     */
    if (
      !booking.patient_id ||
      booking.patient_id !== user.id
    ) {
      const errorMessage =
        language === "ar"
          ? "لا يمكنك الدفع مقابل هذا الحجز."
          : language === "fr"
            ? "Vous ne pouvez pas payer cette réservation."
            : "You cannot pay for this booking.";

      return NextResponse.json(
        {
          error: errorMessage,
        },
        {
          status: 403,
        },
      );
    }

    /*
     * Only pending bookings can create a checkout session.
     */
    if (
      booking.status !== "pending"
    ) {
      if (
        booking.status === "paid"
      ) {
        const errorMessage =
          language === "ar"
            ? "تم دفع هذه الجلسة بالفعل."
            : language === "fr"
              ? "Cette réservation a déjà été payée."
              : "This booking has already been paid.";

        return NextResponse.json(
          {
            error:
              errorMessage,
            alreadyPaid: true,
          },
          {
            status: 409,
          },
        );
      }

      const errorMessage =
        language === "ar"
          ? "لم يعد هذا الحجز متاحاً للدفع."
          : language === "fr"
            ? "Cette réservation n’est plus disponible pour le paiement."
            : "This booking is no longer available for payment.";

      return NextResponse.json(
        {
          error: errorMessage,
        },
        {
          status: 409,
        },
      );
    }

    /*
     * Enforce the 10-minute payment hold on the server.
     */
    const createdAtMs =
      new Date(
        booking.created_at,
      ).getTime();

    if (
      Number.isNaN(
        createdAtMs,
      )
    ) {
      console.error(
        "Invalid booking created_at:",
        {
          bookingId,
          created_at:
            booking.created_at,
        },
      );

      return NextResponse.json(
        {
          error:
            language === "ar"
              ? "تعذر التحقق من صلاحية الحجز."
              : language === "fr"
                ? "Impossible de vérifier la validité de la réservation."
                : "Unable to verify the booking validity.",
        },
        {
          status: 500,
        },
      );
    }

    const expiresAtMs =
      createdAtMs +
      PAYMENT_HOLD_MS;

    if (
      Date.now() >=
      expiresAtMs
    ) {
      const errorMessage =
        language === "ar"
          ? "انتهت مهلة الدفع لهذه الجلسة. يرجى اختيار موعد جديد."
          : language === "fr"
            ? "Le délai de paiement de 10 minutes a expiré. Veuillez choisir un nouveau créneau."
            : "The 10-minute payment window has expired. Please choose a new time slot.";

      return NextResponse.json(
        {
          error: errorMessage,
          expired: true,
        },
        {
          status: 410,
        },
      );
    }

    const numericPrice =
      Number(
        booking.price,
      );

    if (
      !Number.isFinite(
        numericPrice,
      ) ||
      numericPrice <= 0
    ) {
      console.error(
        "Invalid booking price:",
        {
          bookingId,
          price:
            booking.price,
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
          error:
            errorMessage,
        },
        {
          status: 400,
        },
      );
    }

    const therapist =
      booking.therapist_name?.trim() ||
      (
        language === "ar"
          ? "المختص"
          : language === "fr"
            ? "Spécialiste"
            : "Specialist"
      );

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
          error:
            errorMessage,
        },
        {
          status: 400,
        },
      );
    }

    let slot = "";

    if (
      booking.scheduled_start
    ) {
      try {
        slot =
          new Intl.DateTimeFormat(
            language === "fr"
              ? "fr-FR"
              : language === "ar"
                ? "ar-LB"
                : "en-GB",
            {
              dateStyle:
                "full",
              timeStyle:
                "short",
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
      new URL(
        request.url,
      ).origin;

    const publicSiteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(
        /\/$/,
        "",
      ) ||
      requestOrigin;

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
        String(
          numericPrice,
        ),
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

    const session =
      await stripe.checkout.sessions.create(
        {
          mode:
            "payment",

          customer_email:
            email,

          locale:
            stripeLocale,

          payment_method_types: [
            "card",
          ],

          line_items: [
            {
              quantity: 1,

              price_data: {
                currency:
                  "usd",

                unit_amount:
                  Math.round(
                    numericPrice *
                      100,
                  ),

                product_data: {
                  name:
                    productName,

                  description:
                    slot,
                },
              },
            },
          ],

          metadata: {
            bookingId,
            patientId:
              user.id,
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
              patientId:
                user.id,
              paymentProvider:
                "stripe",
            },
          },

          success_url:
            successUrl,

          cancel_url:
            cancelUrl,
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
      provider:
        "stripe",
      sessionId:
        session.id,
      bookingId,
      amount:
        numericPrice,
      currency:
        "USD",
      url:
        session.url,
      expiresAt:
        new Date(
          expiresAtMs,
        ).toISOString(),
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

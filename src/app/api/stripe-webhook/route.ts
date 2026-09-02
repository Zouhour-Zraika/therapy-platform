import {
  createClient,
} from "@supabase/supabase-js";

import {
  NextResponse,
} from "next/server";

import Stripe from "stripe";

export const runtime =
  "nodejs";

type Language =
  | "en"
  | "fr"
  | "ar";

type BookingRecord = {
  id: string;
  status: string;

  price: number;

  patient_id:
    | string
    | null;

  patient_email:
    | string
    | null;

  therapist_id:
    | string
    | null;

  therapist_name:
    | string
    | null;

  slot_id:
    | string
    | null;

  slot_day:
    | string
    | null;

  slot_time:
    | string
    | null;

  scheduled_start:
    | string
    | null;

  scheduled_end:
    | string
    | null;

  payment_provider:
    | string
    | null;

  payment_method:
    | string
    | null;

  payment_transaction_id:
    | string
    | null;
};

type TherapistAssignmentInfo = {
  id: string;
  care_domain:
    | string
    | null;
};

type ActiveAssignment = {
  id: string;
  therapist_id: string;
  care_domain: string;
  status: string;
};

export async function POST(
  request: Request,
) {
  const stripeSecretKey =
    process.env
      .STRIPE_SECRET_KEY;

  const webhookSecret =
    process.env
      .STRIPE_WEBHOOK_SECRET;

  const supabaseUrl =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL;

  const supabaseServerKey =
    process.env
      .SUPABASE_SECRET_KEY ||
    process.env
      .SUPABASE_SERVICE_ROLE_KEY;

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
    new Stripe(
      stripeSecretKey,
    );

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
   * =========================================================
   * Vérification de la signature Stripe
   * =========================================================
   */

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

  let event:
    Stripe.Event;

  try {
    /*
     * IMPORTANT :
     * Stripe exige le corps brut.
     *
     * Ne jamais remplacer
     * request.text()
     * par request.json().
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
    /*
     * =======================================================
     * Nous traitons uniquement
     * les paiements Checkout réussis.
     * =======================================================
     */

    const isSuccessfulCheckout =
      event.type ===
        "checkout.session.completed" ||
      event.type ===
        "checkout.session.async_payment_succeeded";

    if (
      !isSuccessfulCheckout
    ) {
      return NextResponse.json({
        received: true,
        ignored: true,
      });
    }

    const session =
      event.data
        .object as Stripe.Checkout.Session;

    /*
     * La réservation ne devient payée
     * que si Stripe indique réellement "paid".
     */
    if (
      session.payment_status !==
      "paid"
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

    /*
     * =======================================================
     * Identifier la réservation
     * =======================================================
     */

    const bookingId =
      session.metadata
        ?.bookingId
        ?.trim();

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

    const language:
      Language =
      session.metadata
        ?.language ===
      "ar"
        ? "ar"
        : session.metadata
              ?.language ===
            "fr"
          ? "fr"
          : "en";

    /*
     * =======================================================
     * Récupérer LA réservation depuis Supabase.
     *
     * Supabase devient la source de vérité :
     * - patient
     * - prix
     * - thérapeute
     * - horaire
     * - e-mail patient
     * =======================================================
     */

    const {
      data:
        existingBooking,
      error:
        bookingReadError,
    } =
      await supabaseAdmin
        .from("bookings")
        .select(
          `
            id,
            status,
            price,
            patient_id,
            patient_email,
            therapist_id,
            therapist_name,
            slot_id,
            slot_day,
            slot_time,
            scheduled_start,
            scheduled_end,
            payment_provider,
            payment_method,
            payment_transaction_id
          `,
        )
        .eq(
          "id",
          bookingId,
        )
        .maybeSingle<BookingRecord>();

    if (
      bookingReadError
    ) {
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

    /*
     * =======================================================
     * Informations Stripe
     * =======================================================
     */

    const paymentIntentId =
      typeof session
        .payment_intent ===
      "string"
        ? session.payment_intent
        : session
            .payment_intent
            ?.id;

    /*
     * Pour les remboursements futurs,
     * le PaymentIntent est particulièrement utile.
     */
    const transactionId =
      paymentIntentId ||
      session.id;

    const amount =
      typeof session
        .amount_total ===
      "number"
        ? session.amount_total /
          100
        : 0;

    const currency =
      session.currency
        ?.toUpperCase() ||
      "USD";

    /*
     * =======================================================
     * Vérification du prix
     * =======================================================
     */

    const bookingPrice =
      Number(
        existingBooking.price,
      );

    if (
      !Number.isFinite(
        bookingPrice,
      ) ||
      bookingPrice <= 0
    ) {
      console.error(
        "Invalid booking price:",
        {
          bookingId,
          bookingPrice:
            existingBooking.price,
        },
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
        amount -
          bookingPrice,
      ) > 0.001
    ) {
      console.error(
        "Stripe payment amount mismatch:",
        {
          bookingId,

          expectedAmount:
            bookingPrice,

          paidAmount:
            amount,

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
     * =======================================================
     * Paiement idempotent
     * =======================================================
     */

    const {
      error:
        paymentError,
    } =
      await supabaseAdmin
        .from("payments")
        .upsert(
          {
            booking_id:
              bookingId,

            provider:
              "stripe",

            amount,

            currency,

            status:
              "paid",

            transaction_id:
              transactionId,
          },
          {
            onConflict:
              "transaction_id",

            ignoreDuplicates:
              false,
          },
        );

    if (paymentError) {
      throw paymentError;
    }

    /*
     * =======================================================
     * Mettre la réservation à PAID
     * =======================================================
     */

    const bookingWasAlreadyPaid =
      existingBooking.status ===
      "paid";

    const {
      data:
        updatedBooking,
      error:
        bookingUpdateError,
    } =
      await supabaseAdmin
        .from("bookings")
        .update({
          status:
            "paid",

          payment_provider:
            "stripe",

          payment_method:
            "card",

          payment_transaction_id:
            transactionId,
        })
        .eq(
          "id",
          bookingId,
        )
        .select(
          `
            id,
            status,
            price,
            patient_id,
            patient_email,
            therapist_id,
            therapist_name,
            slot_id,
            slot_day,
            slot_time,
            scheduled_start,
            scheduled_end,
            payment_provider,
            payment_method,
            payment_transaction_id
          `,
        )
        .maybeSingle<BookingRecord>();

    if (
      bookingUpdateError
    ) {
      throw bookingUpdateError;
    }

    if (!updatedBooking) {
      throw new Error(
        "Booking was not updated after successful payment.",
      );
    }

    if (
      updatedBooking.status !==
      "paid"
    ) {
      throw new Error(
        "Booking was not marked as paid.",
      );
    }

    /*
     * =======================================================
     * Créer / conserver le suivi clinique actif.
     *
     * Règle :
     * un patient ne peut avoir qu'un spécialiste actif
     * par care_domain.
     *
     * Cette opération est idempotente :
     * - si l'assignment existe déjà avec ce spécialiste,
     *   on ne crée rien ;
     * - sinon, on crée l'assignment actif.
     *
     * La protection principale contre le changement
     * de spécialiste se trouve aussi dans
     * /api/booking/hold.
     * =======================================================
     */

    if (
      updatedBooking.patient_id &&
      updatedBooking.therapist_id
    ) {
      const {
        data:
          therapistInfo,
        error:
          therapistInfoError,
      } =
        await supabaseAdmin
          .from("therapists")
          .select(
            `
              id,
              care_domain
            `,
          )
          .eq(
            "id",
            updatedBooking
              .therapist_id,
          )
          .maybeSingle<TherapistAssignmentInfo>();

      if (
        therapistInfoError
      ) {
        throw therapistInfoError;
      }

      const careDomain =
        therapistInfo
          ?.care_domain
          ?.trim() ||
        null;

      if (careDomain) {
        const {
          data:
            activeAssignment,
          error:
            assignmentReadError,
        } =
          await supabaseAdmin
            .from(
              "patient_therapist_assignments",
            )
            .select(
              `
                id,
                therapist_id,
                care_domain,
                status
              `,
            )
            .eq(
              "patient_id",
              updatedBooking
                .patient_id,
            )
            .eq(
              "care_domain",
              careDomain,
            )
            .eq(
              "status",
              "active",
            )
            .limit(1)
            .maybeSingle<ActiveAssignment>();

        if (
          assignmentReadError
        ) {
          throw assignmentReadError;
        }

        if (
          !activeAssignment
        ) {
          const {
            error:
              assignmentInsertError,
          } =
            await supabaseAdmin
              .from(
                "patient_therapist_assignments",
              )
              .insert({
                patient_id:
                  updatedBooking
                    .patient_id,

                therapist_id:
                  updatedBooking
                    .therapist_id,

                care_domain:
                  careDomain,

                status:
                  "active",
              });

          if (
            assignmentInsertError
          ) {
            /*
             * Un webhook Stripe peut être reçu plusieurs fois
             * ou deux traitements peuvent se croiser.
             *
             * On relit alors l'assignment actif avant de
             * considérer cela comme une vraie erreur.
             */
            const {
              data:
                assignmentAfterInsert,
              error:
                assignmentAfterInsertError,
            } =
              await supabaseAdmin
                .from(
                  "patient_therapist_assignments",
                )
                .select(
                  `
                    id,
                    therapist_id,
                    care_domain,
                    status
                  `,
                )
                .eq(
                  "patient_id",
                  updatedBooking
                    .patient_id,
                )
                .eq(
                  "care_domain",
                  careDomain,
                )
                .eq(
                  "status",
                  "active",
                )
                .limit(1)
                .maybeSingle<ActiveAssignment>();

            if (
              assignmentAfterInsertError ||
              !assignmentAfterInsert
            ) {
              throw assignmentInsertError;
            }

            if (
              assignmentAfterInsert
                .therapist_id !==
              updatedBooking
                .therapist_id
            ) {
              console.error(
                "CLINICAL ASSIGNMENT CONFLICT AFTER PAYMENT:",
                {
                  bookingId,

                  patientId:
                    updatedBooking
                      .patient_id,

                  paidTherapistId:
                    updatedBooking
                      .therapist_id,

                  activeTherapistId:
                    assignmentAfterInsert
                      .therapist_id,

                  careDomain,
                },
              );
            }
          }
        } else if (
          activeAssignment
            .therapist_id !==
          updatedBooking
            .therapist_id
        ) {
          /*
           * Ce cas ne devrait normalement jamais arriver,
           * car /api/booking/hold bloque le changement avant
           * Stripe. On logue fortement le conflit sans
           * annuler rétroactivement un paiement déjà réussi.
           */
          console.error(
            "CLINICAL ASSIGNMENT CONFLICT AFTER PAYMENT:",
            {
              bookingId,

              patientId:
                updatedBooking
                  .patient_id,

              paidTherapistId:
                updatedBooking
                  .therapist_id,

              activeTherapistId:
                activeAssignment
                  .therapist_id,

              careDomain,
            },
          );
        }
      } else {
        /*
         * Tant que care_domain n'est pas défini pour ce
         * spécialiste, aucun verrou de domaine n'est créé.
         */
        console.warn(
          "Therapist care_domain is missing; clinical assignment was not created:",
          {
            bookingId,

            therapistId:
              updatedBooking
                .therapist_id,
          },
        );
      }
    } else {
      console.warn(
        "Booking patient_id or therapist_id is missing; clinical assignment was not created:",
        {
          bookingId,

          patientId:
            updatedBooking
              .patient_id,

          therapistId:
            updatedBooking
              .therapist_id,
        },
      );
    }

    /*
     * =======================================================
     * Construire l'horaire pour l'e-mail
     * depuis les données Supabase.
     * =======================================================
     */

    const therapistName =
      updatedBooking
        .therapist_name ||
      "Specialist";

    const slotParts: string[] =
      [];

    if (
      updatedBooking
        .slot_day
    ) {
      slotParts.push(
        updatedBooking
          .slot_day,
      );
    }

    if (
      updatedBooking
        .slot_time
    ) {
      slotParts.push(
        updatedBooking
          .slot_time,
      );
    }

    const slotDescription =
      slotParts
        .join(" ")
        .trim();

    /*
     * L'e-mail enregistré dans bookings
     * est prioritaire.
     *
     * Stripe sert uniquement de fallback.
     */
    const customerEmail =
      updatedBooking
        .patient_email
        ?.trim() ||
      session
        .customer_details
        ?.email ||
      session.customer_email ||
      session.metadata
        ?.email ||
      "";

    /*
     * =======================================================
     * Envoyer l'e-mail une seule fois
     * =======================================================
     */

    if (
      !bookingWasAlreadyPaid &&
      customerEmail
    ) {
      const siteUrl =
        process.env
          .NEXT_PUBLIC_SITE_URL
          ?.replace(
            /\/$/,
            "",
          ) ||
        new URL(
          request.url,
        ).origin;

      try {
        const emailResponse =
          await fetch(
            `${siteUrl}/api/send-booking-email`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  email:
                    customerEmail,

                  therapist:
                    therapistName,

                  slot:
                    slotDescription,

                  price:
                    amount,

                  language,

                  bookingId,

                  paymentProvider:
                    "stripe",

                  transactionId,
                }),
            },
          );

        if (
          !emailResponse.ok
        ) {
          console.error(
            "Booking confirmation email failed:",
            emailResponse.status,
            await emailResponse.text(),
          );
        }
      } catch (
        emailError
      ) {
        /*
         * Très important :
         * un échec d'e-mail
         * ne remet jamais en cause
         * un paiement réussi.
         */
        console.error(
          "Booking confirmation email request failed:",
          emailError,
        );
      }
    }

    /*
     * =======================================================
     * Log serveur utile pour administration/debug.
     * =======================================================
     */

    console.log(
      "STRIPE PAYMENT CONFIRMED:",
      {
        bookingId,

        patientId:
          updatedBooking
            .patient_id,

        therapistId:
          updatedBooking
            .therapist_id,

        transactionId,

        amount,

        currency,

        alreadyProcessed:
          bookingWasAlreadyPaid,
      },
    );

    return NextResponse.json({
      received: true,

      bookingId,

      paymentStatus:
        "paid",

      bookingStatus:
        updatedBooking.status,

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
     * HTTP 500 demande à Stripe
     * de réessayer le webhook.
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
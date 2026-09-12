import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const runtime = "nodejs";

function createSupabaseAdmin() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY;

  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    throw new Error(
      "Supabase server configuration is missing.",
    );
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    },
  );
}

function isAuthorized(
  request: Request,
) {
  const cronSecret =
    process.env.AAN_CRON_SECRET;

  if (!cronSecret) {
    return false;
  }

  const authorization =
    request.headers.get(
      "authorization",
    );

  return (
    authorization ===
    `Bearer ${cronSecret}`
  );
}

export async function GET(
  request: Request,
) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        error: "Unauthorized.",
      },
      {
        status: 401,
      },
    );
  }

  const stripeSecretKey =
    process.env.STRIPE_SECRET_KEY;

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

  const supabaseAdmin =
    createSupabaseAdmin();

  const stripe =
    new Stripe(
      stripeSecretKey,
    );

  const nowIso =
    new Date().toISOString();

  const {
    data:
      expiredBookings,
    error:
      expiredLookupError,
  } = await supabaseAdmin
    .from("bookings")
    .select(
      `
        id,
        slot_id,
        therapist_id,
        status,
        hold_expires_at,
        payment_transaction_id
      `,
    )
    .eq(
      "status",
      "pending",
    )
    .not(
      "hold_expires_at",
      "is",
      null,
    )
    .lt(
      "hold_expires_at",
      nowIso,
    )
    .limit(100);

  if (expiredLookupError) {
    console.error(
      "Expired hold cron lookup error:",
      expiredLookupError,
    );

    return NextResponse.json(
      {
        error:
          "Unable to load expired holds.",
      },
      {
        status: 500,
      },
    );
  }

  let checkoutExpired = 0;
  let bookingsDeleted = 0;
  let slotsReleased = 0;
  let skippedPaidOrComplete = 0;
  let skippedStripeErrors = 0;

  for (
    const booking
    of expiredBookings || []
  ) {
    const checkoutSessionId =
      typeof booking
        .payment_transaction_id ===
        "string" &&
      booking
        .payment_transaction_id
        .startsWith("cs_")
        ? booking
            .payment_transaction_id
        : null;

    /*
     * Si une Checkout Session Stripe est attachée,
     * on la ferme AVANT de supprimer le booking.
     *
     * Tant que Stripe n'a pas confirmé qu'elle est fermée
     * ou déjà expirée, on ne supprime rien.
     */
    if (checkoutSessionId) {
      try {
        const checkoutSession =
          await stripe.checkout.sessions.retrieve(
            checkoutSessionId,
          );

        if (
          checkoutSession.payment_status ===
            "paid" ||
          checkoutSession.status ===
            "complete"
        ) {
          /*
           * Cas de course :
           * le paiement a déjà été terminé.
           * On laisse le webhook Stripe gérer le paiement
           * ou son remboursement tardif.
           */
          skippedPaidOrComplete +=
            1;

          console.warn(
            "Expired hold cron found completed Checkout; leaving booking for webhook:",
            {
              bookingId:
                booking.id,
              sessionId:
                checkoutSessionId,
              checkoutStatus:
                checkoutSession.status,
              paymentStatus:
                checkoutSession.payment_status,
            },
          );

          continue;
        }

        if (
          checkoutSession.status ===
          "open"
        ) {
          await stripe.checkout.sessions.expire(
            checkoutSessionId,
          );

          checkoutExpired += 1;
        }

        /*
         * "expired" est également sûr :
         * la page Stripe n'est plus payable.
         */
        if (
          checkoutSession.status !==
            "expired" &&
          checkoutSession.status !==
            "open"
        ) {
          console.warn(
            "Expired hold cron encountered unexpected Checkout status:",
            {
              bookingId:
                booking.id,
              sessionId:
                checkoutSessionId,
              checkoutStatus:
                checkoutSession.status,
            },
          );

          continue;
        }
      } catch (
        stripeError
      ) {
        skippedStripeErrors += 1;

        /*
         * Sécurité absolue :
         * si Stripe ne répond pas, on NE supprime PAS le booking
         * et on NE libère PAS le slot.
         *
         * Le prochain passage du cron réessaiera.
         */
        console.error(
          "Expired hold cron Stripe expiration error:",
          {
            bookingId:
              booking.id,
            sessionId:
              checkoutSessionId,
            error:
              stripeError,
          },
        );

        continue;
      }
    }

    /*
     * Supprimer uniquement si le booking est toujours pending
     * et toujours expiré au moment de l'opération.
     */
    const {
      data:
        deletedBooking,
      error:
        deleteError,
    } = await supabaseAdmin
      .from("bookings")
      .delete()
      .eq(
        "id",
        booking.id,
      )
      .eq(
        "status",
        "pending",
      )
      .lt(
        "hold_expires_at",
        nowIso,
      )
      .select(
        "id, slot_id, therapist_id",
      )
      .maybeSingle<{
        id: string;
        slot_id:
          | string
          | null;
        therapist_id:
          | string
          | null;
      }>();

    if (deleteError) {
      console.error(
        "Expired hold cron delete error:",
        {
          bookingId:
            booking.id,
          error:
            deleteError,
        },
      );

      continue;
    }

    if (!deletedBooking) {
      continue;
    }

    bookingsDeleted += 1;

    if (
      !deletedBooking.slot_id
    ) {
      continue;
    }

    /*
     * Ne jamais libérer un slot déjà repris
     * par une autre réservation pending ou paid.
     */
    const {
      data:
        competingBookings,
      error:
        competingLookupError,
    } = await supabaseAdmin
      .from("bookings")
      .select("id")
      .eq(
        "slot_id",
        deletedBooking.slot_id,
      )
      .in(
        "status",
        [
          "pending",
          "paid",
        ],
      )
      .limit(1);

    if (
      competingLookupError
    ) {
      console.error(
        "Expired hold cron competing booking lookup error:",
        {
          bookingId:
            booking.id,
          slotId:
            deletedBooking.slot_id,
          error:
            competingLookupError,
        },
      );

      continue;
    }

    if (
      competingBookings &&
      competingBookings.length >
        0
    ) {
      continue;
    }

    const {
      error:
        slotReleaseError,
    } = await supabaseAdmin
      .from(
        "availability_slots",
      )
      .update({
        is_booked: false,
      })
      .eq(
        "id",
        deletedBooking.slot_id,
      );

    if (slotReleaseError) {
      console.error(
        "Expired hold cron slot release error:",
        {
          bookingId:
            booking.id,
          slotId:
            deletedBooking.slot_id,
          error:
            slotReleaseError,
        },
      );

      continue;
    }

    slotsReleased += 1;
  }

  return NextResponse.json({
    success: true,
    checked:
      expiredBookings?.length ||
      0,
    checkoutExpired,
    bookingsDeleted,
    slotsReleased,
    skippedPaidOrComplete,
    skippedStripeErrors,
    ranAt:
      new Date().toISOString(),
  });
}

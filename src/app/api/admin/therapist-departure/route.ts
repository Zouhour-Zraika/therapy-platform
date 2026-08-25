import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

type DepartureAction =
  | "start_departure"
  | "maintain"
  | "transfer"
  | "refund"
  | "finalize";

type DepartureRequest = {
  action?: DepartureAction;
  therapistId?: string;
  bookingId?: string;
  newTherapistId?: string;
  newSlotId?: string;
};

type BookingRow = {
  id: string;

  patient_id: string | null;
  patient_email: string | null;

  therapist_id: string | null;
  therapist_name: string | null;

  slot_id: string | null;
  slot_day: string | null;
  slot_time: string | null;

  price: number | null;
  status: string | null;

  scheduled_start: string | null;
  scheduled_end: string | null;

  payment_provider: string | null;
  payment_method: string | null;
  payment_transaction_id: string | null;

  meeting_url: string | null;
  meeting_provider: string | null;
  calendar_event_id: string | null;

  zoom_join_url: string | null;
  zoom_start_url: string | null;

  departure_action: string | null;
  original_therapist_id: string | null;
  refunded_at: string | null;
};

function createSupabaseAdmin() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseServerKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServerKey) {
    throw new Error(
      "Supabase server configuration is missing.",
    );
  }

  return createClient(
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
}

async function verifyAdmin(
  request: Request,
) {
  const supabaseAdmin =
    createSupabaseAdmin();

  const authorization =
    request.headers.get(
      "authorization",
    );

  if (
    !authorization?.startsWith(
      "Bearer ",
    )
  ) {
    return {
      supabaseAdmin,
      user: null,
      error: NextResponse.json(
        {
          error:
            "Authentication required.",
        },
        {
          status: 401,
        },
      ),
    };
  }

  const accessToken =
    authorization
      .slice("Bearer ".length)
      .trim();

  if (!accessToken) {
    return {
      supabaseAdmin,
      user: null,
      error: NextResponse.json(
        {
          error:
            "Authentication required.",
        },
        {
          status: 401,
        },
      ),
    };
  }

  const {
    data: { user },
    error: userError,
  } =
    await supabaseAdmin.auth.getUser(
      accessToken,
    );

  if (userError || !user) {
    return {
      supabaseAdmin,
      user: null,
      error: NextResponse.json(
        {
          error:
            "Invalid or expired session.",
        },
        {
          status: 401,
        },
      ),
    };
  }

  const {
    data: profile,
    error: profileError,
  } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{
      role: string | null;
    }>();

  if (profileError) {
    console.error(
      "Admin verification error:",
      profileError,
    );

    return {
      supabaseAdmin,
      user: null,
      error: NextResponse.json(
        {
          error:
            "Unable to verify administrator access.",
        },
        {
          status: 500,
        },
      ),
    };
  }

  if (
    profile?.role !==
    "admin"
  ) {
    return {
      supabaseAdmin,
      user: null,
      error: NextResponse.json(
        {
          error:
            "Admin access required.",
        },
        {
          status: 403,
        },
      ),
    };
  }

  return {
    supabaseAdmin,
    user,
    error: null,
  };
}

const bookingSelect = `
  id,
  patient_id,
  patient_email,
  therapist_id,
  therapist_name,
  slot_id,
  slot_day,
  slot_time,
  price,
  status,
  scheduled_start,
  scheduled_end,
  payment_provider,
  payment_method,
  payment_transaction_id,
  meeting_url,
  meeting_provider,
  calendar_event_id,
  zoom_join_url,
  zoom_start_url,
  departure_action,
  original_therapist_id,
  refunded_at
`;

export async function GET(
  request: Request,
) {
  try {
    const verification =
      await verifyAdmin(request);

    if (verification.error) {
      return verification.error;
    }

    const {
      supabaseAdmin,
    } = verification;

    const url =
      new URL(request.url);

    const therapistId =
      url.searchParams
        .get("therapistId")
        ?.trim();

    if (!therapistId) {
      return NextResponse.json(
        {
          error:
            "Therapist ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const {
      data: therapist,
      error: therapistError,
    } = await supabaseAdmin
      .from("therapists")
      .select(
        `
          id,
          full_name,
          price,
          work_status
        `,
      )
      .eq(
        "id",
        therapistId,
      )
      .maybeSingle();

    if (therapistError) {
      throw therapistError;
    }

    if (!therapist) {
      return NextResponse.json(
        {
          error:
            "Specialist not found.",
        },
        {
          status: 404,
        },
      );
    }

    const now =
      new Date().toISOString();

    const {
      data: futureBookings,
      error: bookingError,
    } = await supabaseAdmin
      .from("bookings")
      .select(
        bookingSelect,
      )
      .eq(
        "therapist_id",
        therapistId,
      )
      .eq(
        "status",
        "paid",
      )
      .gt(
        "scheduled_start",
        now,
      )
      .order(
        "scheduled_start",
        {
          ascending: true,
        },
      );

    if (bookingError) {
      throw bookingError;
    }

    const {
      data: alternatives,
      error: alternativesError,
    } = await supabaseAdmin
      .from("therapists")
      .select(
        `
          id,
          full_name,
          specialty,
          price,
          work_status
        `,
      )
      .eq(
        "work_status",
        "active",
      )
      .neq(
        "id",
        therapistId,
      )
      .order(
        "full_name",
        {
          ascending: true,
        },
      );

    if (alternativesError) {
      throw alternativesError;
    }

    const alternativeIds =
      (alternatives || []).map(
        (item) =>
          item.id,
      );

    let availableSlots:
      any[] = [];

    if (
      alternativeIds.length >
      0
    ) {
      const {
        data: slots,
        error: slotsError,
      } = await supabaseAdmin
        .from(
          "availability_slots",
        )
        .select(
          `
            id,
            therapist_id,
            day,
            time,
            slot_date,
            starts_at,
            ends_at,
            is_booked
          `,
        )
        .in(
          "therapist_id",
          alternativeIds,
        )
        .eq(
          "is_booked",
          false,
        )
        .gt(
          "starts_at",
          now,
        )
        .order(
          "starts_at",
          {
            ascending: true,
          },
        );

      if (slotsError) {
        throw slotsError;
      }

      availableSlots =
        slots || [];
    }

    return NextResponse.json({
      therapist,
      futurePaidBookings:
        futureBookings || [],
      alternatives:
        alternatives || [],
      availableSlots,
    });
  } catch (error) {
    console.error(
      "Therapist departure GET error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load departure information.",
      },
      {
        status: 500,
      },
    );
  }
}
export async function POST(
  request: Request,
) {
  try {
    const verification =
      await verifyAdmin(request);

    if (verification.error) {
      return verification.error;
    }

    const {
      supabaseAdmin,
    } = verification;

    const body =
      (await request.json()) as DepartureRequest;

    const action =
      body.action;

    const therapistId =
      body.therapistId?.trim();

    if (!action) {
      return NextResponse.json(
        {
          error:
            "Departure action is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!therapistId) {
      return NextResponse.json(
        {
          error:
            "Therapist ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      action ===
      "start_departure"
    ) {
      const {
        data: therapist,
        error: therapistError,
      } = await supabaseAdmin
        .from("therapists")
        .update({
          work_status:
            "leaving",
        })
        .eq(
          "id",
          therapistId,
        )
        .select(
          `
            id,
            full_name,
            work_status
          `,
        )
        .maybeSingle();

      if (therapistError) {
        throw therapistError;
      }

      if (!therapist) {
        return NextResponse.json(
          {
            error:
              "Specialist not found.",
          },
          {
            status: 404,
          },
        );
      }

      const now =
        new Date().toISOString();

      const {
        data: futureBookings,
        error: futureError,
      } = await supabaseAdmin
        .from("bookings")
        .select(
          bookingSelect,
        )
        .eq(
          "therapist_id",
          therapistId,
        )
        .eq(
          "status",
          "paid",
        )
        .gt(
          "scheduled_start",
          now,
        )
        .order(
          "scheduled_start",
          {
            ascending: true,
          },
        );

      if (futureError) {
        throw futureError;
      }

      return NextResponse.json({
        success: true,
        therapist,
        futurePaidBookings:
          futureBookings || [],
      });
    }

    const bookingId =
      body.bookingId?.trim();

    if (
      action !==
        "finalize" &&
      !bookingId
    ) {
      return NextResponse.json(
        {
          error:
            "Booking ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      action ===
      "maintain"
    ) {
      const {
        data: booking,
        error: bookingError,
      } = await supabaseAdmin
        .from("bookings")
        .update({
          departure_action:
            "maintain",

          original_therapist_id:
            therapistId,
        })
        .eq(
          "id",
          bookingId!,
        )
        .eq(
          "therapist_id",
          therapistId,
        )
        .eq(
          "status",
          "paid",
        )
        .select(
          bookingSelect,
        )
        .maybeSingle<BookingRow>();

      if (bookingError) {
        throw bookingError;
      }

      if (!booking) {
        return NextResponse.json(
          {
            error:
              "Paid booking was not found for this specialist.",
          },
          {
            status: 404,
          },
        );
      }

      return NextResponse.json({
        success: true,
        action:
          "maintain",
        booking,
      });
    }

    if (
      action ===
      "transfer"
    ) {
      const newTherapistId =
        body.newTherapistId?.trim();

      const newSlotId =
        body.newSlotId?.trim();

      if (
        !newTherapistId ||
        !newSlotId
      ) {
        return NextResponse.json(
          {
            error:
              "New therapist and new slot are required.",
          },
          {
            status: 400,
          },
        );
      }

      if (
        newTherapistId ===
        therapistId
      ) {
        return NextResponse.json(
          {
            error:
              "The new specialist must be different from the current specialist.",
          },
          {
            status: 400,
          },
        );
      }

      const {
        data: currentBooking,
        error: currentBookingError,
      } = await supabaseAdmin
        .from("bookings")
        .select(
          bookingSelect,
        )
        .eq(
          "id",
          bookingId!,
        )
        .eq(
          "therapist_id",
          therapistId,
        )
        .eq(
          "status",
          "paid",
        )
        .maybeSingle<BookingRow>();

      if (
        currentBookingError
      ) {
        throw currentBookingError;
      }

      if (!currentBooking) {
        return NextResponse.json(
          {
            error:
              "Paid booking was not found for this specialist.",
          },
          {
            status: 404,
          },
        );
      }

      const {
        data: newTherapist,
        error: newTherapistError,
      } = await supabaseAdmin
        .from("therapists")
        .select(
          `
            id,
            full_name,
            price,
            work_status
          `,
        )
        .eq(
          "id",
          newTherapistId,
        )
        .eq(
          "work_status",
          "active",
        )
        .maybeSingle();

      if (
        newTherapistError
      ) {
        throw newTherapistError;
      }

      if (!newTherapist) {
        return NextResponse.json(
          {
            error:
              "The new specialist is unavailable.",
          },
          {
            status: 400,
          },
        );
      }

      const {
        data: claimedSlot,
        error: slotClaimError,
      } = await supabaseAdmin
        .from(
          "availability_slots",
        )
        .update({
          is_booked: true,
        })
        .eq(
          "id",
          newSlotId,
        )
        .eq(
          "therapist_id",
          newTherapistId,
        )
        .eq(
          "is_booked",
          false,
        )
        .select(
          `
            id,
            therapist_id,
            day,
            time,
            slot_date,
            starts_at,
            ends_at,
            is_booked
          `,
        )
        .maybeSingle();

      if (
        slotClaimError
      ) {
        throw slotClaimError;
      }

      if (!claimedSlot) {
        return NextResponse.json(
          {
            error:
              "The selected slot is no longer available.",
          },
          {
            status: 409,
          },
        );
      }

      if (
        !claimedSlot.starts_at
      ) {
        await supabaseAdmin
          .from(
            "availability_slots",
          )
          .update({
            is_booked: false,
          })
          .eq(
            "id",
            newSlotId,
          );

        return NextResponse.json(
          {
            error:
              "The selected slot does not have a valid start time.",
          },
          {
            status: 400,
          },
        );
      }

      const scheduledStart =
        claimedSlot.starts_at;

      const scheduledEnd =
        claimedSlot.ends_at ||
        new Date(
          new Date(
            scheduledStart,
          ).getTime() +
            2 *
              60 *
              60 *
              1000,
        ).toISOString();

      const {
        data: transferredBooking,
        error: transferError,
      } = await supabaseAdmin
        .from("bookings")
        .update({
          original_therapist_id:
            currentBooking.original_therapist_id ||
            therapistId,

          therapist_id:
            newTherapist.id,

          therapist_name:
            newTherapist.full_name,

          slot_id:
            claimedSlot.id,

          slot_day:
            claimedSlot.day,

          slot_time:
            claimedSlot.time,

          scheduled_start:
            scheduledStart,

          scheduled_end:
            scheduledEnd,

          departure_action:
            "transferred",

          meeting_url: null,
          meeting_provider: null,
          calendar_event_id: null,

          zoom_join_url: null,
          zoom_start_url: null,
        })
        .eq(
          "id",
          bookingId!,
        )
        .eq(
          "therapist_id",
          therapistId,
        )
        .eq(
          "status",
          "paid",
        )
        .select(
          bookingSelect,
        )
        .maybeSingle<BookingRow>();

      if (
        transferError ||
        !transferredBooking
      ) {
        await supabaseAdmin
          .from(
            "availability_slots",
          )
          .update({
            is_booked: false,
          })
          .eq(
            "id",
            newSlotId,
          );

        if (transferError) {
          throw transferError;
        }

        return NextResponse.json(
          {
            error:
              "The booking could not be transferred.",
          },
          {
            status: 500,
          },
        );
      }

      if (
        currentBooking.slot_id &&
        currentBooking.slot_id !==
          newSlotId
      ) {
        const {
          error:
            releaseError,
        } = await supabaseAdmin
          .from(
            "availability_slots",
          )
          .update({
            is_booked: false,
          })
          .eq(
            "id",
            currentBooking.slot_id,
          );

        if (
          releaseError
        ) {
          console.error(
            "Old slot release warning:",
            releaseError,
          );
        }
      }

      return NextResponse.json({
        success: true,
        action:
          "transfer",
        booking:
          transferredBooking,
        originalPaidPrice:
          currentBooking.price,
        newTherapistPrice:
          Number(
            newTherapist.price ??
              0,
          ),
      });
    }
        if (
      action ===
      "refund"
    ) {
      const stripeSecretKey =
        process.env
          .STRIPE_SECRET_KEY;

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

      const stripe =
        new Stripe(
          stripeSecretKey,
        );

      const {
        data: booking,
        error: bookingError,
      } = await supabaseAdmin
        .from("bookings")
        .select(
          bookingSelect,
        )
        .eq(
          "id",
          bookingId!,
        )
        .eq(
          "therapist_id",
          therapistId,
        )
        .eq(
          "status",
          "paid",
        )
        .maybeSingle<BookingRow>();

      if (bookingError) {
        throw bookingError;
      }

      if (!booking) {
        return NextResponse.json(
          {
            error:
              "Paid booking was not found.",
          },
          {
            status: 404,
          },
        );
      }

      if (
        booking.payment_provider !==
        "stripe"
      ) {
        return NextResponse.json(
          {
            error:
              "Automatic refunds are currently available only for Stripe payments.",
          },
          {
            status: 400,
          },
        );
      }

      let paymentReference =
        booking
          .payment_transaction_id
          ?.trim();

      if (!paymentReference) {
        return NextResponse.json(
          {
            error:
              "Payment transaction ID is missing.",
          },
          {
            status: 400,
          },
        );
      }

      if (
        paymentReference.startsWith(
          "cs_",
        )
      ) {
        const checkoutSession =
          await stripe.checkout.sessions.retrieve(
            paymentReference,
          );

        const paymentIntent =
          checkoutSession.payment_intent;

        paymentReference =
          typeof paymentIntent ===
          "string"
            ? paymentIntent
            : paymentIntent?.id ||
              "";
      }

      if (
        !paymentReference.startsWith(
          "pi_",
        )
      ) {
        return NextResponse.json(
          {
            error:
              "A valid Stripe PaymentIntent could not be determined.",
          },
          {
            status: 400,
          },
        );
      }

      const refund =
        await stripe.refunds.create(
          {
            payment_intent:
              paymentReference,

            reason:
              "requested_by_customer",

            metadata: {
              bookingId:
                booking.id,

              therapistId,

              reason:
                "therapist_departure",
            },
          },
          {
            idempotencyKey:
              `therapist-departure-refund-${booking.id}`,
          },
        );

      if (
        refund.status !==
          "succeeded" &&
        refund.status !==
          "pending"
      ) {
        return NextResponse.json(
          {
            error:
              `Stripe refund status: ${refund.status}`,
          },
          {
            status: 400,
          },
        );
      }

      const refundedAt =
        new Date().toISOString();

      const bookingStatus =
        refund.status ===
        "succeeded"
          ? "refunded"
          : "refund_pending";

      const departureAction =
        refund.status ===
        "succeeded"
          ? "refunded"
          : null;

      const {
        error:
          paymentUpdateError,
      } = await supabaseAdmin
        .from("payments")
        .update({
          status:
            bookingStatus,
        })
        .eq(
          "booking_id",
          booking.id,
        )
        .eq(
          "provider",
          "stripe",
        );

      if (
        paymentUpdateError
      ) {
        console.error(
          "CRITICAL: Stripe refund succeeded but payment DB update failed:",
          {
            bookingId:
              booking.id,
            refundId:
              refund.id,
            paymentUpdateError,
          },
        );

        throw paymentUpdateError;
      }

      const {
        data: updatedBooking,
        error:
          bookingUpdateError,
      } = await supabaseAdmin
        .from("bookings")
        .update({
          status:
            bookingStatus,

          departure_action:
            departureAction,

          refunded_at:
            refund.status ===
            "succeeded"
              ? refundedAt
              : null,

          meeting_url: null,
          meeting_provider: null,
          calendar_event_id: null,
          zoom_join_url: null,
          zoom_start_url: null,
        })
        .eq(
          "id",
          booking.id,
        )
        .select(
          bookingSelect,
        )
        .maybeSingle<BookingRow>();

      if (
        bookingUpdateError
      ) {
        console.error(
          "CRITICAL: Stripe refund succeeded but booking DB update failed:",
          {
            bookingId:
              booking.id,
            refundId:
              refund.id,
            bookingUpdateError,
          },
        );

        throw bookingUpdateError;
      }

      if (
        refund.status ===
          "succeeded" &&
        booking.slot_id
      ) {
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
            booking.slot_id,
          );

        if (
          slotReleaseError
        ) {
          console.error(
            "Refund slot release warning:",
            slotReleaseError,
          );
        }
      }

      return NextResponse.json({
        success: true,
        action:
          "refund",

        refund: {
          id:
            refund.id,
          status:
            refund.status,
          amount:
            refund.amount /
            100,
          currency:
            refund.currency.toUpperCase(),
        },

        booking:
          updatedBooking,
      });
    }

    if (
      action ===
      "finalize"
    ) {
      const now =
        new Date().toISOString();

      const {
        count:
          remainingCount,
        error:
          remainingError,
      } = await supabaseAdmin
        .from("bookings")
        .select(
          "id",
          {
            count:
              "exact",
            head:
              true,
          },
        )
        .eq(
          "therapist_id",
          therapistId,
        )
        .eq(
          "status",
          "paid",
        )
        .gt(
          "scheduled_start",
          now,
        );

      if (
        remainingError
      ) {
        throw remainingError;
      }

      if (
        (remainingCount || 0) >
        0
      ) {
        return NextResponse.json(
          {
            error:
              "This specialist still has future paid sessions and cannot be fully deactivated yet.",

            remainingPaidBookings:
              remainingCount,
          },
          {
            status: 409,
          },
        );
      }

      const {
        data: therapist,
        error:
          therapistUpdateError,
      } = await supabaseAdmin
        .from("therapists")
        .update({
          work_status:
            "inactive",
        })
        .eq(
          "id",
          therapistId,
        )
        .select(
          `
            id,
            full_name,
            work_status
          `,
        )
        .maybeSingle();

      if (
        therapistUpdateError
      ) {
        throw therapistUpdateError;
      }

      if (!therapist) {
        return NextResponse.json(
          {
            error:
              "Specialist not found.",
          },
          {
            status: 404,
          },
        );
      }

      /*
       * IMPORTANT :
       * on garde profiles.role = "therapist".
       *
       * L'état de travail est géré uniquement
       * par therapists.work_status.
       */

      const {
        error:
          availabilityDeleteError,
      } = await supabaseAdmin
        .from(
          "availability_slots",
        )
        .delete()
        .eq(
          "therapist_id",
          therapistId,
        )
        .eq(
          "is_booked",
          false,
        );

      if (
        availabilityDeleteError
      ) {
        console.error(
          "Inactive therapist availability cleanup warning:",
          availabilityDeleteError,
        );
      }

      return NextResponse.json({
        success: true,
        action:
          "finalize",
        therapist,
      });
    }

    return NextResponse.json(
      {
        error:
          "Unsupported departure action.",
      },
      {
        status: 400,
      },
    );
  } catch (error) {
    console.error(
      "Therapist departure POST error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to process specialist departure.",
      },
      {
        status: 500,
      },
    );
  }
}
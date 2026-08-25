import {
  createClient,
} from "@supabase/supabase-js";

import {
  NextResponse,
} from "next/server";

export const runtime =
  "nodejs";

const HOLD_MINUTES = 10;

function createSupabaseAdmin() {
  const supabaseUrl =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env
      .SUPABASE_SERVICE_ROLE_KEY ||
    process.env
      .SUPABASE_SECRET_KEY;

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
        autoRefreshToken:
          false,

        persistSession:
          false,

        detectSessionInUrl:
          false,
      },
    },
  );
}

async function getAuthenticatedUser(
  request: Request,
  supabaseAdmin:
    ReturnType<
      typeof createSupabaseAdmin
    >,
) {
  const authorization =
    request.headers.get(
      "authorization",
    );

  if (
    !authorization?.startsWith(
      "Bearer ",
    )
  ) {
    return null;
  }

  const accessToken =
    authorization
      .slice(
        "Bearer ".length,
      )
      .trim();

  if (!accessToken) {
    return null;
  }

  const {
    data: {
      user,
    },
    error,
  } =
    await supabaseAdmin.auth.getUser(
      accessToken,
    );

  if (
    error ||
    !user
  ) {
    return null;
  }

  return user;
}

export async function POST(
  request: Request,
) {
  const supabaseAdmin =
    createSupabaseAdmin();

  let claimedSlotId:
    | string
    | null = null;

  try {
    /*
     * 1. Vérifier l'utilisateur.
     */
    const user =
      await getAuthenticatedUser(
        request,
        supabaseAdmin,
      );

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Authentication required.",
        },
        {
          status: 401,
        },
      );
    }

    /*
     * Le hold est réservé aux patients.
     */
    const {
      data: profile,
      error:
        profileError,
    } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq(
        "id",
        user.id,
      )
      .maybeSingle<{
        role:
          | string
          | null;
      }>();

    if (profileError) {
      throw profileError;
    }

    if (
      !profile ||
      profile.role !==
        "patient"
    ) {
      return NextResponse.json(
        {
          error:
            "Only patient accounts can create bookings.",
        },
        {
          status: 403,
        },
      );
    }

    /*
     * 2. Lire la demande.
     */
    const body =
      await request.json();

    const therapistId =
      String(
        body.therapistId ||
          "",
      ).trim();

    const slotId =
      String(
        body.slotId ||
          "",
      ).trim();

    if (
      !therapistId ||
      !slotId
    ) {
      return NextResponse.json(
        {
          error:
            "Specialist and slot are required.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * 3. Nettoyer les anciens holds expirés.
     *
     * On ne touche qu'aux réservations
     * encore pending dont les 10 minutes
     * sont dépassées.
     */
    const now =
      new Date();

    const nowIso =
      now.toISOString();

    const {
      data:
        expiredBookings,
      error:
        expiredBookingsError,
    } = await supabaseAdmin
      .from("bookings")
      .select(
        `
          id,
          slot_id
        `,
      )
      .eq(
        "status",
        "pending",
      )
      .lt(
        "hold_expires_at",
        nowIso,
      );

    if (
      expiredBookingsError
    ) {
      throw expiredBookingsError;
    }

    for (
      const expiredBooking
      of expiredBookings || []
    ) {
      if (
        expiredBooking.slot_id
      ) {
        const {
          error:
            slotReleaseError,
        } =
          await supabaseAdmin
            .from(
              "availability_slots",
            )
            .update({
              is_booked:
                false,
            })
            .eq(
              "id",
              expiredBooking.slot_id,
            );

        if (
          slotReleaseError
        ) {
          console.error(
            "Expired hold slot release warning:",
            slotReleaseError,
          );
        }
      }

      const {
        error:
          expiredDeleteError,
      } =
        await supabaseAdmin
          .from("bookings")
          .delete()
          .eq(
            "id",
            expiredBooking.id,
          )
          .eq(
            "status",
            "pending",
          );

      if (
        expiredDeleteError
      ) {
        console.error(
          "Expired booking cleanup warning:",
          expiredDeleteError,
        );
      }
    }

    /*
     * 4. Vérifier le spécialiste.
     *
     * Le prix vient TOUJOURS de Supabase.
     */
    const {
      data: therapist,
      error:
        therapistError,
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
      .maybeSingle<{
        id: string;

        full_name:
          string;

        price:
          number | null;

        work_status:
          | "active"
          | "leaving"
          | "inactive";
      }>();

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

    if (
      therapist.work_status !==
      "active"
    ) {
      return NextResponse.json(
        {
          error:
            "This specialist is no longer accepting new bookings.",
        },
        {
          status: 409,
        },
      );
    }

    const price =
      Number(
        therapist.price,
      );

    if (
      !Number.isFinite(
        price,
      ) ||
      price <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "The session price is currently unavailable.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * 5. Vérifier le créneau.
     */
    const {
      data: slot,
      error:
        slotError,
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
      .eq(
        "id",
        slotId,
      )
      .eq(
        "therapist_id",
        therapistId,
      )
      .maybeSingle<{
        id:
          string;

        therapist_id:
          string;

        day:
          string;

        time:
          string;

        slot_date:
          string | null;

        starts_at:
          string | null;

        ends_at:
          string | null;

        is_booked:
          boolean | null;
      }>();

    if (slotError) {
      throw slotError;
    }

    if (
      !slot ||
      slot.is_booked ===
        true
    ) {
      return NextResponse.json(
        {
          error:
            "This slot is no longer available.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * Le système actuel possède normalement
     * starts_at / ends_at.
     */
    if (!slot.starts_at) {
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
      new Date(
        slot.starts_at,
      );

    if (
      Number.isNaN(
        scheduledStart.getTime(),
      )
    ) {
      return NextResponse.json(
        {
          error:
            "The selected slot has an invalid start time.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Refuser les créneaux déjà passés.
     */
    if (
      scheduledStart.getTime() <=
      Date.now()
    ) {
      return NextResponse.json(
        {
          error:
            "This slot is no longer available.",
        },
        {
          status: 409,
        },
      );
    }

    const scheduledEnd =
      slot.ends_at
        ? new Date(
            slot.ends_at,
          )
        : new Date(
            scheduledStart.getTime() +
              2 *
                60 *
                60 *
                1000,
          );

    /*
     * 6. Claim atomique du créneau.
     *
     * .eq("is_booked", false)
     * empêche normalement deux requêtes
     * simultanées de le prendre.
     */
    const {
      data:
        claimedSlot,
      error:
        slotClaimError,
    } = await supabaseAdmin
      .from(
        "availability_slots",
      )
      .update({
        is_booked:
          true,
      })
      .eq(
        "id",
        slotId,
      )
      .eq(
        "therapist_id",
        therapistId,
      )
      .eq(
        "is_booked",
        false,
      )
      .select(
        "id",
      )
      .maybeSingle<{
        id:
          string;
      }>();

    if (
      slotClaimError
    ) {
      throw slotClaimError;
    }

    if (
      !claimedSlot
    ) {
      return NextResponse.json(
        {
          error:
            "This slot has just been reserved by another patient.",
        },
        {
          status: 409,
        },
      );
    }

    claimedSlotId =
      claimedSlot.id;

    /*
     * 7. Expiration du hold.
     */
    const holdExpiresAt =
      new Date(
        Date.now() +
          HOLD_MINUTES *
            60 *
            1000,
      );

    /*
     * 8. Créer la réservation temporaire.
     *
     * Elle n'est PAS encore une réservation
     * confirmée.
     */
    const {
      data: booking,
      error:
        bookingError,
    } = await supabaseAdmin
      .from("bookings")
      .insert({
        patient_id:
          user.id,

        patient_email:
          user.email ||
          null,

        therapist_id:
          therapist.id,

        therapist_name:
          therapist.full_name,

        slot_id:
          slot.id,

        slot_day:
          slot.day,

        slot_time:
          slot.time,

        scheduled_start:
          scheduledStart.toISOString(),

        scheduled_end:
          scheduledEnd.toISOString(),

        price,

        status:
          "pending",

        hold_expires_at:
          holdExpiresAt.toISOString(),
      })
      .select(
        `
          id,
          therapist_name,
          slot_day,
          slot_time,
          price,
          scheduled_start,
          scheduled_end,
          hold_expires_at
        `,
      )
      .single();

    if (
      bookingError ||
      !booking
    ) {
      /*
       * Si la création échoue,
       * libérer immédiatement le créneau.
       */
      await supabaseAdmin
        .from(
          "availability_slots",
        )
        .update({
          is_booked:
            false,
        })
        .eq(
          "id",
          slotId,
        );

      claimedSlotId =
        null;

      if (
        bookingError
      ) {
        throw bookingError;
      }

      throw new Error(
        "Unable to create booking hold.",
      );
    }

    /*
     * 9. Réponse au navigateur.
     */
    return NextResponse.json({
      success:
        true,

      bookingId:
        booking.id,

      holdExpiresAt:
        booking.hold_expires_at,

      therapistName:
        booking.therapist_name,

      price:
        Number(
          booking.price,
        ),

      slotLabel:
        `${booking.slot_day || ""} ${booking.slot_time || ""}`.trim(),

      booking,
    });
  } catch (
    error
  ) {
    /*
     * Sécurité supplémentaire :
     * si quelque chose casse après le claim,
     * on essaie de libérer le slot.
     */
    if (
      claimedSlotId
    ) {
      const {
        error:
          releaseError,
      } =
        await supabaseAdmin
          .from(
            "availability_slots",
          )
          .update({
            is_booked:
              false,
          })
          .eq(
            "id",
            claimedSlotId,
          );

      if (
        releaseError
      ) {
        console.error(
          "Hold rollback error:",
          releaseError,
        );
      }
    }

    console.error(
      "Booking hold error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof
          Error
            ? error.message
            : "Unable to create booking hold.",
      },
      {
        status: 500,
      },
    );
  }
}
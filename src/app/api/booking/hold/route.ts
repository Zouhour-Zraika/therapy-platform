import {
  createClient,
} from "@supabase/supabase-js";

import {
  NextResponse,
} from "next/server";

export const runtime =
  "nodejs";

const HOLD_MINUTES = 10;
const TIME_ZONE = "Asia/Beirut";

type SlotRow = {
  id: string;
  therapist_id: string | null;
  day: string | null;
  time: string | null;
  slot_date: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_booked: boolean | null;
};

type TherapistRow = {
  id: string;
  full_name: string | null;
  price: number | null;
  work_status:
    | "active"
    | "leaving"
    | "inactive"
    | null;
};

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

async function getAuthenticatedPatient(
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
    error:
      userError,
  } =
    await supabaseAdmin.auth.getUser(
      accessToken,
    );

  if (
    userError ||
    !user
  ) {
    return null;
  }

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

  if (
    profileError ||
    !profile ||
    profile.role !==
      "patient"
  ) {
    return null;
  }

  return user;
}

function parseSlotTime(
  time: string,
) {
  const normalized =
    time
      .trim()
      .toUpperCase();

  const match =
    normalized.match(
      /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/,
    );

  if (!match) {
    return null;
  }

  let hour =
    Number(match[1]);

  const minute =
    Number(
      match[2] || "0",
    );

  const period =
    match[3];

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  if (period) {
    if (
      hour < 1 ||
      hour > 12
    ) {
      return null;
    }

    if (
      period === "PM" &&
      hour < 12
    ) {
      hour += 12;
    }

    if (
      period === "AM" &&
      hour === 12
    ) {
      hour = 0;
    }
  } else if (
    hour < 0 ||
    hour > 23
  ) {
    return null;
  }

  return {
    hour,
    minute,
  };
}

function getTimeZoneOffsetMs(
  date: Date,
  timeZone: string,
) {
  const formatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone,
        year:
          "numeric",
        month:
          "2-digit",
        day:
          "2-digit",
        hour:
          "2-digit",
        minute:
          "2-digit",
        second:
          "2-digit",
        hourCycle:
          "h23",
      },
    );

  const parts =
    formatter.formatToParts(
      date,
    );

  const values =
    Object.fromEntries(
      parts
        .filter(
          (part) =>
            part.type !==
            "literal",
        )
        .map(
          (part) => [
            part.type,
            part.value,
          ],
        ),
    );

  const asUtc =
    Date.UTC(
      Number(values.year),
      Number(values.month) -
        1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
      Number(values.second),
    );

  return (
    asUtc -
    date.getTime()
  );
}

function buildScheduledStart(
  slot: SlotRow,
) {
  /*
   * Les nouveaux créneaux peuvent déjà
   * posséder starts_at.
   */
  if (slot.starts_at) {
    const existing =
      new Date(
        slot.starts_at,
      );

    if (
      !Number.isNaN(
        existing.getTime(),
      )
    ) {
      return existing;
    }
  }

  /*
   * Compatibilité avec les anciens créneaux
   * de la base qui ont starts_at = NULL.
   */
  if (
    !slot.slot_date ||
    !slot.time
  ) {
    return null;
  }

  const parsedTime =
    parseSlotTime(
      slot.time,
    );

  if (!parsedTime) {
    return null;
  }

  const [
    year,
    month,
    day,
  ] =
    slot.slot_date
      .split("-")
      .map(Number);

  if (
    !year ||
    !month ||
    !day
  ) {
    return null;
  }

  const utcGuess =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        parsedTime.hour,
        parsedTime.minute,
        0,
      ),
    );

  let offset =
    getTimeZoneOffsetMs(
      utcGuess,
      TIME_ZONE,
    );

  let result =
    new Date(
      utcGuess.getTime() -
        offset,
    );

  const correctedOffset =
    getTimeZoneOffsetMs(
      result,
      TIME_ZONE,
    );

  if (
    correctedOffset !==
    offset
  ) {
    offset =
      correctedOffset;

    result =
      new Date(
        utcGuess.getTime() -
          offset,
      );
  }

  return result;
}

function buildScheduledEnd(
  slot: SlotRow,
  start: Date,
) {
  if (slot.ends_at) {
    const existingEnd =
      new Date(
        slot.ends_at,
      );

    if (
      !Number.isNaN(
        existingEnd.getTime(),
      )
    ) {
      return existingEnd;
    }
  }

  /*
   * Le système actuel réserve une fenêtre
   * maximale de 2 heures pour la séance.
   */
  return new Date(
    start.getTime() +
      2 *
        60 *
        60 *
        1000,
  );
}

async function cleanupExpiredHolds(
  supabaseAdmin:
    ReturnType<
      typeof createSupabaseAdmin
    >,
) {
  const nowIso =
    new Date().toISOString();

  const {
    data:
      expiredBookings,
    error:
      expiredError,
  } = await supabaseAdmin
    .from("bookings")
    .select(
      "id, slot_id",
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
    );

  if (expiredError) {
    /*
     * Un échec du nettoyage ne doit pas
     * empêcher toutes les nouvelles réservations.
     */
    console.error(
      "Expired booking cleanup lookup error:",
      expiredError,
    );

    return;
  }

  for (
    const expiredBooking
    of expiredBookings || []
  ) {
    /*
     * On supprime d'abord le pending expiré.
     * La condition status=pending évite de
     * supprimer une réservation qui aurait été
     * confirmée entre-temps par le webhook.
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
        expiredBooking.id,
      )
      .eq(
        "status",
        "pending",
      )
      .select(
        "id, slot_id",
      )
      .maybeSingle<{
        id: string;
        slot_id:
          | string
          | null;
      }>();

    if (deleteError) {
      console.error(
        "Expired booking delete error:",
        deleteError,
      );

      continue;
    }

    /*
     * Si le booking n'a pas été supprimé,
     * il a probablement changé de statut.
     */
    if (
      !deletedBooking ||
      !deletedBooking.slot_id
    ) {
      continue;
    }

    /*
     * Vérification de sécurité :
     * ne jamais libérer un slot s'il existe
     * maintenant une réservation payée dessus.
     */
    const {
      data:
        confirmedBooking,
      error:
        confirmedLookupError,
    } = await supabaseAdmin
      .from("bookings")
      .select("id")
      .eq(
        "slot_id",
        deletedBooking.slot_id,
      )
      .eq(
        "status",
        "paid",
      )
      .limit(1)
      .maybeSingle<{
        id: string;
      }>();

    if (
      confirmedLookupError
    ) {
      console.error(
        "Expired hold paid-booking verification error:",
        confirmedLookupError,
      );

      continue;
    }

    if (confirmedBooking) {
      continue;
    }

    const {
      error:
        releaseError,
    } = await supabaseAdmin
      .from(
        "availability_slots",
      )
      .update({
        is_booked:
          false,
      })
      .eq(
        "id",
        deletedBooking.slot_id,
      );

    if (releaseError) {
      console.error(
        "Expired hold slot release error:",
        releaseError,
      );
    }
  }
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
     * 1. Authentification du patient.
     */
    const user =
      await getAuthenticatedPatient(
        request,
        supabaseAdmin,
      );

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Patient authentication required.",
        },
        {
          status: 401,
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
     * 3. Nettoyage opportuniste des holds
     * expirés avant de traiter la demande.
     */
    await cleanupExpiredHolds(
      supabaseAdmin,
    );

    /*
     * 4. Vérifier le spécialiste.
     * Le prix est relu côté serveur.
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
      .maybeSingle<TherapistRow>();

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
      .maybeSingle<SlotRow>();

    if (slotError) {
      throw slotError;
    }

    if (!slot) {
      return NextResponse.json(
        {
          error:
            "This slot was not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (
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
     * 6. Calculer la vraie date/heure.
     *
     * Important : certains anciens créneaux
     * ont starts_at = NULL. On reconstruit alors
     * la date avec slot_date + time en heure de
     * Beyrouth.
     */
    const scheduledStart =
      buildScheduledStart(
        slot,
      );

    if (!scheduledStart) {
      return NextResponse.json(
        {
          error:
            "The selected slot does not have a valid date and time.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Un créneau passé ne doit jamais être
     * réservable, même si quelqu'un appelle
     * directement cette API avec son ID.
     */
    if (
      scheduledStart.getTime() <=
      Date.now()
    ) {
      return NextResponse.json(
        {
          error:
            "This slot has already passed.",
        },
        {
          status: 409,
        },
      );
    }

    const scheduledEnd =
      buildScheduledEnd(
        slot,
        scheduledStart,
      );

    /*
     * 7. Claim du slot.
     *
     * On ne claim que si le slot est toujours
     * libre au moment exact de l'UPDATE.
     * Cela empêche deux patients de réserver
     * simultanément le même créneau.
     */
    const {
      data:
        claimedSlots,
      error:
        claimError,
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
        slot.id,
      )
      .eq(
        "therapist_id",
        therapist.id,
      )
      .or(
        "is_booked.eq.false,is_booked.is.null",
      )
      .select(
        "id",
      );

    if (claimError) {
      throw claimError;
    }

    const claimedSlot =
      claimedSlots?.[0] ||
      null;

    if (!claimedSlot) {
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
     * 8. Hold de 10 minutes.
     */
    const holdExpiresAt =
      new Date(
        Date.now() +
          HOLD_MINUTES *
            60 *
            1000,
      );

    /*
     * 9. Créer la réservation temporaire.
     *
     * Le statut reste pending jusqu'à ce que
     * le webhook Stripe confirme réellement
     * le paiement.
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
          scheduled_start,
          scheduled_end,
          price,
          status,
          hold_expires_at
        `,
      )
      .single();

    if (
      bookingError ||
      !booking
    ) {
      /*
       * La réservation n'a pas pu être créée :
       * on rend immédiatement le slot disponible.
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
          slot.id,
        );

      claimedSlotId =
        null;

      if (bookingError) {
        throw bookingError;
      }

      throw new Error(
        "Unable to create booking hold.",
      );
    }

    /*
     * 10. Succès.
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
  } catch (error) {
    /*
     * Rollback de sécurité :
     * si une erreur survient après le claim mais
     * avant la création complète du booking,
     * on libère le créneau.
     */
    if (claimedSlotId) {
      const {
        error:
          releaseError,
      } = await supabaseAdmin
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

      if (releaseError) {
        console.error(
          "Booking hold rollback error:",
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

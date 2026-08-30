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

type PatientAction =
  | "request_reschedule"
  | "reschedule"
  | "cancel_and_refund";

type BookingRow = {
  id: string;
  patient_id: string | null;
  patient_email: string | null;
  therapist_id: string | null;
  therapist_name: string | null;
  slot_id: string | null;
  slot_day: string | null;
  slot_time: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  price: number | null;
  status: string | null;
  payment_provider: string | null;
  payment_transaction_id: string | null;
  reschedule_requested_by?: string | null;
  reschedule_requested_at?: string | null;
  cancellation_initiated_by?: string | null;
  cancelled_at?: string | null;
  refund_id?: string | null;
  refunded_at?: string | null;
  meeting_url?: string | null;
  meeting_provider?: string | null;
  calendar_event_id?: string | null;
  zoom_join_url?: string | null;
  zoom_start_url?: string | null;
};

const CHANGE_DEADLINE_MS =
  24 * 60 * 60 * 1000;

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

async function getAuthenticatedPatient(
  request: Request,
  supabaseAdmin:
    ReturnType<typeof createSupabaseAdmin>,
) {
  const authorization =
    request.headers.get("authorization");

  if (
    !authorization?.startsWith("Bearer ")
  ) {
    return null;
  }

  const accessToken =
    authorization
      .slice("Bearer ".length)
      .trim();

  if (!accessToken) {
    return null;
  }

  const {
    data: { user },
    error: userError,
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
    error: profileError,
  } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{
      role: string | null;
    }>();

  if (
    profileError ||
    !profile ||
    profile.role !== "patient"
  ) {
    return null;
  }

  return user;
}

function getLanguage(
  value: unknown,
): Language {
  return value === "ar"
    ? "ar"
    : value === "fr"
      ? "fr"
      : "en";
}

function getErrorMessage(
  language: Language,
  key:
    | "auth"
    | "missingBooking"
    | "invalidAction"
    | "notFound"
    | "forbidden"
    | "paidOnly"
    | "missingDate"
    | "tooLate"
    | "unsupportedRefund"
    | "missingTransaction"
    | "stripeConfig"
    | "missingNewSlot"
    | "slotNotAvailable"
    | "wrongTherapist"
    | "generic",
) {
  const messages = {
    auth: {
      ar: "يجب تسجيل الدخول بحساب المريض.",
      fr: "Vous devez être connecté avec votre compte patient.",
      en: "You must be signed in with your patient account.",
    },
    missingBooking: {
      ar: "معرّف الحجز غير موجود.",
      fr: "L’identifiant de réservation est manquant.",
      en: "The booking identifier is missing.",
    },
    invalidAction: {
      ar: "الإجراء المطلوب غير صالح.",
      fr: "L’action demandée n’est pas valide.",
      en: "The requested action is invalid.",
    },
    notFound: {
      ar: "لم يتم العثور على الحجز.",
      fr: "La réservation est introuvable.",
      en: "The booking was not found.",
    },
    forbidden: {
      ar: "لا يمكنك إدارة هذا الحجز.",
      fr: "Vous ne pouvez pas gérer cette réservation.",
      en: "You cannot manage this booking.",
    },
    paidOnly: {
      ar: "يمكن تعديل أو إلغاء الحجوزات المدفوعة فقط.",
      fr: "Seules les réservations payées peuvent être modifiées ou annulées.",
      en: "Only paid bookings can be changed or cancelled.",
    },
    missingDate: {
      ar: "تعذر تحديد تاريخ ووقت الجلسة.",
      fr: "Impossible de déterminer la date et l’heure de la séance.",
      en: "Unable to determine the session date and time.",
    },
    tooLate: {
      ar: "لم يعد من الممكن تغيير أو إلغاء الجلسة قبل أقل من 24 ساعة من موعدها.",
      fr: "Il n’est plus possible de modifier ou d’annuler la séance à moins de 24 heures du rendez-vous.",
      en: "The session can no longer be changed or cancelled less than 24 hours before the appointment.",
    },
    unsupportedRefund: {
      ar: "الاسترداد التلقائي لهذه وسيلة الدفع غير متاح بعد. يرجى التواصل مع دعم AAN.",
      fr: "Le remboursement automatique pour ce moyen de paiement n’est pas encore disponible. Veuillez contacter le support AAN.",
      en: "Automatic refunds for this payment method are not available yet. Please contact AAN support.",
    },
    missingTransaction: {
      ar: "مرجع معاملة الدفع غير موجود.",
      fr: "La référence de transaction de paiement est manquante.",
      en: "The payment transaction reference is missing.",
    },
    stripeConfig: {
      ar: "إعدادات Stripe غير مكتملة.",
      fr: "La configuration Stripe est incomplète.",
      en: "Stripe configuration is incomplete.",
    },
    missingNewSlot: {
      ar: "يرجى اختيار موعد جديد.",
      fr: "Veuillez choisir un nouveau créneau.",
      en: "Please choose a new appointment time.",
    },
    slotNotAvailable: {
      ar: "هذا الموعد لم يعد متاحاً. يرجى اختيار موعد آخر.",
      fr: "Ce créneau n’est plus disponible. Veuillez en choisir un autre.",
      en: "This time is no longer available. Please choose another one.",
    },
    wrongTherapist: {
      ar: "يمكن تغيير الموعد فقط مع نفس المختص.",
      fr: "Le changement de créneau doit rester avec le même spécialiste.",
      en: "The appointment can only be rescheduled with the same specialist.",
    },
    generic: {
      ar: "تعذر تنفيذ هذا الإجراء.",
      fr: "Impossible d’effectuer cette action.",
      en: "Unable to perform this action.",
    },
  } as const;

  return messages[key][language];
}

function ensureMoreThan24Hours(
  booking: BookingRow,
  language: Language,
) {
  if (!booking.scheduled_start) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          error: getErrorMessage(
            language,
            "missingDate",
          ),
        },
        {
          status: 400,
        },
      ),
    };
  }

  const scheduledStartMs =
    new Date(
      booking.scheduled_start,
    ).getTime();

  if (
    Number.isNaN(scheduledStartMs)
  ) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          error: getErrorMessage(
            language,
            "missingDate",
          ),
        },
        {
          status: 400,
        },
      ),
    };
  }

  const remainingMs =
    scheduledStartMs - Date.now();

  if (
    remainingMs <= CHANGE_DEADLINE_MS
  ) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          error: getErrorMessage(
            language,
            "tooLate",
          ),
          code: "CHANGE_WINDOW_CLOSED",
          scheduledStart:
            booking.scheduled_start,
        },
        {
          status: 409,
        },
      ),
    };
  }

  return {
    ok: true as const,
    scheduledStartMs,
  };
}

async function resolveStripePaymentIntent(
  stripe: Stripe,
  transactionId: string,
) {
  let paymentReference =
    transactionId.trim();

  if (
    paymentReference.startsWith("cs_")
  ) {
    const checkoutSession =
      await stripe.checkout.sessions.retrieve(
        paymentReference,
      );

    const paymentIntent =
      checkoutSession.payment_intent;

    paymentReference =
      typeof paymentIntent === "string"
        ? paymentIntent
        : paymentIntent?.id || "";
  }

  if (
    !paymentReference.startsWith("pi_")
  ) {
    throw new Error(
      "A valid Stripe PaymentIntent could not be determined.",
    );
  }

  return paymentReference;
}


type AvailabilitySlotRow = {
  id: string;
  therapist_id: string;
  slot_date: string | null;
  day: string | null;
  time: string;
  starts_at: string | null;
  ends_at: string | null;
  is_booked: boolean | null;
};

function parseSlotTime(time: string) {
  const normalized = time.trim().toUpperCase();
  const match = normalized.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] || "0");
  const period = match[3];
  if (Number.isNaN(hour) || Number.isNaN(minute) || minute < 0 || minute > 59) return null;
  if (period) {
    if (hour < 1 || hour > 12) return null;
    if (period === "PM" && hour < 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;
  } else if (hour < 0 || hour > 23) return null;
  return { hour, minute };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day), Number(values.hour), Number(values.minute), Number(values.second));
  return asUtc - date.getTime();
}

function getSlotScheduledStart(slot: AvailabilitySlotRow) {
  if (slot.starts_at) {
    const value = new Date(slot.starts_at);
    if (!Number.isNaN(value.getTime())) return value;
  }
  if (!slot.slot_date) return null;
  const parsed = parseSlotTime(slot.time);
  if (!parsed) return null;
  const [year, month, day] = slot.slot_date.split("-").map(Number);
  if (!year || !month || !day) return null;
  const utcGuess = new Date(Date.UTC(year, month - 1, day, parsed.hour, parsed.minute, 0));
  let offset = getTimeZoneOffsetMs(utcGuess, "Asia/Beirut");
  let result = new Date(utcGuess.getTime() - offset);
  const correctedOffset = getTimeZoneOffsetMs(result, "Asia/Beirut");
  if (correctedOffset !== offset) {
    offset = correctedOffset;
    result = new Date(utcGuess.getTime() - offset);
  }
  return result;
}

export async function POST(
  request: Request,
) {
  const supabaseAdmin =
    createSupabaseAdmin();

  try {
    const body =
      await request.json();

    const language =
      getLanguage(body.language);

    const patientUser =
      await getAuthenticatedPatient(
        request,
        supabaseAdmin,
      );

    if (!patientUser) {
      return NextResponse.json(
        {
          error: getErrorMessage(
            language,
            "auth",
          ),
        },
        {
          status: 401,
        },
      );
    }

    const bookingId =
      String(
        body.bookingId || "",
      ).trim();

    const action =
      String(
        body.action || "",
      ) as PatientAction;

    if (!bookingId) {
      return NextResponse.json(
        {
          error: getErrorMessage(
            language,
            "missingBooking",
          ),
        },
        {
          status: 400,
        },
      );
    }

    if (
      action !== "request_reschedule" &&
      action !== "reschedule" &&
      action !== "cancel_and_refund"
    ) {
      return NextResponse.json(
        {
          error: getErrorMessage(
            language,
            "invalidAction",
          ),
        },
        {
          status: 400,
        },
      );
    }

    const {
      data: booking,
      error: bookingError,
    } = await supabaseAdmin
      .from("bookings")
      .select(
        `
          id,
          patient_id,
          patient_email,
          therapist_id,
          therapist_name,
          slot_id,
          slot_day,
          slot_time,
          scheduled_start,
          scheduled_end,
          price,
          status,
          payment_provider,
          payment_transaction_id,
          reschedule_requested_by,
          reschedule_requested_at,
          cancellation_initiated_by,
          cancelled_at,
          refund_id,
          refunded_at,
          meeting_url,
          meeting_provider,
          calendar_event_id,
          zoom_join_url,
          zoom_start_url
        `,
      )
      .eq("id", bookingId)
      .maybeSingle<BookingRow>();

    if (bookingError) {
      throw bookingError;
    }

    if (!booking) {
      return NextResponse.json(
        {
          error: getErrorMessage(
            language,
            "notFound",
          ),
        },
        {
          status: 404,
        },
      );
    }

    if (
      booking.patient_id !== patientUser.id
    ) {
      return NextResponse.json(
        {
          error: getErrorMessage(
            language,
            "forbidden",
          ),
        },
        {
          status: 403,
        },
      );
    }

    if (
      booking.status !== "paid"
    ) {
      return NextResponse.json(
        {
          error: getErrorMessage(
            language,
            "paidOnly",
          ),
        },
        {
          status: 409,
        },
      );
    }

    const deadlineCheck =
      ensureMoreThan24Hours(
        booking,
        language,
      );

    if (!deadlineCheck.ok) {
      return deadlineCheck.response;
    }

    if (
      action === "request_reschedule"
    ) {
      const now =
        new Date().toISOString();

      const {
        error: updateError,
      } = await supabaseAdmin
        .from("bookings")
        .update({
          reschedule_requested_by:
            "patient",
          reschedule_requested_at:
            now,
        })
        .eq("id", booking.id)
        .eq("patient_id", patientUser.id)
        .eq("status", "paid");

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({
        success: true,
        action: "request_reschedule",
        bookingId: booking.id,
        rescheduleRequestedAt: now,
      });
    }

    if (action === "reschedule") {
      const newSlotId = String(body.newSlotId || "").trim();
      if (!newSlotId) {
        return NextResponse.json({ error: getErrorMessage(language, "missingNewSlot") }, { status: 400 });
      }

      const { data: newSlot, error: newSlotError } = await supabaseAdmin
        .from("availability_slots")
        .select("id, therapist_id, slot_date, day, time, starts_at, ends_at, is_booked")
        .eq("id", newSlotId)
        .maybeSingle<AvailabilitySlotRow>();

      if (newSlotError) throw newSlotError;
      if (!newSlot || newSlot.is_booked === true) {
        return NextResponse.json({ error: getErrorMessage(language, "slotNotAvailable"), code: "SLOT_NOT_AVAILABLE" }, { status: 409 });
      }
      if (newSlot.therapist_id !== booking.therapist_id) {
        return NextResponse.json({ error: getErrorMessage(language, "wrongTherapist"), code: "WRONG_THERAPIST" }, { status: 409 });
      }

      const newStart = getSlotScheduledStart(newSlot);
      if (!newStart || newStart.getTime() <= Date.now()) {
        return NextResponse.json({ error: getErrorMessage(language, "slotNotAvailable"), code: "SLOT_NOT_AVAILABLE" }, { status: 409 });
      }

      const newEndCandidate = newSlot.ends_at ? new Date(newSlot.ends_at) : null;
      const newEnd = newEndCandidate && !Number.isNaN(newEndCandidate.getTime())
        ? newEndCandidate
        : new Date(newStart.getTime() + 2 * 60 * 60 * 1000);

      const { data: claimedSlot, error: claimError } = await supabaseAdmin
        .from("availability_slots")
        .update({ is_booked: true })
        .eq("id", newSlot.id)
        .eq("therapist_id", booking.therapist_id)
        .eq("is_booked", false)
        .select("id")
        .maybeSingle<{ id: string }>();

      if (claimError) throw claimError;
      if (!claimedSlot) {
        return NextResponse.json({ error: getErrorMessage(language, "slotNotAvailable"), code: "SLOT_NOT_AVAILABLE" }, { status: 409 });
      }

      const oldSlotId = booking.slot_id;
      const { error: bookingUpdateError } = await supabaseAdmin
        .from("bookings")
        .update({
          slot_id: newSlot.id,
          slot_day: newSlot.day || booking.slot_day,
          slot_time: newSlot.time,
          scheduled_start: newStart.toISOString(),
          scheduled_end: newEnd.toISOString(),
          reschedule_requested_by: null,
          reschedule_requested_at: null,
          meeting_url: null,
          meeting_provider: null,
          calendar_event_id: null,
          zoom_join_url: null,
          zoom_start_url: null,
        })
        .eq("id", booking.id)
        .eq("patient_id", patientUser.id)
        .eq("status", "paid");

      if (bookingUpdateError) {
        await supabaseAdmin.from("availability_slots").update({ is_booked: false }).eq("id", newSlot.id);
        throw bookingUpdateError;
      }

      if (oldSlotId && oldSlotId !== newSlot.id) {
        const { error: oldSlotReleaseError } = await supabaseAdmin
          .from("availability_slots")
          .update({ is_booked: false })
          .eq("id", oldSlotId)
          .eq("therapist_id", booking.therapist_id);
        if (oldSlotReleaseError) console.error("Old slot release warning after reschedule:", oldSlotReleaseError);
      }

      return NextResponse.json({
        success: true,
        action: "reschedule",
        bookingId: booking.id,
        oldSlotId,
        newSlotId: newSlot.id,
        scheduledStart: newStart.toISOString(),
        paymentPreserved: true,
      });
    }

    if (
      action === "cancel_and_refund"
    ) {
      const provider =
        (
          booking.payment_provider || ""
        )
          .trim()
          .toLowerCase();

      if (
        provider === "whish" ||
        provider === "whish_money" ||
        provider === "omt"
      ) {
        return NextResponse.json(
          {
            error: getErrorMessage(
              language,
              "unsupportedRefund",
            ),
            code:
              "REFUND_PROVIDER_NOT_CONFIGURED",
            paymentProvider: provider,
          },
          {
            status: 409,
          },
        );
      }

      if (
        provider !== "stripe"
      ) {
        return NextResponse.json(
          {
            error: getErrorMessage(
              language,
              "unsupportedRefund",
            ),
            code:
              "REFUND_PROVIDER_NOT_CONFIGURED",
            paymentProvider:
              provider || null,
          },
          {
            status: 409,
          },
        );
      }

      if (
        !booking.payment_transaction_id
      ) {
        return NextResponse.json(
          {
            error: getErrorMessage(
              language,
              "missingTransaction",
            ),
          },
          {
            status: 400,
          },
        );
      }

      const stripeSecretKey =
        process.env.STRIPE_SECRET_KEY;

      if (!stripeSecretKey) {
        return NextResponse.json(
          {
            error: getErrorMessage(
              language,
              "stripeConfig",
            ),
          },
          {
            status: 500,
          },
        );
      }

      const stripe =
        new Stripe(stripeSecretKey);

      const paymentIntentId =
        await resolveStripePaymentIntent(
          stripe,
          booking.payment_transaction_id,
        );

      const refund =
        await stripe.refunds.create(
          {
            payment_intent:
              paymentIntentId,
            reason:
              "requested_by_customer",
            metadata: {
              bookingId: booking.id,
              initiatedBy: "patient",
              cancellationPolicy:
                "more_than_24_hours",
            },
          },
          {
            idempotencyKey:
              `booking-${booking.id}-patient-cancel`,
          },
        );

      if (
        refund.status !== "succeeded" &&
        refund.status !== "pending"
      ) {
        return NextResponse.json(
          {
            error:
              `Stripe refund status: ${refund.status}`,
          },
          {
            status: 409,
          },
        );
      }

      const now =
        new Date().toISOString();

      const {
        error: cancellationError,
      } = await supabaseAdmin
        .from("bookings")
        .update({
          status: "cancelled",
          cancellation_initiated_by:
            "patient",
          cancelled_at: now,
          refund_id: refund.id,
          refunded_at:
            refund.status === "succeeded"
              ? now
              : null,
          reschedule_requested_by:
            null,
          reschedule_requested_at:
            null,
          meeting_url: null,
          meeting_provider: null,
          calendar_event_id: null,
          zoom_join_url: null,
          zoom_start_url: null,
        })
        .eq("id", booking.id)
        .eq("patient_id", patientUser.id)
        .eq("status", "paid");

      if (cancellationError) {
        console.error(
          "CRITICAL: refund created but booking update failed.",
          {
            bookingId: booking.id,
            refundId: refund.id,
            cancellationError,
          },
        );

        throw new Error(
          "Refund was created but the booking could not be updated. Please contact an administrator.",
        );
      }

      try {
        const paymentStatus =
          refund.status === "succeeded"
            ? "refunded"
            : "refund_pending";

        const {
          error: paymentUpdateError,
        } = await supabaseAdmin
          .from("payments")
          .update({
            status: paymentStatus,
          })
          .eq("booking_id", booking.id)
          .eq("provider", "stripe");

        if (paymentUpdateError) {
          console.error(
            "Payment status update warning:",
            paymentUpdateError,
          );
        }
      } catch (paymentTableError) {
        console.error(
          "Payment table update warning:",
          paymentTableError,
        );
      }

      if (booking.slot_id) {
        const {
          error: slotReleaseError,
        } = await supabaseAdmin
          .from("availability_slots")
          .update({
            is_booked: false,
          })
          .eq("id", booking.slot_id);

        if (slotReleaseError) {
          console.error(
            "Cancelled booking slot release warning:",
            slotReleaseError,
          );
        }
      }

      return NextResponse.json({
        success: true,
        action: "cancel_and_refund",
        bookingId: booking.id,
        paymentProvider: "stripe",
        refund: {
          id: refund.id,
          status: refund.status,
        },
      });
    }

    return NextResponse.json(
      {
        error: getErrorMessage(
          language,
          "generic",
        ),
      },
      {
        status: 400,
      },
    );
  } catch (error) {
    console.error(
      "Patient booking action error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to manage booking.",
      },
      {
        status: 500,
      },
    );
  }
}

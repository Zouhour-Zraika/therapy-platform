import {
  createClient,
} from "@supabase/supabase-js";

import {
  NextResponse,
} from "next/server";

import Stripe from "stripe";

import {
  createGoogleCalendarEventForBooking,
  createGoogleMeetContinuationForBooking,
  createGoogleMeetForBooking,
} from "@/lib/googleCalendar";

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

  hold_expires_at:
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

  meeting_url:
    | string
    | null;

  meeting_provider:
    | string
    | null;

  calendar_event_id:
    | string
    | null;

  zoom_join_url:
    | string
    | null;

  zoom_start_url:
    | string
    | null;

  service_type:
    | string
    | null;

  duration_minutes:
    | number
    | null;

  backup_meeting_provider:
    | string
    | null;

  backup_join_url:
    | string
    | null;

  backup_host_url:
    | string
    | null;

  backup_calendar_event_id:
    | string
    | null;
};

type MeetingProvider =
  | "google_meet"
  | "zoom";

type TherapistAssignmentInfo = {
  id: string;
  care_domain:
    | string
    | null;

  preferred_meeting_provider:
    | MeetingProvider
    | null;
};

type ZoomConnection = {
  access_token:
    | string
    | null;

  refresh_token:
    | string
    | null;

  token_expires_at:
    | string
    | null;
};

type ZoomTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  reason?: string;
};

type ZoomMeetingResponse = {
  id?: number;
  join_url?: string;
  start_url?: string;
  message?: string;
  code?: number;
};

type ActiveAssignment = {
  id: string;
  therapist_id: string;
  care_domain: string;
  status: string;
};


type BusinessSettingsRow = {
  aan_commission_rate:
    | number
    | string
    | null;
};

type ExistingPaymentFinancials = {
  aan_commission_rate:
    | number
    | null;
  aan_commission_amount:
    | number
    | null;
  specialist_rate:
    | number
    | null;
  specialist_amount:
    | number
    | null;
};


type PatientPackRecord = {
  id: string;
  patient_id: string;
  therapist_id: string;
  therapist_service_id: string;
  sessions_total: number;
  sessions_remaining: number;
  session_price: number;
  discount_rate: number;
  total_price: number;
  status: string;
  purchased_at: string | null;
  valid_until: string | null;
  payment_provider: string | null;
  payment_transaction_id: string | null;
  aan_commission_rate: number | null;
  aan_commission_amount: number | null;
  specialist_rate: number | null;
  specialist_amount: number | null;
};

type PatientPackTherapistInfo = {
  id: string;
  care_domain: string | null;
};

function roundMoney(value: number) {
  return Math.round(
    (value + Number.EPSILON) * 100,
  ) / 100;
}

async function refundExpiredCheckoutPayment({
  stripe,
  session,
  bookingId,
}: {
  stripe: Stripe;
  session: Stripe.Checkout.Session;
  bookingId: string;
}) {
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  if (!paymentIntentId) {
    throw new Error(
      "Late Stripe payment cannot be refunded because PaymentIntent is missing.",
    );
  }

  return stripe.refunds.create(
    {
      payment_intent: paymentIntentId,
      reason: "requested_by_customer",
      metadata: {
        bookingId,
        reason: "booking_hold_expired",
        initiatedBy: "system",
      },
    },
    {
      idempotencyKey:
        `booking-${bookingId}-expired-hold-refund`,
    },
  );
}

async function refreshZoomAccessToken({
  therapistId,
  refreshToken,
  supabaseAdmin,
}: {
  therapistId: string;
  refreshToken: string;
  supabaseAdmin: any;
}) {
  const clientId =
    process.env
      .ZOOM_OAUTH_CLIENT_ID;

  const clientSecret =
    process.env
      .ZOOM_OAUTH_CLIENT_SECRET;

  if (
    !clientId ||
    !clientSecret
  ) {
    throw new Error(
      "Zoom OAuth configuration is missing.",
    );
  }

  const basicAuth =
    Buffer.from(
      `${clientId}:${clientSecret}`,
    ).toString("base64");

  const response =
    await fetch(
      "https://zoom.us/oauth/token",
      {
        method: "POST",

        headers: {
          Authorization:
            `Basic ${basicAuth}`,

          "Content-Type":
            "application/x-www-form-urlencoded",
        },

        body:
          new URLSearchParams({
            grant_type:
              "refresh_token",

            refresh_token:
              refreshToken,
          }),
      },
    );

  const data =
    (await response.json()) as
      ZoomTokenResponse;

  if (
    !response.ok ||
    !data.access_token
  ) {
    console.error(
      "Zoom access token refresh failed:",
      {
        status:
          response.status,

        error:
          data.error,

        reason:
          data.reason,
      },
    );

    throw new Error(
      "Unable to refresh Zoom access token.",
    );
  }

  const expiresAt =
    typeof data.expires_in ===
    "number"
      ? new Date(
          Date.now() +
            data.expires_in *
              1000,
        ).toISOString()
      : null;

  const {
    error:
      connectionUpdateError,
  } =
    await supabaseAdmin
      .from(
        "therapist_zoom_connections",
      )
      .update({
        access_token:
          data.access_token,

        refresh_token:
          data.refresh_token ||
          refreshToken,

        token_expires_at:
          expiresAt,


        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "therapist_id",
        therapistId,
      );

  if (
    connectionUpdateError
  ) {
    throw connectionUpdateError;
  }

  return data.access_token;
}

async function getZoomAccessToken({
  therapistId,
  supabaseAdmin,
}: {
  therapistId: string;
  supabaseAdmin: any;
}) {
  const {
    data: connection,
    error:
      connectionError,
  } =
    await supabaseAdmin
      .from(
        "therapist_zoom_connections",
      )
      .select(
        "access_token, refresh_token, token_expires_at",
      )
      .eq(
        "therapist_id",
        therapistId,
      )
      .maybeSingle();

  const zoomConnection =
    connection as ZoomConnection | null;

  if (
    connectionError
  ) {
    throw connectionError;
  }

  if (!connection) {
    throw new Error(
      "The specialist has not connected a Zoom account.",
    );
  }

  const expiresAt =
    connection.token_expires_at
      ? new Date(
          connection.token_expires_at,
        ).getTime()
      : 0;

  if (
    connection.access_token &&
    expiresAt >
      Date.now() + 60_000
  ) {
    return connection.access_token;
  }

  if (
    !connection.refresh_token
  ) {
    throw new Error(
      "The specialist Zoom connection must be renewed.",
    );
  }

  return refreshZoomAccessToken({
    therapistId,
    refreshToken:
      connection.refresh_token,
    supabaseAdmin,
  });
}

async function createZoomMeetingForBooking({
  therapistId,
  therapistName,
  start,
  end,
  supabaseAdmin,
  continuation = false,
}: {
  therapistId: string;
  therapistName: string;
  start: string;
  end: string;
  supabaseAdmin: any;
  continuation?: boolean;
}) {
  const accessToken =
    await getZoomAccessToken({
      therapistId,
      supabaseAdmin,
    });

  const startDate =
    new Date(start);

  const endDate =
    new Date(end);

  if (
    Number.isNaN(
      startDate.getTime(),
    ) ||
    Number.isNaN(
      endDate.getTime(),
    )
  ) {
    throw new Error(
      "Invalid session schedule for Zoom.",
    );
  }

  const durationMinutes =
    Math.max(
      1,
      Math.round(
        (
          endDate.getTime() -
          startDate.getTime()
        ) /
          60_000,
      ),
    );

  const response =
    await fetch(
      "https://api.zoom.us/v2/users/me/meetings",
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${accessToken}`,

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            topic:
              continuation
                ? `AAN Psychotherapy — ${therapistName} — Continuation`
                : `AAN Psychotherapy — ${therapistName}`,

            type: 2,

            start_time:
              startDate.toISOString(),

            duration:
              durationMinutes,

            timezone:
              "Asia/Beirut",

            agenda:
              continuation
                ? "AAN psychotherapy session — continuation room"
                : "AAN psychotherapy session",

            settings: {
              join_before_host:
                false,

              waiting_room:
                true,

              mute_upon_entry:
                true,
            },
          }),
      },
    );

  const meeting =
    (await response.json()) as
      ZoomMeetingResponse;

  if (
    !response.ok ||
    !meeting.join_url ||
    !meeting.start_url
  ) {
    console.error(
      "Zoom meeting creation failed:",
      {
        status:
          response.status,

        code:
          meeting.code,

        message:
          meeting.message,
      },
    );

    throw new Error(
      meeting.message ||
        "Unable to create the Zoom meeting.",
    );
  }

  return {
    provider:
      "zoom" as const,

    joinUrl:
      meeting.join_url,

    startUrl:
      meeting.start_url,
  };
}

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
     * PATIENT PACK
     * =======================================================
     *
     * Une Checkout Session de type "patient_pack" n'est pas
     * liée à un booking. Le paiement active le crédit de
     * séances, puis les séances seront réservées une par une.
     */
    const purchaseType =
      session.metadata
        ?.purchaseType
        ?.trim();

    if (
      purchaseType ===
      "patient_pack"
    ) {
      const packId =
        session.metadata
          ?.packId
          ?.trim();

      if (!packId) {
        console.error(
          "Stripe Patient Pack session does not contain packId:",
          session.id,
        );

        return NextResponse.json(
          {
            error:
              "Patient Pack identifier is missing.",
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

      const paymentIntentId =
        typeof session
          .payment_intent ===
        "string"
          ? session.payment_intent
          : session
              .payment_intent
              ?.id;

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
       * Le pack est toujours relu dans Supabase.
       * Stripe metadata sert à identifier l'achat,
       * mais pas à déterminer son prix.
       */
      const {
        data:
          existingPack,
        error:
          packReadError,
      } =
        await supabaseAdmin
          .from(
            "patient_packs",
          )
          .select(
            `
              id,
              patient_id,
              therapist_id,
              therapist_service_id,
              sessions_total,
              sessions_remaining,
              session_price,
              discount_rate,
              total_price,
              status,
              purchased_at,
              valid_until,
              payment_provider,
              payment_transaction_id,
              aan_commission_rate,
              aan_commission_amount,
              specialist_rate,
              specialist_amount
            `,
          )
          .eq(
            "id",
            packId,
          )
          .maybeSingle<PatientPackRecord>();

      if (packReadError) {
        throw packReadError;
      }

      if (!existingPack) {
        console.error(
          "Patient Pack not found:",
          packId,
        );

        return NextResponse.json(
          {
            error:
              "Patient Pack not found.",
          },
          {
            status: 404,
          },
        );
      }

      /*
       * Vérification supplémentaire :
       * le patient contenu dans Stripe doit correspondre
       * au propriétaire du pack lorsque la metadata existe.
       */
      const metadataPatientId =
        session.metadata
          ?.patientId
          ?.trim();

      if (
        metadataPatientId &&
        metadataPatientId !==
          existingPack.patient_id
      ) {
        console.error(
          "Patient Pack ownership mismatch:",
          {
            packId,
            metadataPatientId,
            packPatientId:
              existingPack.patient_id,
          },
        );

        return NextResponse.json(
          {
            error:
              "Patient Pack ownership mismatch.",
          },
          {
            status: 400,
          },
        );
      }

      const packPrice =
        Number(
          existingPack.total_price,
        );

      if (
        !Number.isFinite(
          packPrice,
        ) ||
        packPrice <= 0
      ) {
        return NextResponse.json(
          {
            error:
              "Patient Pack price is invalid.",
          },
          {
            status: 400,
          },
        );
      }

      if (
        Math.abs(
          amount -
            packPrice,
        ) > 0.001
      ) {
        console.error(
          "Stripe Patient Pack amount mismatch:",
          {
            packId,
            expectedAmount:
              packPrice,
            paidAmount:
              amount,
            sessionId:
              session.id,
          },
        );

        return NextResponse.json(
          {
            error:
              "Payment amount does not match the Patient Pack price.",
          },
          {
            status: 400,
          },
        );
      }

      /*
       * Commission AAN :
       * - nouveau paiement = snapshot du taux admin courant ;
       * - replay Stripe = conservation du snapshot déjà présent.
       */
      const {
        data:
          businessSettings,
        error:
          businessSettingsError,
      } =
        await supabaseAdmin
          .from(
            "platform_business_settings",
          )
          .select(
            "aan_commission_rate",
          )
          .eq(
            "id",
            1,
          )
          .maybeSingle<BusinessSettingsRow>();

      if (
        businessSettingsError
      ) {
        throw businessSettingsError;
      }

      const configuredCommissionRate =
        Number(
          businessSettings
            ?.aan_commission_rate ??
            30,
        );

      if (
        !Number.isFinite(
          configuredCommissionRate,
        ) ||
        configuredCommissionRate < 0 ||
        configuredCommissionRate > 100
      ) {
        throw new Error(
          "Invalid AAN commission rate configuration.",
        );
      }

      const configuredSpecialistRate =
        roundMoney(
          100 -
            configuredCommissionRate,
        );

      const hasHistoricalFinancialSnapshot =
        existingPack
          .aan_commission_rate !==
          null &&
        existingPack
          .aan_commission_amount !==
          null &&
        existingPack
          .specialist_rate !==
          null &&
        existingPack
          .specialist_amount !==
          null;

      const aanCommissionRate =
        hasHistoricalFinancialSnapshot
          ? Number(
              existingPack
                .aan_commission_rate,
            )
          : configuredCommissionRate;

      const specialistRate =
        hasHistoricalFinancialSnapshot
          ? Number(
              existingPack
                .specialist_rate,
            )
          : configuredSpecialistRate;

      const aanCommissionAmount =
        hasHistoricalFinancialSnapshot
          ? Number(
              existingPack
                .aan_commission_amount,
            )
          : roundMoney(
              amount *
                (
                  aanCommissionRate /
                  100
                ),
            );

      const specialistAmount =
        hasHistoricalFinancialSnapshot
          ? Number(
              existingPack
                .specialist_amount,
            )
          : roundMoney(
              amount -
                aanCommissionAmount,
            );

      /*
       * Validité :
       * le nombre de mois est celui snapshoté dans
       * la Checkout Session créée par notre serveur.
       */
      const validityMonths =
        Number(
          session.metadata
            ?.validityMonths,
        );

      if (
        !Number.isInteger(
          validityMonths,
        ) ||
        validityMonths <= 0
      ) {
        throw new Error(
          "Patient Pack validity is missing or invalid.",
        );
      }

      const packWasAlreadyActive =
        existingPack.status ===
          "active" ||
        existingPack.status ===
          "used";

      let purchasedAt =
        existingPack
          .purchased_at;

      let validUntil =
        existingPack
          .valid_until;

      if (!purchasedAt) {
        purchasedAt =
          new Date().toISOString();
      }

      if (!validUntil) {
        const expiry =
          new Date(
            purchasedAt,
          );

        expiry.setUTCMonth(
          expiry.getUTCMonth() +
            validityMonths,
        );

        validUntil =
          expiry.toISOString();
      }

      /*
       * On ne réinitialise JAMAIS sessions_remaining
       * lors d'un replay du webhook.
       */
      const {
        data:
          updatedPack,
        error:
          packUpdateError,
      } =
        await supabaseAdmin
          .from(
            "patient_packs",
          )
          .update({
            status:
              packWasAlreadyActive
                ? existingPack.status
                : "active",

            purchased_at:
              purchasedAt,

            valid_until:
              validUntil,

            payment_provider:
              "stripe",

            payment_transaction_id:
              existingPack
                .payment_transaction_id ||
              transactionId,

            aan_commission_rate:
              aanCommissionRate,

            aan_commission_amount:
              aanCommissionAmount,

            specialist_rate:
              specialistRate,

            specialist_amount:
              specialistAmount,

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            packId,
          )
          .select(
            `
              id,
              patient_id,
              therapist_id,
              therapist_service_id,
              sessions_total,
              sessions_remaining,
              session_price,
              discount_rate,
              total_price,
              status,
              purchased_at,
              valid_until,
              payment_provider,
              payment_transaction_id,
              aan_commission_rate,
              aan_commission_amount,
              specialist_rate,
              specialist_amount
            `,
          )
          .maybeSingle<PatientPackRecord>();

      if (
        packUpdateError
      ) {
        throw packUpdateError;
      }

      if (!updatedPack) {
        throw new Error(
          "Patient Pack was not updated after successful payment.",
        );
      }

      /*
       * Acheter un pack avec un spécialiste crée/conserve
       * aussi la relation clinique active pour ce domaine,
       * exactement comme un paiement de séance.
       */
      const {
        data:
          packTherapist,
        error:
          packTherapistError,
      } =
        await supabaseAdmin
          .from(
            "therapists",
          )
          .select(
            "id, care_domain",
          )
          .eq(
            "id",
            updatedPack
              .therapist_id,
          )
          .maybeSingle<PatientPackTherapistInfo>();

      if (
        packTherapistError
      ) {
        throw packTherapistError;
      }

      const careDomain =
        packTherapist
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
              "id, therapist_id, care_domain, status",
            )
            .eq(
              "patient_id",
              updatedPack
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
                  updatedPack
                    .patient_id,

                therapist_id:
                  updatedPack
                    .therapist_id,

                care_domain:
                  careDomain,

                status:
                  "active",
              });

          if (
            assignmentInsertError
          ) {
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
                  "id, therapist_id, care_domain, status",
                )
                .eq(
                  "patient_id",
                  updatedPack
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
              updatedPack
                .therapist_id
            ) {
              console.error(
                "CLINICAL ASSIGNMENT CONFLICT AFTER PACK PAYMENT:",
                {
                  packId,
                  patientId:
                    updatedPack.patient_id,
                  paidTherapistId:
                    updatedPack.therapist_id,
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
          updatedPack
            .therapist_id
        ) {
          console.error(
            "CLINICAL ASSIGNMENT CONFLICT AFTER PACK PAYMENT:",
            {
              packId,
              patientId:
                updatedPack.patient_id,
              paidTherapistId:
                updatedPack.therapist_id,
              activeTherapistId:
                activeAssignment
                  .therapist_id,
              careDomain,
            },
          );
        }
      }

      console.log(
        "STRIPE PATIENT PACK PAYMENT CONFIRMED:",
        {
          packId,

          patientId:
            updatedPack.patient_id,

          therapistId:
            updatedPack.therapist_id,

          transactionId,

          amount,

          currency,

          sessionsTotal:
            updatedPack.sessions_total,

          sessionsRemaining:
            updatedPack.sessions_remaining,

          purchasedAt:
            updatedPack.purchased_at,

          validUntil:
            updatedPack.valid_until,

          aanCommissionRate,

          aanCommissionAmount,

          specialistRate,

          specialistAmount,

          alreadyProcessed:
            packWasAlreadyActive,
        },
      );

      return NextResponse.json({
        received:
          true,

        purchaseType:
          "patient_pack",

        packId,

        packStatus:
          updatedPack.status,

        paymentStatus:
          "paid",

        paymentProvider:
          "stripe",

        paymentMethod:
          "card",

        transactionId,

        amount,

        currency,

        sessionsTotal:
          updatedPack.sessions_total,

        sessionsRemaining:
          updatedPack.sessions_remaining,

        purchasedAt:
          updatedPack.purchased_at,

        validUntil:
          updatedPack.valid_until,

        aanCommissionRate,

        aanCommissionAmount,

        specialistRate,

        specialistAmount,

        alreadyProcessed:
          packWasAlreadyActive,
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
            hold_expires_at,
            payment_provider,
            payment_method,
            payment_transaction_id,
            meeting_url,
            meeting_provider,
            calendar_event_id,
            zoom_join_url,
            zoom_start_url,
            service_type,
            duration_minutes,
            backup_meeting_provider,
            backup_join_url,
            backup_host_url,
            backup_calendar_event_id
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
      /*
       * Le booking peut avoir été supprimé après expiration du hold
       * (ou annulé par le patient) alors qu'une ancienne page Stripe
       * est restée ouverte. Le paiement ne doit jamais ressusciter
       * une réservation inexistante.
       *
       * Puisque Stripe nous indique ici que le paiement est déjà
       * encaissé, on le rembourse immédiatement et on répond 200
       * pour éviter les retries du webhook.
       */
      console.error(
        "Paid Stripe Checkout received for missing booking:",
        {
          bookingId,
          sessionId: session.id,
        },
      );

      try {
        const lateRefund =
          await refundExpiredCheckoutPayment({
            stripe,
            session,
            bookingId,
          });

        return NextResponse.json({
          received: true,
          ignored: true,
          reason:
            "Booking no longer exists. Payment was automatically refunded.",
          bookingId,
          refundId: lateRefund.id,
          refundStatus: lateRefund.status,
        });
      } catch (lateRefundError) {
        console.error(
          "CRITICAL: paid Stripe Checkout references a missing booking and automatic refund failed:",
          {
            bookingId,
            sessionId: session.id,
            error: lateRefundError,
          },
        );

        /*
         * 500 est volontaire ici : Stripe réessaiera le webhook.
         * On préfère un retry plutôt que de laisser un paiement
         * encaissé sans réservation ni remboursement.
         */
        throw lateRefundError;
      }
    }

    /*
     * =======================================================
     * Protection du hold de 10 minutes.
     *
     * On compare l'heure réelle de l'événement Stripe
     * (event.created) au hold_expires_at stocké dans Supabase.
     * Ainsi, un simple retard de livraison du webhook ne provoque
     * pas un faux remboursement.
     *
     * IMPORTANT :
     * - un booking déjà "paid" est un replay idempotent normal ;
     * - seul un booking encore "pending" et payé après expiration
     *   est considéré comme un paiement tardif.
     * =======================================================
     */
    if (
      existingBooking.status === "pending" &&
      existingBooking.hold_expires_at
    ) {
      const holdExpiresAtMs =
        new Date(
          existingBooking.hold_expires_at,
        ).getTime();

      const stripeCompletedAtMs =
        event.created * 1000;

      if (
        Number.isFinite(holdExpiresAtMs) &&
        stripeCompletedAtMs >
          holdExpiresAtMs
      ) {
        console.warn(
          "Late Stripe payment received after booking hold expired:",
          {
            bookingId,
            sessionId: session.id,
            holdExpiresAt:
              existingBooking.hold_expires_at,
            stripeCompletedAt:
              new Date(
                stripeCompletedAtMs,
              ).toISOString(),
          },
        );

        const lateRefund =
          await refundExpiredCheckoutPayment({
            stripe,
            session,
            bookingId,
          });

        /*
         * Marquer le booking comme annulé afin qu'il ne puisse
         * jamais être transformé en réservation payée par un replay.
         * On conserve la référence du paiement et du remboursement
         * pour l'audit.
         */
        const {
          error: expiredBookingUpdateError,
        } = await supabaseAdmin
          .from("bookings")
          .update({
            status: "cancelled",
            payment_provider: "stripe",
            payment_method: "card",
            payment_transaction_id:
              typeof session.payment_intent ===
              "string"
                ? session.payment_intent
                : session.payment_intent?.id ||
                  session.id,
            refund_id: lateRefund.id,
            refunded_at:
              lateRefund.status ===
              "succeeded"
                ? new Date().toISOString()
                : null,
          })
          .eq("id", bookingId)
          .eq("status", "pending");

        if (expiredBookingUpdateError) {
          console.error(
            "Late payment was refunded but expired booking update failed:",
            {
              bookingId,
              refundId: lateRefund.id,
              error:
                expiredBookingUpdateError,
            },
          );
        }

        /*
         * Ne jamais libérer aveuglément le slot : il peut avoir été
         * repris par un autre patient après les 10 minutes.
         * On ne le remet disponible que s'il n'existe aucune autre
         * réservation active pour ce slot.
         */
        if (existingBooking.slot_id) {
          const {
            data: competingBookings,
            error: competingBookingError,
          } = await supabaseAdmin
            .from("bookings")
            .select("id")
            .eq(
              "slot_id",
              existingBooking.slot_id,
            )
            .neq("id", bookingId)
            .in("status", [
              "pending",
              "paid",
            ])
            .limit(1);

          if (competingBookingError) {
            console.error(
              "Unable to verify slot ownership after late payment refund:",
              {
                bookingId,
                slotId:
                  existingBooking.slot_id,
                error:
                  competingBookingError,
              },
            );
          } else if (
            !competingBookings ||
            competingBookings.length === 0
          ) {
            const {
              error: slotReleaseError,
            } = await supabaseAdmin
              .from("availability_slots")
              .update({
                is_booked: false,
              })
              .eq(
                "id",
                existingBooking.slot_id,
              )
              .eq(
                "therapist_id",
                existingBooking.therapist_id,
              );

            if (slotReleaseError) {
              console.error(
                "Expired slot release warning after late Stripe payment refund:",
                {
                  bookingId,
                  slotId:
                    existingBooking.slot_id,
                  error:
                    slotReleaseError,
                },
              );
            }
          }
        }

        return NextResponse.json({
          received: true,
          ignored: true,
          reason:
            "Booking hold expired before payment. Payment was automatically refunded.",
          bookingId,
          refundId: lateRefund.id,
          refundStatus: lateRefund.status,
        });
      }
    }

    /*
     * Une réservation qui n'est plus pending ne doit jamais être
     * ressuscitée par un ancien événement Checkout. Les bookings
     * déjà paid continuent normalement pour l'idempotence.
     */
    if (
      existingBooking.status !== "pending" &&
      existingBooking.status !== "paid"
    ) {
      console.warn(
        "Stripe payment ignored because booking is no longer payable:",
        {
          bookingId,
          bookingStatus:
            existingBooking.status,
          sessionId: session.id,
        },
      );

      return NextResponse.json({
        received: true,
        ignored: true,
        reason:
          "Booking is no longer payable.",
        bookingId,
        bookingStatus:
          existingBooking.status,
      });
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
     * Charger la commission AAN depuis les paramètres métier.
     *
     * La valeur par défaut de 30% sert uniquement de filet
     * de sécurité si la ligne de configuration n'existe pas.
     * Les administrateurs peuvent modifier ce taux depuis
     * platform_business_settings sans redéployer le code.
     * =======================================================
     */
    const {
      data:
        businessSettings,
      error:
        businessSettingsError,
    } =
      await supabaseAdmin
        .from(
          "platform_business_settings",
        )
        .select(
          "aan_commission_rate",
        )
        .eq(
          "id",
          1,
        )
        .maybeSingle<BusinessSettingsRow>();

    if (
      businessSettingsError
    ) {
      throw businessSettingsError;
    }

    const configuredCommissionRate =
      Number(
        businessSettings
          ?.aan_commission_rate ??
          30,
      );

    if (
      !Number.isFinite(
        configuredCommissionRate,
      ) ||
      configuredCommissionRate < 0 ||
      configuredCommissionRate > 100
    ) {
      throw new Error(
        "Invalid AAN commission rate configuration.",
      );
    }

    const configuredSpecialistRate =
      roundMoney(
        100 -
          configuredCommissionRate,
      );

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
     * Paiement idempotent + snapshot financier historique.
     *
     * IMPORTANT :
     * - pour un NOUVEAU paiement, on snapshot le taux admin
     *   courant et les montants 30/70 correspondants ;
     * - si Stripe rejoue le même webhook plus tard après un
     *   changement de commission, on conserve le snapshot
     *   historique déjà enregistré pour cette transaction.
     * =======================================================
     */

    const {
      data:
        existingPayment,
      error:
        existingPaymentError,
    } =
      await supabaseAdmin
        .from("payments")
        .select(
          `
            aan_commission_rate,
            aan_commission_amount,
            specialist_rate,
            specialist_amount
          `,
        )
        .eq(
          "transaction_id",
          transactionId,
        )
        .maybeSingle<ExistingPaymentFinancials>();

    if (
      existingPaymentError
    ) {
      throw existingPaymentError;
    }

    const existingAanCommissionRate =
      existingPayment
        ?.aan_commission_rate;

    const existingAanCommissionAmount =
      existingPayment
        ?.aan_commission_amount;

    const existingSpecialistRate =
      existingPayment
        ?.specialist_rate;

    const existingSpecialistAmount =
      existingPayment
        ?.specialist_amount;

    const hasHistoricalFinancialSnapshot =
      existingAanCommissionRate !==
        null &&
      existingAanCommissionRate !==
        undefined &&
      existingAanCommissionAmount !==
        null &&
      existingAanCommissionAmount !==
        undefined &&
      existingSpecialistRate !==
        null &&
      existingSpecialistRate !==
        undefined &&
      existingSpecialistAmount !==
        null &&
      existingSpecialistAmount !==
        undefined;

    const aanCommissionRate =
      hasHistoricalFinancialSnapshot
        ? Number(
            existingAanCommissionRate,
          )
        : configuredCommissionRate;

    const specialistRate =
      hasHistoricalFinancialSnapshot
        ? Number(
            existingSpecialistRate,
          )
        : configuredSpecialistRate;

    const aanCommissionAmount =
      hasHistoricalFinancialSnapshot
        ? Number(
            existingAanCommissionAmount,
          )
        : roundMoney(
            amount *
              (aanCommissionRate /
                100),
          );

    const specialistAmount =
      hasHistoricalFinancialSnapshot
        ? Number(
            existingSpecialistAmount,
          )
        : roundMoney(
            amount -
              aanCommissionAmount,
          );

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

            aan_commission_rate:
              aanCommissionRate,

            aan_commission_amount:
              aanCommissionAmount,

            specialist_rate:
              specialistRate,

            specialist_amount:
              specialistAmount,
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
            hold_expires_at,
            payment_provider,
            payment_method,
            payment_transaction_id,
            meeting_url,
            meeting_provider,
            calendar_event_id,
            zoom_join_url,
            zoom_start_url,
            service_type,
            duration_minutes,
            backup_meeting_provider,
            backup_join_url,
            backup_host_url,
            backup_calendar_event_id
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
     * Charger la préférence de visioconférence du spécialiste.
     *
     * Règle :
     * - google_meet ou zoom sont les deux providers supportés ;
     * - en l'absence de préférence explicite, Google Meet reste
     *   le fallback pour compatibilité avec les réservations
     *   existantes ;
     * - la création du lien échoue sans jamais annuler un
     *   paiement Stripe déjà confirmé.
     * =======================================================
     */

    let therapistInfo:
      TherapistAssignmentInfo | null =
      null;

    if (
      updatedBooking
        .therapist_id
    ) {
      const {
        data,
        error:
          therapistInfoError,
      } =
        await supabaseAdmin
          .from("therapists")
          .select(
            `
              id,
              care_domain,
              preferred_meeting_provider
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

      therapistInfo =
        data;
    }

    const preferredMeetingProvider:
      MeetingProvider =
      therapistInfo
        ?.preferred_meeting_provider ===
      "zoom"
        ? "zoom"
        : "google_meet";

    /*
     * =======================================================
     * Créer automatiquement le lien de séance correspondant
     * au provider préféré du spécialiste + un lien de
     * continuité lorsque nécessaire.
     *
     * Règles AAN :
     * - Zoom : toujours préparer une deuxième réunion.
     * - Google Meet :
     *     individuelle -> pas de lien de continuité ;
     *     couple/famille/groupe -> lien de continuité.
     * - Même booking, même paiement, aucune séance Pack
     *   supplémentaire consommée.
     * - Le webhook reste idempotent : si un lien existe déjà,
     *   on ne le recrée pas.
     * =======================================================
     */

    if (
      updatedBooking.therapist_id &&
      updatedBooking.scheduled_start &&
      updatedBooking.scheduled_end
    ) {
      const normalizedServiceType =
        updatedBooking.service_type
          ?.trim()
          .toLowerCase() || "";

      const googleMeetNeedsContinuation =
        normalizedServiceType === "couple" ||
        normalizedServiceType === "family" ||
        normalizedServiceType === "famille" ||
        normalizedServiceType === "group" ||
        normalizedServiceType === "groupe";

      if (
        preferredMeetingProvider === "zoom"
      ) {
        /*
         * -------------------------------------------------------
         * ZOOM PRINCIPAL
         * -------------------------------------------------------
         */
        if (
          !updatedBooking.zoom_join_url ||
          !updatedBooking.zoom_start_url
        ) {
          try {
            const zoomMeeting =
              await createZoomMeetingForBooking({
                therapistId:
                  updatedBooking.therapist_id,

                therapistName:
                  updatedBooking.therapist_name ||
                  "Specialist",

                start:
                  updatedBooking.scheduled_start,

                end:
                  updatedBooking.scheduled_end,

                supabaseAdmin,
              });

            let calendarEventId =
              updatedBooking.calendar_event_id;

            if (!calendarEventId) {
              try {
                const calendarEvent =
                  await createGoogleCalendarEventForBooking({
                    therapistId:
                      updatedBooking.therapist_id,

                    summary:
                      `AAN Psychotherapy — ${updatedBooking.therapist_name || "Specialist"}`,

                    description:
                      [
                        `AAN booking ${bookingId}`,
                        "",
                        "Platform: Zoom",
                        `Join Zoom: ${zoomMeeting.joinUrl}`,
                      ].join("\n"),

                    location:
                      zoomMeeting.joinUrl,

                    start:
                      updatedBooking.scheduled_start,

                    end:
                      updatedBooking.scheduled_end,

                    timeZone:
                      "Asia/Beirut",

                    attendeeEmail:
                      updatedBooking.patient_email,
                  });

                calendarEventId =
                  calendarEvent.calendarEventId;
              } catch (calendarError) {
                console.error(
                  "Google Calendar event creation failed for Zoom booking:",
                  {
                    bookingId,
                    therapistId:
                      updatedBooking.therapist_id,
                    error:
                      calendarError,
                  },
                );
              }
            }

            const {
              data:
                bookingWithMeeting,
              error:
                meetingUpdateError,
            } =
              await supabaseAdmin
                .from("bookings")
                .update({
                  meeting_provider:
                    zoomMeeting.provider,

                  zoom_join_url:
                    zoomMeeting.joinUrl,

                  zoom_start_url:
                    zoomMeeting.startUrl,

                  calendar_event_id:
                    calendarEventId,
                })
                .eq(
                  "id",
                  bookingId,
                )
                .is(
                  "zoom_join_url",
                  null,
                )
                .select(
                  `
                    meeting_provider,
                    zoom_join_url,
                    zoom_start_url,
                    calendar_event_id
                  `,
                )
                .maybeSingle();

            if (
              meetingUpdateError
            ) {
              throw meetingUpdateError;
            }

            if (
              bookingWithMeeting
            ) {
              updatedBooking
                .meeting_provider =
                bookingWithMeeting
                  .meeting_provider;

              updatedBooking
                .zoom_join_url =
                bookingWithMeeting
                  .zoom_join_url;

              updatedBooking
                .zoom_start_url =
                bookingWithMeeting
                  .zoom_start_url;

              updatedBooking
                .calendar_event_id =
                bookingWithMeeting
                  .calendar_event_id;
            }

            console.log(
              "ZOOM MEETING CREATED:",
              {
                bookingId,
                therapistId:
                  updatedBooking
                    .therapist_id,
                meetingProvider:
                  zoomMeeting.provider,
                calendarEventId:
                  updatedBooking
                    .calendar_event_id,
              },
            );
          } catch (
            zoomMeetingError
          ) {
            console.error(
              "Zoom meeting creation failed after successful payment:",
              {
                bookingId,
                therapistId:
                  updatedBooking
                    .therapist_id,
                error:
                  zoomMeetingError,
              },
            );
          }
        }

        /*
         * -------------------------------------------------------
         * ZOOM CONTINUATION
         *
         * Toutes les séances AAN dépassent 40 minutes. On prépare
         * donc automatiquement une deuxième réunion Zoom.
         * -------------------------------------------------------
         */
        if (
          !updatedBooking.backup_join_url ||
          updatedBooking.backup_meeting_provider !==
            "zoom"
        ) {
          try {
            const zoomContinuation =
              await createZoomMeetingForBooking({
                therapistId:
                  updatedBooking.therapist_id,

                therapistName:
                  updatedBooking.therapist_name ||
                  "Specialist",

                start:
                  updatedBooking.scheduled_start,

                end:
                  updatedBooking.scheduled_end,

                supabaseAdmin,

                continuation: true,
              });

            const {
              data:
                bookingWithBackup,
              error:
                backupUpdateError,
            } =
              await supabaseAdmin
                .from("bookings")
                .update({
                  backup_meeting_provider:
                    "zoom",

                  backup_join_url:
                    zoomContinuation.joinUrl,

                  backup_host_url:
                    zoomContinuation.startUrl,

                  backup_calendar_event_id:
                    null,
                })
                .eq(
                  "id",
                  bookingId,
                )
                .is(
                  "backup_join_url",
                  null,
                )
                .select(
                  `
                    backup_meeting_provider,
                    backup_join_url,
                    backup_host_url,
                    backup_calendar_event_id
                  `,
                )
                .maybeSingle();

            if (
              backupUpdateError
            ) {
              throw backupUpdateError;
            }

            if (
              bookingWithBackup
            ) {
              updatedBooking
                .backup_meeting_provider =
                bookingWithBackup
                  .backup_meeting_provider;

              updatedBooking
                .backup_join_url =
                bookingWithBackup
                  .backup_join_url;

              updatedBooking
                .backup_host_url =
                bookingWithBackup
                  .backup_host_url;

              updatedBooking
                .backup_calendar_event_id =
                bookingWithBackup
                  .backup_calendar_event_id;
            }

            console.log(
              "ZOOM CONTINUATION MEETING CREATED:",
              {
                bookingId,
                therapistId:
                  updatedBooking.therapist_id,
              },
            );
          } catch (
            zoomContinuationError
          ) {
            /*
             * Le paiement et la réunion principale restent valides
             * même si la salle de continuité échoue.
             */
            console.error(
              "Zoom continuation meeting creation failed:",
              {
                bookingId,
                therapistId:
                  updatedBooking.therapist_id,
                error:
                  zoomContinuationError,
              },
            );
          }
        }
      } else if (
        preferredMeetingProvider ===
        "google_meet"
      ) {
        /*
         * -------------------------------------------------------
         * GOOGLE MEET PRINCIPAL
         * -------------------------------------------------------
         */
        if (
          !updatedBooking.meeting_url
        ) {
          try {
            const googleMeeting =
              await createGoogleMeetForBooking({
                therapistId:
                  updatedBooking.therapist_id,

                summary:
                  `AAN Psychotherapy — ${updatedBooking.therapist_name || "Specialist"}`,

                description:
                  `AAN booking ${bookingId}`,

                start:
                  updatedBooking.scheduled_start,

                end:
                  updatedBooking.scheduled_end,

                timeZone:
                  "Asia/Beirut",

                attendeeEmail:
                  updatedBooking.patient_email,
              });

            const {
              data:
                bookingWithMeeting,
              error:
                meetingUpdateError,
            } =
              await supabaseAdmin
                .from("bookings")
                .update({
                  meeting_url:
                    googleMeeting.meetingUrl,

                  meeting_provider:
                    googleMeeting.provider,

                  calendar_event_id:
                    googleMeeting.calendarEventId,
                })
                .eq(
                  "id",
                  bookingId,
                )
                .is(
                  "meeting_url",
                  null,
                )
                .select(
                  `
                    meeting_url,
                    meeting_provider,
                    calendar_event_id
                  `,
                )
                .maybeSingle();

            if (
              meetingUpdateError
            ) {
              throw meetingUpdateError;
            }

            if (
              bookingWithMeeting
            ) {
              updatedBooking
                .meeting_url =
                bookingWithMeeting
                  .meeting_url;

              updatedBooking
                .meeting_provider =
                bookingWithMeeting
                  .meeting_provider;

              updatedBooking
                .calendar_event_id =
                bookingWithMeeting
                  .calendar_event_id;
            }

            console.log(
              "GOOGLE MEET CREATED:",
              {
                bookingId,
                therapistId:
                  updatedBooking
                    .therapist_id,
                meetingProvider:
                  googleMeeting.provider,
                calendarEventId:
                  googleMeeting
                    .calendarEventId,
              },
            );
          } catch (
            googleMeetingError
          ) {
            console.error(
              "Google Meet creation failed after successful payment:",
              {
                bookingId,
                therapistId:
                  updatedBooking
                    .therapist_id,
                error:
                  googleMeetingError,
              },
            );
          }
        }

        /*
         * -------------------------------------------------------
         * GOOGLE MEET CONTINUATION
         *
         * Couple / famille / groupe : plusieurs participants sont
         * attendus, donc on prépare une seconde salle de continuité.
         * L'individuel reste sur un seul Meet.
         * -------------------------------------------------------
         */
        if (
          googleMeetNeedsContinuation &&
          (
            !updatedBooking.backup_join_url ||
            updatedBooking.backup_meeting_provider !==
              "google_meet"
          )
        ) {
          try {
            const googleContinuation =
              await createGoogleMeetContinuationForBooking({
                therapistId:
                  updatedBooking.therapist_id,

                summary:
                  `AAN Psychotherapy — ${updatedBooking.therapist_name || "Specialist"}`,

                description:
                  `AAN booking ${bookingId} — continuation`,

                start:
                  updatedBooking.scheduled_start,

                end:
                  updatedBooking.scheduled_end,

                timeZone:
                  "Asia/Beirut",
              });

            const {
              data:
                bookingWithBackup,
              error:
                backupUpdateError,
            } =
              await supabaseAdmin
                .from("bookings")
                .update({
                  backup_meeting_provider:
                    "google_meet",

                  backup_join_url:
                    googleContinuation
                      .meetingUrl,

                  // Pour Google Meet, l'hôte ouvre le même lien.
                  backup_host_url:
                    googleContinuation
                      .meetingUrl,

                  backup_calendar_event_id:
                    googleContinuation
                      .calendarEventId,
                })
                .eq(
                  "id",
                  bookingId,
                )
                .is(
                  "backup_join_url",
                  null,
                )
                .select(
                  `
                    backup_meeting_provider,
                    backup_join_url,
                    backup_host_url,
                    backup_calendar_event_id
                  `,
                )
                .maybeSingle();

            if (
              backupUpdateError
            ) {
              throw backupUpdateError;
            }

            if (
              bookingWithBackup
            ) {
              updatedBooking
                .backup_meeting_provider =
                bookingWithBackup
                  .backup_meeting_provider;

              updatedBooking
                .backup_join_url =
                bookingWithBackup
                  .backup_join_url;

              updatedBooking
                .backup_host_url =
                bookingWithBackup
                  .backup_host_url;

              updatedBooking
                .backup_calendar_event_id =
                bookingWithBackup
                  .backup_calendar_event_id;
            }

            console.log(
              "GOOGLE MEET CONTINUATION CREATED:",
              {
                bookingId,
                therapistId:
                  updatedBooking.therapist_id,
                serviceType:
                  updatedBooking.service_type,
              },
            );
          } catch (
            googleContinuationError
          ) {
            /*
             * Comme pour Zoom, l'échec du lien de continuité
             * n'annule jamais le paiement ni le Meet principal.
             */
            console.error(
              "Google Meet continuation creation failed:",
              {
                bookingId,
                therapistId:
                  updatedBooking.therapist_id,
                serviceType:
                  updatedBooking.service_type,
                error:
                  googleContinuationError,
              },
            );
          }
        }
      }
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

    const fallbackSlotParts: string[] =
      [];

    if (
      updatedBooking
        .slot_day
    ) {
      fallbackSlotParts.push(
        updatedBooking
          .slot_day,
      );
    }

    if (
      updatedBooking
        .slot_time
    ) {
      fallbackSlotParts.push(
        updatedBooking
          .slot_time,
      );
    }

    const fallbackSlotDescription =
      fallbackSlotParts
        .join(" ")
        .trim();

    /*
     * L'e-mail AAN doit afficher une vraie date complète,
     * pas seulement "Monday 10:27".
     */
    let slotDescription =
      fallbackSlotDescription;

    if (
      updatedBooking
        .scheduled_start
    ) {
      const scheduledDate =
        new Date(
          updatedBooking
            .scheduled_start,
        );

      if (
        !Number.isNaN(
          scheduledDate.getTime(),
        )
      ) {
        const locale =
          language === "fr"
            ? "fr-FR"
            : language === "ar"
              ? "ar-LB"
              : "en-US";

        slotDescription =
          new Intl.DateTimeFormat(
            locale,
            {
              timeZone:
                "Asia/Beirut",
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            },
          ).format(
            scheduledDate,
          );
      }
    }

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

                  meetingProvider:
                    updatedBooking
                      .meeting_provider,

                  meetingUrl:
                    updatedBooking
                      .meeting_provider ===
                    "zoom"
                      ? updatedBooking
                          .zoom_join_url
                      : updatedBooking
                          .meeting_url,

                  backupMeetingProvider:
                    updatedBooking
                      .backup_meeting_provider,

                  backupJoinUrl:
                    updatedBooking
                      .backup_join_url,
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

        aanCommissionRate,
        aanCommissionAmount,
        specialistRate,
        specialistAmount,

        alreadyProcessed:
          bookingWasAlreadyPaid,

        meetingProvider:
          updatedBooking
            .meeting_provider,
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

      aanCommissionRate,
      aanCommissionAmount,
      specialistRate,
      specialistAmount,

      alreadyProcessed:
        bookingWasAlreadyPaid,

      meetingProvider:
        updatedBooking
          .meeting_provider,

      meetingUrl:
        updatedBooking
          .meeting_provider ===
        "zoom"
          ? updatedBooking
              .zoom_join_url
          : updatedBooking
              .meeting_url,
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

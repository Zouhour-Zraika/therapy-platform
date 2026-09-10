import {
  createClient,
} from "@supabase/supabase-js";

import {
  NextResponse,
} from "next/server";

import Stripe from "stripe";

import {
  createGoogleCalendarEventForBooking,
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
}: {
  therapistId: string;
  therapistName: string;
  start: string;
  end: string;
  supabaseAdmin: any;
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
              `AAN Psychotherapy — ${therapistName}`,

            type: 2,

            start_time:
              startDate.toISOString(),

            duration:
              durationMinutes,

            timezone:
              "Asia/Beirut",

            agenda:
              "AAN psychotherapy session",

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
            payment_provider,
            payment_method,
            payment_transaction_id,
            meeting_url,
            meeting_provider,
            calendar_event_id,
            zoom_join_url,
            zoom_start_url
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
            payment_provider,
            payment_method,
            payment_transaction_id,
            meeting_url,
            meeting_provider,
            calendar_event_id,
            zoom_join_url,
            zoom_start_url
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
     * au provider préféré du spécialiste.
     *
     * Important :
     * - on ne recrée jamais un lien déjà existant ;
     * - Zoom conserve join_url (patient) et start_url (host) ;
     * - Google conserve meeting_url + calendar_event_id ;
     * - le webhook Stripe pouvant être rejoué, les URLs déjà
     *   présentes protègent contre les créations répétées.
     * =======================================================
     */

    if (
      updatedBooking
        .therapist_id &&
      updatedBooking
        .scheduled_start &&
      updatedBooking
        .scheduled_end
    ) {
      if (
        preferredMeetingProvider ===
          "zoom" &&
        !updatedBooking
          .zoom_join_url &&
        !updatedBooking
          .zoom_start_url
      ) {
        try {
          const zoomMeeting =
            await createZoomMeetingForBooking({
              therapistId:
                updatedBooking
                  .therapist_id,

              therapistName:
                updatedBooking
                  .therapist_name ||
                "Specialist",

              start:
                updatedBooking
                  .scheduled_start,

              end:
                updatedBooking
                  .scheduled_end,

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
            } catch (
              calendarError
            ) {
              /*
               * Zoom reste valide même si Google Calendar
               * est temporairement indisponible ou non connecté.
               */
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
      } else if (
        preferredMeetingProvider ===
          "google_meet" &&
        !updatedBooking
          .meeting_url
      ) {
        try {
          const googleMeeting =
            await createGoogleMeetForBooking({
              therapistId:
                updatedBooking
                  .therapist_id,

              summary:
                `AAN Psychotherapy — ${updatedBooking.therapist_name || "Specialist"}`,

              description:
                `AAN booking ${bookingId}`,

              start:
                updatedBooking
                  .scheduled_start,

              end:
                updatedBooking
                  .scheduled_end,

              timeZone:
                "Asia/Beirut",

              attendeeEmail:
                updatedBooking
                  .patient_email,
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
                  googleMeeting
                    .meetingUrl,

                meeting_provider:
                  googleMeeting
                    .provider,

                calendar_event_id:
                  googleMeeting
                    .calendarEventId,
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
                googleMeeting
                  .provider,

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
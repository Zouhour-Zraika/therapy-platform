import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

type Language = "en" | "fr" | "ar";
type PurchaseType = "booking" | "patient_pack";

type CheckoutRequest = {
  bookingId?: string;
  language?: Language;

  /*
   * Nouveau :
   * - booking = paiement normal d'une séance existante
   * - patient_pack = achat d'un pack de séances individuelles
   *
   * Si purchaseType est absent, on garde le comportement historique
   * afin de ne rien casser dans le paiement actuel.
   */
  purchaseType?: PurchaseType;
  therapistId?: string;
  serviceId?: string;
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

type TherapistRecord = {
  id: string;
  full_name: string | null;
  work_status: string | null;
  care_domain: string | null;
};

type TherapistServiceRecord = {
  id: string;
  therapist_id: string;
  service_type: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
};

type BusinessSettingsRecord = {
  patient_pack_sessions: number;
  patient_pack_discount_rate: number;
  patient_pack_validity_months: number;
};

type ActiveAssignmentRecord = {
  id: string;
  therapist_id: string;
};

type PendingPackRecord = {
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
};

const PAYMENT_HOLD_MS = 10 * 60 * 1000;

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function normalizeLanguage(value: unknown): Language {
  return value === "ar"
    ? "ar"
    : value === "fr"
      ? "fr"
      : "en";
}

function createSupabaseClient(
  supabaseUrl: string,
  key: string,
  accessToken?: string,
) {
  return createClient(
    supabaseUrl,
    key,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      ...(accessToken
        ? {
            global: {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            },
          }
        : {}),
    },
  );
}

export async function POST(request: Request) {
  let createdPendingPackId: string | null = null;

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
      createSupabaseClient(
        supabaseUrl,
        supabaseAnonKey,
        accessToken,
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

    const {
      data: profile,
      error: profileError,
    } = await supabaseAuth
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
      return NextResponse.json(
        {
          error:
            "Patient authentication is required.",
        },
        {
          status: 403,
        },
      );
    }

    const supabaseAdmin =
      createSupabaseClient(
        supabaseUrl,
        supabaseServerKey,
      );

    const body =
      (await request.json()) as CheckoutRequest;

    const language =
      normalizeLanguage(body.language);

    const purchaseType: PurchaseType =
      body.purchaseType === "patient_pack"
        ? "patient_pack"
        : "booking";

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

    /*
     * ============================================================
     * PATIENT PACK
     * ============================================================
     *
     * On ne crée PAS quatre bookings.
     *
     * Le paiement achète un crédit de plusieurs séances.
     * Les séances seront ensuite réservées une par une.
     */
    if (purchaseType === "patient_pack") {
      const therapistId =
        String(
          body.therapistId || "",
        ).trim();

      const serviceId =
        String(
          body.serviceId || "",
        ).trim();

      if (
        !therapistId ||
        !serviceId
      ) {
        return NextResponse.json(
          {
            error:
              language === "ar"
                ? "المختص ونوع الجلسة مطلوبان لشراء الباقة."
                : language === "fr"
                  ? "Le spécialiste et le type de séance sont requis pour acheter le pack."
                  : "Specialist and service are required to purchase the pack.",
          },
          {
            status: 400,
          },
        );
      }

      /*
       * 1. Spécialiste :
       * toujours relu côté serveur.
       */
      const {
        data: therapist,
        error: therapistError,
      } = await supabaseAdmin
        .from("therapists")
        .select(
          "id, full_name, work_status, care_domain",
        )
        .eq(
          "id",
          therapistId,
        )
        .maybeSingle<TherapistRecord>();

      if (therapistError) {
        throw therapistError;
      }

      if (!therapist) {
        return NextResponse.json(
          {
            error:
              language === "fr"
                ? "Le spécialiste est introuvable."
                : language === "ar"
                  ? "تعذر العثور على المختص."
                  : "The specialist was not found.",
          },
          {
            status: 404,
          },
        );
      }

      if (
        therapist.work_status !== "active"
      ) {
        return NextResponse.json(
          {
            error:
              language === "fr"
                ? "Ce spécialiste n’accepte plus de nouvelles réservations."
                : language === "ar"
                  ? "هذا المختص لا يقبل حجوزات جديدة حالياً."
                  : "This specialist is no longer accepting new bookings.",
          },
          {
            status: 409,
          },
        );
      }

      /*
       * 2. Service :
       * un pack patient est exclusivement un pack
       * de séances INDIVIDUELLES.
       */
      const {
        data: service,
        error: serviceError,
      } = await supabaseAdmin
        .from("therapist_services")
        .select(
          "id, therapist_id, service_type, price, duration_minutes, is_active",
        )
        .eq(
          "id",
          serviceId,
        )
        .eq(
          "therapist_id",
          therapist.id,
        )
        .eq(
          "is_active",
          true,
        )
        .maybeSingle<TherapistServiceRecord>();

      if (serviceError) {
        throw serviceError;
      }

      if (
        !service ||
        service.service_type !== "individual"
      ) {
        return NextResponse.json(
          {
            error:
              language === "fr"
                ? "Le Pack Patient est disponible uniquement pour les séances individuelles."
                : language === "ar"
                  ? "باقة المريض متاحة فقط للجلسات الفردية."
                  : "The Patient Pack is available only for individual sessions.",
            code:
              "PACK_INDIVIDUAL_ONLY",
          },
          {
            status: 400,
          },
        );
      }

      const sessionPrice =
        Number(service.price);

      if (
        !Number.isFinite(sessionPrice) ||
        sessionPrice <= 0
      ) {
        return NextResponse.json(
          {
            error:
              "The individual service has an invalid price.",
          },
          {
            status: 400,
          },
        );
      }

      /*
       * 3. Règle du spécialiste actif par care_domain.
       *
       * Le pack ne doit pas permettre de contourner
       * la protection déjà appliquée aux bookings.
       */
      const careDomain =
        therapist.care_domain
          ?.trim() ||
        null;

      if (careDomain) {
        const {
          data: activeAssignment,
          error: assignmentError,
        } = await supabaseAdmin
          .from(
            "patient_therapist_assignments",
          )
          .select(
            "id, therapist_id",
          )
          .eq(
            "patient_id",
            user.id,
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
          .maybeSingle<ActiveAssignmentRecord>();

        if (assignmentError) {
          throw assignmentError;
        }

        if (
          activeAssignment &&
          activeAssignment.therapist_id !==
            therapist.id
        ) {
          return NextResponse.json(
            {
              error:
                language === "fr"
                  ? "Vous êtes déjà suivi(e) par un spécialiste dans ce domaine. Pour changer de spécialiste, veuillez contacter la clinique AAN."
                  : language === "ar"
                    ? "لديك بالفعل مختص نشط في هذا المجال. لتغيير المختص، يرجى التواصل مع عيادة AAN."
                    : "You already have an active specialist in this area. To change specialist, please contact AAN.",
              code:
                "ACTIVE_SPECIALIST_CONFLICT",
            },
            {
              status: 409,
            },
          );
        }
      }

      /*
       * 4. Configuration du Pack :
       * source de vérité = platform_business_settings.
       */
      const {
        data: settings,
        error: settingsError,
      } = await supabaseAdmin
        .from(
          "platform_business_settings",
        )
        .select(
          "patient_pack_sessions, patient_pack_discount_rate, patient_pack_validity_months",
        )
        .eq(
          "id",
          1,
        )
        .maybeSingle<BusinessSettingsRecord>();

      if (settingsError) {
        throw settingsError;
      }

      if (!settings) {
        return NextResponse.json(
          {
            error:
              "Patient Pack business settings are missing.",
          },
          {
            status: 500,
          },
        );
      }

      const sessionsTotal =
        Number(
          settings.patient_pack_sessions,
        );

      const discountRate =
        Number(
          settings.patient_pack_discount_rate,
        );

      const validityMonths =
        Number(
          settings.patient_pack_validity_months,
        );

      if (
        !Number.isInteger(sessionsTotal) ||
        sessionsTotal <= 0 ||
        !Number.isFinite(discountRate) ||
        discountRate < 0 ||
        discountRate > 100 ||
        !Number.isInteger(validityMonths) ||
        validityMonths <= 0
      ) {
        return NextResponse.json(
          {
            error:
              "Patient Pack business settings are invalid.",
          },
          {
            status: 500,
          },
        );
      }

      const grossPrice =
        roundMoney(
          sessionPrice *
            sessionsTotal,
        );

      const totalPrice =
        roundMoney(
          grossPrice *
            (1 -
              discountRate /
                100),
        );

      if (totalPrice <= 0) {
        return NextResponse.json(
          {
            error:
              "The Patient Pack total price is invalid.",
          },
          {
            status: 500,
          },
        );
      }

      /*
       * 5. Eviter plusieurs packs actifs/en attente
       * identiques pour le même patient + spécialiste.
       *
       * Un pack "used", "expired", "cancelled" ou "refunded"
       * n'empêche pas un nouvel achat.
       */
      const {
        data: existingPack,
        error: existingPackError,
      } = await supabaseAdmin
        .from("patient_packs")
        .select(
          "id, status, sessions_remaining",
        )
        .eq(
          "patient_id",
          user.id,
        )
        .eq(
          "therapist_id",
          therapist.id,
        )
        .eq(
          "therapist_service_id",
          service.id,
        )
        .in(
          "status",
          [
            "pending",
            "active",
          ],
        )
        .order(
          "created_at",
          {
            ascending: false,
          },
        )
        .limit(1)
        .maybeSingle<{
          id: string;
          status: string;
          sessions_remaining: number;
        }>();

      if (existingPackError) {
        throw existingPackError;
      }

      if (
        existingPack?.status === "active" &&
        Number(
          existingPack.sessions_remaining,
        ) > 0
      ) {
        return NextResponse.json(
          {
            error:
              language === "fr"
                ? "Vous avez déjà un Pack Patient actif avec ce spécialiste."
                : language === "ar"
                  ? "لديك بالفعل باقة مريض فعّالة مع هذا المختص."
                  : "You already have an active Patient Pack with this specialist.",
            code:
              "ACTIVE_PACK_EXISTS",
          },
          {
            status: 409,
          },
        );
      }

      /*
       * Les anciens pending non payés peuvent rester après
       * un abandon de Stripe. On les annule avant d'en créer
       * un nouveau pour éviter les doublons.
       */
      if (
        existingPack?.status === "pending"
      ) {
        const {
          error: cancelPendingError,
        } = await supabaseAdmin
          .from("patient_packs")
          .update({
            status:
              "cancelled",
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            existingPack.id,
          )
          .eq(
            "status",
            "pending",
          );

        if (cancelPendingError) {
          throw cancelPendingError;
        }
      }

      /*
       * 6. Snapshot du pack AVANT Stripe.
       *
       * Le webhook activera ce pack après confirmation
       * réelle du paiement.
       */
      const {
        data: pendingPack,
        error: pendingPackError,
      } = await supabaseAdmin
        .from("patient_packs")
        .insert({
          patient_id:
            user.id,

          therapist_id:
            therapist.id,

          therapist_service_id:
            service.id,

          sessions_total:
            sessionsTotal,

          sessions_remaining:
            sessionsTotal,

          session_price:
            sessionPrice,

          discount_rate:
            discountRate,

          total_price:
            totalPrice,

          status:
            "pending",

          payment_provider:
            "stripe",

          updated_at:
            new Date().toISOString(),
        })
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
            status
          `,
        )
        .single<PendingPackRecord>();

      if (
        pendingPackError ||
        !pendingPack
      ) {
        if (pendingPackError) {
          throw pendingPackError;
        }

        throw new Error(
          "Unable to create Patient Pack.",
        );
      }

      createdPendingPackId =
        pendingPack.id;

      const therapistName =
        therapist.full_name?.trim() ||
        (
          language === "ar"
            ? "المختص"
            : language === "fr"
              ? "Spécialiste"
              : "Specialist"
        );

      const email =
        user.email?.trim();

      if (!email) {
        throw new Error(
          language === "fr"
            ? "L’adresse e-mail du patient est manquante."
            : language === "ar"
              ? "البريد الإلكتروني للمريض غير موجود."
              : "The patient email address is missing.",
        );
      }

      const productName =
        language === "ar"
          ? `باقة المريض - ${sessionsTotal} جلسات مع ${therapistName}`
          : language === "fr"
            ? `Pack Patient - ${sessionsTotal} séances avec ${therapistName}`
            : `Patient Pack - ${sessionsTotal} sessions with ${therapistName}`;

      const productDescription =
        language === "ar"
          ? `جلسات فردية · خصم ${discountRate}% · صالحة لمدة ${validityMonths} أشهر`
          : language === "fr"
            ? `Séances individuelles · remise ${discountRate}% · validité ${validityMonths} mois`
            : `Individual sessions · ${discountRate}% discount · valid for ${validityMonths} months`;

      const stripeLocale =
        language === "fr"
          ? "fr"
          : language === "en"
            ? "en"
            : "auto";

      const successUrl =
        `${publicSiteUrl}/success` +
        `?packId=${encodeURIComponent(
          pendingPack.id,
        )}` +
        `&session_id={CHECKOUT_SESSION_ID}`;

      const cancelUrl =
        `${publicSiteUrl}/booking` +
        `?therapistId=${encodeURIComponent(
          therapist.id,
        )}` +
        `&serviceId=${encodeURIComponent(
          service.id,
        )}`;

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
                      totalPrice *
                        100,
                    ),

                  product_data: {
                    name:
                      productName,

                    description:
                      productDescription,
                  },
                },
              },
            ],

            metadata: {
              purchaseType:
                "patient_pack",

              packId:
                pendingPack.id,

              patientId:
                user.id,

              therapistId:
                therapist.id,

              serviceId:
                service.id,

              therapist:
                therapistName,

              sessionsTotal:
                String(
                  sessionsTotal,
                ),

              sessionPrice:
                String(
                  sessionPrice,
                ),

              discountRate:
                String(
                  discountRate,
                ),

              validityMonths:
                String(
                  validityMonths,
                ),

              totalPrice:
                String(
                  totalPrice,
                ),

              language,

              email,

              paymentProvider:
                "stripe",
            },

            payment_intent_data: {
              metadata: {
                purchaseType:
                  "patient_pack",

                packId:
                  pendingPack.id,

                patientId:
                  user.id,

                therapistId:
                  therapist.id,

                serviceId:
                  service.id,

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
        throw new Error(
          "Stripe did not return a checkout URL.",
        );
      }

      /*
       * Stripe Checkout est créé :
       * le pending ne doit plus être supprimé par le catch.
       * Le webhook s'occupera de l'activation après paiement.
       */
      createdPendingPackId =
        null;

      return NextResponse.json({
        provider:
          "stripe",

        purchaseType:
          "patient_pack",

        sessionId:
          session.id,

        packId:
          pendingPack.id,

        therapistId:
          therapist.id,

        serviceId:
          service.id,

        sessionsTotal,

        sessionPrice,

        discountRate,

        validityMonths,

        amount:
          totalPrice,

        currency:
          "USD",

        url:
          session.url,
      });
    }

    /*
     * ============================================================
     * BOOKING NORMAL
     * ============================================================
     *
     * Cette partie conserve le comportement existant.
     */
    const bookingId =
      body.bookingId?.trim();

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
            purchaseType:
              "booking",

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
              purchaseType:
                "booking",

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

    /*
     * Conserver temporairement l'identifiant de la Checkout Session
     * Stripe sur le booking pending.
     *
     * Stripe Checkout n'accepte pas une expiration native à 10 minutes.
     * Le nettoyage des holds utilisera donc cet identifiant "cs_..."
     * pour fermer explicitement la page Stripe après expiration.
     *
     * Après paiement réussi, le webhook remplacera cette valeur
     * par le PaymentIntent "pi_...".
     */
    const {
      error:
        checkoutSessionPersistenceError,
    } = await supabaseAdmin
      .from("bookings")
      .update({
        payment_provider:
          "stripe",
        payment_transaction_id:
          session.id,
      })
      .eq("id", bookingId)
      .eq("patient_id", user.id)
      .eq("status", "pending");

    if (
      checkoutSessionPersistenceError
    ) {
      try {
        await stripe.checkout.sessions.expire(
          session.id,
        );
      } catch (
        checkoutExpirationError
      ) {
        console.error(
          "Stripe Checkout rollback expiration warning:",
          {
            bookingId,
            sessionId:
              session.id,
            error:
              checkoutExpirationError,
          },
        );
      }

      throw checkoutSessionPersistenceError;
    }

    return NextResponse.json({
      provider:
        "stripe",

      purchaseType:
        "booking",

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
    /*
     * Si la création Stripe du Pack échoue après l'INSERT,
     * on supprime uniquement le pending créé par CET appel.
     */
    if (createdPendingPackId) {
      try {
        const supabaseUrl =
          process.env.NEXT_PUBLIC_SUPABASE_URL;

        const supabaseServerKey =
          process.env.SUPABASE_SECRET_KEY ||
          process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (
          supabaseUrl &&
          supabaseServerKey
        ) {
          const supabaseAdmin =
            createSupabaseClient(
              supabaseUrl,
              supabaseServerKey,
            );

          const {
            error: cleanupError,
          } = await supabaseAdmin
            .from("patient_packs")
            .delete()
            .eq(
              "id",
              createdPendingPackId,
            )
            .eq(
              "status",
              "pending",
            );

          if (cleanupError) {
            console.error(
              "Patient Pack checkout rollback error:",
              cleanupError,
            );
          }
        }
      } catch (
        cleanupError
      ) {
        console.error(
          "Patient Pack checkout rollback error:",
          cleanupError,
        );
      }
    }

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

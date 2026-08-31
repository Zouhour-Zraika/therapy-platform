import {
  createClient,
} from "@supabase/supabase-js";

import {
  NextResponse,
} from "next/server";

import Stripe from "stripe";

export const runtime =
  "nodejs";

type TherapistAction =
  | "request_reschedule"
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
};

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

async function getAuthenticatedTherapist(
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
    !profile
  ) {
    return null;
  }

  if (
    profile.role ===
    "therapist"
  ) {
    return user;
  }

  if (
    profile.role ===
    "admin"
  ) {
    const {
      data:
        therapistRecord,
      error:
        therapistError,
    } =
      await supabaseAdmin
        .from(
          "therapists",
        )
        .select("id")
        .eq(
          "id",
          user.id,
        )
        .maybeSingle<{
          id: string;
        }>();

    if (
      therapistError ||
      !therapistRecord
    ) {
      return null;
    }

    return user;
  }

  return null;
}

function getSiteUrl(
  request: Request,
) {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configured) {
    return configured.replace(
      /\/$/,
      "",
    );
  }

  return new URL(
    request.url,
  ).origin;
}

function formatSessionDate(
  scheduledStart:
    string | null,
  slotDay:
    string | null,
  slotTime:
    string | null,
  language:
    string,
) {
  if (
    scheduledStart
  ) {
    const date =
      new Date(
        scheduledStart,
      );

    if (
      !Number.isNaN(
        date.getTime(),
      )
    ) {
      const formatted =
        new Intl.DateTimeFormat(
          language === "ar"
            ? "ar-LB"
            : language === "fr"
              ? "fr-FR"
              : "en-GB",
          {
            weekday:
              "long",

            day:
              "numeric",

            month:
              "long",

            year:
              "numeric",

            hour:
              "2-digit",

            minute:
              "2-digit",

            timeZone:
              "Asia/Beirut",
          },
        ).format(date);

      return formatted;
    }
  }

  return [
    slotDay || "",
    slotTime || "",
  ]
    .filter(Boolean)
    .join(" ");
}

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const resendApiKey =
    process.env.RESEND_API_KEY;

  const from =
    process.env.RESEND_FROM_EMAIL ||
    process.env.EMAIL_FROM;

  if (
    !resendApiKey ||
    !from
  ) {
    throw new Error(
      "Email configuration is missing. Set RESEND_API_KEY and RESEND_FROM_EMAIL (or EMAIL_FROM).",
    );
  }

  const response =
    await fetch(
      "https://api.resend.com/emails",
      {
        method:
          "POST",

        headers: {
          Authorization:
            `Bearer ${resendApiKey}`,

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            from,
            to: [to],
            subject,
            html,
          }),
      },
    );

  const result =
    await response.json();

  if (!response.ok) {
    console.error(
      "Resend error:",
      result,
    );

    throw new Error(
      result?.message ||
      "Unable to send email.",
    );
  }

  return result;
}

function buildRescheduleEmail({
  language,
  therapistName,
  sessionDate,
  dashboardUrl,
}: {
  language: string;
  therapistName: string;
  sessionDate: string;
  dashboardUrl: string;
}) {
  if (
    language === "ar"
  ) {
    return {
      subject:
        "طلب تغيير موعد جلستك - AAN Psychotherapy",

      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.7;color:#223748">
          <h2>طلب تغيير موعد الجلسة</h2>
          <p>
            طلب المختص <strong>${therapistName}</strong>
            تغيير موعد جلستك الحالية:
          </p>
          <p><strong>${sessionDate}</strong></p>
          <p>
            لم يتم إلغاء الدفع ولن يُطلب منك الدفع مرة أخرى.
            يمكنك الدخول إلى حسابك واختيار موعد جديد متاح يناسبك.
          </p>
          <p>
            <a href="${dashboardUrl}">
              اختيار موعد جديد
            </a>
          </p>
          <p>AAN Psychotherapy</p>
        </div>
      `,
    };
  }

  if (
    language === "fr"
  ) {
    return {
      subject:
        "Demande de changement de votre séance - AAN Psychotherapy",

      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.7;color:#223748">
          <h2>Demande de changement de rendez-vous</h2>
          <p>
            Votre spécialiste <strong>${therapistName}</strong>
            souhaite modifier la séance actuellement prévue :
          </p>
          <p><strong>${sessionDate}</strong></p>
          <p>
            Votre paiement reste valable et aucun nouveau paiement
            ne vous sera demandé. Connectez-vous à votre espace patient
            pour choisir un nouveau créneau disponible qui vous convient.
          </p>
          <p>
            <a href="${dashboardUrl}">
              Choisir un nouveau créneau
            </a>
          </p>
          <p>AAN Psychotherapy</p>
        </div>
      `,
    };
  }

  return {
    subject:
      "Request to reschedule your session - AAN Psychotherapy",

    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.7;color:#223748">
        <h2>Session reschedule request</h2>
        <p>
          Your specialist <strong>${therapistName}</strong>
          has requested a change to your currently scheduled session:
        </p>
        <p><strong>${sessionDate}</strong></p>
        <p>
          Your existing payment remains valid and you will not be
          charged again. Please sign in to your patient dashboard
          and choose another available time that works for you.
        </p>
        <p>
          <a href="${dashboardUrl}">
            Choose a new time
          </a>
        </p>
        <p>AAN Psychotherapy</p>
      </div>
    `,
  };
}

function buildCancellationEmail({
  language,
  therapistName,
  sessionDate,
}: {
  language: string;
  therapistName: string;
  sessionDate: string;
}) {
  if (
    language === "ar"
  ) {
    return {
      subject:
        "إلغاء جلستك واسترداد المبلغ - AAN Psychotherapy",

      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.7;color:#223748">
          <h2>تم إلغاء الجلسة</h2>
          <p>
            تم إلغاء جلستك مع
            <strong>${therapistName}</strong>:
          </p>
          <p><strong>${sessionDate}</strong></p>
          <p>
            تم إرسال طلب استرداد المبلغ إلى مزود الدفع.
            قد يحتاج ظهور المبلغ في حسابك عدة أيام عمل
            بحسب البنك أو وسيلة الدفع.
          </p>
          <p>AAN Psychotherapy</p>
        </div>
      `,
    };
  }

  if (
    language === "fr"
  ) {
    return {
      subject:
        "Annulation et remboursement de votre séance - AAN Psychotherapy",

      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.7;color:#223748">
          <h2>Votre séance a été annulée</h2>
          <p>
            Votre séance avec
            <strong>${therapistName}</strong> prévue le :
          </p>
          <p><strong>${sessionDate}</strong></p>
          <p>
            a été annulée par le spécialiste.
            Une demande de remboursement a été envoyée au prestataire
            de paiement. Selon votre banque ou votre moyen de paiement,
            le remboursement peut prendre plusieurs jours ouvrés
            avant d’apparaître sur votre compte.
          </p>
          <p>AAN Psychotherapy</p>
        </div>
      `,
    };
  }

  return {
    subject:
      "Your session was cancelled and refunded - AAN Psychotherapy",

    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.7;color:#223748">
        <h2>Your session has been cancelled</h2>
        <p>
          Your session with
          <strong>${therapistName}</strong> scheduled for:
        </p>
        <p><strong>${sessionDate}</strong></p>
        <p>
          was cancelled by the specialist. A refund request has been
          submitted to the payment provider. Depending on your bank
          or payment method, it may take several business days for
          the refund to appear.
        </p>
        <p>AAN Psychotherapy</p>
      </div>
    `,
  };
}

export async function POST(
  request: Request,
) {
  const supabaseAdmin =
    createSupabaseAdmin();

  try {
    const therapistUser =
      await getAuthenticatedTherapist(
        request,
        supabaseAdmin,
      );

    if (
      !therapistUser
    ) {
      return NextResponse.json(
        {
          error:
            "Therapist authentication required.",
        },
        {
          status: 401,
        },
      );
    }

    const body =
      await request.json();

    const bookingId =
      String(
        body.bookingId ||
        "",
      ).trim();

    const action =
      String(
        body.action ||
        "",
      ) as TherapistAction;

    const language =
      ["en", "fr", "ar"].includes(
        String(
          body.language,
        ),
      )
        ? String(
            body.language,
          )
        : "en";

    if (!bookingId) {
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
      action !==
        "request_reschedule" &&
      action !==
        "cancel_and_refund"
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid action.",
        },
        {
          status: 400,
        },
      );
    }

    const {
      data: booking,
      error:
        bookingError,
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
          refunded_at
        `,
      )
      .eq(
        "id",
        bookingId,
      )
      .maybeSingle<BookingRow>();

    if (
      bookingError
    ) {
      throw bookingError;
    }

    if (!booking) {
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
     * Un spécialiste ne peut agir que
     * sur ses propres réservations.
     */
    if (
      booking.therapist_id !==
      therapistUser.id
    ) {
      return NextResponse.json(
        {
          error:
            "You cannot manage this booking.",
        },
        {
          status: 403,
        },
      );
    }

    if (
      booking.status !==
      "paid"
    ) {
      return NextResponse.json(
        {
          error:
            "Only paid bookings can be managed here.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      !booking.patient_email
    ) {
      return NextResponse.json(
        {
          error:
            "Patient email is missing.",
        },
        {
          status: 400,
        },
      );
    }

    const sessionDate =
      formatSessionDate(
        booking.scheduled_start,
        booking.slot_day,
        booking.slot_time,
        language,
      );

    const therapistName =
      booking.therapist_name ||
      "AAN specialist";

    /*
     * ACTION 1:
     * Le thérapeute demande au patient
     * de choisir un nouveau créneau.
     *
     * Le statut reste "paid" :
     * le paiement reste parfaitement valide.
     */
    if (
      action ===
      "request_reschedule"
    ) {
      const now =
        new Date().toISOString();

      const {
        error:
          updateError,
      } = await supabaseAdmin
        .from("bookings")
        .update({
          reschedule_requested_by:
            "therapist",

          reschedule_requested_at:
            now,
        })
        .eq(
          "id",
          booking.id,
        )
        .eq(
          "status",
          "paid",
        );

      if (
        updateError
      ) {
        throw updateError;
      }

      const siteUrl =
        getSiteUrl(
          request,
        );

      const dashboardUrl =
        `${siteUrl}/dashboard?reschedule=${encodeURIComponent(
          booking.id,
        )}`;

      const email =
        buildRescheduleEmail({
          language,
          therapistName,
          sessionDate,
          dashboardUrl,
        });

      try {
        await sendEmail({
          to:
            booking.patient_email,

          subject:
            email.subject,

          html:
            email.html,
        });
      } catch (
        emailError
      ) {
        console.error(
          "Reschedule email error:",
          emailError,
        );

        /*
         * On annule le flag si l'email
         * n'a pas pu être envoyé.
         */
        await supabaseAdmin
          .from("bookings")
          .update({
            reschedule_requested_by:
              null,

            reschedule_requested_at:
              null,
          })
          .eq(
            "id",
            booking.id,
          );

        throw emailError;
      }

      return NextResponse.json({
        success:
          true,

        action:
          "request_reschedule",

        bookingId:
          booking.id,
      });
    }

    /*
     * ACTION 2:
     * Annulation par le thérapeute.
     *
     * Si Stripe a encaissé le paiement,
     * remboursement complet automatique.
     */
    if (
      action ===
      "cancel_and_refund"
    ) {
      if (
        booking.payment_provider !==
        "stripe"
      ) {
        return NextResponse.json(
          {
            error:
              "Automatic refund is currently available only for Stripe payments.",
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
            error:
              "Stripe payment transaction ID is missing.",
          },
          {
            status: 400,
          },
        );
      }

      const stripeSecretKey =
        process.env.STRIPE_SECRET_KEY;

      if (
        !stripeSecretKey
      ) {
        throw new Error(
          "STRIPE_SECRET_KEY is missing.",
        );
      }

      const stripe =
        new Stripe(
          stripeSecretKey,
        );

      /*
       * payment_transaction_id est actuellement
       * un PaymentIntent (pi_...).
       */
      const refund =
        await stripe.refunds.create(
          {
            payment_intent:
              booking.payment_transaction_id,

            reason:
              "requested_by_customer",

            metadata: {
              bookingId:
                booking.id,

              initiatedBy:
                "therapist",
            },
          },
          {
            idempotencyKey:
              `booking-${booking.id}-therapist-cancel`,
          },
        );

      const now =
        new Date().toISOString();

      /*
       * Après confirmation Stripe :
       * - réservation annulée,
       * - trace de l'origine,
       * - trace du remboursement.
       */
      const {
        error:
          cancellationError,
      } = await supabaseAdmin
        .from("bookings")
        .update({
          status:
            "cancelled",

          cancellation_initiated_by:
            "therapist",

          cancelled_at:
            now,

          refund_id:
            refund.id,

          refunded_at:
            refund.status ===
              "succeeded"
              ? now
              : null,

          reschedule_requested_by:
            null,

          reschedule_requested_at:
            null,
        })
        .eq(
          "id",
          booking.id,
        )
        .eq(
          "status",
          "paid",
        );

      if (
        cancellationError
      ) {
        /*
         * Le remboursement a déjà été demandé :
         * on ne tente surtout pas un deuxième refund.
         */
        console.error(
          "CRITICAL: Stripe refund created but booking update failed.",
          {
            bookingId:
              booking.id,

            refundId:
              refund.id,

            cancellationError,
          },
        );

        throw new Error(
          "Refund was created but the booking status could not be updated. Please contact an administrator.",
        );
      }

      /*
       * Libérer le créneau seulement après
       * la création du remboursement.
       */
      if (
        booking.slot_id
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
              booking.slot_id,
            )
            .eq(
              "therapist_id",
              therapistUser.id,
            );

        if (
          slotReleaseError
        ) {
          console.error(
            "Cancelled booking slot release warning:",
            slotReleaseError,
          );
        }
      }

      const email =
        buildCancellationEmail({
          language,
          therapistName,
          sessionDate,
        });

      let emailWarning:
        string | null =
        null;

      try {
        await sendEmail({
          to:
            booking.patient_email,

          subject:
            email.subject,

          html:
            email.html,
        });
      } catch (
        emailError
      ) {
        /*
         * Le remboursement est déjà créé.
         * On ne revient donc PAS en arrière.
         */
        console.error(
          "Cancellation email error:",
          emailError,
        );

        emailWarning =
          "The booking was cancelled and refunded, but the email could not be sent.";
      }

      return NextResponse.json({
        success:
          true,

        action:
          "cancel_and_refund",

        bookingId:
          booking.id,

        refund: {
          id:
            refund.id,

          status:
            refund.status,
        },

        emailWarning,
      });
    }

    return NextResponse.json(
      {
        error:
          "Unsupported action.",
      },
      {
        status: 400,
      },
    );
  } catch (
    error
  ) {
    console.error(
      "Therapist booking action error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof
          Error
            ? error.message
            : "Unable to manage booking.",
      },
      {
        status: 500,
      },
    );
  }
}

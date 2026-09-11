import { NextResponse } from "next/server";
import { Resend } from "resend";

type Language =
  | "en"
  | "fr"
  | "ar";

type BookingEmailRequest = {
  email?: string;
  therapist?: string;
  slot?: string;
  price?: number | string;
  language?: Language;
  bookingId?: string;
  paymentProvider?: string;
  transactionId?: string;
  meetingProvider?: "google_meet" | "zoom";
  meetingUrl?: string;
  backupMeetingProvider?: "google_meet" | "zoom" | string | null;
  backupJoinUrl?: string | null;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function providerLabel(
  provider:
    | "google_meet"
    | "zoom"
    | string
    | null
    | undefined,
) {
  if (provider === "zoom") {
    return "Zoom";
  }

  if (provider === "google_meet") {
    return "Google Meet";
  }

  return "";
}

export async function POST(request: Request) {
  try {
    const resendApiKey =
      process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "RESEND_API_KEY is missing.",
        },
        {
          status: 500,
        },
      );
    }

    const resend =
      new Resend(resendApiKey);

    const body =
      (await request.json()) as
        BookingEmailRequest;

    const email =
      body.email?.trim();

    const therapist =
      body.therapist?.trim() ||
      "Therapist";

    const slot =
      body.slot?.trim() ||
      "";

    const price =
      Number(body.price || 0);

    const language:
      Language =
      body.language === "ar"
        ? "ar"
        : body.language === "fr"
          ? "fr"
          : "en";

    const meetingProvider =
      body.meetingProvider === "zoom"
        ? "zoom"
        : body.meetingProvider ===
            "google_meet"
          ? "google_meet"
          : undefined;

    const meetingUrl =
      body.meetingUrl?.trim() ||
      "";

    const backupJoinUrl =
      body.backupJoinUrl?.trim() ||
      "";

    const mainProviderLabel =
      providerLabel(
        meetingProvider,
      );

    const backupProviderLabel =
      providerLabel(
        body.backupMeetingProvider,
      ) ||
      mainProviderLabel;

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Recipient email is missing.",
        },
        {
          status: 400,
        },
      );
    }

    const safeTherapist =
      escapeHtml(therapist);

    const safeSlot =
      escapeHtml(slot);

    const safeMeetingUrl =
      escapeHtml(meetingUrl);

    const safeBackupJoinUrl =
      escapeHtml(
        backupJoinUrl,
      );

    const formattedPrice =
      Number.isFinite(price)
        ? price.toFixed(2)
        : "0.00";

    const isPackBooking =
      body.paymentProvider ===
        "patient_pack" ||
      price === 0;

    const subject =
      language === "ar"
        ? "تأكيد حجز الجلسة - AAN Psychotherapy"
        : language === "fr"
          ? "AAN Psychotherapy — Confirmation de réservation"
          : "AAN Psychotherapy — Session Booking Confirmation";

    const title =
      language === "ar"
        ? "تم تأكيد الحجز"
        : language === "fr"
          ? "Réservation confirmée"
          : "Booking Confirmed";

    const intro =
      language === "ar"
        ? isPackBooking
          ? "تم تأكيد جلستك مع AAN Psychotherapy باستخدام رصيد من باقة المريض."
          : "شكراً لحجز جلستك مع AAN Psychotherapy. تم تأكيد موعدك بنجاح بعد إتمام عملية الدفع."
        : language === "fr"
          ? isPackBooking
            ? "Votre séance avec AAN Psychotherapy est confirmée et a été réservée avec un crédit de votre Pack Patient."
            : "Merci d’avoir réservé votre séance avec AAN Psychotherapy. Votre rendez-vous est confirmé après validation du paiement."
          : isPackBooking
            ? "Your AAN Psychotherapy session is confirmed and was booked using one Patient Pack credit."
            : "Thank you for booking your therapy session with AAN Psychotherapy. Your appointment has been confirmed after successful payment.";

    const therapistLabel =
      language === "ar"
        ? "المعالج:"
        : language === "fr"
          ? "Spécialiste :"
          : "Therapist:";

    const appointmentLabel =
      language === "ar"
        ? "الموعد:"
        : language === "fr"
          ? "Rendez-vous :"
          : "Appointment:";

    const priceLabel =
      language === "ar"
        ? "السعر:"
        : language === "fr"
          ? "Prix :"
          : "Price:";

    const priceValue =
      isPackBooking
        ? language === "ar"
          ? "مشمولة في باقة المريض — لا يوجد دفع إضافي"
          : language === "fr"
            ? "Incluse dans votre Pack Patient — aucun paiement supplémentaire"
            : "Included in your Patient Pack — no additional payment"
        : language === "ar"
          ? `${formattedPrice} دولار`
          : `$${formattedPrice}`;

    const platformLabel =
      language === "ar"
        ? "منصة الجلسة:"
        : language === "fr"
          ? "Plateforme de la séance :"
          : "Session platform:";

    const joinLabel =
      language === "ar"
        ? `الانضمام إلى الجلسة عبر ${mainProviderLabel}`
        : language === "fr"
          ? `Rejoindre la séance via ${mainProviderLabel}`
          : `Join session with ${mainProviderLabel}`;

    const fallbackLinkLabel =
      language === "ar"
        ? "إذا لم يعمل الزر، استخدم هذا الرابط:"
        : language === "fr"
          ? "Si le bouton ne fonctionne pas, utilisez ce lien :"
          : "If the button does not work, use this link:";

    const continuityTitle =
      language === "ar"
        ? "رابط متابعة الجلسة"
        : language === "fr"
          ? "Lien de continuité"
          : "Continuation link";

    const continuityText =
      language === "ar"
        ? "إذا انقطعت مكالمة الفيديو، استخدم الرابط أدناه لمتابعة الجلسة. لن يُطلب أي دفع إضافي ولن يتم خصم رصيد إضافي من الباقة."
        : language === "fr"
          ? "Si la visioconférence est interrompue, utilisez le lien ci-dessous pour poursuivre votre séance. Aucun paiement supplémentaire ne sera demandé et aucun crédit Pack supplémentaire ne sera utilisé."
          : "If the video call is interrupted, use the link below to continue your session. No additional payment will be required and no extra Patient Pack credit will be used.";

    const continuityButtonLabel =
      language === "ar"
        ? `متابعة الجلسة عبر ${backupProviderLabel || "الرابط الاحتياطي"}`
        : language === "fr"
          ? `Poursuivre la séance via ${backupProviderLabel || "le lien de continuité"}`
          : `Continue session with ${backupProviderLabel || "the continuation link"}`;

    const meetingBlock =
      meetingUrl &&
      mainProviderLabel
        ? `
          <tr>
            <td style="padding: 0 36px 26px;">
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
              >
                <tr>
                  <td align="center">
                    <p
                      style="
                        margin: 0 0 14px;
                        color: #5f6f82;
                        font-size: 15px;
                        line-height: 1.8;
                      "
                    >
                      ${platformLabel}
                      <strong style="color: #24364b;">
                        ${escapeHtml(mainProviderLabel)}
                      </strong>
                    </p>

                    <a
                      href="${safeMeetingUrl}"
                      target="_blank"
                      rel="noopener noreferrer"
                      style="
                        display: inline-block;
                        background-color: #61779d;
                        color: #ffffff;
                        text-decoration: none;
                        font-size: 16px;
                        font-weight: 700;
                        padding: 14px 24px;
                        border-radius: 12px;
                      "
                    >
                      ${joinLabel}
                    </a>

                    <p
                      style="
                        margin: 14px 0 0;
                        color: #7d8794;
                        font-size: 12px;
                        line-height: 1.7;
                        word-break: break-all;
                      "
                    >
                      ${fallbackLinkLabel}<br />
                      <a
                        href="${safeMeetingUrl}"
                        style="color: #61779d;"
                      >
                        ${safeMeetingUrl}
                      </a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        `
        : "";

    const continuityBlock =
      backupJoinUrl
        ? `
          <tr>
            <td style="padding: 0 36px 32px;">
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                  background-color: #f9f6f1;
                  border: 1px solid #e4d8c7;
                  border-radius: 18px;
                "
              >
                <tr>
                  <td
                    align="center"
                    style="padding: 22px;"
                  >
                    <p
                      style="
                        margin: 0 0 8px;
                        color: #24364b;
                        font-size: 16px;
                        font-weight: 700;
                      "
                    >
                      ${continuityTitle}
                    </p>

                    <p
                      style="
                        margin: 0 0 16px;
                        color: #5f6f82;
                        font-size: 14px;
                        line-height: 1.8;
                      "
                    >
                      ${continuityText}
                    </p>

                    <a
                      href="${safeBackupJoinUrl}"
                      target="_blank"
                      rel="noopener noreferrer"
                      style="
                        display: inline-block;
                        background-color: #24364b;
                        color: #ffffff;
                        text-decoration: none;
                        font-size: 15px;
                        font-weight: 700;
                        padding: 13px 22px;
                        border-radius: 12px;
                      "
                    >
                      ${continuityButtonLabel}
                    </a>

                    <p
                      style="
                        margin: 14px 0 0;
                        color: #7d8794;
                        font-size: 12px;
                        line-height: 1.7;
                        word-break: break-all;
                      "
                    >
                      ${safeBackupJoinUrl}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        `
        : "";

    const htmlLang =
      language === "ar"
        ? "ar"
        : language === "fr"
          ? "fr"
          : "en";

    const htmlDir =
      language === "ar"
        ? ' dir="rtl"'
        : "";

    const headerAlign =
      language === "ar"
        ? "right"
        : "left";

    const footerText =
      language === "ar"
        ? "مساحة آمنة للدعم والنمو"
        : language === "fr"
          ? "Un espace sûr pour le soutien et l’évolution"
          : "A safe space for support and growth";

    const html = `
      <!DOCTYPE html>
      <html lang="${htmlLang}"${htmlDir}>
        <head>
          <meta charset="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>${subject}</title>
        </head>

        <body
          style="
            margin: 0;
            padding: 0;
            background-color: #f6f2ec;
            font-family: Arial, sans-serif;
            color: #24364b;
          "
        >
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="background-color: #f6f2ec; padding: 32px 16px;"
          >
            <tr>
              <td align="center">
                <table
                  role="presentation"
                  width="100%"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  style="
                    max-width: 620px;
                    background-color: #ffffff;
                    border: 1px solid #e4d8c7;
                    border-radius: 24px;
                    overflow: hidden;
                  "
                >
                  <tr>
                    <td
                      style="
                        padding: 36px 36px 24px;
                        text-align: ${headerAlign};
                      "
                    >
                      <p
                        style="
                          margin: 0;
                          color: #b5965c;
                          font-size: 13px;
                          font-weight: 700;
                          letter-spacing: 3px;
                        "
                      >
                        AAN PSYCHOTHERAPY
                      </p>

                      <h1
                        style="
                          margin: 18px 0 0;
                          color: #24364b;
                          font-size: 34px;
                          line-height: 1.3;
                        "
                      >
                        ${title}
                      </h1>

                      <p
                        style="
                          margin: 18px 0 0;
                          color: #5f6f82;
                          font-size: 17px;
                          line-height: 1.9;
                        "
                      >
                        ${intro}
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 0 36px 32px;">
                      <table
                        role="presentation"
                        width="100%"
                        cellspacing="0"
                        cellpadding="0"
                        border="0"
                        style="
                          background-color: #f9f6f1;
                          border-radius: 18px;
                          padding: 22px;
                        "
                      >
                        <tr>
                          <td style="padding: 8px 0;">
                            <strong style="color: #24364b;">
                              ${therapistLabel}
                            </strong>

                            <span style="color: #5f6f82;">
                              ${safeTherapist}
                            </span>
                          </td>
                        </tr>

                        <tr>
                          <td style="padding: 8px 0;">
                            <strong style="color: #24364b;">
                              ${appointmentLabel}
                            </strong>

                            <span style="color: #5f6f82;">
                              ${safeSlot}
                            </span>
                          </td>
                        </tr>

                        <tr>
                          <td style="padding: 8px 0;">
                            <strong style="color: #24364b;">
                              ${priceLabel}
                            </strong>

                            <span style="color: #5f6f82;">
                              ${priceValue}
                            </span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  ${meetingBlock}

                  ${continuityBlock}

                  <tr>
                    <td
                      style="
                        padding: 22px 36px;
                        background-color: #24364b;
                        text-align: center;
                      "
                    >
                      <p
                        style="
                          margin: 0;
                          color: #ffffff;
                          font-size: 14px;
                          line-height: 1.8;
                        "
                      >
                        AAN Psychotherapy
                        <br />
                        ${footerText}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const { data, error } =
      await resend.emails.send({
        from:
          process.env.RESEND_FROM_EMAIL ||
          "AAN Psychotherapy <onboarding@resend.dev>",
        to: email,
        subject,
        html,
      });

    if (error) {
      console.error(
        "Resend email error:",
        error,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            error.message,
        },
        {
          status: 500,
        },
      );
    }

    console.log(
      "Booking email sent:",
      data,
    );

    return NextResponse.json({
      success: true,
      emailId:
        data?.id,
    });
  } catch (error) {
    console.error(
      "Booking email API error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to send booking email.",
      },
      {
        status: 500,
      },
    );
  }
}

import { NextResponse } from "next/server";
import { Resend } from "resend";

type Language =
  | "en"
  | "fr"
  | "ar";

type PlatformChangeEmailRequest = {
  email?: string;
  therapist?: string;
  meetingProvider?: "google_meet" | "zoom";
  meetingUrl?: string;
  scheduledStart?: string | null;
  language?: Language;
  backupMeetingProvider?:
    | "google_meet"
    | "zoom"
    | string
    | null;
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

function getProviderLabel(
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

    const body =
      (await request.json()) as
        PlatformChangeEmailRequest;

    const email =
      body.email?.trim();

    const therapist =
      body.therapist?.trim() ||
      "Specialist";

    const meetingUrl =
      body.meetingUrl?.trim() ||
      "";

    const backupJoinUrl =
      body.backupJoinUrl?.trim() ||
      "";

    const language:
      Language =
      body.language === "ar"
        ? "ar"
        : body.language === "fr"
          ? "fr"
          : "en";

    const providerLabel =
      getProviderLabel(
        body.meetingProvider,
      );

    const backupProviderLabel =
      getProviderLabel(
        body.backupMeetingProvider,
      ) ||
      providerLabel;

    if (
      !email ||
      !meetingUrl ||
      !providerLabel
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "email, meetingProvider and meetingUrl are required.",
        },
        {
          status: 400,
        },
      );
    }

    const scheduledDate =
      body.scheduledStart &&
      !Number.isNaN(
        new Date(
          body.scheduledStart,
        ).getTime(),
      )
        ? new Date(
            body.scheduledStart,
          )
        : null;

    const scheduledLabel =
      scheduledDate
        ? new Intl.DateTimeFormat(
            language === "ar"
              ? "ar-LB"
              : language === "fr"
                ? "fr-FR"
                : "en-GB",
            {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone:
                "Asia/Beirut",
            },
          ).format(
            scheduledDate,
          )
        : "";

    const safeTherapist =
      escapeHtml(therapist);

    const safeMeetingUrl =
      escapeHtml(meetingUrl);

    const safeBackupJoinUrl =
      escapeHtml(
        backupJoinUrl,
      );

    const subject =
      language === "ar"
        ? "AAN Psychotherapy — تم تغيير منصة الجلسة"
        : language === "fr"
          ? "AAN Psychotherapy — Changement de plateforme de séance"
          : "AAN Psychotherapy — Session platform changed";

    const title =
      language === "ar"
        ? "تم تغيير منصة الجلسة"
        : language === "fr"
          ? "La plateforme de la séance a changé"
          : "Session platform changed";

    const intro =
      language === "ar"
        ? `قام اختصاصيك بتغيير منصة هذه الجلسة إلى <strong>${providerLabel}</strong>. يرجى استخدام الرابط الجديد أدناه.`
        : language === "fr"
          ? `Votre spécialiste a changé la plateforme de cette séance vers <strong>${providerLabel}</strong>. Utilisez le nouveau lien ci-dessous.`
          : `Your specialist has switched this session to <strong>${providerLabel}</strong>. Please use the new link below.`;

    const specialistLabel =
      language === "ar"
        ? "الاختصاصي:"
        : language === "fr"
          ? "Spécialiste :"
          : "Specialist:";

    const sessionLabel =
      language === "ar"
        ? "الجلسة:"
        : language === "fr"
          ? "Séance :"
          : "Session:";

    const timeZoneLabel =
      language === "ar"
        ? "بتوقيت لبنان"
        : language === "fr"
          ? "heure du Liban"
          : "Lebanon time";

    const platformLabel =
      language === "ar"
        ? "المنصة الجديدة:"
        : language === "fr"
          ? "Nouvelle plateforme :"
          : "New platform:";

    const joinLabel =
      language === "ar"
        ? `الانضمام عبر ${providerLabel}`
        : language === "fr"
          ? `Rejoindre via ${providerLabel}`
          : `Join with ${providerLabel}`;

    const fallbackLabel =
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
        ? "إذا انقطعت مكالمة الفيديو، استخدم هذا الرابط لمتابعة نفس الجلسة. لن يُطلب أي دفع إضافي ولن يتم احتساب جلسة إضافية."
        : language === "fr"
          ? "Si la visioconférence est interrompue, utilisez ce lien pour poursuivre la même séance. Aucun paiement supplémentaire ne sera demandé et aucune séance supplémentaire ne sera comptabilisée."
          : "If the video call is interrupted, use this link to continue the same session. No additional payment will be required and no extra session will be counted.";

    const continuityButton =
      language === "ar"
        ? `متابعة الجلسة عبر ${backupProviderLabel || "الرابط الاحتياطي"}`
        : language === "fr"
          ? `Poursuivre via ${backupProviderLabel || "le lien de continuité"}`
          : `Continue with ${backupProviderLabel || "the continuation link"}`;

    const footer =
      language === "ar"
        ? "مساحة آمنة للدعم والنمو"
        : language === "fr"
          ? "Un espace sûr pour le soutien et l’évolution"
          : "A safe space for support and growth";

    const direction =
      language === "ar"
        ? ' dir="rtl"'
        : "";

    const textAlign =
      language === "ar"
        ? "right"
        : "left";

    const continuityBlock =
      backupJoinUrl
        ? `
          <div
            style="
              margin-top:24px;
              padding:20px;
              background:#f9f6f1;
              border:1px solid #e4d8c7;
              border-radius:16px;
              text-align:center;
            "
          >
            <div
              style="
                color:#24364b;
                font-size:16px;
                font-weight:700;
              "
            >
              ${continuityTitle}
            </div>

            <p
              style="
                margin:10px 0 16px;
                color:#5f6f82;
                font-size:14px;
                line-height:1.7;
              "
            >
              ${continuityText}
            </p>

            <a
              href="${safeBackupJoinUrl}"
              target="_blank"
              rel="noopener noreferrer"
              style="
                display:inline-block;
                background:#24364b;
                color:#fff;
                text-decoration:none;
                padding:13px 22px;
                border-radius:12px;
                font-weight:700;
              "
            >
              ${continuityButton}
            </a>

            <p
              style="
                margin:14px 0 0;
                color:#7d8794;
                font-size:12px;
                line-height:1.6;
                word-break:break-all;
              "
            >
              ${safeBackupJoinUrl}
            </p>
          </div>
        `
        : "";

    const resend =
      new Resend(resendApiKey);

    const { data, error } =
      await resend.emails.send({
        from:
          process.env.RESEND_FROM_EMAIL ||
          "AAN Psychotherapy <onboarding@resend.dev>",
        to: [email],
        subject,
        html: `
          <!doctype html>
          <html lang="${language}"${direction}>
            <body
              style="
                margin:0;
                padding:0;
                background:#f6f2ec;
                font-family:Arial,sans-serif;
                color:#24364b;
              "
            >
              <table
                role="presentation"
                width="100%"
                cellpadding="0"
                cellspacing="0"
                style="padding:32px 16px;background:#f6f2ec;"
              >
                <tr>
                  <td align="center">
                    <table
                      role="presentation"
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      style="
                        max-width:620px;
                        background:#fff;
                        border:1px solid #e4d8c7;
                        border-radius:24px;
                        overflow:hidden;
                      "
                    >
                      <tr>
                        <td
                          style="
                            padding:36px;
                            text-align:${textAlign};
                          "
                        >
                          <p
                            style="
                              margin:0;
                              color:#b5965c;
                              font-size:13px;
                              font-weight:700;
                              letter-spacing:3px;
                            "
                          >
                            AAN PSYCHOTHERAPY
                          </p>

                          <h1
                            style="
                              margin:18px 0 0;
                              font-size:30px;
                              line-height:1.3;
                            "
                          >
                            ${title}
                          </h1>

                          <p
                            style="
                              margin:18px 0 0;
                              color:#5f6f82;
                              font-size:16px;
                              line-height:1.7;
                            "
                          >
                            ${intro}
                          </p>

                          <div
                            style="
                              margin-top:22px;
                              padding:18px;
                              background:#f9f6f1;
                              border-radius:16px;
                              color:#5f6f82;
                            "
                          >
                            <div>
                              <strong style="color:#24364b;">
                                ${specialistLabel}
                              </strong>
                              ${safeTherapist}
                            </div>

                            ${
                              scheduledLabel
                                ? `
                                  <div style="margin-top:8px;">
                                    <strong style="color:#24364b;">
                                      ${sessionLabel}
                                    </strong>
                                    ${escapeHtml(scheduledLabel)} · ${timeZoneLabel}
                                  </div>
                                `
                                : ""
                            }

                            <div style="margin-top:8px;">
                              <strong style="color:#24364b;">
                                ${platformLabel}
                              </strong>
                              ${providerLabel}
                            </div>
                          </div>

                          <div
                            style="
                              margin-top:26px;
                              text-align:center;
                            "
                          >
                            <a
                              href="${safeMeetingUrl}"
                              target="_blank"
                              rel="noopener noreferrer"
                              style="
                                display:inline-block;
                                background:#61779d;
                                color:#fff;
                                text-decoration:none;
                                padding:14px 24px;
                                border-radius:12px;
                                font-weight:700;
                              "
                            >
                              ${joinLabel}
                            </a>

                            <p
                              style="
                                margin:14px 0 0;
                                color:#7d8794;
                                font-size:12px;
                                line-height:1.6;
                                word-break:break-all;
                              "
                            >
                              ${fallbackLabel}<br />
                              <a
                                href="${safeMeetingUrl}"
                                style="color:#61779d;"
                              >
                                ${safeMeetingUrl}
                              </a>
                            </p>
                          </div>

                          ${continuityBlock}
                        </td>
                      </tr>

                      <tr>
                        <td
                          style="
                            padding:22px 36px;
                            background:#24364b;
                            color:#fff;
                            text-align:center;
                            font-size:14px;
                            line-height:1.7;
                          "
                        >
                          AAN Psychotherapy
                          <br />
                          ${footer}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
      });

    if (error) {
      console.error(
        "Platform change email failed:",
        error,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to send platform change email.",
        },
        {
          status: 502,
        },
      );
    }

    return NextResponse.json({
      success: true,
      id:
        data?.id ||
        null,
    });
  } catch (error) {
    console.error(
      "Platform change email route error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to send platform change email.",
      },
      {
        status: 500,
      },
    );
  }
}

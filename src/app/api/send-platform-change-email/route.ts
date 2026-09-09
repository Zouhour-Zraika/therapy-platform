import { NextResponse } from "next/server";
import { Resend } from "resend";

type PlatformChangeEmailRequest = {
  email?: string;
  therapist?: string;
  meetingProvider?: "google_meet" | "zoom";
  meetingUrl?: string;
  scheduledStart?: string | null;
};

export async function POST(request: Request) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      return NextResponse.json(
        { success: false, error: "RESEND_API_KEY is missing." },
        { status: 500 },
      );
    }

    const body =
      (await request.json()) as PlatformChangeEmailRequest;

    const email = body.email?.trim();
    const therapist =
      body.therapist?.trim() || "Specialist";
    const meetingUrl =
      body.meetingUrl?.trim() || "";

    const providerLabel =
      body.meetingProvider === "zoom"
        ? "Zoom"
        : body.meetingProvider === "google_meet"
          ? "Google Meet"
          : "";

    if (!email || !meetingUrl || !providerLabel) {
      return NextResponse.json(
        {
          success: false,
          error:
            "email, meetingProvider and meetingUrl are required.",
        },
        { status: 400 },
      );
    }

    const scheduledLabel =
      body.scheduledStart &&
      !Number.isNaN(
        new Date(body.scheduledStart).getTime(),
      )
        ? new Intl.DateTimeFormat("en-GB", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "Asia/Beirut",
          }).format(
            new Date(body.scheduledStart),
          )
        : "";

    const resend = new Resend(resendApiKey);

    const { data, error } =
      await resend.emails.send({
        from:
          "AAN Psychotherapy <onboarding@resend.dev>",
        to: [email],
        subject:
          "AAN Psychotherapy — Session platform changed",
        html: `
          <!doctype html>
          <html>
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
                        <td style="padding:36px;">
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
                            Session platform changed
                          </h1>

                          <p
                            style="
                              margin:18px 0 0;
                              color:#5f6f82;
                              font-size:16px;
                              line-height:1.7;
                            "
                          >
                            Your specialist has switched this session
                            to <strong>${providerLabel}</strong>.
                            Please use the new link below.
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
                                Specialist:
                              </strong>
                              ${therapist}
                            </div>

                            ${
                              scheduledLabel
                                ? `
                                  <div style="margin-top:8px;">
                                    <strong style="color:#24364b;">
                                      Session:
                                    </strong>
                                    ${scheduledLabel} · Lebanon time
                                  </div>
                                `
                                : ""
                            }

                            <div style="margin-top:8px;">
                              <strong style="color:#24364b;">
                                New platform:
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
                              href="${meetingUrl}"
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
                              Join with ${providerLabel}
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
                              If the button does not work, use this link:<br />
                              <a href="${meetingUrl}" style="color:#61779d;">
                                ${meetingUrl}
                              </a>
                            </p>
                          </div>
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
                          "
                        >
                          AAN Psychotherapy
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
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      id: data?.id || null,
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
      { status: 500 },
    );
  }
}

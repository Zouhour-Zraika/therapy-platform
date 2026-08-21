import { NextResponse } from "next/server";
import { Resend } from "resend";

type TherapistApprovalEmailRequest = {
  email?: string;
  fullName?: string;
  loginUrl?: string;
};

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
      (await request.json()) as TherapistApprovalEmailRequest;

    const email =
      body.email?.trim();

    const fullName =
      body.fullName?.trim() ||
      "Specialist";

    const requestOrigin =
      new URL(request.url).origin;

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(
        /\/$/,
        "",
      ) || requestOrigin;

    const loginUrl =
      body.loginUrl?.trim() ||
      `${siteUrl}/clinician`;

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

    const subject =
      "AAN Psychotherapy — Your Specialist Application Has Been Approved";

    const html = `
      <!DOCTYPE html>
      <html lang="en">
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
            style="
              background-color: #f6f2ec;
              padding: 32px 16px;
            "
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
                    max-width: 650px;
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
                          font-size: 32px;
                          line-height: 1.3;
                        "
                      >
                        Application approved
                      </h1>

                      <p
                        style="
                          margin: 18px 0 0;
                          color: #5f6f82;
                          font-size: 17px;
                          line-height: 1.8;
                        "
                      >
                        Dear ${fullName},
                        <br /><br />
                        We are pleased to inform you that your application
                        to join AAN Psychotherapy as a specialist has been
                        approved.
                      </p>

                      <p
                        style="
                          margin: 18px 0 0;
                          color: #5f6f82;
                          font-size: 17px;
                          line-height: 1.8;
                        "
                      >
                        You can now continue the onboarding process and
                        access the specialist portal.
                      </p>

                      <div
                        style="
                          margin-top: 28px;
                          text-align: center;
                        "
                      >
                        <a
                          href="${loginUrl}"
                          style="
                            display: inline-block;
                            background-color: #415a72;
                            color: #ffffff;
                            text-decoration: none;
                            padding: 14px 24px;
                            border-radius: 12px;
                            font-weight: 700;
                          "
                        >
                          Access Specialist Portal
                        </a>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding: 28px 36px;
                        border-top: 1px solid #e4d8c7;
                      "
                    >
                      <h2
                        style="
                          margin: 0;
                          color: #24364b;
                          font-size: 23px;
                        "
                      >
                        Candidature approuvée
                      </h2>

                      <p
                        style="
                          margin: 14px 0 0;
                          color: #5f6f82;
                          font-size: 16px;
                          line-height: 1.8;
                        "
                      >
                        Bonjour ${fullName},
                        <br /><br />
                        Nous avons le plaisir de vous informer que votre
                        candidature pour rejoindre AAN Psychotherapy en
                        tant que spécialiste a été approuvée.
                        <br /><br />
                        Vous pouvez maintenant poursuivre votre intégration
                        et accéder à l’espace spécialiste.
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td
                      dir="rtl"
                      style="
                        padding: 28px 36px;
                        border-top: 1px solid #e4d8c7;
                        text-align: right;
                      "
                    >
                      <h2
                        style="
                          margin: 0;
                          color: #24364b;
                          font-size: 23px;
                        "
                      >
                        تمت الموافقة على طلبك
                      </h2>

                      <p
                        style="
                          margin: 14px 0 0;
                          color: #5f6f82;
                          font-size: 16px;
                          line-height: 1.9;
                        "
                      >
                        مرحباً ${fullName}،
                        <br /><br />
                        يسرّنا إبلاغك بأنه تمت الموافقة على طلبك
                        للانضمام إلى AAN Psychotherapy كمختص.
                        <br /><br />
                        يمكنك الآن متابعة خطوات الانضمام والوصول
                        إلى بوابة المختصين.
                      </p>
                    </td>
                  </tr>

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
                        A safe space for support and growth
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

    const {
      data,
      error,
    } =
      await resend.emails.send({
        from:
          "AAN Psychotherapy <onboarding@resend.dev>",

        to: email,

        subject,

        html,
      });

    if (error) {
      console.error(
        "Therapist approval email error:",
        error,
      );

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        {
          status: 500,
        },
      );
    }

    console.log(
      "Therapist approval email sent:",
      {
        email,
        emailId: data?.id,
      },
    );

    return NextResponse.json({
      success: true,
      emailId: data?.id,
    });
  } catch (error) {
    console.error(
      "Therapist approval email API error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to send therapist approval email.",
      },
      {
        status: 500,
      },
    );
  }
}
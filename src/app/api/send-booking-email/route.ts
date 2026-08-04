import { NextResponse } from "next/server";
import { Resend } from "resend";

type BookingEmailRequest = {
  email?: string;
  therapist?: string;
  slot?: string;
  price?: number | string;
  language?: "en" | "ar";
  bookingId?: string;
  paymentProvider?: string;
  transactionId?: string;
};

export async function POST(request: Request) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "RESEND_API_KEY is missing.",
        },
        {
          status: 500,
        },
      );
    }

    const resend = new Resend(resendApiKey);

    const body = (await request.json()) as BookingEmailRequest;

    const email = body.email?.trim();
    const therapist = body.therapist?.trim() || "Therapist";
    const slot = body.slot?.trim() || "";
    const price = Number(body.price || 0);
    const language = body.language === "ar" ? "ar" : "en";

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: "Recipient email is missing.",
        },
        {
          status: 400,
        },
      );
    }

    const isArabic = language === "ar";

    const subject = isArabic
      ? "تأكيد حجز الجلسة - AAN Psychotherapy"
      : "AAN Psychotherapy — Session Booking Confirmation";

    const formattedPrice = Number.isFinite(price)
      ? price.toFixed(2)
      : "0.00";

    const html = isArabic
      ? `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
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
                          text-align: right;
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
                          تم تأكيد الحجز
                        </h1>

                        <p
                          style="
                            margin: 18px 0 0;
                            color: #5f6f82;
                            font-size: 17px;
                            line-height: 1.9;
                          "
                        >
                          شكراً لحجز جلستك مع AAN Psychotherapy.
                          تم تأكيد موعدك بنجاح بعد إتمام عملية الدفع.
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
                                المعالج:
                              </strong>

                              <span style="color: #5f6f82;">
                                ${therapist}
                              </span>
                            </td>
                          </tr>

                          <tr>
                            <td style="padding: 8px 0;">
                              <strong style="color: #24364b;">
                                الموعد:
                              </strong>

                              <span style="color: #5f6f82;">
                                ${slot}
                              </span>
                            </td>
                          </tr>

                          <tr>
                            <td style="padding: 8px 0;">
                              <strong style="color: #24364b;">
                                السعر:
                              </strong>

                              <span style="color: #5f6f82;">
                                ${formattedPrice} دولار
                              </span>
                            </td>
                          </tr>
                        </table>
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
                          مساحة آمنة للدعم والنمو
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `
      : `
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
                      <td style="padding: 36px 36px 24px;">
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
                          Booking Confirmed
                        </h1>

                        <p
                          style="
                            margin: 18px 0 0;
                            color: #5f6f82;
                            font-size: 17px;
                            line-height: 1.8;
                          "
                        >
                          Thank you for booking your therapy session
                          with AAN Psychotherapy. Your appointment has
                          been confirmed after successful payment.
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
                                Therapist:
                              </strong>

                              <span style="color: #5f6f82;">
                                ${therapist}
                              </span>
                            </td>
                          </tr>

                          <tr>
                            <td style="padding: 8px 0;">
                              <strong style="color: #24364b;">
                                Appointment:
                              </strong>

                              <span style="color: #5f6f82;">
                                ${slot}
                              </span>
                            </td>
                          </tr>

                          <tr>
                            <td style="padding: 8px 0;">
                              <strong style="color: #24364b;">
                                Price:
                              </strong>

                              <span style="color: #5f6f82;">
                                $${formattedPrice}
                              </span>
                            </td>
                          </tr>
                        </table>
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

    const { data, error } = await resend.emails.send({
      from: "AAN Psychotherapy <onboarding@resend.dev>",
      to: email,
      subject,
      html,
    });

    if (error) {
      console.error("Resend email error:", error);

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

    console.log("Booking email sent:", data);

    return NextResponse.json({
      success: true,
      emailId: data?.id,
    });
  } catch (error) {
    console.error("Booking email API error:", error);

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
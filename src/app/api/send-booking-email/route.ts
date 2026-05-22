import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      email,
      therapist,
      slot,
      price,
      language,
    } = body;

    const isArabic = language === "ar";

    const subject = isArabic
      ? "تأكيد حجز الجلسة"
      : "Therapy Session Booking Confirmation";

    const html = isArabic
      ? `
        <div style="font-family: sans-serif; direction: rtl;">
          <h1>تم تأكيد الحجز</h1>

          <p>شكراً لحجز جلستك.</p>

          <p><strong>المعالج:</strong> ${therapist}</p>
          <p><strong>الموعد:</strong> ${slot}</p>
          <p><strong>السعر:</strong> ${price} دولار</p>
        </div>
      `
      : `
        <div style="font-family: sans-serif;">
          <h1>Booking Confirmed</h1>

          <p>Thank you for booking your therapy session.</p>

          <p><strong>Therapist:</strong> ${therapist}</p>
          <p><strong>Slot:</strong> ${slot}</p>
          <p><strong>Price:</strong> $${price}</p>
        </div>
      `;

    const data = await resend.emails.send({
      from: "TheraCare <onboarding@resend.dev>",
      to: email,
      subject,
      html,
    });

    console.log("Email sent:", data);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.log("Email API error:", error);

    return NextResponse.json(
      {
        success: false,
        error,
      },
      {
        status: 500,
      }
    );
  }
}
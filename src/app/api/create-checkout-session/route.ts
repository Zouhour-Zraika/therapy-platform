import { NextResponse } from "next/server";
import Stripe from "stripe";

type CheckoutRequest = {
  therapist?: string;
  price?: number | string;
  slot?: string;
  language?: "en" | "ar";
  email?: string;
  bookingId?: string;
};

export async function POST(request: Request) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        { error: "STRIPE_SECRET_KEY is missing." },
        { status: 500 },
      );
    }

    const stripe = new Stripe(secretKey);

    const body = (await request.json()) as CheckoutRequest;

    const therapist = body.therapist?.trim();
    const slot = body.slot?.trim();
    const email = body.email?.trim();
    const bookingId = body.bookingId?.trim();
    const language = body.language === "ar" ? "ar" : "en";
    const numericPrice = Number(body.price);

    if (
      !therapist ||
      !slot ||
      !email ||
      !bookingId ||
      !Number.isFinite(numericPrice) ||
      numericPrice <= 0
    ) {
      return NextResponse.json(
        {
          error:
            language === "ar"
              ? "معلومات الدفع غير مكتملة."
              : "The payment information is incomplete.",
        },
        { status: 400 },
      );
    }

    const requestOrigin = new URL(request.url).origin;

    const publicSiteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      requestOrigin;

    const successUrl =
      `${publicSiteUrl}/success` +
      `?bookingId=${encodeURIComponent(bookingId)}` +
      `&session_id={CHECKOUT_SESSION_ID}`;

    console.log("STRIPE CHECKOUT DEBUG:", {
      requestOrigin,
      publicSiteUrl,
      bookingId,
      successUrl,
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      customer_email: email,

      locale: language === "ar" ? "auto" : "en",

      payment_method_types: ["card"],

      line_items: [
        {
          quantity: 1,

          price_data: {
            currency: "usd",

            unit_amount: Math.round(numericPrice * 100),

            product_data: {
              name:
                language === "ar"
                  ? `جلسة علاج مع ${therapist}`
                  : `Therapy session with ${therapist}`,

              description: slot,
            },
          },
        },
      ],

      metadata: {
        bookingId,
        therapist,
        slot,
        language,
        email,
        paymentProvider: "stripe",
      },

      payment_intent_data: {
        metadata: {
          bookingId,
          paymentProvider: "stripe",
        },
      },

      success_url: successUrl,

      cancel_url:
        `${publicSiteUrl}/payment` +
        `?bookingId=${encodeURIComponent(bookingId)}` +
        `&therapist=${encodeURIComponent(therapist)}` +
        `&price=${encodeURIComponent(String(numericPrice))}` +
        `&slot=${encodeURIComponent(slot)}`,
    });

    console.log("STRIPE SESSION CREATED:", {
      id: session.id,
      success_url: session.success_url,
      url: session.url,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      provider: "stripe",
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Stripe checkout session error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create the Stripe checkout session.",
      },
      { status: 500 },
    );
  }
}
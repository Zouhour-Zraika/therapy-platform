import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2026-04-22.dahlia",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { therapist, price, slot, language } = body;

    const stripeLocale = language === "ar" ? "ar" : "en";

    const origin =
      req.headers.get("origin") || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],

      locale: stripeLocale as any,

      line_items: [
        {
          price_data: {
            currency: "usd",

            product_data: {
              name:
                language === "ar"
                  ? `جلسة علاج مع ${therapist}`
                  : `Therapy Session with ${therapist}`,

              description: slot,
            },

            unit_amount: Number(price) * 100,
          },

          quantity: 1,
        },
      ],

      mode: "payment",

      success_url: `${origin}/session`,

      cancel_url: `${origin}/payment`,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        error: "Stripe session error",
      },
      {
        status: 500,
      }
    );
  }
}
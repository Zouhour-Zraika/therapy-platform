import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { therapist, price, slot } = body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Therapy Session with ${therapist}`,
              description: slot,
            },
            unit_amount: Number(price) * 100,
          },
          quantity: 1,
        },
      ],

      mode: "payment",

      success_url: "http://localhost:3000/session",
      cancel_url: "http://localhost:3000/payment",
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { error: "Stripe session error" },
      { status: 500 }
    );
  }
}
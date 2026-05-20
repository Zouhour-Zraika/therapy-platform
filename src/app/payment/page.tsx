"use client";

import { useSearchParams } from "next/navigation";

export default function PaymentPage() {
  const searchParams = useSearchParams();

  const therapist = searchParams.get("therapist");
  const price = searchParams.get("price");
  const slot = searchParams.get("slot");

  const handlePayment = async () => {
    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          therapist,
          price,
          slot,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.log(error);
      alert("Payment failed");
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-10">
      <section className="mx-auto max-w-2xl rounded-3xl bg-white p-10 shadow-lg">
        <h1 className="mb-8 text-center text-5xl font-bold text-slate-900">
          Payment
        </h1>

        <div className="rounded-2xl bg-slate-100 p-8">
          <p className="mb-4 text-2xl text-slate-700">
            Therapist:{" "}
            <strong className="text-slate-900">{therapist}</strong>
          </p>

          <p className="mb-4 text-2xl text-slate-700">
            Slot: <strong className="text-slate-900">{slot}</strong>
          </p>

          <p className="text-4xl font-bold text-slate-900">
            Total: ${price}
          </p>
        </div>

        <button
          onClick={handlePayment}
          className="mt-10 w-full rounded-2xl bg-black py-5 text-xl font-semibold text-white transition hover:opacity-90"
        >
          Pay with Stripe
        </button>
      </section>
    </main>
  );
}
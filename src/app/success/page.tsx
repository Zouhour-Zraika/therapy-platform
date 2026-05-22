"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const bookingId = searchParams.get("bookingId");

  const [message, setMessage] = useState(
    "Confirming your payment..."
  );

  useEffect(() => {
    const updateBooking = async () => {
      if (!bookingId) {
        setMessage("Booking not found.");
        return;
      }

      const { error } = await supabase
        .from("bookings")
        .update({
          status: "paid",
        })
        .eq("id", bookingId);

      if (error) {
        console.log("Booking update error:", error);

        setMessage(
          "Payment successful, but booking update failed."
        );

        return;
      }

      setMessage(
        "Payment successful! Your session is confirmed."
      );

      setTimeout(() => {
        router.push("/dashboard");
      }, 2500);
    };

    updateBooking();
  }, [bookingId, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-10">
      <section className="rounded-3xl bg-white p-12 text-center shadow-lg">
        <h1 className="mb-6 text-6xl font-bold text-slate-900">
          Payment Successful
        </h1>

        <p className="text-2xl text-slate-600">
          {message}
        </p>
      </section>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
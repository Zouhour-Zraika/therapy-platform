"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import { Language } from "../lib/translations";

function PaymentContent() {
  const searchParams = useSearchParams();

  const therapist = searchParams.get("therapist");
  const price = searchParams.get("price");
  const slot = searchParams.get("slot");

  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language;

    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  const isArabic = language === "ar";

  const translateDay = (text: string | null) => {
    if (!text || !isArabic) return text;

    return text
      .replace("Monday", "الاثنين")
      .replace("Tuesday", "الثلاثاء")
      .replace("Wednesday", "الأربعاء")
      .replace("Thursday", "الخميس")
      .replace("Friday", "الجمعة")
      .replace("Saturday", "السبت")
      .replace("Sunday", "الأحد");
  };

  const toArabicNumbers = (value: string) => {
    return value.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)]);
  };

  const handlePayment = async () => {
    try {
      const response = await fetch(
        "/api/create-checkout-session",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            therapist,
            price,
            slot,
            language,
            email: "patient@example.com",
          }),
        }
      );

      const data = await response.json();

      console.log("Stripe response:", data);

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(
          isArabic
            ? "حدث خطأ في الدفع"
            : "Payment error"
        );
      }
    } catch (error) {
      console.log("Payment error:", error);

      alert(
        isArabic
          ? "فشل الدفع"
          : "Payment failed"
      );
    }
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-100 p-10">
        <section className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-lg">
          <h1 className="mb-10 text-center text-6xl font-bold text-slate-900">
            {isArabic ? "الدفع" : "Payment"}
          </h1>

          <div className="rounded-3xl bg-slate-100 p-10">
            <p className="mb-6 text-4xl text-slate-900">
              {isArabic ? "المعالج:" : "Therapist:"}{" "}
              <strong>{therapist}</strong>
            </p>

            <p className="mb-6 text-4xl text-slate-900">
              {isArabic ? "الموعد:" : "Slot:"}{" "}
              <strong>
                {isArabic
                  ? toArabicNumbers(
                      translateDay(slot || "") || ""
                    )
                  : slot}
              </strong>
            </p>

            <p className="text-5xl font-bold text-slate-900">
              {isArabic
                ? `الإجمالي: ${toArabicNumbers(
                    price || "0"
                  )} دولار`
                : `Total: $${price}`}
            </p>
          </div>

          <button
            onClick={handlePayment}
            className="mt-10 w-full rounded-3xl bg-black py-6 text-3xl font-bold text-white"
          >
            {isArabic
              ? "الدفع عبر Stripe"
              : "Pay with Stripe"}
          </button>
        </section>
      </main>
    </>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentContent />
    </Suspense>
  );
}
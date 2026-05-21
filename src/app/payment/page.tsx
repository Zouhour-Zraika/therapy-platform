"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import { Language } from "../lib/translations";

export default function PaymentPage() {
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
              <strong>{translateDay(slot)}</strong>
            </p>

            <p className="text-5xl font-bold text-slate-900">
              {isArabic
                ? `الإجمالي: ${Number(price).toLocaleString("ar-EG")} دولار`
                : `Total: $${price}`}
            </p>
          </div>

          <button className="mt-10 w-full rounded-3xl bg-black py-6 text-3xl font-bold text-white">
            {isArabic ? "الدفع عبر Stripe" : "Pay with Stripe"}
          </button>
        </section>
      </main>
    </>
  );
}
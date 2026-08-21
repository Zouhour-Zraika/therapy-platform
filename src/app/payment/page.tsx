"use client";

import {
  Suspense,
  useState,
} from "react";

import {
  useSearchParams,
} from "next/navigation";

import Navbar from "../components/Navbar";

import { supabase } from "@/lib/supabase";

import {
  useLanguage,
} from "@/i18n/LanguageProvider";

type PaymentProvider =
  | "stripe"
  | "whish"
  | "omt";

function PaymentContent() {
  const searchParams =
    useSearchParams();

  const bookingId =
    searchParams.get("bookingId");

  const therapist =
    searchParams.get("therapist");

  const price =
    searchParams.get("price");

  const slot =
    searchParams.get("slot");

  const {
    language,
    isArabic,
  } = useLanguage();

  const [isProcessing, setIsProcessing] =
    useState(false);

  const [selectedProvider, setSelectedProvider] =
    useState<PaymentProvider>(
      "stripe",
    );

  const text = {
    title:
      language === "ar"
        ? "الدفع"
        : language === "fr"
          ? "Paiement"
          : "Payment",

    specialist:
      language === "ar"
        ? "المختص:"
        : language === "fr"
          ? "Spécialiste :"
          : "Specialist:",

    slot:
      language === "ar"
        ? "الموعد:"
        : language === "fr"
          ? "Rendez-vous :"
          : "Appointment:",

    total:
      language === "ar"
        ? "الإجمالي"
        : language === "fr"
          ? "Total"
          : "Total",

    chooseMethod:
      language === "ar"
        ? "اختر طريقة الدفع"
        : language === "fr"
          ? "Choisissez votre moyen de paiement"
          : "Choose your payment method",

    card:
      language === "ar"
        ? "بطاقة مصرفية"
        : language === "fr"
          ? "Carte bancaire"
          : "Bank card",

    stripeDescription:
      language === "ar"
        ? "ادفع بأمان باستخدام بطاقتك عبر Stripe."
        : language === "fr"
          ? "Payez en toute sécurité par carte via Stripe."
          : "Pay securely by card through Stripe.",

    whishDescription:
      language === "ar"
        ? "الدفع عبر محفظة Whish Money."
        : language === "fr"
          ? "Paiement via votre portefeuille Whish Money."
          : "Pay using your Whish Money wallet.",

    omtDescription:
      language === "ar"
        ? "الدفع عبر OMT."
        : language === "fr"
          ? "Paiement via OMT."
          : "Pay through OMT.",

    unavailable:
      language === "ar"
        ? "سيتم تفعيله قريبًا"
        : language === "fr"
          ? "Activation en cours"
          : "Coming soon",

    payStripe:
      language === "ar"
        ? "الدفع بالبطاقة"
        : language === "fr"
          ? "Payer par carte"
          : "Pay by card",

    redirectingStripe:
      language === "ar"
        ? "جاري التحويل إلى Stripe..."
        : language === "fr"
          ? "Redirection vers Stripe..."
          : "Redirecting to Stripe...",

    loginRequired:
      language === "ar"
        ? "يجب تسجيل الدخول لإتمام عملية الدفع."
        : language === "fr"
          ? "Vous devez être connecté pour effectuer le paiement."
          : "You must be logged in to complete the payment.",

    missingBooking:
      language === "ar"
        ? "معلومات الحجز غير مكتملة."
        : language === "fr"
          ? "Les informations de réservation sont incomplètes."
          : "The booking information is incomplete.",

    paymentError:
      language === "ar"
        ? "حدث خطأ أثناء بدء عملية الدفع."
        : language === "fr"
          ? "Une erreur s’est produite lors du démarrage du paiement."
          : "An error occurred while starting the payment.",

    secure:
      language === "ar"
        ? "يتم التحقق من مبلغ الدفع بشكل آمن من بيانات الحجز."
        : language === "fr"
          ? "Le montant du paiement est vérifié de manière sécurisée à partir de votre réservation."
          : "The payment amount is securely verified from your booking.",
  };

  const translateArabicDay = (
    value: string,
  ) => {
    return value
      .replace("Monday", "الاثنين")
      .replace("Tuesday", "الثلاثاء")
      .replace(
        "Wednesday",
        "الأربعاء",
      )
      .replace(
        "Thursday",
        "الخميس",
      )
      .replace("Friday", "الجمعة")
      .replace("Saturday", "السبت")
      .replace("Sunday", "الأحد");
  };

  const translateFrenchDay = (
    value: string,
  ) => {
    return value
      .replace("Monday", "Lundi")
      .replace("Tuesday", "Mardi")
      .replace(
        "Wednesday",
        "Mercredi",
      )
      .replace("Thursday", "Jeudi")
      .replace("Friday", "Vendredi")
      .replace("Saturday", "Samedi")
      .replace("Sunday", "Dimanche")
      .replace(
        "January",
        "janvier",
      )
      .replace(
        "February",
        "février",
      )
      .replace("March", "mars")
      .replace("April", "avril")
      .replace("May", "mai")
      .replace("June", "juin")
      .replace("July", "juillet")
      .replace("August", "août")
      .replace(
        "September",
        "septembre",
      )
      .replace(
        "October",
        "octobre",
      )
      .replace(
        "November",
        "novembre",
      )
      .replace(
        "December",
        "décembre",
      );
  };

  const formatSlot = (
    value: string | null,
  ) => {
    if (!value) {
      return "—";
    }

    if (language === "ar") {
      return translateArabicDay(
        value,
      );
    }

    if (language === "fr") {
      return translateFrenchDay(
        value,
      );
    }

    return value;
  };

  const formatPrice = (
    value: string | null,
  ) => {
    const numericValue =
      Number(value);

    if (
      !Number.isFinite(
        numericValue,
      )
    ) {
      return value || "—";
    }

    return new Intl.NumberFormat(
      language === "ar"
        ? "ar-LB"
        : language === "fr"
          ? "fr-FR"
          : "en-US",
      {
        style: "currency",
        currency: "USD",
      },
    ).format(
      numericValue,
    );
  };

  const handleStripePayment =
    async () => {
      if (isProcessing) {
        return;
      }

      if (!bookingId) {
        alert(
          text.missingBooking,
        );

        return;
      }

      setIsProcessing(true);

      try {
        /*
         * On vérifie seulement ici
         * qu’un utilisateur est connecté.
         *
         * Le prix, le spécialiste et
         * l’e-mail officiel sont récupérés
         * côté serveur depuis Supabase.
         */
        const {
          data: { user },
          error: userError,
        } =
          await supabase.auth.getUser();

        if (
          userError ||
          !user
        ) {
          alert(
            text.loginRequired,
          );

          setIsProcessing(false);

          return;
        }

        const response =
          await fetch(
            "/api/create-checkout-session",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                bookingId,
                language,
              }),
            },
          );

        const data =
          await response.json();

        console.log(
          "Stripe checkout response:",
          data,
        );

        if (!response.ok) {
          alert(
            data.error ||
              text.paymentError,
          );

          setIsProcessing(false);

          return;
        }

        if (data.url) {
          window.location.href =
            data.url;

          return;
        }

        alert(
          text.paymentError,
        );

        setIsProcessing(false);
      } catch (error) {
        console.error(
          "Stripe payment error:",
          error,
        );

        alert(
          text.paymentError,
        );

        setIsProcessing(false);
      }
    };

  const handlePayment = async () => {
    if (
      selectedProvider ===
      "stripe"
    ) {
      await handleStripePayment();

      return;
    }

    /*
     * Whish et OMT seront activés
     * uniquement lorsque les accès
     * marchands/API officiels seront
     * disponibles.
     */
    alert(
      selectedProvider ===
      "whish"
        ? language === "ar"
          ? "سيتم تفعيل الدفع عبر Whish Money بعد ربط حساب التاجر."
          : language === "fr"
            ? "Le paiement Whish Money sera activé après la connexion du compte marchand."
            : "Whish Money payments will be activated after the merchant account is connected."
        : language === "ar"
          ? "سيتم تفعيل الدفع عبر OMT بعد ربط حساب التاجر."
          : language === "fr"
            ? "Le paiement OMT sera activé après la connexion du compte marchand."
            : "OMT payments will be activated after the merchant account is connected.",
    );
  };

  return (
    <>
      <Navbar />

      <main
        dir={
          isArabic
            ? "rtl"
            : "ltr"
        }
        className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6 lg:px-8"
      >
        <section className="mx-auto max-w-4xl rounded-3xl bg-white p-6 shadow-lg sm:p-8 lg:p-10">
          <h1 className="text-center text-4xl font-bold text-slate-900 sm:text-5xl">
            {text.title}
          </h1>

          <div className="mt-10 rounded-3xl bg-slate-100 p-6 sm:p-8">
            <div className="space-y-5">
              <p className="text-xl text-slate-900 sm:text-2xl">
                <strong>
                  {text.specialist}
                </strong>{" "}
                {therapist || "—"}
              </p>

              <p className="text-xl text-slate-900 sm:text-2xl">
                <strong>
                  {text.slot}
                </strong>{" "}
                {formatSlot(slot)}
              </p>

              <div className="border-t border-slate-300 pt-5">
                <p className="text-3xl font-bold text-slate-900 sm:text-4xl">
                  {text.total}:{" "}
                  {formatPrice(
                    price,
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <h2 className="text-2xl font-bold text-slate-900">
              {text.chooseMethod}
            </h2>

            <div className="mt-5 grid gap-4">
              {/* STRIPE */}
              <button
                type="button"
                onClick={() =>
                  setSelectedProvider(
                    "stripe",
                  )
                }
                className={`w-full rounded-2xl border-2 p-5 text-left transition ${
                  selectedProvider ===
                  "stripe"
                    ? "border-aan-button bg-aan-background"
                    : "border-slate-200 bg-white hover:border-aan-gold"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xl font-bold text-slate-900">
                      Stripe
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {text.card}
                    </p>

                    <p className="mt-2 text-sm text-slate-600">
                      {
                        text.stripeDescription
                      }
                    </p>
                  </div>

                  <div
                    className={`h-5 w-5 shrink-0 rounded-full border-2 ${
                      selectedProvider ===
                      "stripe"
                        ? "border-aan-button bg-aan-button"
                        : "border-slate-300"
                    }`}
                  />
                </div>
              </button>

              {/* WHISH */}
              <button
                type="button"
                onClick={() =>
                  setSelectedProvider(
                    "whish",
                  )
                }
                className={`w-full rounded-2xl border-2 p-5 text-left transition ${
                  selectedProvider ===
                  "whish"
                    ? "border-aan-button bg-aan-background"
                    : "border-slate-200 bg-white hover:border-aan-gold"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xl font-bold text-slate-900">
                      Whish Money
                    </p>

                    <p className="mt-2 text-sm text-slate-600">
                      {
                        text.whishDescription
                      }
                    </p>

                    <span className="mt-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                      {text.unavailable}
                    </span>
                  </div>

                  <div
                    className={`h-5 w-5 shrink-0 rounded-full border-2 ${
                      selectedProvider ===
                      "whish"
                        ? "border-aan-button bg-aan-button"
                        : "border-slate-300"
                    }`}
                  />
                </div>
              </button>

              {/* OMT */}
              <button
                type="button"
                onClick={() =>
                  setSelectedProvider(
                    "omt",
                  )
                }
                className={`w-full rounded-2xl border-2 p-5 text-left transition ${
                  selectedProvider ===
                  "omt"
                    ? "border-aan-button bg-aan-background"
                    : "border-slate-200 bg-white hover:border-aan-gold"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xl font-bold text-slate-900">
                      OMT
                    </p>

                    <p className="mt-2 text-sm text-slate-600">
                      {
                        text.omtDescription
                      }
                    </p>

                    <span className="mt-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                      {text.unavailable}
                    </span>
                  </div>

                  <div
                    className={`h-5 w-5 shrink-0 rounded-full border-2 ${
                      selectedProvider ===
                      "omt"
                        ? "border-aan-button bg-aan-button"
                        : "border-slate-300"
                    }`}
                  />
                </div>
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            {text.secure}
          </p>

          <button
            type="button"
            onClick={handlePayment}
            disabled={
              isProcessing ||
              selectedProvider !==
                "stripe"
            }
            className="mt-8 w-full rounded-2xl bg-aan-button px-6 py-5 text-xl font-bold text-white shadow-sm transition hover:bg-aan-hover disabled:cursor-not-allowed disabled:opacity-50 sm:text-2xl"
          >
            {selectedProvider ===
            "stripe"
              ? isProcessing
                ? text.redirectingStripe
                : text.payStripe
              : text.unavailable}
          </button>
        </section>
      </main>
    </>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
          <p>
            Loading...
          </p>
        </main>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}


import {
  Suspense,
  useState,
} from "react";

import {
  useSearchParams,
} from "next/navigation";

import Navbar from "../components/Navbar";

import {
  supabase,
} from "@/lib/supabase";

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

  const [
    isProcessing,
    setIsProcessing,
  ] = useState(false);

  const [
    selectedProvider,
    setSelectedProvider,
  ] =
    useState<PaymentProvider>(
      "stripe",
    );

  const text =
    language === "ar"
      ? {
          eyebrow:
            "الدفع الآمن",

          title:
            "تأكيد وحجز الجلسة",

          subtitle:
            "راجع تفاصيل جلستك واختر وسيلة الدفع المناسبة لإتمام الحجز.",

          specialist:
            "المختص",

          appointment:
            "الموعد",

          total:
            "الإجمالي",

          bookingSummary:
            "ملخص الحجز",

          chooseMethod:
            "اختر وسيلة الدفع",

          card:
            "بطاقة مصرفية",

          stripeDescription:
            "ادفع بأمان باستخدام بطاقتك عبر Stripe.",

          whishDescription:
            "الدفع عبر محفظة Whish Money.",

          omtDescription:
            "الدفع عبر OMT.",

          unavailable:
            "التفعيل قيد الإعداد",

          payStripe:
            "المتابعة إلى الدفع الآمن",

          redirectingStripe:
            "جارٍ التحويل إلى Stripe...",

          loginRequired:
            "يجب تسجيل الدخول لإتمام عملية الدفع.",

          missingBooking:
            "معلومات الحجز غير مكتملة.",

          paymentError:
            "حدث خطأ أثناء بدء عملية الدفع.",

          secure:
            "يتم التحقق من مبلغ الدفع بشكل آمن من بيانات الحجز قبل إنشاء عملية الدفع.",

          secureBadge:
            "دفع آمن",

          availableNow:
            "متاح الآن",

          soon:
            "قريباً",

          paymentInfo:
            "لن يتم تأكيد الحجز نهائياً إلا بعد نجاح عملية الدفع.",

          loading:
            "جارٍ تحميل صفحة الدفع...",
        }
      : language === "fr"
        ? {
            eyebrow:
              "Paiement sécurisé",

            title:
              "Confirmer et régler votre séance",

            subtitle:
              "Vérifiez les détails de votre séance et choisissez votre moyen de paiement pour finaliser la réservation.",

            specialist:
              "Spécialiste",

            appointment:
              "Rendez-vous",

            total:
              "Total",

            bookingSummary:
              "Récapitulatif de la réservation",

            chooseMethod:
              "Choisissez votre moyen de paiement",

            card:
              "Carte bancaire",

            stripeDescription:
              "Payez en toute sécurité par carte via Stripe.",

            whishDescription:
              "Paiement via votre portefeuille Whish Money.",

            omtDescription:
              "Paiement via OMT.",

            unavailable:
              "Activation en cours",

            payStripe:
              "Continuer vers le paiement sécurisé",

            redirectingStripe:
              "Redirection vers Stripe...",

            loginRequired:
              "Vous devez être connecté pour effectuer le paiement.",

            missingBooking:
              "Les informations de réservation sont incomplètes.",

            paymentError:
              "Une erreur s’est produite lors du démarrage du paiement.",

            secure:
              "Le montant est vérifié de manière sécurisée à partir de votre réservation avant la création du paiement.",

            secureBadge:
              "Paiement sécurisé",

            availableNow:
              "Disponible",

            soon:
              "Bientôt disponible",

            paymentInfo:
              "Votre réservation ne sera confirmée définitivement qu’après la validation du paiement.",

            loading:
              "Chargement de la page de paiement...",
          }
        : {
            eyebrow:
              "Secure payment",

            title:
              "Confirm and pay for your session",

            subtitle:
              "Review your session details and choose a payment method to complete your booking.",

            specialist:
              "Specialist",

            appointment:
              "Appointment",

            total:
              "Total",

            bookingSummary:
              "Booking summary",

            chooseMethod:
              "Choose your payment method",

            card:
              "Bank card",

            stripeDescription:
              "Pay securely by card through Stripe.",

            whishDescription:
              "Pay using your Whish Money wallet.",

            omtDescription:
              "Pay through OMT.",

            unavailable:
              "Activation in progress",

            payStripe:
              "Continue to secure payment",

            redirectingStripe:
              "Redirecting to Stripe...",

            loginRequired:
              "You must be logged in to complete the payment.",

            missingBooking:
              "The booking information is incomplete.",

            paymentError:
              "An error occurred while starting the payment.",

            secure:
              "The amount is securely verified from your booking before the payment is created.",

            secureBadge:
              "Secure payment",

            availableNow:
              "Available",

            soon:
              "Coming soon",

            paymentInfo:
              "Your booking will only be confirmed after the payment has been successfully validated.",

            loading:
              "Loading payment page...",
          };

  const translateArabicDay = (
    value: string,
  ) => {
    return value
      .replace(
        "Monday",
        "الاثنين",
      )
      .replace(
        "Tuesday",
        "الثلاثاء",
      )
      .replace(
        "Wednesday",
        "الأربعاء",
      )
      .replace(
        "Thursday",
        "الخميس",
      )
      .replace(
        "Friday",
        "الجمعة",
      )
      .replace(
        "Saturday",
        "السبت",
      )
      .replace(
        "Sunday",
        "الأحد",
      );
  };

  const translateFrenchDay = (
    value: string,
  ) => {
    return value
      .replace(
        "Monday",
        "Lundi",
      )
      .replace(
        "Tuesday",
        "Mardi",
      )
      .replace(
        "Wednesday",
        "Mercredi",
      )
      .replace(
        "Thursday",
        "Jeudi",
      )
      .replace(
        "Friday",
        "Vendredi",
      )
      .replace(
        "Saturday",
        "Samedi",
      )
      .replace(
        "Sunday",
        "Dimanche",
      )
      .replace(
        "January",
        "janvier",
      )
      .replace(
        "February",
        "février",
      )
      .replace(
        "March",
        "mars",
      )
      .replace(
        "April",
        "avril",
      )
      .replace(
        "May",
        "mai",
      )
      .replace(
        "June",
        "juin",
      )
      .replace(
        "July",
        "juillet",
      )
      .replace(
        "August",
        "août",
      )
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
    value:
      | string
      | null,
  ) => {
    if (!value) {
      return "—";
    }

    if (
      language === "ar"
    ) {
      return translateArabicDay(
        value,
      );
    }

    if (
      language === "fr"
    ) {
      return translateFrenchDay(
        value,
      );
    }

    return value;
  };

  const formatPrice = (
    value:
      | string
      | null,
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
        style:
          "currency",

        currency:
          "USD",

        minimumFractionDigits:
          0,

        maximumFractionDigits:
          2,
      },
    ).format(
      numericValue,
    );
  };

  const handleStripePayment =
    async () => {
      if (
        isProcessing
      ) {
        return;
      }

      if (!bookingId) {
        alert(
          text.missingBooking,
        );

        return;
      }

      setIsProcessing(
        true,
      );

      try {
        /*
         * On vérifie uniquement
         * qu'un utilisateur est connecté.
         *
         * Le montant officiel, le spécialiste
         * et le patient sont relus côté serveur.
         */
        const {
          data: {
            user,
          },

          error:
            userError,
        } =
          await supabase.auth.getUser();

        if (
          userError ||
          !user
        ) {
          alert(
            text.loginRequired,
          );

          setIsProcessing(
            false,
          );

          return;
        }

        const {
          data: {
            session,
          },
          error:
            sessionError,
        } =
          await supabase.auth.getSession();

        if (
          sessionError ||
          !session?.access_token
        ) {
          alert(
            text.loginRequired,
          );

          setIsProcessing(
            false,
          );

          return;
        }

        const response =
          await fetch(
            "/api/create-checkout-session",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
                Authorization:
                  `Bearer ${session.access_token}`,
              },

              body:
                JSON.stringify({
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

        if (
          !response.ok
        ) {
          alert(
            data.error ||
              text.paymentError,
          );

          setIsProcessing(
            false,
          );

          return;
        }

        if (
          data.url
        ) {
          window.location.href =
            data.url;

          return;
        }

        alert(
          text.paymentError,
        );

        setIsProcessing(
          false,
        );
      } catch (
        error
      ) {
        console.error(
          "Stripe payment error:",
          error,
        );

        alert(
          text.paymentError,
        );

        setIsProcessing(
          false,
        );
      }
    };

  const handlePayment =
    async () => {
      if (
        selectedProvider ===
        "stripe"
      ) {
        await handleStripePayment();

        return;
      }

      alert(
        selectedProvider ===
          "whish"
          ? language === "ar"
            ? "سيتم تفعيل الدفع عبر Whish Money بعد ربط حساب التاجر."
            : language ===
                "fr"
              ? "Le paiement Whish Money sera activé après la connexion du compte marchand."
              : "Whish Money payments will be activated after the merchant account is connected."
          : language === "ar"
            ? "سيتم تفعيل الدفع عبر OMT بعد ربط حساب التاجر."
            : language ===
                "fr"
              ? "Le paiement OMT sera activé après la connexion du compte marchand."
              : "OMT payments will be activated after the merchant account is connected.",
      );
    };

  const paymentOptionClass = (
    provider:
      PaymentProvider,
  ) => {
    const selected =
      selectedProvider ===
      provider;

    return `w-full rounded-[1.4rem] border p-5 text-left transition duration-200 ${
      selected
        ? "border-aan-button bg-[#f8f4ee] shadow-[var(--aan-shadow-sm)]"
        : "border-aan-border bg-white hover:border-aan-gold hover:bg-[#fbf8f3]"
    }`;
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
        className="relative min-h-screen overflow-hidden bg-aan-background px-4 py-10 sm:px-6 lg:px-8"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-aan-gold/10 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-aan-button/10 blur-3xl"
        />

        <section className="relative mx-auto max-w-5xl">
          <div className="aan-card overflow-hidden">
            {/* HEADER */}
            <div className="border-b border-aan-border px-7 pb-8 pt-9 text-center sm:px-12 sm:pb-10 sm:pt-11">
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-aan-gold">
                {
                  text.eyebrow
                }
              </p>

              <h1 className="aan-heading mx-auto mt-5 max-w-3xl text-4xl leading-tight sm:text-5xl lg:text-6xl">
                {
                  text.title
                }
              </h1>

              <div className="mx-auto mt-6 flex items-center justify-center gap-3">
                <div className="h-px w-20 bg-aan-gold" />

                <span className="h-2 w-2 rounded-full bg-aan-gold" />

                <div className="h-px w-20 bg-aan-gold" />
              </div>

              <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-aan-secondary sm:text-lg">
                {
                  text.subtitle
                }
              </p>
            </div>

            <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:p-10">
              {/* RÉCAPITULATIF */}
              <aside className="self-start rounded-[1.75rem] border border-aan-border bg-[linear-gradient(145deg,#fbf8f3_0%,#f5eee4_100%)] p-6 sm:p-7">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-aan-gold">
                  {
                    text.bookingSummary
                  }
                </p>

                <div className="mt-6 space-y-6">
                  <div>
                    <p className="text-sm font-bold text-aan-secondary">
                      {
                        text.specialist
                      }
                    </p>

                    <p className="aan-heading mt-2 text-3xl">
                      {
                        therapist ||
                        "—"
                      }
                    </p>
                  </div>

                  <div className="border-t border-aan-border pt-5">
                    <p className="text-sm font-bold text-aan-secondary">
                      {
                        text.appointment
                      }
                    </p>

                    <p className="mt-2 text-lg font-semibold leading-7 text-aan-navy">
                      {
                        formatSlot(
                          slot,
                        )
                      }
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white p-5 shadow-[var(--aan-shadow-sm)]">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-aan-gold">
                      {
                        text.total
                      }
                    </p>

                    <p className="mt-2 text-4xl font-bold text-aan-navy">
                      {
                        formatPrice(
                          price,
                        )
                      }
                    </p>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl border border-aan-border bg-white/70 px-4 py-4">
                    <span className="mt-0.5 text-aan-gold">
                      ✓
                    </span>

                    <p className="text-sm leading-6 text-aan-secondary">
                      {
                        text.paymentInfo
                      }
                    </p>
                  </div>
                </div>
              </aside>

              {/* PAIEMENT */}
              <section>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-aan-gold">
                      {
                        text.secureBadge
                      }
                    </p>

                    <h2 className="aan-heading mt-2 text-3xl">
                      {
                        text.chooseMethod
                      }
                    </h2>
                  </div>
                </div>

                <div className="mt-6 grid gap-4">
                  {/* STRIPE */}
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedProvider(
                        "stripe",
                      )
                    }
                    className={
                      paymentOptionClass(
                        "stripe",
                      )
                    }
                  >
                    <div className="flex items-center justify-between gap-5">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-xl font-bold text-aan-navy">
                            Stripe
                          </p>

                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                            {
                              text.availableNow
                            }
                          </span>
                        </div>

                        <p className="mt-2 text-sm font-bold text-aan-secondary">
                          {
                            text.card
                          }
                        </p>

                        <p className="mt-2 text-sm leading-6 text-aan-secondary">
                          {
                            text.stripeDescription
                          }
                        </p>
                      </div>

                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                          selectedProvider ===
                          "stripe"
                            ? "border-aan-button"
                            : "border-aan-border"
                        }`}
                      >
                        {selectedProvider ===
                          "stripe" && (
                          <span className="h-3 w-3 rounded-full bg-aan-button" />
                        )}
                      </div>
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
                    className={
                      paymentOptionClass(
                        "whish",
                      )
                    }
                  >
                    <div className="flex items-center justify-between gap-5">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-xl font-bold text-aan-navy">
                            Whish Money
                          </p>

                          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                            {
                              text.soon
                            }
                          </span>
                        </div>

                        <p className="mt-2 text-sm leading-6 text-aan-secondary">
                          {
                            text.whishDescription
                          }
                        </p>

                        <p className="mt-2 text-xs font-semibold text-aan-gold">
                          {
                            text.unavailable
                          }
                        </p>
                      </div>

                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                          selectedProvider ===
                          "whish"
                            ? "border-aan-button"
                            : "border-aan-border"
                        }`}
                      >
                        {selectedProvider ===
                          "whish" && (
                          <span className="h-3 w-3 rounded-full bg-aan-button" />
                        )}
                      </div>
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
                    className={
                      paymentOptionClass(
                        "omt",
                      )
                    }
                  >
                    <div className="flex items-center justify-between gap-5">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-xl font-bold text-aan-navy">
                            OMT
                          </p>

                          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                            {
                              text.soon
                            }
                          </span>
                        </div>

                        <p className="mt-2 text-sm leading-6 text-aan-secondary">
                          {
                            text.omtDescription
                          }
                        </p>

                        <p className="mt-2 text-xs font-semibold text-aan-gold">
                          {
                            text.unavailable
                          }
                        </p>
                      </div>

                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                          selectedProvider ===
                          "omt"
                            ? "border-aan-button"
                            : "border-aan-border"
                        }`}
                      >
                        {selectedProvider ===
                          "omt" && (
                          <span className="h-3 w-3 rounded-full bg-aan-button" />
                        )}
                      </div>
                    </div>
                  </button>
                </div>

                <div className="mt-6 rounded-2xl border border-aan-border bg-[#fbf8f3] px-5 py-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-aan-gold">
                      🔒
                    </span>

                    <p className="text-sm leading-6 text-aan-secondary">
                      {
                        text.secure
                      }
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={
                    handlePayment
                  }
                  disabled={
                    isProcessing ||
                    selectedProvider !==
                      "stripe"
                  }
                  className="aan-cta mt-6 w-full rounded-2xl px-6 py-4 text-lg font-bold text-white disabled:cursor-not-allowed disabled:opacity-45 sm:text-xl"
                >
                  {selectedProvider ===
                  "stripe"
                    ? isProcessing
                      ? text.redirectingStripe
                      : text.payStripe
                    : text.unavailable}
                </button>
              </section>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default function PaymentPage() {
  const {
    language,
  } = useLanguage();

  const loadingText =
    language === "ar"
      ? "جارٍ تحميل صفحة الدفع..."
      : language === "fr"
        ? "Chargement de la page de paiement..."
        : "Loading payment page...";

  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-aan-background px-6">
          <div className="aan-card px-8 py-6 text-center">
            <p className="font-semibold text-aan-secondary">
              {
                loadingText
              }
            </p>
          </div>
        </main>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
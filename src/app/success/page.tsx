"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import Navbar from "../components/Navbar";
import {
  useLanguage,
} from "@/i18n/LanguageProvider";

type BookingStatus = {
  id: string;
  status: string;
  therapist_name: string | null;
  slot_day: string | null;
  slot_time: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  meeting_url: string | null;
  meeting_provider: string | null;
  calendar_event_id: string | null;
};

function SuccessContent() {
  const searchParams =
    useSearchParams();

  const router =
    useRouter();

  const {
    language,
    isArabic,
  } = useLanguage();

  const bookingId =
    searchParams.get("bookingId");

  const sessionId =
    searchParams.get("session_id");

  const [booking, setBooking] =
    useState<BookingStatus | null>(
      null,
    );

  const [messageKey, setMessageKey] =
    useState<
      | "confirming"
      | "incomplete"
      | "stillConfirming"
      | "success"
      | "finalising"
      | "delayed"
    >("confirming");

  const [loading, setLoading] =
    useState(true);

  const text =
    language === "ar"
      ? {
          eyebrow: "تأكيد الحجز",
          title: "تم تأكيد الدفع",
          confirming: "جارٍ تأكيد عملية الدفع...",
          incomplete: "مرجع الدفع غير مكتمل.",
          stillConfirming: "لا يزال الدفع قيد التأكيد...",
          success: "تم الدفع بنجاح وتم تأكيد حجز جلستك.",
          finalising: "تم استلام الدفع، ويتم الآن إنهاء تأكيد الحجز...",
          delayed: "تم استلام الدفع، لكن الحجز لا يزال قيد الإنهاء. يرجى مراجعة لوحة التحكم بعد قليل.",
          bookingDetails: "تفاصيل الحجز",
          specialist: "المختص",
          sessionDate: "تاريخ الجلسة",
          sessionTime: "الوقت",
          status: "الحالة",
          paid: "مدفوع",
          joinMeeting: "الانضمام إلى الجلسة",
          dashboard: "عرض مواعيدي",
          secureNote: "تم التحقق من الدفع من خلال مزود الدفع قبل تأكيد الحجز.",
        }
      : language === "fr"
        ? {
            eyebrow: "Confirmation de réservation",
            title: "Paiement confirmé",
            confirming: "Confirmation de votre paiement...",
            incomplete: "La référence de paiement est incomplète.",
            stillConfirming: "Votre paiement est encore en cours de confirmation...",
            success: "Votre paiement a été validé et votre séance est maintenant confirmée.",
            finalising: "Paiement reçu. Finalisation de votre réservation...",
            delayed: "Votre paiement a bien été reçu, mais la réservation est encore en cours de finalisation. Consultez votre tableau de bord dans quelques instants.",
            bookingDetails: "Détails de la réservation",
            specialist: "Spécialiste",
            sessionDate: "Date de la séance",
            sessionTime: "Heure",
            status: "Statut",
            paid: "Payé",
            joinMeeting: "Rejoindre la séance",
            dashboard: "Voir mes rendez-vous",
            secureNote: "Le paiement a été vérifié auprès du prestataire de paiement avant la confirmation de la réservation.",
          }
        : {
            eyebrow: "Booking confirmation",
            title: "Payment confirmed",
            confirming: "Confirming your payment...",
            incomplete: "Payment reference is incomplete.",
            stillConfirming: "Your payment is still being confirmed...",
            success: "Your payment was successful and your session is now confirmed.",
            finalising: "Payment received. Finalising your booking...",
            delayed: "Your payment was received, but the booking is still being finalised. Please check your dashboard shortly.",
            bookingDetails: "Booking details",
            specialist: "Specialist",
            sessionDate: "Session date",
            sessionTime: "Time",
            status: "Status",
            paid: "Paid",
            joinMeeting: "Join session",
            dashboard: "View my appointments",
            secureNote: "Your payment was verified with the payment provider before the booking was confirmed.",
          };

  useEffect(() => {
    let cancelled = false;

    const verifyPayment = async () => {
      if (!sessionId || !bookingId) {
        if (!cancelled) {
          setMessageKey("incomplete");
          setLoading(false);
        }
        return;
      }

      for (let attempt = 0; attempt < 8; attempt += 1) {
        try {
          const params = new URLSearchParams({
            session_id: sessionId,
            bookingId,
          });

          const response = await fetch(
            `/api/payment-status?${params.toString()}`,
            { cache: "no-store" },
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Unable to verify payment.");
          }

          if (data.paymentStatus !== "paid") {
            if (!cancelled) {
              setMessageKey("stillConfirming");
            }
          } else if (data.booking?.status === "paid") {
            if (cancelled) return;

            setBooking(data.booking);
            setMessageKey("success");
            setLoading(false);
            return;
          } else if (!cancelled) {
            setMessageKey("finalising");
          }
        } catch (error) {
          console.error("Payment confirmation error:", error);
        }

        await new Promise((resolve) =>
          window.setTimeout(resolve, 1500),
        );
      }

      if (!cancelled) {
        setMessageKey("delayed");
        setLoading(false);
      }
    };

    void verifyPayment();

    return () => {
      cancelled = true;
    };
  }, [bookingId, sessionId]);

  const locale =
    language === "ar"
      ? "ar-LB"
      : language === "fr"
        ? "fr-FR"
        : "en-GB";

  const formatSessionDate = (value: string | null) => {
    if (!value) return "—";

    return new Intl.DateTimeFormat(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Beirut",
    }).format(new Date(value));
  };

  const formatSessionTime = (value: string | null) => {
    if (!value) return booking?.slot_time || "—";

    return new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Beirut",
    }).format(new Date(value));
  };

  const isConfirmed = Boolean(
    booking && booking.status === "paid",
  );

  const currentMessage = text[messageKey];

  return (
    <>
      <Navbar />

      <main
        dir={isArabic ? "rtl" : "ltr"}
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

        <section className="relative mx-auto max-w-4xl">
          <div className="aan-card overflow-hidden">
            <div className="border-b border-aan-border px-6 pb-8 pt-10 text-center sm:px-10 sm:pb-10 sm:pt-12">
              <div
                className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full border text-3xl font-bold ${
                  isConfirmed
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-aan-border bg-[#fbf8f3] text-aan-gold"
                }`}
              >
                {isConfirmed ? "✓" : "•"}
              </div>

              <p className="mt-6 text-sm font-bold uppercase tracking-[0.3em] text-aan-gold">
                {text.eyebrow}
              </p>

              <h1 className="aan-heading mx-auto mt-4 max-w-3xl text-4xl leading-tight sm:text-5xl lg:text-6xl">
                {isConfirmed ? text.title : currentMessage}
              </h1>

              <div className="mx-auto mt-6 flex items-center justify-center gap-3">
                <div className="h-px w-20 bg-aan-gold" />
                <span className="h-2 w-2 rounded-full bg-aan-gold" />
                <div className="h-px w-20 bg-aan-gold" />
              </div>

              {isConfirmed && (
                <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-aan-secondary sm:text-lg">
                  {currentMessage}
                </p>
              )}
            </div>

            <div className="p-6 sm:p-8 lg:p-10">
              {loading ? (
                <div className="rounded-[1.75rem] border border-aan-border bg-[#fbf8f3] p-10 text-center">
                  <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-aan-border border-t-aan-button" />
                  <p className="mt-5 font-semibold text-aan-secondary">
                    {currentMessage}
                  </p>
                </div>
              ) : booking ? (
                <>
                  <section className="rounded-[1.75rem] border border-aan-border bg-[linear-gradient(145deg,#fbf8f3_0%,#f5eee4_100%)] p-6 sm:p-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.24em] text-aan-gold">
                          {text.bookingDetails}
                        </p>

                        <h2 className="aan-heading mt-2 text-3xl sm:text-4xl">
                          {booking.therapist_name || text.specialist}
                        </h2>
                      </div>

                      <span className="inline-flex w-fit rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
                        {text.paid}
                      </span>
                    </div>

                    <div className="mt-7 grid gap-4 sm:grid-cols-3">
                      <div className="rounded-2xl bg-white p-5 shadow-[var(--aan-shadow-sm)]">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-aan-gold">
                          {text.sessionDate}
                        </p>
                        <p className="mt-2 font-bold capitalize leading-6 text-aan-navy">
                          {formatSessionDate(booking.scheduled_start)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-5 shadow-[var(--aan-shadow-sm)]">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-aan-gold">
                          {text.sessionTime}
                        </p>
                        <p className="mt-2 text-xl font-bold text-aan-navy">
                          {formatSessionTime(booking.scheduled_start)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-5 shadow-[var(--aan-shadow-sm)]">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-aan-gold">
                          {text.status}
                        </p>
                        <p className="mt-2 text-xl font-bold text-emerald-700">
                          {text.paid}
                        </p>
                      </div>
                    </div>
                  </section>

                  <div className="mt-6 rounded-2xl border border-aan-border bg-white px-5 py-4">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 text-aan-gold">✓</span>
                      <p className="text-sm leading-6 text-aan-secondary">
                        {text.secureNote}
                      </p>
                    </div>
                  </div>

                  <div className="mt-7 grid gap-3 sm:grid-cols-2">
                    {booking.meeting_url ? (
                      <a
                        href={booking.meeting_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aan-button flex items-center justify-center px-6 py-4 text-center font-bold"
                      >
                        {text.joinMeeting}
                      </a>
                    ) : (
                      <div className="hidden sm:block" />
                    )}

                    <button
                      type="button"
                      onClick={() => router.push("/dashboard")}
                      className={`aan-cta rounded-2xl px-6 py-4 text-lg font-bold text-white ${
                        booking.meeting_url ? "" : "sm:col-span-2"
                      }`}
                    >
                      {text.dashboard}
                    </button>
                  </div>
                </>
              ) : (
                <div className="rounded-[1.75rem] border border-aan-border bg-[#fbf8f3] p-8 text-center">
                  <p className="leading-7 text-aan-secondary">
                    {currentMessage}
                  </p>

                  <button
                    type="button"
                    onClick={() => router.push("/dashboard")}
                    className="aan-cta mt-6 rounded-2xl px-7 py-3 font-bold text-white"
                  >
                    {text.dashboard}
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-aan-background px-6">
          <div className="aan-card px-8 py-6 text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-aan-border border-t-aan-button" />
            <p className="mt-5 font-semibold text-aan-secondary">
              Confirming payment...
            </p>
          </div>
        </main>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}

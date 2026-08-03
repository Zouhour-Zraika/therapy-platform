"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import ProtectedRoute from "../components/ProtectedRoute";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/i18n/LanguageProvider";

type Booking = {
  id: string;
  therapist_name: string;
  slot_day: string;
  slot_time: string;
  price: number;
  status: string;
  created_at: string;
  zoom_join_url: string | null;
};

const DAYS_AR: Record<string, string> = {
  Monday: "الاثنين",
  Tuesday: "الثلاثاء",
  Wednesday: "الأربعاء",
  Thursday: "الخميس",
  Friday: "الجمعة",
  Saturday: "السبت",
  Sunday: "الأحد",
};

export default function PatientDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const { isArabic } = useLanguage();

  useEffect(() => {
    void getBookings();
  }, []);

  const copy = isArabic
    ? {
        eyebrow: "مساحتك الخاصة",
        title: "لوحة تحكم المريض",
        description:
          "اطّلع على جلساتك القادمة، وأكمل الدفع، وانضم إلى الجلسات عبر الإنترنت.",
        appointments: "مواعيدي",
        loading: "جارٍ تحميل المواعيد...",
        empty: "لا توجد لديك مواعيد حتى الآن.",
        findTherapist: "البحث عن معالج",
        price: "السعر",
        status: "الحالة",
        booked: "تاريخ الحجز",
        paid: "مدفوع",
        pending: "بانتظار الدفع",
        cancelled: "ملغى",
        joinZoom: "الانضمام إلى جلسة Zoom",
        zoomNotReady: "رابط Zoom غير جاهز",
        completePayment: "إكمال الدفع",
        sessionDetails: "تفاصيل الجلسة",
        unableToLoad: "تعذر تحميل المواعيد. يرجى المحاولة مرة أخرى.",
      }
    : {
        eyebrow: "Your private space",
        title: "Patient Dashboard",
        description:
          "Review your upcoming sessions, complete payments and join your online appointments.",
        appointments: "My Appointments",
        loading: "Loading appointments...",
        empty: "You do not have any appointments yet.",
        findTherapist: "Find a Therapist",
        price: "Price",
        status: "Status",
        booked: "Booked",
        paid: "Paid",
        pending: "Payment pending",
        cancelled: "Cancelled",
        joinZoom: "Join Zoom Session",
        zoomNotReady: "Zoom link not ready",
        completePayment: "Complete Payment",
        sessionDetails: "Session details",
        unableToLoad:
          "Unable to load appointments. Please try again.",
      };

  const getBookings = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        window.location.href = "/login";
        return;
      }

      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("patient_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setBookings((data as Booking[] | null) || []);
    } catch (error) {
      console.error("Unable to load patient bookings:", error);
      setErrorMessage(copy.unableToLoad);
    } finally {
      setLoading(false);
    }
  };

  const formatDigits = (value: string | number) => {
    const text = String(value);

    if (!isArabic) {
      return text;
    }

    return text.replace(/\d/g, (digit) => {
      return "٠١٢٣٤٥٦٧٨٩"[Number(digit)];
    });
  };

  const formatDay = (day: string) => {
    return isArabic ? DAYS_AR[day] || day : day;
  };

  const formatPrice = (price: number) => {
    if (isArabic) {
      return `${new Intl.NumberFormat("ar").format(price)} دولار`;
    }

    return `$${new Intl.NumberFormat("en-US").format(price)}`;
  };

  const formatBookedDate = (date: string) => {
    return new Intl.DateTimeFormat(isArabic ? "ar-LB" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  };

  const getStatusLabel = (status: string) => {
    if (status === "paid") {
      return copy.paid;
    }

    if (status === "cancelled") {
      return copy.cancelled;
    }

    return copy.pending;
  };

  const getStatusClasses = (status: string) => {
    if (status === "paid") {
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }

    if (status === "cancelled") {
      return "border-red-200 bg-red-50 text-red-700";
    }

    return "border-amber-200 bg-amber-50 text-amber-700";
  };

  return (
    <ProtectedRoute allowedRoles={["patient"]}>
      <>
        <Navbar />

        <main
          dir={isArabic ? "rtl" : "ltr"}
          className="min-h-screen bg-aan-background px-5 py-10 sm:px-8 lg:px-10"
        >
          <section className="mx-auto max-w-7xl">
            <header className="relative mb-10 overflow-hidden rounded-[2.25rem] border border-aan-border bg-white p-8 shadow-[var(--aan-shadow-md)] sm:p-10 lg:p-12">
              <div
                aria-hidden="true"
                className={`absolute -top-24 h-72 w-72 rounded-full bg-aan-gold/10 blur-3xl ${
                  isArabic ? "-left-20" : "-right-20"
                }`}
              />

              <div className="relative">
                <p className="text-sm font-bold uppercase tracking-[0.28em] text-aan-gold">
                  {copy.eyebrow}
                </p>

                <h1 className="aan-heading mt-4 text-4xl sm:text-5xl lg:text-6xl">
                  {copy.title}
                </h1>

                <div className="mt-6 flex items-center gap-3">
                  <div className="h-px w-28 bg-aan-gold" />
                  <span className="h-2 w-2 rounded-full bg-aan-gold" />
                  <span className="h-1.5 w-1.5 rounded-full bg-aan-gold/60" />
                </div>

                <p className="mt-6 max-w-3xl text-lg leading-8 text-aan-secondary">
                  {copy.description}
                </p>
              </div>
            </header>

            <section className="rounded-[2.25rem] border border-aan-border bg-white p-6 shadow-[var(--aan-shadow-md)] sm:p-8 lg:p-10">
              <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-aan-gold">
                    AAN Psychotherapy
                  </p>

                  <h2 className="aan-heading mt-2 text-3xl sm:text-4xl">
                    {copy.appointments}
                  </h2>
                </div>

                {!loading && bookings.length > 0 && (
                  <span className="inline-flex w-fit rounded-full border border-aan-border bg-[#fbf8f3] px-4 py-2 text-sm font-bold text-aan-navy">
                    {formatDigits(bookings.length)}
                  </span>
                )}
              </div>

              {loading ? (
                <div className="rounded-2xl border border-aan-border bg-[#fbf8f3] p-10 text-center">
                  <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-aan-border border-t-aan-button" />

                  <p className="mt-5 font-semibold text-aan-secondary">
                    {copy.loading}
                  </p>
                </div>
              ) : errorMessage ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-7 text-center text-red-700">
                  {errorMessage}
                </div>
              ) : bookings.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-aan-border bg-[#fbf8f3] p-10 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-2xl text-aan-gold shadow-sm">
                    ◇
                  </div>

                  <p className="mt-5 text-lg font-semibold text-aan-secondary">
                    {copy.empty}
                  </p>

                  <Link
                    href="/therapists"
                    className="aan-cta mt-7 inline-flex items-center justify-center rounded-2xl px-8 py-4 font-bold text-white"
                  >
                    {copy.findTherapist}
                  </Link>
                </div>
              ) : (
                <div className="grid gap-6">
                  {bookings.map((booking) => (
                    <article
                      key={booking.id}
                      className="overflow-hidden rounded-[2rem] border border-aan-border bg-white shadow-[var(--aan-shadow-sm)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--aan-shadow-md)]"
                    >
                      <div className="grid lg:grid-cols-[1fr_280px]">
                        <div className="p-6 sm:p-8">
                          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-[0.22em] text-aan-gold">
                                {copy.sessionDetails}
                              </p>

                              <h3 className="aan-heading mt-3 text-3xl">
                                {booking.therapist_name}
                              </h3>
                            </div>

                            <span
                              className={`inline-flex w-fit rounded-full border px-4 py-2 text-sm font-bold ${getStatusClasses(
                                booking.status,
                              )}`}
                            >
                              {getStatusLabel(booking.status)}
                            </span>
                          </div>

                          <div className="mt-7 grid gap-4 sm:grid-cols-3">
                            <div className="rounded-2xl bg-[#fbf8f3] p-4">
                              <p className="text-xs font-bold uppercase tracking-[0.18em] text-aan-gold">
                                {isArabic ? "اليوم" : "Day"}
                              </p>

                              <p className="mt-2 font-bold text-aan-navy">
                                {formatDay(booking.slot_day)}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-[#fbf8f3] p-4">
                              <p className="text-xs font-bold uppercase tracking-[0.18em] text-aan-gold">
                                {isArabic ? "الوقت" : "Time"}
                              </p>

                              <p className="mt-2 font-bold text-aan-navy">
                                {formatDigits(booking.slot_time)}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-[#fbf8f3] p-4">
                              <p className="text-xs font-bold uppercase tracking-[0.18em] text-aan-gold">
                                {copy.price}
                              </p>

                              <p className="mt-2 font-bold text-aan-navy">
                                {formatPrice(booking.price)}
                              </p>
                            </div>
                          </div>

                          <p className="mt-6 text-sm text-aan-secondary">
                            <span className="font-semibold text-aan-navy">
                              {copy.booked}:
                            </span>{" "}
                            {formatBookedDate(booking.created_at)}
                          </p>
                        </div>

                        <div className="flex flex-col justify-center border-t border-aan-border bg-[linear-gradient(145deg,#fbf8f3_0%,#eef4fa_100%)] p-6 lg:border-s lg:border-t-0 sm:p-8">
                          {booking.status === "paid" &&
                          booking.zoom_join_url ? (
                            <a
                              href={booking.zoom_join_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="aan-cta flex w-full items-center justify-center rounded-2xl px-6 py-4 text-center font-bold text-white"
                            >
                              {copy.joinZoom}
                            </a>
                          ) : booking.status === "paid" ? (
                            <button
                              type="button"
                              disabled
                              className="w-full cursor-not-allowed rounded-2xl bg-aan-button/40 px-6 py-4 font-bold text-white"
                            >
                              {copy.zoomNotReady}
                            </button>
                          ) : booking.status === "cancelled" ? (
                            <span className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-center font-bold text-red-700">
                              {copy.cancelled}
                            </span>
                          ) : (
                            <Link
                              href={`/payment?bookingId=${booking.id}&therapist=${encodeURIComponent(
                                booking.therapist_name,
                              )}&price=${booking.price}&slot=${encodeURIComponent(
                                `${booking.slot_day} ${booking.slot_time}`,
                              )}`}
                              className="aan-cta flex w-full items-center justify-center rounded-2xl px-6 py-4 text-center font-bold text-white"
                            >
                              {copy.completePayment}
                            </Link>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </section>
        </main>
      </>
    </ProtectedRoute>
  );
}
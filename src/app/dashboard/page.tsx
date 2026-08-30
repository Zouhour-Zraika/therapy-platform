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
  scheduled_start: string | null;
  zoom_join_url: string | null;
  reschedule_requested_by?: string | null;
  reschedule_requested_at?: string | null;
};

const PAYMENT_HOLD_MS = 10 * 60 * 1000;
const PATIENT_CHANGE_DEADLINE_MS = 24 * 60 * 60 * 1000;

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
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [bookingActionId, setBookingActionId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState("");

  const { language, isArabic } = useLanguage();

  const copy =
    language === "ar"
      ? {
          eyebrow: "مساحتك الخاصة",
          title: "لوحة تحكم المريض",
          description:
            "اطّلع على جلساتك القادمة، وأكمل الدفع، وانضم إلى الجلسات عبر الإنترنت.",
          appointments: "مواعيدي",
          loading: "جارٍ تحميل المواعيد...",
          empty: "لا توجد لديك مواعيد حتى الآن.",
          findTherapist: "البحث عن معالج",
          date: "التاريخ",
          time: "الوقت",
          localTime: "توقيتك المحلي",
          price: "السعر",
          status: "الحالة",
          booked: "تم الحجز في",
          paid: "مدفوع",
          pending: "بانتظار الدفع",
          cancelled: "ملغى",
          joinZoom: "الانضمام إلى جلسة Zoom",
          zoomNotReady: "رابط Zoom غير جاهز",
          completePayment: "إكمال الدفع",
          sessionDetails: "تفاصيل الجلسة",
          unableToLoad: "تعذر تحميل المواعيد. يرجى المحاولة مرة أخرى.",
          changeSlot: "تغيير الموعد",
          cancelAndRefund: "إلغاء الجلسة واسترداد المبلغ",
          changeConfirm: "يمكنك تغيير الموعد فقط إذا بقي أكثر من 24 ساعة على الجلسة. هل تريد المتابعة؟",
          cancelConfirm: "سيتم إلغاء الجلسة وطلب استرداد المبلغ إلى وسيلة الدفع الأصلية. هل تريد المتابعة؟",
          tooLate: "لا يمكن تغيير أو إلغاء الجلسة خلال آخر 24 ساعة قبل الموعد.",
          missingScheduledStart: "لا يمكن إدارة هذا الموعد لأن وقت الجلسة غير متوفر.",
          changing: "جارٍ تحضير تغيير الموعد...",
          cancelling: "جارٍ الإلغاء والاسترداد...",
          rescheduleReady: "تم تسجيل طلب تغيير الموعد. اختر الآن موعداً جديداً.",
          cancelSuccess: "تم إلغاء الجلسة وبدء عملية استرداد المبلغ.",
          actionError: "تعذر تنفيذ هذا الإجراء. يرجى المحاولة مرة أخرى.",
          refundProviderPending: "الاسترداد التلقائي لهذا المزود غير مفعّل بعد. يرجى التواصل مع AAN.",
          manageUntil: "التغيير والإلغاء متاحان حتى 24 ساعة قبل الجلسة.",
          sessionPast: "جلسة سابقة",
        }
      : language === "fr"
        ? {
            eyebrow: "Votre espace privé",
            title: "Tableau de bord patient",
            description:
              "Consultez vos prochaines séances, finalisez vos paiements et rejoignez vos rendez-vous en ligne.",
            appointments: "Mes rendez-vous",
            loading: "Chargement des rendez-vous...",
            empty: "Vous n’avez aucun rendez-vous pour le moment.",
            findTherapist: "Trouver un spécialiste",
            date: "Date",
            time: "Heure",
            localTime: "Votre heure locale",
            price: "Prix",
            status: "Statut",
            booked: "Réservé le",
            paid: "Payé",
            pending: "Paiement en attente",
            cancelled: "Annulé",
            joinZoom: "Rejoindre la séance Zoom",
            zoomNotReady: "Lien Zoom pas encore disponible",
            completePayment: "Finaliser le paiement",
            sessionDetails: "Détails de la séance",
            unableToLoad:
              "Impossible de charger les rendez-vous. Veuillez réessayer.",
            changeSlot: "Changer le créneau",
            cancelAndRefund: "Annuler et demander le remboursement",
            changeConfirm:
              "Vous pouvez changer le créneau uniquement à plus de 24 h de la séance. Continuer ?",
            cancelConfirm:
              "La séance sera annulée et le remboursement sera demandé sur le moyen de paiement d’origine. Continuer ?",
            tooLate:
              "Le changement et l’annulation ne sont plus possibles dans les 24 heures précédant la séance.",
            missingScheduledStart:
              "Impossible de gérer ce rendez-vous car l’heure de séance n’est pas disponible.",
            changing: "Préparation du changement de créneau...",
            cancelling: "Annulation et remboursement...",
            rescheduleReady:
              "Le changement a été enregistré. Choisissez maintenant un nouveau créneau.",
            cancelSuccess:
              "La séance a été annulée et la procédure de remboursement a été lancée.",
            actionError:
              "Impossible d’effectuer cette action. Veuillez réessayer.",
            refundProviderPending:
              "Le remboursement automatique pour ce prestataire n’est pas encore activé. Veuillez contacter AAN.",
            manageUntil:
              "Changement et annulation possibles jusqu’à 24 h avant la séance.",
            sessionPast: "Séance passée",
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
            date: "Date",
            time: "Time",
            localTime: "Your local time",
            price: "Price",
            status: "Status",
            booked: "Booked on",
            paid: "Paid",
            pending: "Payment pending",
            cancelled: "Cancelled",
            joinZoom: "Join Zoom Session",
            zoomNotReady: "Zoom link not ready",
            completePayment: "Complete Payment",
            sessionDetails: "Session details",
            unableToLoad:
              "Unable to load appointments. Please try again.",
            changeSlot: "Change time",
            cancelAndRefund: "Cancel and request refund",
            changeConfirm:
              "You can change the appointment only when more than 24 hours remain before the session. Continue?",
            cancelConfirm:
              "The session will be cancelled and a refund will be requested to the original payment method. Continue?",
            tooLate:
              "Changes and cancellations are no longer available within 24 hours of the session.",
            missingScheduledStart:
              "This appointment cannot be managed because its scheduled time is unavailable.",
            changing: "Preparing appointment change...",
            cancelling: "Cancelling and refunding...",
            rescheduleReady:
              "The change request has been recorded. Choose a new available time now.",
            cancelSuccess:
              "The session was cancelled and the refund process was started.",
            actionError:
              "Unable to perform this action. Please try again.",
            refundProviderPending:
              "Automatic refunds for this payment provider are not active yet. Please contact AAN.",
            manageUntil:
              "Changes and cancellations are available until 24 hours before the session.",
            sessionPast: "Past session",
          };

  useEffect(() => {
    void getBookings();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 15_000);

    return () => window.clearInterval(timer);
  }, []);

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
      setNowMs(Date.now());
    } catch (error) {
      console.error("Unable to load patient bookings:", error);
      setErrorMessage(copy.unableToLoad);
    } finally {
      setLoading(false);
    }
  };

  const isExpiredPendingBooking = (booking: Booking) => {
    if (booking.status !== "pending") {
      return false;
    }

    const createdAtMs = new Date(booking.created_at).getTime();

    if (Number.isNaN(createdAtMs)) {
      return false;
    }

    return nowMs >= createdAtMs + PAYMENT_HOLD_MS;
  };

  /*
   * Une réservation "pending" n'est visible que pendant les 10 minutes
   * de hold de paiement. Après expiration, elle disparaît automatiquement
   * du dashboard sans nécessiter un nouveau fetch Supabase.
   */
  const visibleBookings = bookings.filter(
    (booking) => !isExpiredPendingBooking(booking),
  );

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

  const getLocale = () => {
    if (language === "ar") {
      return "ar-LB";
    }

    if (language === "fr") {
      return "fr-FR";
    }

    return "en-GB";
  };

  const getLocalTimeZone = () => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch {
      return "";
    }
  };

  /*
   * IMPORTANT :
   * aucune timeZone n'est forcée ici.
   * Le navigateur affiche donc created_at dans le fuseau local du patient.
   */
  const formatBookedDate = (date: string) => {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return new Intl.DateTimeFormat(getLocale(), {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(parsedDate);
  };

  /*
   * scheduled_start est un instant absolu.
   * Sans timeZone: "Asia/Beirut", Intl l'affiche automatiquement
   * dans le fuseau horaire du navigateur du patient.
   */
  const formatAppointmentDate = (booking: Booking) => {
    if (booking.scheduled_start) {
      const scheduledDate = new Date(booking.scheduled_start);

      if (!Number.isNaN(scheduledDate.getTime())) {
        return new Intl.DateTimeFormat(getLocale(), {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(scheduledDate);
      }
    }

    /*
     * Anciennes réservations sans scheduled_start :
     * on conserve le jour historique enregistré.
     */
    return formatDay(booking.slot_day);
  };

  const formatAppointmentTime = (booking: Booking) => {
    if (booking.scheduled_start) {
      const scheduledDate = new Date(booking.scheduled_start);

      if (!Number.isNaN(scheduledDate.getTime())) {
        const formatted = new Intl.DateTimeFormat(getLocale(), {
          hour: "2-digit",
          minute: "2-digit",
        }).format(scheduledDate);

        return formatDigits(formatted);
      }
    }

    /*
     * Fallback pour les anciennes réservations qui n'ont pas
     * de scheduled_start.
     */
    return formatDigits(booking.slot_time);
  };

  const canPatientManageBooking = (booking: Booking) => {
    if (
      booking.status !== "paid" ||
      !booking.scheduled_start
    ) {
      return false;
    }

    const scheduledStartMs =
      new Date(booking.scheduled_start).getTime();

    if (Number.isNaN(scheduledStartMs)) {
      return false;
    }

    return (
      scheduledStartMs - nowMs >
      PATIENT_CHANGE_DEADLINE_MS
    );
  };

  const hasValidScheduledStart = (booking: Booking) => {
    if (!booking.scheduled_start) {
      return false;
    }

    return !Number.isNaN(
      new Date(booking.scheduled_start).getTime(),
    );
  };

  const isPastBooking = (booking: Booking) => {
    if (!booking.scheduled_start) {
      return false;
    }

    const scheduledStartMs =
      new Date(booking.scheduled_start).getTime();

    if (Number.isNaN(scheduledStartMs)) {
      return false;
    }

    return scheduledStartMs < nowMs;
  };

  const runPatientBookingAction = async (
    booking: Booking,
    action: "request_reschedule" | "cancel_and_refund",
  ) => {
    setActionMessage("");

    if (!hasValidScheduledStart(booking)) {
      alert(copy.missingScheduledStart);
      return;
    }

    if (!canPatientManageBooking(booking)) {
      alert(copy.tooLate);
      return;
    }

    const confirmed = window.confirm(
      action === "request_reschedule"
        ? copy.changeConfirm
        : copy.cancelConfirm,
    );

    if (!confirmed) {
      return;
    }

    setBookingActionId(booking.id);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(
        "/api/booking/patient-action",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            bookingId: booking.id,
            action,
            language,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        const message =
          result.code === "CHANGE_WINDOW_CLOSED"
            ? copy.tooLate
            : result.code === "REFUND_PROVIDER_NOT_CONFIGURED"
              ? copy.refundProviderPending
              : result.error || copy.actionError;

        alert(message);
        return;
      }

      if (action === "cancel_and_refund") {
        setActionMessage(copy.cancelSuccess);
        await getBookings();
        return;
      }

      /*
       * Le serveur vient d'enregistrer que ce booking payé
       * est en cours de changement.
       *
       * IMPORTANT : /booking devra reconnaître le paramètre
       * "reschedule" et remplacer le créneau de CE booking
       * sans créer un deuxième paiement.
       */
      setActionMessage(copy.rescheduleReady);

      window.location.href =
        `/booking?reschedule=${encodeURIComponent(
          booking.id,
        )}`;
    } catch (error) {
      console.error(
        "Patient booking action error:",
        error,
      );

      alert(copy.actionError);
    } finally {
      setBookingActionId(null);
    }
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

  const localTimeZone = getLocalTimeZone();

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
              {actionMessage && (
                <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 font-semibold text-emerald-800">
                  {actionMessage}
                </div>
              )}

              <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-aan-gold">
                    AAN Psychotherapy
                  </p>

                  <h2 className="aan-heading mt-2 text-3xl sm:text-4xl">
                    {copy.appointments}
                  </h2>
                </div>

                {!loading && visibleBookings.length > 0 && (
                  <span className="inline-flex w-fit rounded-full border border-aan-border bg-[#fbf8f3] px-4 py-2 text-sm font-bold text-aan-navy">
                    {formatDigits(visibleBookings.length)}
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
              ) : visibleBookings.length === 0 ? (
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
                  {visibleBookings.map((booking) => (
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
                                {copy.date}
                              </p>

                              <p className="mt-2 font-bold capitalize text-aan-navy">
                                {formatAppointmentDate(booking)}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-[#fbf8f3] p-4">
                              <p className="text-xs font-bold uppercase tracking-[0.18em] text-aan-gold">
                                {copy.time}
                              </p>

                              <p className="mt-2 font-bold text-aan-navy">
                                {formatAppointmentTime(booking)}
                              </p>

                              {booking.scheduled_start && (
                                <p className="mt-1 text-xs leading-5 text-aan-secondary">
                                  {copy.localTime}
                                  {localTimeZone ? ` · ${localTimeZone}` : ""}
                                </p>
                              )}
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
                          {booking.status === "paid" ? (
                            isPastBooking(booking) ? (
                              <div className="rounded-2xl border border-aan-border bg-white/80 px-6 py-4 text-center font-bold text-aan-secondary">
                                {copy.sessionPast}
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {booking.zoom_join_url ? (
                                  <a
                                    href={booking.zoom_join_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="aan-cta flex w-full items-center justify-center rounded-2xl px-6 py-4 text-center font-bold text-white"
                                  >
                                    {copy.joinZoom}
                                  </a>
                                ) : (
                                  <button
                                    type="button"
                                    disabled
                                    className="w-full cursor-not-allowed rounded-2xl bg-aan-button/40 px-6 py-4 font-bold text-white"
                                  >
                                    {copy.zoomNotReady}
                                  </button>
                                )}

                                {canPatientManageBooking(booking) ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        void runPatientBookingAction(
                                          booking,
                                          "request_reschedule",
                                        )
                                      }
                                      disabled={
                                        bookingActionId === booking.id
                                      }
                                      className="w-full rounded-2xl border border-aan-gold bg-white px-5 py-3 font-bold text-aan-navy transition hover:bg-[#fbf8f3] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {bookingActionId === booking.id
                                        ? copy.changing
                                        : copy.changeSlot}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        void runPatientBookingAction(
                                          booking,
                                          "cancel_and_refund",
                                        )
                                      }
                                      disabled={
                                        bookingActionId === booking.id
                                      }
                                      className="w-full rounded-2xl border border-red-200 bg-white px-5 py-3 font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {bookingActionId === booking.id
                                        ? copy.cancelling
                                        : copy.cancelAndRefund}
                                    </button>

                                    <p className="text-center text-xs leading-5 text-aan-secondary">
                                      {copy.manageUntil}
                                    </p>
                                  </>
                                ) : (
                                  <div className="rounded-2xl border border-aan-border bg-white/80 px-4 py-3 text-center text-xs leading-5 text-aan-secondary">
                                    {hasValidScheduledStart(booking)
                                      ? copy.tooLate
                                      : copy.missingScheduledStart}
                                  </div>
                                )}
                              </div>
                            )
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

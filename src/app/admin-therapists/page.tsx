"use client";

import {
  useEffect,
  useState,
} from "react";

import Navbar from "../components/Navbar";
import ProtectedRoute from "../components/ProtectedRoute";

import {
  supabase,
} from "@/lib/supabase";

import {
  useLanguage,
} from "@/i18n/LanguageProvider";

type WorkStatus =
  | "active"
  | "leaving"
  | "inactive";

type Therapist = {
  id: string;
  full_name: string;
  specialty: string;
  bio: string;
  price: number;
  email: string | null;
  role: string | null;

  work_status?: WorkStatus;
};

type DepartureBooking = {
  id: string;

  patient_id:
    | string
    | null;

  patient_email:
    | string
    | null;

  therapist_id:
    | string
    | null;

  therapist_name:
    | string
    | null;

  slot_id:
    | string
    | null;

  slot_day:
    | string
    | null;

  slot_time:
    | string
    | null;

  price:
    | number
    | null;

  status:
    | string
    | null;

  scheduled_start:
    | string
    | null;

  scheduled_end:
    | string
    | null;

  payment_provider:
    | string
    | null;

  payment_method:
    | string
    | null;

  payment_transaction_id:
    | string
    | null;

  departure_action:
    | string
    | null;

  original_therapist_id:
    | string
    | null;

  refunded_at:
    | string
    | null;
};

type AlternativeTherapist = {
  id: string;
  full_name: string;
  specialty:
    | string
    | null;

  price:
    | number
    | null;

  work_status:
    WorkStatus;
};

type AvailableSlot = {
  id: string;

  therapist_id:
    string;

  day:
    string;

  time:
    string;

  slot_date:
    | string
    | null;

  starts_at:
    | string
    | null;

  ends_at:
    | string
    | null;

  is_booked:
    boolean;
};

type DepartureData = {
  therapist: {
    id: string;
    full_name: string;
    price: number;
    work_status:
      WorkStatus;
  };

  futurePaidBookings:
    DepartureBooking[];

  alternatives:
    AlternativeTherapist[];

  availableSlots:
    AvailableSlot[];
};

type TransferChoice = {
  therapistId: string;
  slotId: string;
};

export default function AdminTherapistsPage() {
  const {
    language,
    isArabic,
  } = useLanguage();

  const [
    therapists,
    setTherapists,
  ] = useState<
    Therapist[]
  >([]);

  const [
    prices,
    setPrices,
  ] = useState<
    Record<
      string,
      string
    >
  >({});

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    processingId,
    setProcessingId,
  ] = useState<
    string | null
  >(null);

  const [
    actionBookingId,
    setActionBookingId,
  ] = useState<
    string | null
  >(null);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  /*
   * Spécialiste dont le départ
   * est actuellement géré.
   */
  const [
    departureTherapist,
    setDepartureTherapist,
  ] = useState<
    Therapist | null
  >(null);

  const [
    departureData,
    setDepartureData,
  ] = useState<
    DepartureData | null
  >(null);

  const [
    departureLoading,
    setDepartureLoading,
  ] = useState(false);

  /*
   * Choix transfert pour
   * chaque réservation.
   */
  const [
    transferChoices,
    setTransferChoices,
  ] = useState<
    Record<
      string,
      TransferChoice
    >
  >({});

  const text =
    language === "ar"
      ? {
          eyebrow:
            "إدارة المختصين",

          title:
            "إدارة المختصين والأسعار",

          description:
            "يمكن للإدارة تحديد سعر الجلسة لكل مختص وإدارة مغادرة المختصين مع الحفاظ على الحجوزات والمدفوعات السابقة.",

          loading:
            "جارٍ تحميل المختصين...",

          empty:
            "لا توجد حسابات مختصين حالياً.",

          therapist:
            "مختص",

          unnamed:
            "مختص بدون اسم",

          emailUnavailable:
            "البريد الإلكتروني غير متوفر",

          noSpecialty:
            "لم تتم إضافة تخصص",

          noBio:
            "لم تتم إضافة نبذة بعد.",

          currentPrice:
            "السعر الحالي",

          perSession:
            "للجلسة",

          newPrice:
            "السعر الجديد للجلسة",

          updatePrice:
            "تحديث السعر",

          updating:
            "جارٍ التحديث...",

          processing:
            "جارٍ المعالجة...",

          invalidPrice:
            "يرجى إدخال سعر صالح أكبر من صفر.",

          sessionExpired:
            "انتهت جلستك. يرجى تسجيل الدخول من جديد.",

          loadError:
            "تعذر تحميل المختصين.",

          unexpectedLoad:
            "حدث خطأ غير متوقع أثناء تحميل المختصين.",

          updateError:
            "تعذر تحديث السعر.",

          unexpectedUpdate:
            "حدث خطأ غير متوقع أثناء تحديث السعر.",

          updateSuccess:
            "تم تحديث سعر الجلسة بنجاح.",

          managedByClinic:
            "السعر مُدار حصرياً من قبل الإدارة.",

          active:
            "نشط",

          leaving:
            "في مرحلة المغادرة",

          inactive:
            "غير نشط",

          manageDeparture:
            "إدارة مغادرة المختص",

          startDeparture:
            "إدارة المغادرة",

          confirmStartDeparture:
            "تأكيد بدء المغادرة",

          resumeDeparture:
            "متابعة معالجة المغادرة",

          departurePreparationIntro:
            "أنت الآن في مرحلة مراجعة المغادرة فقط. لم يتغير وضع المختص بعد، وسيبقى ظاهراً للمرضى ويمكنه استقبال حجوزات جديدة إلى أن تؤكد بدء المغادرة.",

          departureIntro:
            "بدأت المغادرة بالفعل. لم يعد المختص يقبل حجوزات جديدة، ويجب معالجة كل جلسة مستقبلية مدفوعة قبل إغلاق وصوله نهائياً.",

          departureNotStarted:
            "لم تبدأ المغادرة بعد. يمكنك مراجعة الحجوزات أدناه ثم تأكيد بدء المغادرة عندما تكون جاهزاً.",

          confirmDeparture:
            "هل تريد تأكيد بدء مغادرة هذا المختص؟ بعد التأكيد سيتوقف فوراً عن استقبال حجوزات جديدة، مع الاحتفاظ بالسجل والحجوزات المدفوعة.",

          departureLoading:
            "جارٍ تحميل الحجوزات المدفوعة...",

          futureBookings:
            "الحجوزات المستقبلية المدفوعة",

          noFutureBookings:
            "لا توجد حجوزات مستقبلية مدفوعة مرتبطة بهذا المختص.",

          booking:
            "الحجز",

          patient:
            "المريض",

          date:
            "التاريخ",

          price:
            "المبلغ المدفوع",

          payment:
            "الدفع",

          decision:
            "قرار الإدارة",

          unresolved:
            "لم تتم المعالجة",

          maintained:
            "تم الإبقاء مع المختص",

          transferred:
            "تم النقل إلى مختص آخر",

          refunded:
            "تم الإلغاء والاسترداد",

          maintain:
            "الإبقاء مع هذا المختص",

          maintainHelp:
            "سيستمر المختص في الوصول إلى حسابه حتى يتمكن من إجراء هذه الجلسة.",

          transfer:
            "نقل إلى مختص آخر",

          transferHelp:
            "اختر مختصاً نشطاً وموعداً جديداً. لن يُطلب من المريض الدفع مرة أخرى.",

          refund:
            "إلغاء واسترداد",

          refundHelp:
            "سيتم طلب استرداد المبلغ من Stripe وإلغاء الجلسة بعد نجاح العملية.",

          selectTherapist:
            "اختر المختص الجديد",

          selectSlot:
            "اختر الموعد الجديد",

          chooseTherapistFirst:
            "اختر المختص أولاً",

          noSlots:
            "لا توجد مواعيد متاحة لهذا المختص.",

          confirmMaintain:
            "هل تريد الإبقاء على هذه الجلسة مع المختص الحالي؟",

          confirmTransfer:
            "هل تريد نقل هذه الجلسة إلى المختص والموعد المحددين؟ لن يدفع المريض مرة أخرى.",

          confirmRefund:
            "هل تريد إلغاء هذه الجلسة وطلب استرداد كامل للمبلغ؟",

          maintainedSuccess:
            "تم الإبقاء على الجلسة مع المختص.",

          transferredSuccess:
            "تم نقل الجلسة بنجاح.",

          refundedSuccess:
            "تم إرسال طلب الاسترداد وتحديث الحجز.",

          departureStarted:
            "بدأت عملية مغادرة المختص. لم يعد يقبل حجوزات جديدة.",

          finalize:
            "إنهاء مغادرة المختص",

          finalizeHelp:
            "يصبح الحساب غير نشط عندما لا تبقى أي جلسة مستقبلية مدفوعة مرتبطة بالمختص.",

          confirmFinalize:
            "هل تريد إنهاء المغادرة وتعطيل وصول هذا المختص؟ سيبقى السجل محفوظاً.",

          finalizedSuccess:
            "تم إنهاء مغادرة المختص وأصبح الحساب غير نشط.",

          cannotFinalize:
            "لا يمكن إنهاء المغادرة بعد لأن هناك جلسات مستقبلية مدفوعة ما زالت مرتبطة بالمختص.",

          close:
            "إغلاق",

          refresh:
            "تحديث",

          departureError:
            "تعذر معالجة مغادرة المختص.",

          automaticRefundNote:
            "الاسترداد التلقائي متاح حالياً لمدفوعات Stripe فقط.",
        }
      : language === "fr"
        ? {
            eyebrow:
              "Gestion des spécialistes",

            title:
              "Spécialistes et tarifs",

            description:
              "L’administration définit les tarifs et gère le départ des spécialistes sans supprimer l’historique des réservations et des paiements.",

            loading:
              "Chargement des spécialistes...",

            empty:
              "Aucun compte spécialiste pour le moment.",

            therapist:
              "Spécialiste",

            unnamed:
              "Spécialiste sans nom",

            emailUnavailable:
              "E-mail indisponible",

            noSpecialty:
              "Aucune spécialité renseignée",

            noBio:
              "Aucune biographie pour le moment.",

            currentPrice:
              "Tarif actuel",

            perSession:
              "par séance",

            newPrice:
              "Nouveau tarif de la séance",

            updatePrice:
              "Mettre à jour le tarif",

            updating:
              "Mise à jour...",

            processing:
              "Traitement...",

            invalidPrice:
              "Veuillez saisir un tarif valide supérieur à 0.",

            sessionExpired:
              "Votre session a expiré. Veuillez vous reconnecter.",

            loadError:
              "Impossible de charger les spécialistes.",

            unexpectedLoad:
              "Une erreur inattendue est survenue pendant le chargement.",

            updateError:
              "Impossible de mettre à jour le tarif.",

            unexpectedUpdate:
              "Une erreur inattendue est survenue pendant la mise à jour du tarif.",

            updateSuccess:
              "Le tarif de la séance a été mis à jour avec succès.",

            managedByClinic:
              "Tarif géré exclusivement par l’administration.",

            active:
              "Actif",

            leaving:
              "En cours de départ",

            inactive:
              "Inactif",

            manageDeparture:
              "Gérer le départ",

            startDeparture:
              "Gérer le départ",

            confirmStartDeparture:
              "Confirmer le début du départ",

            resumeDeparture:
              "Continuer la gestion du départ",

            departurePreparationIntro:
              "Vous êtes seulement dans l’étape de préparation. Rien n’a encore changé pour ce spécialiste : il reste visible pour les patients et peut encore recevoir de nouvelles réservations tant que vous n’avez pas confirmé le début du départ.",

            departureIntro:
              "Le départ a réellement commencé. Le spécialiste ne reçoit plus de nouvelles réservations. Chaque séance future déjà payée doit être traitée avant la désactivation définitive de son accès.",

            departureNotStarted:
              "Le départ n’a pas encore commencé. Vous pouvez vérifier les réservations ci-dessous, puis confirmer le début du départ lorsque vous êtes prêt.",

            confirmDeparture:
              "Confirmer le début du départ de ce spécialiste ? Après confirmation, il ne recevra plus de nouvelles réservations, mais son historique et ses réservations payées seront conservés.",

            departureLoading:
              "Chargement des réservations payées...",

            futureBookings:
              "Réservations futures payées",

            noFutureBookings:
              "Aucune réservation future payée n’est encore attribuée à ce spécialiste.",

            booking:
              "Réservation",

            patient:
              "Patient",

            date:
              "Date",

            price:
              "Montant payé",

            payment:
              "Paiement",

            decision:
              "Décision administrative",

            unresolved:
              "À traiter",

            maintained:
              "Maintenue avec le spécialiste",

            transferred:
              "Transférée",

            refunded:
              "Annulée et remboursée",

            maintain:
              "Maintenir avec ce spécialiste",

            maintainHelp:
              "Le spécialiste conservera l’accès nécessaire pour assurer cette séance.",

            transfer:
              "Transférer à un autre spécialiste",

            transferHelp:
              "Choisissez un spécialiste actif et un nouveau créneau. Le patient ne paiera pas une deuxième fois.",

            refund:
              "Annuler et rembourser",

            refundHelp:
              "Stripe recevra une demande de remboursement complet. La séance sera annulée après le traitement du remboursement.",

            selectTherapist:
              "Choisir le nouveau spécialiste",

            selectSlot:
              "Choisir le nouveau créneau",

            chooseTherapistFirst:
              "Sélectionnez d’abord un spécialiste",

            noSlots:
              "Aucun créneau disponible pour ce spécialiste.",

            confirmMaintain:
              "Maintenir cette séance avec le spécialiste actuel ?",

            confirmTransfer:
              "Transférer cette séance vers le spécialiste et le créneau sélectionnés ? Aucun nouveau paiement ne sera demandé au patient.",

            confirmRefund:
              "Annuler cette séance et demander son remboursement intégral ?",

            maintainedSuccess:
              "La séance reste avec le spécialiste actuel.",

            transferredSuccess:
              "La séance a été transférée avec succès.",

            refundedSuccess:
              "Le remboursement a été demandé et la réservation a été mise à jour.",

            departureStarted:
              "Le départ a commencé. Le spécialiste n’accepte plus de nouvelles réservations.",

            finalize:
              "Finaliser le départ",

            finalizeHelp:
              "Le compte devient inactif lorsqu’aucune séance future payée n’est encore attribuée au spécialiste.",

            confirmFinalize:
              "Finaliser le départ et désactiver l’accès de ce spécialiste ? Son historique restera conservé.",

            finalizedSuccess:
              "Le départ est terminé et le compte spécialiste est maintenant inactif.",

            cannotFinalize:
              "Impossible de finaliser le départ tant que des séances futures payées restent attribuées au spécialiste.",

            close:
              "Fermer",

            refresh:
              "Actualiser",

            departureError:
              "Impossible de traiter le départ du spécialiste.",

            automaticRefundNote:
              "Le remboursement automatique est actuellement disponible uniquement pour les paiements Stripe.",
          }
        : {
            eyebrow:
              "Specialist management",

            title:
              "Specialists and Session Prices",

            description:
              "Administrators define session prices and manage specialist departures without deleting booking and payment history.",

            loading:
              "Loading specialists...",

            empty:
              "No specialist accounts found.",

            therapist:
              "Specialist",

            unnamed:
              "Unnamed specialist",

            emailUnavailable:
              "Email unavailable",

            noSpecialty:
              "No specialty provided",

            noBio:
              "No biography yet.",

            currentPrice:
              "Current price",

            perSession:
              "per session",

            newPrice:
              "New session price",

            updatePrice:
              "Update Price",

            updating:
              "Updating...",

            processing:
              "Processing...",

            invalidPrice:
              "Please enter a valid price greater than 0.",

            sessionExpired:
              "Your session has expired. Please sign in again.",

            loadError:
              "Unable to load specialists.",

            unexpectedLoad:
              "An unexpected error occurred while loading specialists.",

            updateError:
              "Unable to update the price.",

            unexpectedUpdate:
              "An unexpected error occurred while updating the price.",

            updateSuccess:
              "Session price updated successfully.",

            managedByClinic:
              "Price managed exclusively by the administration.",

            active:
              "Active",

            leaving:
              "Leaving",

            inactive:
              "Inactive",

            manageDeparture:
              "Manage departure",

            startDeparture:
              "Manage departure",

            confirmStartDeparture:
              "Confirm departure start",

            resumeDeparture:
              "Continue departure management",

            departurePreparationIntro:
              "You are only reviewing the departure setup. Nothing has changed yet: the specialist remains visible to patients and can still receive new bookings until you confirm the start of the departure.",

            departureIntro:
              "The departure has started. The specialist no longer receives new bookings. Every future paid session must be handled before access can be fully deactivated.",

            departureNotStarted:
              "The departure has not started yet. Review the bookings below, then confirm the departure when you are ready.",

            confirmDeparture:
              "Confirm the start of this specialist’s departure? After confirmation, new bookings will stop immediately while booking and payment history will be preserved.",

            departureLoading:
              "Loading paid bookings...",

            futureBookings:
              "Future paid bookings",

            noFutureBookings:
              "No future paid bookings remain assigned to this specialist.",

            booking:
              "Booking",

            patient:
              "Patient",

            date:
              "Date",

            price:
              "Amount paid",

            payment:
              "Payment",

            decision:
              "Administrative decision",

            unresolved:
              "Needs action",

            maintained:
              "Maintained with specialist",

            transferred:
              "Transferred",

            refunded:
              "Cancelled and refunded",

            maintain:
              "Maintain with this specialist",

            maintainHelp:
              "The specialist keeps the access needed to deliver this session.",

            transfer:
              "Transfer to another specialist",

            transferHelp:
              "Choose an active specialist and a new slot. The patient will not pay again.",

            refund:
              "Cancel and Refund",

            refundHelp:
              "A full refund will be requested from Stripe and the session will be cancelled.",

            selectTherapist:
              "Choose new specialist",

            selectSlot:
              "Choose new slot",

            chooseTherapistFirst:
              "Choose a specialist first",

            noSlots:
              "No available slots for this specialist.",

            confirmMaintain:
              "Keep this session with the current specialist?",

            confirmTransfer:
              "Transfer this session to the selected specialist and slot? The patient will not be charged again.",

            confirmRefund:
              "Cancel this session and request a full refund?",

            maintainedSuccess:
              "The session remains with the current specialist.",

            transferredSuccess:
              "The session was transferred successfully.",

            refundedSuccess:
              "The refund was requested and the booking was updated.",

            departureStarted:
              "Departure started. The specialist no longer accepts new bookings.",

            finalize:
              "Finalize Departure",

            finalizeHelp:
              "The account becomes inactive once no future paid session remains assigned to the specialist.",

            confirmFinalize:
              "Finalize the departure and deactivate this specialist’s access? Historical data will be preserved.",

            finalizedSuccess:
              "Departure finalized. The specialist account is now inactive.",

            cannotFinalize:
              "Departure cannot be finalized while future paid sessions remain assigned to this specialist.",

            close:
              "Close",

            refresh:
              "Refresh",

            departureError:
              "Unable to process specialist departure.",

            automaticRefundNote:
              "Automatic refunds are currently available only for Stripe payments.",
          };
            useEffect(() => {
    void getTherapists();
  }, []);

  const getAccessToken =
    async () => {
      const {
        data: {
          session,
        },
      } =
        await supabase.auth.getSession();

      return (
        session?.access_token ||
        null
      );
    };

  const formatPrice = (
    price: number,
  ) => {
    const locale =
      language === "fr"
        ? "fr-FR"
        : language === "ar"
          ? "ar-LB"
          : "en-US";

    return new Intl.NumberFormat(
      locale,
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
      price,
    );
  };

  const formatDateTime = (
    value:
      | string
      | null,
  ) => {
    if (!value) {
      return "—";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return value;
    }

    const locale =
      language === "ar"
        ? "ar-LB"
        : language === "fr"
          ? "fr-FR"
          : "en-GB";

    return new Intl.DateTimeFormat(
      locale,
      {
        dateStyle:
          "medium",

        timeStyle:
          "short",

        timeZone:
          "Asia/Beirut",
      },
    ).format(
      date,
    );
  };

  const getStatusLabel = (
    status:
      | WorkStatus
      | undefined,
  ) => {
    if (
      status ===
      "leaving"
    ) {
      return text.leaving;
    }

    if (
      status ===
      "inactive"
    ) {
      return text.inactive;
    }

    return text.active;
  };

  const getStatusClasses = (
    status:
      | WorkStatus
      | undefined,
  ) => {
    if (
      status ===
      "leaving"
    ) {
      return "border-amber-200 bg-amber-50 text-amber-800";
    }

    if (
      status ===
      "inactive"
    ) {
      return "border-slate-300 bg-slate-100 text-slate-600";
    }

    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  };

  const getTherapists =
    async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const accessToken =
          await getAccessToken();

        if (!accessToken) {
          alert(
            text.sessionExpired,
          );

          window.location.href =
            "/login";

          return;
        }

        const response =
          await fetch(
            "/api/admin/therapists",
            {
              method:
                "GET",

              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },

              cache:
                "no-store",
            },
          );

        const result =
          await response.json();

        if (
          !response.ok
        ) {
          setErrorMessage(
            result.error ||
              text.loadError,
          );

          if (
            response.status ===
              401 ||
            response.status ===
              403
          ) {
            window.location.href =
              "/login";
          }

          return;
        }

        const loadedTherapists:
          Therapist[] =
          result.therapists ||
          [];

        /*
         * Ton ancien endpoint admin
         * peut ne pas encore renvoyer
         * work_status.
         *
         * On complète donc les statuts
         * via l'API de départ.
         */
        const therapistsWithStatus =
          await Promise.all(
            loadedTherapists.map(
              async (
                therapist,
              ) => {
                try {
                  const statusResponse =
                    await fetch(
                      `/api/admin/therapist-departure?therapistId=${encodeURIComponent(
                        therapist.id,
                      )}`,
                      {
                        headers: {
                          Authorization:
                            `Bearer ${accessToken}`,
                        },

                        cache:
                          "no-store",
                      },
                    );

                  if (
                    !statusResponse.ok
                  ) {
                    return {
                      ...therapist,
                      work_status:
                        therapist.work_status ||
                        "active",
                    } as Therapist;
                  }

                  const statusResult =
                    await statusResponse.json();

                  return {
                    ...therapist,

                    work_status:
                      statusResult
                        .therapist
                        ?.work_status ||
                      therapist.work_status ||
                      "active",
                  } as Therapist;
                } catch {
                  return {
                    ...therapist,

                    work_status:
                      therapist.work_status ||
                      "active",
                  } as Therapist;
                }
              },
            ),
          );

        const initialPrices:
          Record<
            string,
            string
          > = {};

        therapistsWithStatus.forEach(
          (
            therapist,
          ) => {
            initialPrices[
              therapist.id
            ] =
              String(
                therapist.price ??
                  0,
              );
          },
        );

        setTherapists(
          therapistsWithStatus,
        );

        setPrices(
          initialPrices,
        );
      } catch (error) {
        console.error(
          "Load therapists error:",
          error,
        );

        setErrorMessage(
          text.unexpectedLoad,
        );
      } finally {
        setLoading(false);
      }
    };

  const updatePrice =
    async (
      therapistId:
        string,
    ) => {
      const newPrice =
        Number(
          prices[
            therapistId
          ],
        );

      if (
        !Number.isFinite(
          newPrice,
        ) ||
        newPrice <= 0
      ) {
        setErrorMessage(
          text.invalidPrice,
        );

        return;
      }

      setProcessingId(
        therapistId,
      );

      setSuccessMessage(
        "",
      );

      setErrorMessage(
        "",
      );

      try {
        const accessToken =
          await getAccessToken();

        if (!accessToken) {
          alert(
            text.sessionExpired,
          );

          window.location.href =
            "/login";

          return;
        }

        const response =
          await fetch(
            "/api/admin/update-therapist-price",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${accessToken}`,
              },

              body:
                JSON.stringify({
                  therapistId,
                  price:
                    newPrice,
                }),
            },
          );

        const result =
          await response.json();

        if (
          !response.ok
        ) {
          setErrorMessage(
            result.error ||
              text.updateError,
          );

          return;
        }

        const savedPrice =
          Number(
            result
              .therapist
              .price,
          );

        setTherapists(
          (
            current,
          ) =>
            current.map(
              (
                therapist,
              ) =>
                therapist.id ===
                therapistId
                  ? {
                      ...therapist,
                      price:
                        savedPrice,
                    }
                  : therapist,
            ),
        );

        setPrices(
          (
            current,
          ) => ({
            ...current,

            [therapistId]:
              String(
                savedPrice,
              ),
          }),
        );

        setSuccessMessage(
          `${text.updateSuccess} ${formatPrice(
            savedPrice,
          )}`,
        );
      } catch (
        error
      ) {
        console.error(
          "Update price error:",
          error,
        );

        setErrorMessage(
          text.unexpectedUpdate,
        );
      } finally {
        setProcessingId(
          null,
        );
      }
    };

  const loadDepartureData =
    async (
      therapist:
        Therapist,
    ) => {
      setDepartureTherapist(
        therapist,
      );

      setDepartureData(
        null,
      );

      setDepartureLoading(
        true,
      );

      setTransferChoices(
        {},
      );

      setErrorMessage(
        "",
      );

      try {
        const accessToken =
          await getAccessToken();

        if (!accessToken) {
          alert(
            text.sessionExpired,
          );

          window.location.href =
            "/login";

          return;
        }

        const response =
          await fetch(
            `/api/admin/therapist-departure?therapistId=${encodeURIComponent(
              therapist.id,
            )}`,
            {
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },

              cache:
                "no-store",
            },
          );

        const result =
          await response.json();

        if (
          !response.ok
        ) {
          throw new Error(
            result.error ||
              text.departureError,
          );
        }

        setDepartureData(
          result as DepartureData,
        );

        setTherapists(
          (
            current,
          ) =>
            current.map(
              (
                item,
              ) =>
                item.id ===
                therapist.id
                  ? {
                      ...item,

                      work_status:
                        result
                          .therapist
                          .work_status,
                    }
                  : item,
            ),
        );
      } catch (
        error
      ) {
        console.error(
          "Departure loading error:",
          error,
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : text.departureError,
        );
      } finally {
        setDepartureLoading(
          false,
        );
      }
    };

  const closeDeparture =
    () => {
      setDepartureTherapist(
        null,
      );

      setDepartureData(
        null,
      );

      setTransferChoices(
        {},
      );
    };

  const callDepartureAction =
    async (
      body: Record<
        string,
        string
      >,
    ) => {
      const accessToken =
        await getAccessToken();

      if (!accessToken) {
        alert(
          text.sessionExpired,
        );

        window.location.href =
          "/login";

        throw new Error(
          text.sessionExpired,
        );
      }

      const response =
        await fetch(
          "/api/admin/therapist-departure",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${accessToken}`,
            },

            body:
              JSON.stringify(
                body,
              ),
          },
        );

      const result =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          result.error ||
            text.departureError,
        );
      }

      return result;
    };
      const startDeparture =
    async (
      therapist:
        Therapist,
    ) => {
      const confirmed =
        window.confirm(
          text.confirmDeparture,
        );

      if (!confirmed) {
        return;
      }

      setProcessingId(
        therapist.id,
      );

      setSuccessMessage(
        "",
      );

      setErrorMessage(
        "",
      );

      try {
        await callDepartureAction(
          {
            action:
              "start_departure",

            therapistId:
              therapist.id,
          },
        );

        setTherapists(
          (
            current,
          ) =>
            current.map(
              (
                item,
              ) =>
                item.id ===
                therapist.id
                  ? {
                      ...item,

                      work_status:
                        "leaving",
                    }
                  : item,
            ),
        );

        setSuccessMessage(
          text.departureStarted,
        );

        await loadDepartureData(
          {
            ...therapist,
            work_status:
              "leaving",
          },
        );
      } catch (
        error
      ) {
        console.error(
          "Start departure error:",
          error,
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : text.departureError,
        );
      } finally {
        setProcessingId(
          null,
        );
      }
    };

  const maintainBooking =
    async (
      booking:
        DepartureBooking,
    ) => {
      if (
        !departureTherapist
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          text.confirmMaintain,
        );

      if (!confirmed) {
        return;
      }

      setActionBookingId(
        booking.id,
      );

      setErrorMessage(
        "",
      );

      try {
        await callDepartureAction(
          {
            action:
              "maintain",

            therapistId:
              departureTherapist.id,

            bookingId:
              booking.id,
          },
        );

        setSuccessMessage(
          text.maintainedSuccess,
        );

        await loadDepartureData(
          departureTherapist,
        );
      } catch (
        error
      ) {
        console.error(
          "Maintain booking error:",
          error,
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : text.departureError,
        );
      } finally {
        setActionBookingId(
          null,
        );
      }
    };

  const transferBooking =
    async (
      booking:
        DepartureBooking,
    ) => {
      if (
        !departureTherapist
      ) {
        return;
      }

      const choice =
        transferChoices[
          booking.id
        ];

      if (
        !choice
          ?.therapistId ||
        !choice.slotId
      ) {
        setErrorMessage(
          language === "ar"
            ? "يرجى اختيار المختص الجديد والموعد."
            : language ===
                "fr"
              ? "Veuillez choisir le nouveau spécialiste et le nouveau créneau."
              : "Please choose the new specialist and the new slot.",
        );

        return;
      }

      const confirmed =
        window.confirm(
          text.confirmTransfer,
        );

      if (!confirmed) {
        return;
      }

      setActionBookingId(
        booking.id,
      );

      setErrorMessage(
        "",
      );

      try {
        await callDepartureAction(
          {
            action:
              "transfer",

            therapistId:
              departureTherapist.id,

            bookingId:
              booking.id,

            newTherapistId:
              choice.therapistId,

            newSlotId:
              choice.slotId,
          },
        );

        setSuccessMessage(
          text.transferredSuccess,
        );

        await loadDepartureData(
          departureTherapist,
        );
      } catch (
        error
      ) {
        console.error(
          "Transfer booking error:",
          error,
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : text.departureError,
        );
      } finally {
        setActionBookingId(
          null,
        );
      }
    };

  const refundBooking =
    async (
      booking:
        DepartureBooking,
    ) => {
      if (
        !departureTherapist
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          text.confirmRefund,
        );

      if (!confirmed) {
        return;
      }

      setActionBookingId(
        booking.id,
      );

      setErrorMessage(
        "",
      );

      try {
        await callDepartureAction(
          {
            action:
              "refund",

            therapistId:
              departureTherapist.id,

            bookingId:
              booking.id,
          },
        );

        setSuccessMessage(
          text.refundedSuccess,
        );

        await loadDepartureData(
          departureTherapist,
        );
      } catch (
        error
      ) {
        console.error(
          "Refund booking error:",
          error,
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : text.departureError,
        );
      } finally {
        setActionBookingId(
          null,
        );
      }
    };

  const finalizeDeparture =
    async () => {
      if (
        !departureTherapist
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          text.confirmFinalize,
        );

      if (!confirmed) {
        return;
      }

      setProcessingId(
        departureTherapist.id,
      );

      setErrorMessage(
        "",
      );

      try {
        await callDepartureAction(
          {
            action:
              "finalize",

            therapistId:
              departureTherapist.id,
          },
        );

        setTherapists(
          (
            current,
          ) =>
            current.map(
              (
                item,
              ) =>
                item.id ===
                departureTherapist.id
                  ? {
                      ...item,

                      work_status:
                        "inactive",
                    }
                  : item,
            ),
        );

        setSuccessMessage(
          text.finalizedSuccess,
        );

        closeDeparture();
      } catch (
        error
      ) {
        console.error(
          "Finalize departure error:",
          error,
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : text.cannotFinalize,
        );
      } finally {
        setProcessingId(
          null,
        );
      }
    };

  const updateTransferTherapist =
    (
      bookingId:
        string,

      therapistId:
        string,
    ) => {
      setTransferChoices(
        (
          current,
        ) => ({
          ...current,

          [bookingId]: {
            therapistId,

            /*
             * Nouveau thérapeute
             * = il faut rechoisir
             * le créneau.
             */
            slotId: "",
          },
        }),
      );
    };

  const updateTransferSlot =
    (
      bookingId:
        string,

      slotId:
        string,
    ) => {
      setTransferChoices(
        (
          current,
        ) => ({
          ...current,

          [bookingId]: {
            therapistId:
              current[
                bookingId
              ]?.therapistId ||
              "",

            slotId,
          },
        }),
      );
    };

  const getAvailableSlotsForTherapist =
    (
      therapistId:
        string,
    ) => {
      if (
        !departureData
      ) {
        return [];
      }

      return departureData
        .availableSlots
        .filter(
          (
            slot,
          ) =>
            slot.therapist_id ===
              therapistId &&
            slot.is_booked !==
              true,
        );
    };

  const getBookingDecisionLabel =
    (
      booking:
        DepartureBooking,
    ) => {
      if (
        booking.departure_action ===
        "maintain"
      ) {
        return text.maintained;
      }

      if (
        booking.departure_action ===
        "transferred"
      ) {
        return text.transferred;
      }

      if (
        booking.departure_action ===
        "refunded" ||
        booking.status ===
          "refunded"
      ) {
        return text.refunded;
      }

      return text.unresolved;
    };

  const canFinalizeDeparture =
    Boolean(
      departureData &&
        departureData.therapist.work_status ===
          "leaving" &&
        departureData
          .futurePaidBookings
          .length === 0,
    );
      return (
    <ProtectedRoute
      allowedRoles={[
        "admin",
      ]}
    >
      <>
        <Navbar />

        <main
          dir={
            isArabic
              ? "rtl"
              : "ltr"
          }
          className="min-h-screen bg-aan-background px-5 py-10 sm:px-8 lg:px-10"
        >
          <section className="mx-auto max-w-7xl">
            <div className="aan-card relative mb-10 overflow-hidden p-8 sm:p-10 lg:p-12">
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-aan-gold">
                {
                  text.eyebrow
                }
              </p>

              <h1 className="aan-heading mt-4 text-4xl sm:text-5xl lg:text-6xl">
                {
                  text.title
                }
              </h1>

              <p className="mt-5 max-w-4xl text-lg leading-8 text-aan-secondary">
                {
                  text.description
                }
              </p>
            </div>

            {successMessage && (
              <div className="mb-7 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 font-semibold text-emerald-700">
                {
                  successMessage
                }
              </div>
            )}

            {errorMessage && (
              <div className="mb-7 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-semibold text-red-700">
                {
                  errorMessage
                }
              </div>
            )}

            {loading ? (
              <div className="aan-card p-10 text-center">
                <p className="text-aan-secondary">
                  {
                    text.loading
                  }
                </p>
              </div>
            ) : therapists.length ===
              0 ? (
              <div className="aan-card p-10 text-center">
                <p className="text-aan-secondary">
                  {
                    text.empty
                  }
                </p>
              </div>
            ) : (
              <div className="grid gap-7 md:grid-cols-2">
                {therapists.map(
                  (
                    therapist,
                  ) => {
                    const isProcessing =
                      processingId ===
                      therapist.id;

                    const status =
                      therapist.work_status ||
                      "active";

                    return (
                      <article
                        key={
                          therapist.id
                        }
                        className="aan-card flex h-full flex-col p-7 sm:p-8"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <h2 className="aan-heading text-3xl">
                              {therapist.full_name ||
                                text.unnamed}
                            </h2>

                            <p className="mt-2 text-sm text-aan-secondary">
                              {therapist.email ||
                                text.emailUnavailable}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full border border-aan-border bg-[#fbf8f3] px-3 py-1.5 text-xs font-bold text-aan-navy">
                              ✓{" "}
                              {
                                text.therapist
                              }
                            </span>

                            <span
                              className={`rounded-full border px-3 py-1.5 text-xs font-bold ${getStatusClasses(
                                status,
                              )}`}
                            >
                              {
                                getStatusLabel(
                                  status,
                                )
                              }
                            </span>
                          </div>
                        </div>

                        <div className="mt-6 flex-1">
                          <p className="font-semibold text-aan-button">
                            {therapist.specialty ||
                              text.noSpecialty}
                          </p>

                          <p className="mt-4 line-clamp-4 leading-7 text-aan-secondary">
                            {therapist.bio ||
                              text.noBio}
                          </p>
                        </div>

                        <div className="mt-7 rounded-2xl bg-[linear-gradient(135deg,#f8f1e7_0%,#fbf8f3_100%)] p-5">
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-aan-gold">
                            {
                              text.currentPrice
                            }
                          </p>

                          <p className="mt-2 text-3xl font-bold text-aan-navy">
                            {formatPrice(
                              therapist.price ||
                                0,
                            )}

                            <span className="ml-2 text-base font-semibold text-aan-secondary">
                              /{" "}
                              {
                                text.perSession
                              }
                            </span>
                          </p>

                          <p className="mt-2 text-sm text-aan-secondary">
                            {
                              text.managedByClinic
                            }
                          </p>
                        </div>

                        {status !==
                          "inactive" && (
                          <div className="mt-6">
                            <label className="mb-2 block text-sm font-bold text-aan-navy">
                              {
                                text.newPrice
                              }
                            </label>

                            <div className="flex flex-col gap-3 sm:flex-row">
                              <div className="relative flex-1">
                                <span
                                  className={`absolute top-1/2 -translate-y-1/2 font-bold text-aan-secondary ${
                                    isArabic
                                      ? "right-4"
                                      : "left-4"
                                  }`}
                                >
                                  $
                                </span>

                                <input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  value={
                                    prices[
                                      therapist.id
                                    ] ??
                                    ""
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    setPrices(
                                      (
                                        current,
                                      ) => ({
                                        ...current,

                                        [therapist.id]:
                                          event
                                            .target
                                            .value,
                                      }),
                                    )
                                  }
                                  disabled={
                                    isProcessing
                                  }
                                  className={`aan-field w-full py-4 ${
                                    isArabic
                                      ? "pr-9 pl-4"
                                      : "pl-9 pr-4"
                                  }`}
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  void updatePrice(
                                    therapist.id,
                                  )
                                }
                                disabled={
                                  isProcessing
                                }
                                className="aan-button whitespace-nowrap px-6 py-4 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isProcessing
                                  ? text.updating
                                  : text.updatePrice}
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="mt-7 border-t border-aan-border pt-6">
                          {status ===
                          "active" ? (
                            <button
                              type="button"
                              onClick={() =>
                                void loadDepartureData(
                                  therapist,
                                )
                              }
                              disabled={
                                isProcessing
                              }
                              className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-3 font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isProcessing
                                ? text.processing
                                : text.manageDeparture}
                            </button>
                          ) : status ===
                            "leaving" ? (
                            <button
                              type="button"
                              onClick={() =>
                                void loadDepartureData(
                                  therapist,
                                )
                              }
                              disabled={
                                isProcessing
                              }
                              className="rounded-xl border border-aan-gold bg-[#fbf8f3] px-5 py-3 font-semibold text-aan-navy transition hover:bg-[#f4ecdf] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {
                                text.resumeDeparture
                              }
                            </button>
                          ) : (
                            <p className="text-sm font-semibold text-aan-secondary">
                              {
                                text.inactive
                              }
                            </p>
                          )}
                        </div>
                      </article>
                    );
                  },
                )}
              </div>
            )}
          </section>
        </main>

        {/* =================================================
            PANNEAU / MODAL DE DÉPART
        ================================================= */}

        {departureTherapist && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-[#162432]/60 px-4 py-8 backdrop-blur-sm sm:px-6">
            <section
              dir={
                isArabic
                  ? "rtl"
                  : "ltr"
              }
              className="w-full max-w-6xl rounded-[2rem] border border-aan-border bg-aan-background shadow-2xl"
            >
              <div className="sticky top-0 z-10 flex flex-col gap-5 rounded-t-[2rem] border-b border-aan-border bg-white/95 px-6 py-6 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-8">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-aan-gold">
                    {
                      text.manageDeparture
                    }
                  </p>

                  <h2 className="aan-heading mt-2 text-3xl sm:text-4xl">
                    {
                      departureTherapist.full_name
                    }
                  </h2>

                  <p className="mt-2 max-w-3xl leading-7 text-aan-secondary">
                    {departureData?.therapist.work_status ===
                    "active"
                      ? text.departurePreparationIntro
                      : text.departureIntro}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      void loadDepartureData(
                        departureTherapist,
                      )
                    }
                    disabled={
                      departureLoading
                    }
                    className="rounded-xl border border-aan-border bg-white px-4 py-3 font-semibold text-aan-navy hover:bg-aan-background disabled:opacity-50"
                  >
                    {
                      text.refresh
                    }
                  </button>

                  <button
                    type="button"
                    onClick={
                      closeDeparture
                    }
                    className="rounded-xl border border-aan-border bg-white px-4 py-3 font-semibold text-aan-navy hover:bg-aan-background"
                  >
                    {
                      text.close
                    }
                  </button>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                {departureLoading ? (
                  <div className="aan-card p-10 text-center">
                    <p className="text-aan-secondary">
                      {
                        text.departureLoading
                      }
                    </p>
                  </div>
                ) : departureData ? (
                  <>
                    {departureData.therapist.work_status ===
                      "active" && (
                      <div className="mb-7 rounded-[1.75rem] border border-blue-200 bg-blue-50 p-6">
                        <h3 className="text-xl font-bold text-blue-900">
                          {
                            text.manageDeparture
                          }
                        </h3>

                        <p className="mt-2 max-w-4xl leading-7 text-blue-800">
                          {
                            text.departureNotStarted
                          }
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            void startDeparture(
                              departureTherapist,
                            )
                          }
                          disabled={
                            processingId ===
                            departureTherapist.id
                          }
                          className="mt-5 rounded-xl bg-blue-700 px-6 py-4 font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {processingId ===
                          departureTherapist.id
                            ? text.processing
                            : text.confirmStartDeparture}
                        </button>
                      </div>
                    )}

                    <div className="mb-7 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-aan-border bg-white p-5">
                      <div>
                        <p className="text-sm font-bold text-aan-secondary">
                          {
                            text.futureBookings
                          }
                        </p>

                        <p className="mt-1 text-3xl font-bold text-aan-navy">
                          {
                            departureData
                              .futurePaidBookings
                              .length
                          }
                        </p>
                      </div>

                      <span
                        className={`rounded-full border px-4 py-2 text-sm font-bold ${getStatusClasses(
                          departureData
                            .therapist
                            .work_status,
                        )}`}
                      >
                        {getStatusLabel(
                          departureData
                            .therapist
                            .work_status,
                        )}
                      </span>
                    </div>

                    {departureData
                      .futurePaidBookings
                      .length ===
                    0 ? (
                      <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-7">
                        <p className="font-semibold leading-7 text-emerald-800">
                          {
                            text.noFutureBookings
                          }
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-7">
                        {departureData.futurePaidBookings.map(
                          (
                            booking,
                            index,
                          ) => {
                            const currentChoice =
                              transferChoices[
                                booking.id
                              ];

                            const selectedSlots =
                              currentChoice
                                ?.therapistId
                                ? getAvailableSlotsForTherapist(
                                    currentChoice.therapistId,
                                  )
                                : [];

                            const isBookingProcessing =
                              actionBookingId ===
                              booking.id;

                            return (
                              <article
                                key={
                                  booking.id
                                }
                                className="rounded-[1.75rem] border border-aan-border bg-white p-6 shadow-[var(--aan-shadow-sm)] sm:p-7"
                              >
                                <div className="flex flex-col gap-5 border-b border-aan-border pb-6 lg:flex-row lg:items-start lg:justify-between">
                                  <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-aan-gold">
                                      {
                                        text.booking
                                      }{" "}
                                      #
                                      {index +
                                        1}
                                    </p>

                                    <h3 className="mt-2 text-2xl font-bold text-aan-navy">
                                      {formatDateTime(
                                        booking.scheduled_start,
                                      )}
                                    </h3>

                                    <p className="mt-2 text-sm text-aan-secondary">
                                      ID:{" "}
                                      {
                                        booking.id
                                      }
                                    </p>
                                  </div>

                                  <span
                                    className={`rounded-full px-4 py-2 text-sm font-bold ${
                                      booking.departure_action ===
                                      "maintain"
                                        ? "bg-emerald-50 text-emerald-700"
                                        : booking.departure_action ===
                                            "transferred"
                                          ? "bg-blue-50 text-blue-700"
                                          : booking.departure_action ===
                                                "refunded" ||
                                              booking.status ===
                                                "refunded"
                                            ? "bg-slate-100 text-slate-700"
                                            : "bg-amber-50 text-amber-800"
                                    }`}
                                  >
                                    {getBookingDecisionLabel(
                                      booking,
                                    )}
                                  </span>
                                </div>

                                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                                  <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-aan-secondary">
                                      {
                                        text.patient
                                      }
                                    </p>

                                    <p className="mt-2 font-semibold text-aan-navy">
                                      {booking.patient_email ||
                                        "—"}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-aan-secondary">
                                      {
                                        text.date
                                      }
                                    </p>

                                    <p className="mt-2 font-semibold text-aan-navy">
                                      {formatDateTime(
                                        booking.scheduled_start,
                                      )}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-aan-secondary">
                                      {
                                        text.price
                                      }
                                    </p>

                                    <p className="mt-2 font-semibold text-aan-navy">
                                      {formatPrice(
                                        Number(
                                          booking.price ||
                                            0,
                                        ),
                                      )}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-aan-secondary">
                                      {
                                        text.payment
                                      }
                                    </p>

                                    <p className="mt-2 font-semibold text-aan-navy">
                                      {booking.payment_provider ||
                                        "—"}
                                    </p>
                                  </div>
                                </div>

                                <div className="mt-7 grid gap-5 lg:grid-cols-3">
                                  {/* MAINTENIR */}
                                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
                                    <h4 className="font-bold text-emerald-800">
                                      {
                                        text.maintain
                                      }
                                    </h4>

                                    <p className="mt-2 text-sm leading-6 text-emerald-800/80">
                                      {
                                        text.maintainHelp
                                      }
                                    </p>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        void maintainBooking(
                                          booking,
                                        )
                                      }
                                      disabled={
                                        isBookingProcessing ||
                                        departureData.therapist.work_status !==
                                          "leaving"
                                      }
                                      className="mt-5 w-full rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white disabled:opacity-50"
                                    >
                                      {isBookingProcessing
                                        ? text.processing
                                        : text.maintain}
                                    </button>
                                  </div>

                                  {/* TRANSFÉRER */}
                                  <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5">
                                    <h4 className="font-bold text-blue-800">
                                      {
                                        text.transfer
                                      }
                                    </h4>

                                    <p className="mt-2 text-sm leading-6 text-blue-800/80">
                                      {
                                        text.transferHelp
                                      }
                                    </p>

                                    <select
                                      value={
                                        currentChoice
                                          ?.therapistId ||
                                        ""
                                      }
                                      onChange={(
                                        event,
                                      ) =>
                                        updateTransferTherapist(
                                          booking.id,
                                          event
                                            .target
                                            .value,
                                        )
                                      }
                                      disabled={
                                        isBookingProcessing ||
                                        departureData.therapist.work_status !==
                                          "leaving"
                                      }
                                      className="aan-field mt-4 w-full p-3"
                                    >
                                      <option value="">
                                        {
                                          text.selectTherapist
                                        }
                                      </option>

                                      {departureData.alternatives.map(
                                        (
                                          alternative,
                                        ) => (
                                          <option
                                            key={
                                              alternative.id
                                            }
                                            value={
                                              alternative.id
                                            }
                                          >
                                            {
                                              alternative.full_name
                                            }{" "}
                                            —{" "}
                                            {formatPrice(
                                              Number(
                                                alternative.price ||
                                                  0,
                                              ),
                                            )}
                                          </option>
                                        ),
                                      )}
                                    </select>

                                    <select
                                      value={
                                        currentChoice
                                          ?.slotId ||
                                        ""
                                      }
                                      onChange={(
                                        event,
                                      ) =>
                                        updateTransferSlot(
                                          booking.id,
                                          event
                                            .target
                                            .value,
                                        )
                                      }
                                      disabled={
                                        isBookingProcessing ||
                                        departureData.therapist.work_status !==
                                          "leaving" ||
                                        !currentChoice
                                          ?.therapistId
                                      }
                                      className="aan-field mt-3 w-full p-3"
                                    >
                                      <option value="">
                                        {currentChoice
                                          ?.therapistId
                                          ? selectedSlots.length >
                                            0
                                            ? text.selectSlot
                                            : text.noSlots
                                          : text.chooseTherapistFirst}
                                      </option>

                                      {selectedSlots.map(
                                        (
                                          slot,
                                        ) => (
                                          <option
                                            key={
                                              slot.id
                                            }
                                            value={
                                              slot.id
                                            }
                                          >
                                            {formatDateTime(
                                              slot.starts_at,
                                            )}{" "}
                                            —{" "}
                                            {
                                              slot.time
                                            }
                                          </option>
                                        ),
                                      )}
                                    </select>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        void transferBooking(
                                          booking,
                                        )
                                      }
                                      disabled={
                                        isBookingProcessing ||
                                        departureData.therapist.work_status !==
                                          "leaving" ||
                                        !currentChoice
                                          ?.therapistId ||
                                        !currentChoice
                                          ?.slotId
                                      }
                                      className="mt-4 w-full rounded-xl bg-blue-700 px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                      {isBookingProcessing
                                        ? text.processing
                                        : text.transfer}
                                    </button>
                                  </div>

                                  {/* REMBOURSER */}
                                  <div className="rounded-2xl border border-red-200 bg-red-50/60 p-5">
                                    <h4 className="font-bold text-red-800">
                                      {
                                        text.refund
                                      }
                                    </h4>

                                    <p className="mt-2 text-sm leading-6 text-red-800/80">
                                      {
                                        text.refundHelp
                                      }
                                    </p>

                                    {booking.payment_provider !==
                                      "stripe" && (
                                      <p className="mt-3 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-red-700">
                                        {
                                          text.automaticRefundNote
                                        }
                                      </p>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() =>
                                        void refundBooking(
                                          booking,
                                        )
                                      }
                                      disabled={
                                        isBookingProcessing ||
                                        departureData.therapist.work_status !==
                                          "leaving" ||
                                        booking.payment_provider !==
                                          "stripe"
                                      }
                                      className="mt-5 w-full rounded-xl bg-red-700 px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                      {isBookingProcessing
                                        ? text.processing
                                        : text.refund}
                                    </button>
                                  </div>
                                </div>
                              </article>
                            );
                          },
                        )}
                      </div>
                    )}

                    {departureData.therapist.work_status !==
                      "active" && (
                    <div className="mt-8 rounded-[1.75rem] border border-aan-border bg-white p-6">
                      <h3 className="text-xl font-bold text-aan-navy">
                        {
                          text.finalize
                        }
                      </h3>

                      <p className="mt-2 leading-7 text-aan-secondary">
                        {
                          text.finalizeHelp
                        }
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          void finalizeDeparture()
                        }
                        disabled={
                          !canFinalizeDeparture ||
                          processingId ===
                            departureTherapist.id
                        }
                        className="aan-button mt-5 px-6 py-4 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {processingId ===
                        departureTherapist.id
                          ? text.processing
                          : text.finalize}
                      </button>

                      {!canFinalizeDeparture && (
                        <p className="mt-3 text-sm font-semibold text-amber-700">
                          {
                            text.cannotFinalize
                          }
                        </p>
                      )}
                    </div>
                    )}
                  </>
                ) : null}
              </div>
            </section>
          </div>
        )}
      </>
    </ProtectedRoute>
  );
}
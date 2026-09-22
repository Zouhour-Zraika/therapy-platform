"use client";

import { Suspense, useEffect, useState, type ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import PatientSidebar from "../components/PatientSidebar";
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
  patient_pack_id?: string | null;
  payment_source?: string | null;
  payment_provider?: string | null;
  reschedule_requested_by?: string | null;
  reschedule_requested_at?: string | null;
};

type PatientPack = {
  id: string;
  therapist_id: string;
  therapist_service_id: string;
  sessions_total: number;
  sessions_remaining: number;
  session_price: number;
  discount_rate: number;
  total_price: number;
  status: string;
  valid_until: string | null;
  therapist_name: string;
};

type PatientProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  photo_url: string | null;
  role: string | null;
  phone_number: string | null;
  date_of_birth: string | null;
  occupation: string | null;
  education_level: string | null;
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

function PatientDashboardContent() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [patientPacks, setPatientPacks] = useState<PatientPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [sessionsPage, setSessionsPage] = useState(1);
  const SESSIONS_PER_PAGE = 20;
  const [bookingActionId, setBookingActionId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileDateOfBirth, setProfileDateOfBirth] = useState("");
  const [profileOccupation, setProfileOccupation] = useState("");
  const [profileEducationLevel, setProfileEducationLevel] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const { language, isArabic } = useLanguage();
  const searchParams = useSearchParams();

  const requestedSection = searchParams.get("section");
  const normalizedSection =
    requestedSection === "appointments" || requestedSection === "packs"
      ? "sessions"
      : requestedSection;

  const activeSection =
    normalizedSection === "sessions" ||
    normalizedSection === "profile" ||
    normalizedSection === "documents" ||
    normalizedSection === "help"
      ? normalizedSection
      : "dashboard";

  useEffect(() => {
    setSessionsPage(1);
  }, [activeSection]);


  const copy =
    language === "ar"
      ? {
          eyebrow: "مساحتك الخاصة",
          title: "لوحة تحكم المريض",
          description:
            "اطّلع على جلساتك القادمة، وأكمل الدفع، وانضم إلى الجلسات عبر الإنترنت.",
          appointments: "مواعيدي",
          sessionsTitle: "جلساتي",
          sessionsDescription: "تابع مواعيدك وباقة المريض من مكان واحد.",
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
          cancelPending: "إلغاء هذا الحجز",
          cancelPendingConfirm: "هل تريد إلغاء هذا الحجز غير المدفوع؟ سيصبح الموعد متاحاً من جديد فوراً.",
          cancellingPending: "جارٍ إلغاء الحجز...",
          cancelPendingSuccess: "تم إلغاء الحجز وأصبح الموعد متاحاً من جديد.",
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
          packManageUntil: "يمكن تغيير موعد جلسة الباقة حتى 24 ساعة قبل الجلسة. لا يمكن إلغاء جلسة الباقة أو استرداد قيمتها.",
          packTitle: "باقة المريض",
          packRemaining: "جلسات متبقية",
          packValidUntil: "صالحة حتى",
          packBookSession: "حجز جلسة من الباقة",
          packIncluded: "مشمولة في باقتك",
          packSession: "جلسة",
          packOf: "من",
          packNoExtraPayment: "لا يوجد دفع إضافي لهذه الجلسة.",
          packCompleted: "اكتملت الباقة",
          packUsed: "جلسات مستخدمة",
          sessionPast: "جلسة سابقة",
          openMenu: "فتح القائمة",
          profileTitle: "ملفي الشخصي",
          profileDescription: "يمكنك تحديث معلوماتك الشخصية وصورتك هنا. يبقى بريدك الإلكتروني مرتبطاً بحسابك.",
          profilePhoto: "الصورة الشخصية",
          profilePhotoHint: "اختياري · JPG أو PNG أو WEBP · بحد أقصى 5 ميغابايت",
          choosePhoto: "اختيار صورة",
          changePhoto: "تغيير الصورة",
          fullName: "الاسم الكامل",
          email: "البريد الإلكتروني",
          emailReadOnly: "البريد الإلكتروني مرتبط بحسابك ولا يمكن تغييره من هنا.",
          phoneNumber: "رقم الهاتف",
          phonePlaceholder: "مثال: +961 70 123 456",
          dateOfBirth: "تاريخ الميلاد",
          ageHint: "يُستخدم تاريخ الميلاد بدلاً من حفظ العمر، لأن العمر يتغير مع الوقت.",
          occupation: "العمل / المهنة",
          occupationPlaceholder: "مثال: طالب، مهندس، مدرس...",
          educationLevel: "الدراسة / المستوى التعليمي",
          educationPlaceholder: "مثال: جامعي، ماجستير، ثانوي...",
          optionalField: "اختياري",
          saveProfile: "حفظ التغييرات",
          savingProfile: "جارٍ الحفظ...",
          profileSaved: "تم تحديث ملفك الشخصي.",
          profileLoadError: "تعذر تحميل ملفك الشخصي.",
          profileSaveError: "تعذر حفظ ملفك الشخصي. يرجى المحاولة مرة أخرى.",
          invalidPhotoType: "يرجى اختيار صورة بصيغة JPG أو PNG أو WEBP.",
          photoTooLarge: "يجب ألا يتجاوز حجم الصورة 5 ميغابايت.",
          nameRequired: "يرجى إدخال اسمك الكامل.",
          documentsTitle: "مستنداتي",
          documentsDescription: "ستجد هنا مستنداتك وإيصالات الدفع الخاصة بك.",
          helpTitle: "المساعدة والأسئلة الشائعة",
          helpDescription: "ستجد هنا المساعدة والإجابات عن الأسئلة الأكثر شيوعاً.",
        }
      : language === "fr"
        ? {
            eyebrow: "Votre espace privé",
            title: "Tableau de bord patient",
            description:
              "Consultez vos prochaines séances, finalisez vos paiements et rejoignez vos rendez-vous en ligne.",
            appointments: "Mes rendez-vous",
            sessionsTitle: "Mes séances",
            sessionsDescription:
              "Retrouvez vos rendez-vous et votre Pack Patient au même endroit.",
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
            cancelPending: "Annuler cette réservation",
            cancelPendingConfirm:
              "Voulez-vous annuler cette réservation non payée ? Le créneau redeviendra immédiatement disponible.",
            cancellingPending: "Annulation de la réservation...",
            cancelPendingSuccess:
              "La réservation a été annulée et le créneau est de nouveau disponible.",
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
            packManageUntil:
              "Pour une séance du Pack, le changement de créneau est possible jusqu’à 24 h avant la séance. L’annulation et le remboursement ne sont pas disponibles.",
            packTitle: "Mon Pack Patient",
            packRemaining: "séances restantes",
            packValidUntil: "Valable jusqu’au",
            packBookSession: "Réserver une séance du Pack",
            packIncluded: "Incluse dans votre Pack",
            packSession: "Séance",
            packOf: "sur",
            packNoExtraPayment: "Aucun paiement supplémentaire pour cette séance.",
            packCompleted: "Pack terminé",
            packUsed: "séances utilisées",
            sessionPast: "Séance passée",
            openMenu: "Ouvrir le menu",
            profileTitle: "Mon profil",
            profileDescription:
              "Mettez à jour vos informations personnelles et votre photo de profil. Votre adresse e-mail reste liée à votre compte.",
            profilePhoto: "Photo de profil",
            profilePhotoHint: "Facultatif · JPG, PNG ou WEBP · 5 Mo maximum",
            choosePhoto: "Choisir une photo",
            changePhoto: "Changer la photo",
            fullName: "Nom complet",
            email: "Adresse e-mail",
            emailReadOnly:
              "L’adresse e-mail est liée à votre compte et ne peut pas être modifiée ici.",
            phoneNumber: "Numéro de téléphone",
            phonePlaceholder: "Ex. +961 70 123 456",
            dateOfBirth: "Date de naissance",
            ageHint:
              "La date de naissance est enregistrée plutôt que l’âge, car l’âge évolue avec le temps.",
            occupation: "Travail / profession",
            occupationPlaceholder: "Ex. Étudiant, ingénieur, enseignant...",
            educationLevel: "Études / niveau d’études",
            educationPlaceholder: "Ex. Universitaire, master, secondaire...",
            optionalField: "Facultatif",
            saveProfile: "Enregistrer les modifications",
            savingProfile: "Enregistrement...",
            profileSaved: "Votre profil a été mis à jour.",
            profileLoadError: "Impossible de charger votre profil.",
            profileSaveError:
              "Impossible d’enregistrer votre profil. Veuillez réessayer.",
            invalidPhotoType:
              "Veuillez choisir une image JPG, PNG ou WEBP.",
            photoTooLarge: "La photo ne doit pas dépasser 5 Mo.",
            nameRequired: "Veuillez renseigner votre nom complet.",
            documentsTitle: "Mes documents",
            documentsDescription:
              "Retrouvez ici vos documents et vos reçus de paiement.",
            helpTitle: "Aide & FAQ",
            helpDescription:
              "Retrouvez ici l’aide et les réponses aux questions les plus fréquentes.",
          }
        : {
            eyebrow: "Your private space",
            title: "Patient Dashboard",
            description:
              "Review your upcoming sessions, complete payments and join your online appointments.",
            appointments: "My Appointments",
            sessionsTitle: "My sessions",
            sessionsDescription:
              "Manage your appointments and Patient Pack in one place.",
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
            cancelPending: "Cancel this booking",
            cancelPendingConfirm:
              "Do you want to cancel this unpaid booking? The time slot will become available again immediately.",
            cancellingPending: "Cancelling booking...",
            cancelPendingSuccess:
              "The booking was cancelled and the time slot is available again.",
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
            packManageUntil:
              "For a Pack session, you can change the time until 24 hours before the session. Cancellation and refunds are not available.",
            packTitle: "My Patient Pack",
            packRemaining: "sessions remaining",
            packValidUntil: "Valid until",
            packBookSession: "Book a Pack session",
            packIncluded: "Included in your Pack",
            packSession: "Session",
            packOf: "of",
            packNoExtraPayment: "No additional payment for this session.",
            packCompleted: "Pack completed",
            packUsed: "sessions used",
            sessionPast: "Past session",
            openMenu: "Open menu",
            profileTitle: "My profile",
            profileDescription:
              "Update your personal information and profile photo here. Your email address remains linked to your account.",
            profilePhoto: "Profile photo",
            profilePhotoHint: "Optional · JPG, PNG or WEBP · 5 MB maximum",
            choosePhoto: "Choose a photo",
            changePhoto: "Change photo",
            fullName: "Full name",
            email: "Email address",
            emailReadOnly:
              "Your email address is linked to your account and cannot be changed here.",
            phoneNumber: "Phone number",
            phonePlaceholder: "e.g. +961 70 123 456",
            dateOfBirth: "Date of birth",
            ageHint:
              "Date of birth is stored instead of age because age changes over time.",
            occupation: "Work / occupation",
            occupationPlaceholder: "e.g. Student, engineer, teacher...",
            educationLevel: "Studies / education level",
            educationPlaceholder: "e.g. University, master’s, secondary...",
            optionalField: "Optional",
            saveProfile: "Save changes",
            savingProfile: "Saving...",
            profileSaved: "Your profile has been updated.",
            profileLoadError: "Unable to load your profile.",
            profileSaveError:
              "Unable to save your profile. Please try again.",
            invalidPhotoType:
              "Please choose a JPG, PNG or WEBP image.",
            photoTooLarge: "The photo must not exceed 5 MB.",
            nameRequired: "Please enter your full name.",
            documentsTitle: "My documents",
            documentsDescription:
              "Find your documents and payment receipts here.",
            helpTitle: "Help & FAQ",
            helpDescription:
              "Find help and answers to frequently asked questions here.",
          };

  useEffect(() => {
    /*
     * Compatibilité avec les anciens e-mails de changement envoyés
     * vers /dashboard?reschedule=<bookingId>.
     *
     * Le vrai parcours de replanification se trouve sur /booking.
     * On redirige donc immédiatement sans afficher le dashboard.
     */
    const params =
      new URLSearchParams(
        window.location.search,
      );

    const rescheduleBookingId =
      params.get(
        "reschedule",
      );

    if (
      rescheduleBookingId
    ) {
      window.location.replace(
        `/booking?reschedule=${encodeURIComponent(
          rescheduleBookingId,
        )}`,
      );

      return;
    }

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

      const [
        { data: bookingData, error: bookingError },
        { data: packData, error: packError },
        { data: profileData, error: profileLoadError },
      ] = await Promise.all([
        supabase
          .from("bookings")
          .select("*")
          .eq("patient_id", user.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("patient_packs")
          .select(
            "id, therapist_id, therapist_service_id, sessions_total, sessions_remaining, session_price, discount_rate, total_price, status, valid_until",
          )
          .eq("patient_id", user.id)
          .in("status", ["active", "used"])
          .order("created_at", { ascending: false }),

        supabase
          .from("profiles")
          .select("id, email, full_name, photo_url, role, phone_number, date_of_birth, occupation, education_level")
          .eq("id", user.id)
          .single(),
      ]);

      if (bookingError) {
        throw bookingError;
      }

      if (packError) {
        console.error("Unable to load patient packs:", packError);
      }

      if (profileLoadError) {
        console.error("Unable to load patient profile:", profileLoadError);
        setProfileError(copy.profileLoadError);
      } else if (profileData) {
        const loadedProfile = profileData as PatientProfile;
        setPatientProfile(loadedProfile);
        setProfileName(loadedProfile.full_name || "");
        setProfileEmail(loadedProfile.email || user.email || "");
        setProfilePhotoUrl(loadedProfile.photo_url || "");
        setProfilePhone(loadedProfile.phone_number || "");
        setProfileDateOfBirth(loadedProfile.date_of_birth || "");
        setProfileOccupation(loadedProfile.occupation || "");
        setProfileEducationLevel(loadedProfile.education_level || "");
        setProfilePhotoPreview("");
        setProfilePhotoFile(null);
      }

      const loadedBookings =
        (bookingData as Booking[] | null) || [];

      setBookings(loadedBookings);

      const rawPacks =
        (packData || []) as Array<{
          id: string;
          therapist_id: string;
          therapist_service_id: string;
          sessions_total: number;
          sessions_remaining: number;
          session_price: number;
          discount_rate: number;
          total_price: number;
          status: string;
          valid_until: string | null;
        }>;

      if (rawPacks.length > 0) {
        const therapistIds = Array.from(
          new Set(
            rawPacks.map(
              (pack) => pack.therapist_id,
            ),
          ),
        );

        const {
          data: therapistData,
          error: therapistError,
        } = await supabase
          .from("therapists")
          .select("id, full_name")
          .in("id", therapistIds);

        if (therapistError) {
          console.error(
            "Unable to load pack specialists:",
            therapistError,
          );
        }

        const therapistNames = new Map(
          (therapistData || []).map(
            (therapist) => [
              therapist.id,
              therapist.full_name,
            ],
          ),
        );

        const now = Date.now();

        setPatientPacks(
          rawPacks
            .filter((pack) => {
              if (
                pack.status !== "active" &&
                pack.status !== "used"
              ) {
                return false;
              }

              if (
                pack.status === "used" ||
                Number(pack.sessions_remaining) <= 0
              ) {
                return true;
              }

              if (!pack.valid_until) {
                return true;
              }

              const validUntilMs =
                new Date(
                  pack.valid_until,
                ).getTime();

              return (
                Number.isNaN(validUntilMs) ||
                validUntilMs > now
              );
            })
            .map((pack) => ({
              ...pack,
              therapist_name:
                therapistNames.get(
                  pack.therapist_id,
                ) || "",
            })),
        );
      } else {
        setPatientPacks([]);
      }

      setNowMs(Date.now());
    } catch (error) {
      console.error("Unable to load patient bookings:", error);
      setErrorMessage(copy.unableToLoad);
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePhotoChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setProfileMessage("");
    setProfileError("");

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setProfileError(copy.invalidPhotoType);
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileError(copy.photoTooLarge);
      event.target.value = "";
      return;
    }

    if (profilePhotoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(profilePhotoPreview);
    }

    setProfilePhotoFile(file);
    setProfilePhotoPreview(URL.createObjectURL(file));
  };

  const savePatientProfile = async () => {
    const trimmedName = profileName.trim();

    setProfileMessage("");
    setProfileError("");

    if (!trimmedName) {
      setProfileError(copy.nameRequired);
      return;
    }

    setProfileSaving(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        window.location.href = "/login";
        return;
      }

      let nextPhotoUrl = profilePhotoUrl || null;

      if (profilePhotoFile) {
        const extension =
          profilePhotoFile.name.split(".").pop()?.toLowerCase() || "jpg";

        const filePath =
          `${user.id}/patient-profile-${Date.now()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("profile-photos")
          .upload(filePath, profilePhotoFile, {
            cacheControl: "3600",
            contentType: profilePhotoFile.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage
          .from("profile-photos")
          .getPublicUrl(filePath);

        nextPhotoUrl = publicUrl;
      }

      const { data: updatedProfile, error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: trimmedName,
          photo_url: nextPhotoUrl,
          phone_number: profilePhone.trim() || null,
          date_of_birth: profileDateOfBirth || null,
          occupation: profileOccupation.trim() || null,
          education_level: profileEducationLevel.trim() || null,
        })
        .eq("id", user.id)
        .select("id, email, full_name, photo_url, role, phone_number, date_of_birth, occupation, education_level")
        .single();

      if (updateError) throw updateError;

      const savedProfile = updatedProfile as PatientProfile;

      setPatientProfile(savedProfile);
      setProfileName(savedProfile.full_name || "");
      setProfileEmail(savedProfile.email || user.email || "");
      setProfilePhotoUrl(savedProfile.photo_url || "");
      setProfilePhone(savedProfile.phone_number || "");
      setProfileDateOfBirth(savedProfile.date_of_birth || "");
      setProfileOccupation(savedProfile.occupation || "");
      setProfileEducationLevel(savedProfile.education_level || "");

      if (profilePhotoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(profilePhotoPreview);
      }

      setProfilePhotoPreview("");
      setProfilePhotoFile(null);
      setProfileMessage(copy.profileSaved);
    } catch (error) {
      console.error("Unable to save patient profile:", error);
      setProfileError(copy.profileSaveError);
    } finally {
      setProfileSaving(false);
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

  const formatPackValidity = (
    value: string | null,
  ) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return new Intl.DateTimeFormat(
      getLocale(),
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      },
    ).format(date);
  };

  const isPackBooking = (
    booking: Booking,
  ) =>
    Boolean(
      booking.patient_pack_id ||
        booking.payment_source ===
          "patient_pack" ||
        booking.payment_provider ===
          "patient_pack",
    );

  const getPackForBooking = (
    booking: Booking,
  ) => {
    if (!booking.patient_pack_id) {
      return null;
    }

    return (
      patientPacks.find(
        (pack) =>
          pack.id ===
          booking.patient_pack_id,
      ) || null
    );
  };

  const getPackSessionNumber = (
    booking: Booking,
  ) => {
    if (!booking.patient_pack_id) {
      return null;
    }

    const packBookings = bookings
      .filter(
        (item) =>
          item.patient_pack_id ===
            booking.patient_pack_id &&
          item.status === "paid",
      )
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime(),
      );

    const index = packBookings.findIndex(
      (item) => item.id === booking.id,
    );

    return index >= 0
      ? index + 1
      : null;
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


  const dashboardUpcomingBookings = [...visibleBookings]
    .filter((booking) => !isPastBooking(booking))
    .sort((a, b) => {
      const aTime = a.scheduled_start
        ? new Date(a.scheduled_start).getTime()
        : Number.MAX_SAFE_INTEGER;
      const bTime = b.scheduled_start
        ? new Date(b.scheduled_start).getTime()
        : Number.MAX_SAFE_INTEGER;

      return aTime - bTime;
    })
    .slice(0, 2);

  const dashboardPastBookings = [...visibleBookings]
    .filter((booking) => isPastBooking(booking))
    .sort((a, b) => {
      const aTime = a.scheduled_start
        ? new Date(a.scheduled_start).getTime()
        : 0;
      const bTime = b.scheduled_start
        ? new Date(b.scheduled_start).getTime()
        : 0;

      return bTime - aTime;
    })
    .slice(0, 2);

  const sessionsTotalPages = Math.max(
    1,
    Math.ceil(visibleBookings.length / SESSIONS_PER_PAGE),
  );

  const safeSessionsPage = Math.min(sessionsPage, sessionsTotalPages);
  const sessionsPageStart = (safeSessionsPage - 1) * SESSIONS_PER_PAGE;

  const paginatedSessionBookings = visibleBookings.slice(
    sessionsPageStart,
    sessionsPageStart + SESSIONS_PER_PAGE,
  );

  const displayedBookings =
    activeSection === "dashboard"
      ? [...dashboardUpcomingBookings, ...dashboardPastBookings]
      : paginatedSessionBookings;


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

  const cancelPendingBooking = async (booking: Booking) => {
    setActionMessage("");

    const confirmed = window.confirm(copy.cancelPendingConfirm);

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
            action: "cancel_pending",
            language,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || copy.actionError);
        return;
      }

      setActionMessage(copy.cancelPendingSuccess);
      await getBookings();
    } catch (error) {
      console.error(
        "Pending booking cancellation error:",
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
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className="min-h-screen bg-aan-background"
      >
        <Navbar />

        <div className="lg:flex">
          <PatientSidebar
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />

        <div className="min-w-0 flex-1">
          <div className="sticky top-0 z-40 flex items-center border-b border-aan-border bg-white/95 px-5 py-3 backdrop-blur lg:hidden">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label={copy.openMenu}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-aan-border bg-white text-aan-navy shadow-sm"
            >
              <span className="sr-only">{copy.openMenu}</span>
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>

            <div className="mx-3 min-w-0">
              <p className="truncate text-sm font-extrabold tracking-[0.14em] text-aan-navy">
                AAN
              </p>
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-aan-secondary">
                {copy.title}
              </p>
            </div>
          </div>

          <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
            <section className="mx-auto max-w-7xl">
            {activeSection === "dashboard" && (
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
            )}

            {activeSection === "sessions" && (
              <header className="relative mb-10 overflow-hidden rounded-[2.25rem] border border-aan-border bg-white p-8 shadow-[var(--aan-shadow-md)] sm:p-10">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-aan-gold">
                  AAN Psychotherapy
                </p>
                <h1 className="aan-heading mt-2 text-3xl sm:text-4xl">
                  {copy.sessionsTitle}
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-aan-secondary">
                  {copy.sessionsDescription}
                </p>
              </header>
            )}

            {(activeSection === "dashboard" || activeSection === "sessions") &&
              !loading &&
              patientPacks.length > 0 && (
                <section
                  id="packs"
                  className="mb-10 scroll-mt-24 rounded-[2.25rem] border border-aan-border bg-white p-6 shadow-[var(--aan-shadow-md)] sm:p-8 lg:p-10"
                >
                  <div className="mb-6">
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-aan-gold">
                      AAN Psychotherapy
                    </p>

                    <h2 className="aan-heading mt-2 text-3xl sm:text-4xl">
                      {copy.packTitle}
                    </h2>
                  </div>

                  <div className="grid gap-5">
                    {patientPacks.map(
                      (pack) => (
                        <article
                          key={pack.id}
                          className="rounded-[1.75rem] border border-[#d8c7aa] bg-[linear-gradient(145deg,#fffaf2_0%,#f7f2e9_100%)] p-6 sm:p-7"
                        >
                          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              {pack.therapist_name && (
                                <p className="font-bold text-aan-navy">
                                  {pack.therapist_name}
                                </p>
                              )}

                              <div className="mt-3 flex flex-wrap items-center gap-3">
                                {pack.status === "used" ||
                                Number(pack.sessions_remaining) <= 0 ? (
                                  <span className="rounded-full border border-aan-border bg-[#fbf8f3] px-4 py-2 text-sm font-bold text-aan-navy">
                                    {copy.packCompleted} ·{" "}
                                    {formatDigits(pack.sessions_total)}/
                                    {formatDigits(pack.sessions_total)}{" "}
                                    {copy.packUsed}
                                  </span>
                                ) : (
                                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
                                    {formatDigits(pack.sessions_remaining)}/
                                    {formatDigits(pack.sessions_total)}{" "}
                                    {copy.packRemaining}
                                  </span>
                                )}

                                <span className="rounded-full border border-aan-border bg-white px-4 py-2 text-sm font-semibold text-aan-secondary">
                                  {copy.packValidUntil}:{" "}
                                  {formatPackValidity(pack.valid_until)}
                                </span>
                              </div>

                              <p className="mt-4 text-sm leading-6 text-aan-secondary">
                                {pack.status === "used" ||
                                Number(pack.sessions_remaining) <= 0
                                  ? language === "ar"
                                    ? "تم استخدام جميع جلسات هذه الباقة."
                                    : language === "fr"
                                      ? "Toutes les séances de ce Pack ont été utilisées."
                                      : "All sessions in this Pack have been used."
                                  : language === "ar"
                                    ? "جلساتك مدفوعة مسبقاً ضمن هذه الباقة. اختر موعداً جديداً من رصيدك المتبقي من دون دفع إضافي."
                                    : language === "fr"
                                      ? "Vos séances sont déjà prépayées dans ce Pack. Réservez vos prochains créneaux avec votre crédit restant, sans nouveau paiement."
                                      : "Your sessions are prepaid in this Pack. Book your next appointments from your remaining credit with no additional payment."}
                              </p>
                            </div>

                            {pack.status === "active" &&
                              Number(pack.sessions_remaining) > 0 && (
                                <Link
                                  href={`/booking?packId=${encodeURIComponent(
                                    pack.id,
                                  )}`}
                                  className="aan-cta inline-flex shrink-0 items-center justify-center rounded-2xl px-6 py-4 text-center font-bold text-white"
                                >
                                  {copy.packBookSession}
                                </Link>
                              )}
                          </div>
                        </article>
                      ),
                    )}
                  </div>
                </section>
              )}

            {(activeSection === "dashboard" || activeSection === "sessions") && (
            <section
              id="appointments"
              className="scroll-mt-24 rounded-[2.25rem] border border-aan-border bg-white p-6 shadow-[var(--aan-shadow-md)] sm:p-8 lg:p-10"
            >
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
                  <div className="flex flex-wrap items-center gap-3">
                    {activeSection === "dashboard" && visibleBookings.length > displayedBookings.length && (
                      <Link
                        href="/dashboard?section=sessions"
                        className="rounded-xl border border-aan-border bg-white px-4 py-2 text-sm font-bold text-aan-navy transition hover:border-aan-gold hover:bg-[#fbf8f3]"
                      >
                        {language === "ar"
                          ? "عرض كل الجلسات"
                          : language === "fr"
                            ? "Voir toutes mes séances"
                            : "View all my sessions"}
                      </Link>
                    )}
                    <span className="inline-flex w-fit rounded-full border border-aan-border bg-[#fbf8f3] px-4 py-2 text-sm font-bold text-aan-navy">
                      {formatDigits(
                        activeSection === "dashboard"
                          ? displayedBookings.length
                          : visibleBookings.length,
                      )}
                    </span>
                  </div>
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
              ) : displayedBookings.length === 0 ? (
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
                <div className="grid gap-3">
                  {displayedBookings.map((booking) => (
                    <article
                      key={booking.id}
                      className="rounded-2xl border border-aan-border bg-white px-4 py-4 shadow-[var(--aan-shadow-sm)] transition hover:border-aan-gold/60 sm:px-5"
                    >
                      <div className="grid gap-4 xl:grid-cols-[minmax(180px,0.8fr)_minmax(210px,1fr)_minmax(250px,1.25fr)_auto] xl:items-center">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef4fa] text-aan-button">
                            <svg
                              viewBox="0 0 24 24"
                              className="h-5 w-5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              aria-hidden="true"
                            >
                              <path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
                            </svg>
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-extrabold capitalize text-aan-navy">
                              {formatAppointmentDate(booking)}
                            </p>
                            <p className="mt-0.5 text-sm font-semibold text-aan-secondary">
                              {formatAppointmentTime(booking)}
                              {booking.scheduled_start && localTimeZone
                                ? ` · ${localTimeZone}`
                                : ""}
                            </p>
                          </div>
                        </div>

                        <div className="min-w-0 xl:border-s xl:border-aan-border xl:ps-5">
                          <p className="truncate font-extrabold text-aan-navy">
                            {booking.therapist_name}
                          </p>
                          <p className="mt-1 text-xs text-aan-secondary">
                            {copy.sessionDetails}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {isPackBooking(booking) ? (
                            <>
                              <span className="inline-flex rounded-full border border-[#d8c7aa] bg-[#fffaf2] px-3 py-1.5 text-xs font-bold text-[#8f744d]">
                                {copy.packTitle}
                              </span>

                              {getPackSessionNumber(booking) && (
                                <span className="inline-flex rounded-full border border-aan-border bg-[#fbf8f3] px-3 py-1.5 text-xs font-bold text-aan-navy">
                                  {copy.packSession}{" "}
                                  {formatDigits(
                                    getPackSessionNumber(booking) as number,
                                  )}{" "}
                                  {copy.packOf}{" "}
                                  {formatDigits(
                                    getPackForBooking(booking)?.sessions_total ||
                                      4,
                                  )}
                                </span>
                              )}

                              <span className="text-xs font-bold text-aan-navy">
                                {copy.packIncluded}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm font-bold text-aan-navy">
                              {formatPrice(booking.price)}
                            </span>
                          )}

                          <span
                            className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold ${getStatusClasses(
                              booking.status,
                            )}`}
                          >
                            {getStatusLabel(booking.status)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                          {booking.status === "paid" ? (
                            isPastBooking(booking) ? (
                              <span className="rounded-xl border border-aan-border bg-[#fbf8f3] px-4 py-2 text-xs font-bold text-aan-secondary">
                                {copy.sessionPast}
                              </span>
                            ) : (
                              <>
                                {booking.zoom_join_url ? (
                                  <a
                                    href={booking.zoom_join_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="aan-cta inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-bold text-white"
                                  >
                                    {copy.joinZoom}
                                  </a>
                                ) : (
                                  <button
                                    type="button"
                                    disabled
                                    className="cursor-not-allowed rounded-xl bg-aan-button/40 px-4 py-2 text-xs font-bold text-white"
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
                                      disabled={bookingActionId === booking.id}
                                      className="rounded-xl border border-aan-gold bg-white px-4 py-2 text-xs font-bold text-aan-navy transition hover:bg-[#fbf8f3] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {bookingActionId === booking.id
                                        ? copy.changing
                                        : copy.changeSlot}
                                    </button>

                                    {!isPackBooking(booking) && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          void runPatientBookingAction(
                                            booking,
                                            "cancel_and_refund",
                                          )
                                        }
                                        disabled={bookingActionId === booking.id}
                                        className="rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        {bookingActionId === booking.id
                                          ? copy.cancelling
                                          : copy.cancelAndRefund}
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  <span className="max-w-[230px] rounded-xl border border-aan-border bg-[#fbf8f3] px-3 py-2 text-center text-[11px] leading-4 text-aan-secondary">
                                    {hasValidScheduledStart(booking)
                                      ? copy.tooLate
                                      : copy.missingScheduledStart}
                                  </span>
                                )}
                              </>
                            )
                          ) : booking.status === "cancelled" ? (
                            <span className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700">
                              {copy.cancelled}
                            </span>
                          ) : (
                            <>
                              <Link
                                href={`/payment?bookingId=${booking.id}&therapist=${encodeURIComponent(
                                  booking.therapist_name,
                                )}&price=${booking.price}&slot=${encodeURIComponent(
                                  `${booking.slot_day} ${booking.slot_time}`,
                                )}`}
                                className="aan-cta inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-bold text-white"
                              >
                                {copy.completePayment}
                              </Link>

                              <button
                                type="button"
                                onClick={() =>
                                  void cancelPendingBooking(booking)
                                }
                                disabled={bookingActionId === booking.id}
                                className="rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {bookingActionId === booking.id
                                  ? copy.cancellingPending
                                  : copy.cancelPending}
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-aan-border/70 pt-3 text-[11px] text-aan-secondary">
                        <span>
                          <span className="font-bold text-aan-navy">
                            {copy.booked}:
                          </span>{" "}
                          {formatBookedDate(booking.created_at)}
                        </span>

                        {isPackBooking(booking) && (
                          <span>{copy.packNoExtraPayment}</span>
                        )}

                        {booking.status === "paid" &&
                          !isPastBooking(booking) &&
                          canPatientManageBooking(booking) && (
                            <span>
                              {isPackBooking(booking)
                                ? copy.packManageUntil
                                : copy.manageUntil}
                            </span>
                          )}
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {!loading &&
                activeSection === "sessions" &&
                visibleBookings.length > SESSIONS_PER_PAGE && (
                  <div className="mt-6 flex flex-col gap-4 border-t border-aan-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-aan-secondary">
                      {language === "ar"
                        ? `عرض ${formatDigits(sessionsPageStart + 1)} إلى ${formatDigits(
                            Math.min(
                              sessionsPageStart + SESSIONS_PER_PAGE,
                              visibleBookings.length,
                            ),
                          )} من أصل ${formatDigits(visibleBookings.length)} جلسة`
                        : language === "fr"
                          ? `Affichage de ${formatDigits(
                              sessionsPageStart + 1,
                            )} à ${formatDigits(
                              Math.min(
                                sessionsPageStart + SESSIONS_PER_PAGE,
                                visibleBookings.length,
                              ),
                            )} sur ${formatDigits(
                              visibleBookings.length,
                            )} séances`
                          : `Showing ${formatDigits(
                              sessionsPageStart + 1,
                            )} to ${formatDigits(
                              Math.min(
                                sessionsPageStart + SESSIONS_PER_PAGE,
                                visibleBookings.length,
                              ),
                            )} of ${formatDigits(
                              visibleBookings.length,
                            )} sessions`}
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSessionsPage((current) => Math.max(1, current - 1));
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        disabled={safeSessionsPage === 1}
                        className="flex h-10 min-w-10 items-center justify-center rounded-xl border border-aan-border bg-white px-3 font-bold text-aan-navy transition hover:border-aan-gold disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={
                          language === "ar"
                            ? "الصفحة السابقة"
                            : language === "fr"
                              ? "Page précédente"
                              : "Previous page"
                        }
                      >
                        ‹
                      </button>

                      {Array.from(
                        { length: sessionsTotalPages },
                        (_, index) => index + 1,
                      ).map((pageNumber) => (
                        <button
                          key={pageNumber}
                          type="button"
                          onClick={() => {
                            setSessionsPage(pageNumber);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          aria-current={
                            safeSessionsPage === pageNumber ? "page" : undefined
                          }
                          className={`flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-bold transition ${
                            safeSessionsPage === pageNumber
                              ? "border-aan-button bg-aan-button text-white shadow-sm"
                              : "border-aan-border bg-white text-aan-navy hover:border-aan-gold"
                          }`}
                        >
                          {formatDigits(pageNumber)}
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => {
                          setSessionsPage((current) =>
                            Math.min(sessionsTotalPages, current + 1),
                          );
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        disabled={safeSessionsPage === sessionsTotalPages}
                        className="flex h-10 min-w-10 items-center justify-center rounded-xl border border-aan-border bg-white px-3 font-bold text-aan-navy transition hover:border-aan-gold disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={
                          language === "ar"
                            ? "الصفحة التالية"
                            : language === "fr"
                              ? "Page suivante"
                              : "Next page"
                        }
                      >
                        ›
                      </button>
                    </div>
                  </div>
                )}
            </section>
            )}

            {activeSection === "profile" && (
              <section className="rounded-[2.25rem] border border-aan-border bg-white p-8 shadow-[var(--aan-shadow-md)] sm:p-10">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-aan-gold">
                  AAN Psychotherapy
                </p>
                <h1 className="aan-heading mt-2 text-3xl sm:text-4xl">
                  {copy.profileTitle}
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-aan-secondary">
                  {copy.profileDescription}
                </p>

                {profileMessage && (
                  <div className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 font-semibold text-emerald-800">
                    {profileMessage}
                  </div>
                )}

                {profileError && (
                  <div className="mt-7 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-semibold text-red-700">
                    {profileError}
                  </div>
                )}

                <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
                  <div className="rounded-[1.75rem] border border-aan-border bg-[#fbf8f3] p-6">
                    <p className="text-sm font-bold text-aan-navy">
                      {copy.profilePhoto}
                    </p>

                    <div className="mt-5 flex flex-col items-center">
                      <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border border-aan-border bg-white shadow-sm">
                        {profilePhotoPreview || profilePhotoUrl ? (
                          <img
                            src={profilePhotoPreview || profilePhotoUrl}
                            alt={profileName || copy.profilePhoto}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-4xl font-bold text-aan-navy">
                            {(profileName || profileEmail || "A")
                              .trim()
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        )}
                      </div>

                      <label className="mt-5 inline-flex cursor-pointer items-center justify-center rounded-2xl border border-aan-gold bg-white px-5 py-3 text-sm font-bold text-aan-navy transition hover:bg-[#fffaf2]">
                        {profilePhotoUrl || profilePhotoPreview
                          ? copy.changePhoto
                          : copy.choosePhoto}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleProfilePhotoChange}
                          className="sr-only"
                        />
                      </label>

                      <p className="mt-3 text-center text-xs leading-5 text-aan-secondary">
                        {copy.profilePhotoHint}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[1.75rem] border border-aan-border bg-white p-6 sm:p-7">
                    <div>
                      <label
                        htmlFor="patient-full-name"
                        className="text-sm font-bold text-aan-navy"
                      >
                        {copy.fullName}
                      </label>
                      <input
                        id="patient-full-name"
                        type="text"
                        value={profileName}
                        onChange={(event) => {
                          setProfileName(event.target.value);
                          setProfileMessage("");
                          setProfileError("");
                        }}
                        autoComplete="name"
                        className="mt-2 w-full rounded-2xl border border-aan-border bg-white px-4 py-3.5 text-aan-navy outline-none transition focus:border-aan-gold focus:ring-2 focus:ring-aan-gold/15"
                      />
                    </div>

                    <div className="mt-6">
                      <label
                        htmlFor="patient-email"
                        className="text-sm font-bold text-aan-navy"
                      >
                        {copy.email}
                      </label>
                      <input
                        id="patient-email"
                        type="email"
                        value={profileEmail}
                        readOnly
                        className="mt-2 w-full cursor-not-allowed rounded-2xl border border-aan-border bg-[#f7f5f1] px-4 py-3.5 text-aan-secondary outline-none"
                      />
                      <p className="mt-2 text-xs leading-5 text-aan-secondary">
                        {copy.emailReadOnly}
                      </p>
                    </div>

                    <div className="mt-6 grid gap-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor="patient-phone" className="text-sm font-bold text-aan-navy">
                          {copy.phoneNumber} <span className="text-xs font-normal text-aan-secondary">({copy.optionalField})</span>
                        </label>
                        <input id="patient-phone" type="tel" value={profilePhone} onChange={(event) => { setProfilePhone(event.target.value); setProfileMessage(""); setProfileError(""); }} placeholder={copy.phonePlaceholder} autoComplete="tel" className="mt-2 w-full rounded-2xl border border-aan-border bg-white px-4 py-3.5 text-aan-navy outline-none transition focus:border-aan-gold focus:ring-2 focus:ring-aan-gold/15" />
                      </div>

                      <div>
                        <label htmlFor="patient-date-of-birth" className="text-sm font-bold text-aan-navy">
                          {copy.dateOfBirth} <span className="text-xs font-normal text-aan-secondary">({copy.optionalField})</span>
                        </label>
                        <input id="patient-date-of-birth" type="date" value={profileDateOfBirth} max={new Date().toISOString().split("T")[0]} onChange={(event) => { setProfileDateOfBirth(event.target.value); setProfileMessage(""); setProfileError(""); }} autoComplete="bday" className="mt-2 w-full rounded-2xl border border-aan-border bg-white px-4 py-3.5 text-aan-navy outline-none transition focus:border-aan-gold focus:ring-2 focus:ring-aan-gold/15" />
                        <p className="mt-2 text-xs leading-5 text-aan-secondary">{copy.ageHint}</p>
                      </div>

                      <div>
                        <label htmlFor="patient-occupation" className="text-sm font-bold text-aan-navy">
                          {copy.occupation} <span className="text-xs font-normal text-aan-secondary">({copy.optionalField})</span>
                        </label>
                        <input id="patient-occupation" type="text" value={profileOccupation} onChange={(event) => { setProfileOccupation(event.target.value); setProfileMessage(""); setProfileError(""); }} placeholder={copy.occupationPlaceholder} autoComplete="organization-title" className="mt-2 w-full rounded-2xl border border-aan-border bg-white px-4 py-3.5 text-aan-navy outline-none transition focus:border-aan-gold focus:ring-2 focus:ring-aan-gold/15" />
                      </div>

                      <div>
                        <label htmlFor="patient-education-level" className="text-sm font-bold text-aan-navy">
                          {copy.educationLevel} <span className="text-xs font-normal text-aan-secondary">({copy.optionalField})</span>
                        </label>
                        <input id="patient-education-level" type="text" value={profileEducationLevel} onChange={(event) => { setProfileEducationLevel(event.target.value); setProfileMessage(""); setProfileError(""); }} placeholder={copy.educationPlaceholder} className="mt-2 w-full rounded-2xl border border-aan-border bg-white px-4 py-3.5 text-aan-navy outline-none transition focus:border-aan-gold focus:ring-2 focus:ring-aan-gold/15" />
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                      <button
                        type="button"
                        onClick={() => void savePatientProfile()}
                        disabled={profileSaving || !patientProfile}
                        className="aan-cta inline-flex min-w-[220px] items-center justify-center rounded-2xl px-6 py-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {profileSaving
                          ? copy.savingProfile
                          : copy.saveProfile}
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeSection === "documents" && (
              <section className="rounded-[2.25rem] border border-aan-border bg-white p-8 shadow-[var(--aan-shadow-md)] sm:p-10">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-aan-gold">
                  AAN Psychotherapy
                </p>
                <h1 className="aan-heading mt-2 text-3xl sm:text-4xl">
                  {copy.documentsTitle}
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-aan-secondary">
                  {copy.documentsDescription}
                </p>
              </section>
            )}

            {activeSection === "help" && (
              <section className="rounded-[2.25rem] border border-aan-border bg-white p-8 shadow-[var(--aan-shadow-md)] sm:p-10">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-aan-gold">
                  AAN Psychotherapy
                </p>
                <h1 className="aan-heading mt-2 text-3xl sm:text-4xl">
                  {copy.helpTitle}
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-aan-secondary">
                  {copy.helpDescription}
                </p>
              </section>
            )}
            </section>
          </main>
        </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function PatientDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-aan-background">
          <div className="flex min-h-screen items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-aan-border border-t-aan-button" />
          </div>
        </div>
      }
    >
      <PatientDashboardContent />
    </Suspense>
  );
}

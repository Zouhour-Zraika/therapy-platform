"use client";

import Image from "next/image";
import {
  ChangeEvent,
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";
import Navbar from "../components/Navbar";
import ProtectedRoute from "../components/ProtectedRoute";
import { useLanguage } from "@/i18n/LanguageProvider";

type Language = "en" | "fr" | "ar";

type AvailabilitySlot = {
  id: string;
  slot_date: string | null;
  day: string | null;
  time: string;
};

type Booking = {
  id: string;
  slot_id: string | null;
  slot_day: string;
  slot_time: string;
  scheduled_start: string | null;
  price: number;
  status: string;
  created_at: string;
  patient_email: string | null;

  zoom_start_url: string | null;

  meeting_url?: string | null;
  meeting_provider?: string | null;
};

type TherapistProfile = {
  full_name: string | null;
  full_name_ar: string | null;

  specialty: string | null;
  specialty_fr: string | null;
  specialty_ar: string | null;

  professional_title: string | null;
  professional_title_fr: string | null;
  professional_title_ar: string | null;

  experience_years: number | null;

  bio: string | null;
  bio_fr: string | null;
  bio_ar: string | null;

  education: string | null;
  education_fr: string | null;
  education_ar: string | null;

  certifications: string | null;
  certifications_fr: string | null;
  certifications_ar: string | null;

  therapeutic_approach: string | null;
  therapeutic_approach_fr: string | null;
  therapeutic_approach_ar: string | null;

  languages: string | null;
  languages_fr: string | null;
  languages_ar: string | null;

  photo_url: string | null;
};

type TherapistService = {
  id: string;
  therapist_id: string;

  service_type:
    | "individual"
    | "couples"
    | "family"
    | "group";

  price: number;
  duration_minutes: number;
  price_per_participant: boolean;
  min_participants: number | null;
  max_participants: number | null;
  is_active: boolean;
};

type TranslationFields = {
  fullName?: string;
  professionalTitle: string;
  specialty: string;
  bio: string;
  education: string;
  certifications: string;
  therapeuticApproach: string;
  languages: string;
};

const MAX_PHOTO_SIZE =
  5 * 1024 * 1024;

export default function TherapistDashboard() {
  const {
    language,
    isArabic,
  } = useLanguage();

  const [fullName, setFullName] =
    useState("");

  const [
    professionalTitle,
    setProfessionalTitle,
  ] = useState("");

  const [specialty, setSpecialty] =
    useState("");

  const [
    experienceYears,
    setExperienceYears,
  ] = useState("");

  const [bio, setBio] =
    useState("");

  const [education, setEducation] =
    useState("");

  const [
    certifications,
    setCertifications,
  ] = useState("");

  const [
    therapeuticApproach,
    setTherapeuticApproach,
  ] = useState("");

  const [languages, setLanguages] =
    useState("");

  const [
    therapistServices,
    setTherapistServices,
  ] = useState<
    TherapistService[]
  >([]);

  const [photoUrl, setPhotoUrl] =
    useState("");

  const [photoFile, setPhotoFile] =
    useState<File | null>(null);

  const [
    photoPreview,
    setPhotoPreview,
  ] = useState("");

  const [slotDate, setSlotDate] =
    useState("");

  const [time, setTime] =
    useState("");

  const [slots, setSlots] =
    useState<AvailabilitySlot[]>([]);

  const [bookings, setBookings] =
    useState<Booking[]>([]);

  const [showAllSlots, setShowAllSlots] =
    useState(false);

  const [
    showAllUpcomingBookings,
    setShowAllUpcomingBookings,
  ] = useState(false);

  const [
    showPastBookings,
    setShowPastBookings,
  ] = useState(false);

  const [nowMs, setNowMs] =
    useState(() => Date.now());

  const [
    bookingActionId,
    setBookingActionId,
  ] = useState<string | null>(
    null,
  );

  const [loading, setLoading] =
    useState(false);

  const [
    uploadingPhoto,
    setUploadingPhoto,
  ] = useState(false);

  const [
    translating,
    setTranslating,
  ] = useState(false);

  const [
    connectingGoogle,
    setConnectingGoogle,
  ] = useState(false);

  const [
    googleConnection,
    setGoogleConnection,
  ] = useState<{
    connected: boolean;
    email: string | null;
  }>({
    connected: false,
    email: null,
  });

  const [
    googleStatusLoading,
    setGoogleStatusLoading,
  ] = useState(true);

  const [
    disconnectingGoogle,
    setDisconnectingGoogle,
  ] = useState(false);

  const [
    showProfileEditor,
    setShowProfileEditor,
  ] = useState(false);

  const [
    showAvailabilityEditor,
    setShowAvailabilityEditor,
  ] = useState(false);

  type DashboardView =
    | "dashboard"
    | "profile"
    | "availability"
    | "sessions"
    | "services";

  const [
    activeView,
    setActiveView,
  ] = useState<DashboardView>(
    "dashboard",
  );

  const text =
    language === "ar"
      ? {
          profileTitle:
            "الملف المهني للمختص",

          profileDescription:
            "أكمل معلوماتك المهنية باللغة التي تفضلها. ستقوم المنصة بإنشاء النسخ الإنجليزية والفرنسية والعربية تلقائياً عند الحفظ.",

          basic:
            "الصورة والمعلومات الأساسية",

          choosePhoto:
            "اختيار صورة",

          photoHelp:
            "JPG أو PNG أو WebP، بحد أقصى 5 ميغابايت.",

          photoAlt:
            "صورة المختص",

          fullName:
            "الاسم الكامل",

          professionalTitle:
            "المسمى المهني",

          professionalTitlePlaceholder:
            "مثال: معالج نفسي سريري",

          specialty:
            "التخصص",

          specialtyPlaceholder:
            "مثال: العلاج النفسي التكاملي",

          experience:
            "سنوات الخبرة",

          biographySection:
            "التعريف والخبرة المهنية",

          biography:
            "نبذة مهنية",

          biographyPlaceholder:
            "اكتب نبذة مفصلة عن خبرتك والفئات التي تعمل معها والمجالات التي تدعمها.",

          education:
            "التعليم والمؤهلات",

          educationPlaceholder:
            "مثال: ماجستير في علم النفس السريري...",

          certifications:
            "التدريبات والشهادات",

          certificationsPlaceholder:
            "اكتب كل تدريب أو شهادة في سطر منفصل.",

          approach:
            "النهج العلاجي",

          approachPlaceholder:
            "اشرح أسلوبك العلاجي وكيف تعمل مع العملاء.",

          servicesLanguages:
            "الخدمات واللغات",

          services:
            "الخدمات",

          servicesPlaceholder:
            "اكتب كل خدمة في سطر منفصل.",

          languages:
            "اللغات",

          languagesPlaceholder:
            "اكتب كل لغة في سطر منفصل.",

          sessionPrice:
            "سعر الجلسة",

          adminPrice:
            "يتم تحديد السعر بواسطة الإدارة.",

          save:
            "حفظ الملف المهني",

          saving:
            "جارٍ الحفظ والترجمة...",

          saved:
            "تم حفظ الملف وترجمته بنجاح إلى اللغات الثلاث.",

          saveError:
            "تعذر حفظ الملف الشخصي.",

          translationError:
            "تعذر إنشاء الترجمات تلقائياً. لم يتم حفظ الملف لتجنب عرض ترجمات غير مكتملة.",

          fullNameRequired:
            "يرجى إدخال الاسم الكامل.",

          professionalTitleRequired:
            "يرجى إدخال المسمى المهني.",

          specialtyRequired:
            "يرجى إدخال التخصص.",

          experienceInvalid:
            "يرجى إدخال عدد صحيح صالح لسنوات الخبرة.",

          loginRequired:
            "يجب تسجيل الدخول.",

          availability:
            "المواعيد المتاحة",

          addAvailability:
            "إضافة موعد",

          chooseDateTime:
            "يرجى اختيار التاريخ والوقت.",

          addAvailabilityError:
            "تعذرت إضافة الموعد.",

          noAvailability:
            "لا توجد مواعيد متاحة.",

          delete:
            "حذف",

          deleteConfirm:
            "هل تريد حذف هذا الموعد؟",

          deleteError:
            "تعذر حذف الموعد.",

          bookedSessions:
            "الجلسات المحجوزة",

          noBookings:
            "لا توجد حجوزات مدفوعة بعد.",

          price:
            "السعر",

          patientEmail:
            "بريد المريض",

          unknown:
            "غير معروف",

          status:
            "الحالة",

          created:
            "تم الإنشاء",

          startSession:
            "بدء الجلسة",

          meetingNotReady:
            "رابط الجلسة غير جاهز",

          requestReschedule:
            "طلب تغيير الموعد",

          cancelSession:
            "إلغاء الجلسة",

          rescheduleConfirm:
            "سيتم إرسال رسالة إلى المريض لطلب اختيار موعد جديد. هل تريد المتابعة؟",

          cancelSessionConfirm:
            "سيتم إلغاء الجلسة وطلب ردّ المبلغ للمريض مع إرسال إشعار بالبريد الإلكتروني. هل تريد المتابعة؟",

          actionSuccessReschedule:
            "تم إرسال طلب تغيير الموعد إلى المريض.",

          actionSuccessCancel:
            "تم إرسال طلب إلغاء الجلسة واسترداد المبلغ.",

          actionError:
            "تعذر تنفيذ هذا الإجراء.",

          sessionDate:
            "تاريخ الجلسة",

          sessionPast:
            "جلسة سابقة",

          therapistTimeZone:
            "توقيت لبنان · Asia/Beirut",
        }
      : language === "fr"
        ? {
            profileTitle:
              "Profil professionnel du spécialiste",

            profileDescription:
              "Complétez vos informations professionnelles dans la langue de votre choix. La plateforme générera automatiquement les versions française, anglaise et arabe lors de l’enregistrement.",

            basic:
              "Photo et informations principales",

            choosePhoto:
              "Choisir une photo",

            photoHelp:
              "JPG, PNG ou WebP, maximum 5 Mo.",

            photoAlt:
              "Photo du spécialiste",

            fullName:
              "Nom complet",

            professionalTitle:
              "Titre professionnel",

            professionalTitlePlaceholder:
              "Exemple : Psychothérapeute clinicien",

            specialty:
              "Spécialité",

            specialtyPlaceholder:
              "Exemple : Psychothérapie intégrative",

            experience:
              "Années d’expérience",

            biographySection:
              "Biographie et expérience professionnelle",

            biography:
              "Biographie professionnelle",

            biographyPlaceholder:
              "Décrivez votre expérience, les personnes que vous accompagnez et vos principaux domaines d’intervention.",

            education:
              "Formation et qualifications",

            educationPlaceholder:
              "Exemple : Master en psychologie clinique...",

            certifications:
              "Formations et certifications",

            certificationsPlaceholder:
              "Saisissez chaque formation ou certification sur une ligne séparée.",

            approach:
              "Approche thérapeutique",

            approachPlaceholder:
              "Expliquez votre approche et votre manière d’accompagner vos clients.",

            servicesLanguages:
              "Services et langues",

            services:
              "Services",

            servicesPlaceholder:
              "Saisissez un service par ligne.",

            languages:
              "Langues",

            languagesPlaceholder:
              "Saisissez une langue par ligne.",

            sessionPrice:
              "Prix de la séance",

            adminPrice:
              "Le prix est géré par l’administration.",

            save:
              "Enregistrer le profil professionnel",

            saving:
              "Enregistrement et traduction...",

            saved:
              "Le profil a été enregistré et traduit avec succès dans les trois langues.",

            saveError:
              "Impossible d’enregistrer le profil.",

            translationError:
              "La traduction automatique n’a pas pu être effectuée. Le profil n’a pas été enregistré afin d’éviter des traductions incomplètes.",

            fullNameRequired:
              "Veuillez saisir votre nom complet.",

            professionalTitleRequired:
              "Veuillez saisir votre titre professionnel.",

            specialtyRequired:
              "Veuillez saisir votre spécialité.",

            experienceInvalid:
              "Veuillez saisir un nombre entier valide d’années d’expérience.",

            loginRequired:
              "Vous devez être connecté.",

            availability:
              "Disponibilités",

            addAvailability:
              "Ajouter une disponibilité",

            chooseDateTime:
              "Veuillez choisir une date et une heure.",

            addAvailabilityError:
              "Impossible d’ajouter la disponibilité.",

            noAvailability:
              "Aucune disponibilité pour le moment.",

            delete:
              "Supprimer",

            deleteConfirm:
              "Supprimer cette disponibilité ?",

            deleteError:
              "Impossible de supprimer la disponibilité.",

            bookedSessions:
              "Séances réservées",

            noBookings:
              "Aucune réservation payée pour le moment.",

            price:
              "Prix",

            patientEmail:
              "E-mail du patient",

            unknown:
              "Inconnu",

            status:
              "Statut",

            created:
              "Créé le",

            startSession:
              "Démarrer la séance",

            meetingNotReady:
              "Lien de séance non disponible",

            requestReschedule:
              "Demander un changement",

            cancelSession:
              "Annuler la séance",

            rescheduleConfirm:
              "Le patient recevra un e-mail lui demandant de choisir un nouveau créneau. Continuer ?",

            cancelSessionConfirm:
              "La séance sera annulée, le remboursement sera demandé et le patient recevra un e-mail. Continuer ?",

            actionSuccessReschedule:
              "La demande de changement a été envoyée au patient.",

            actionSuccessCancel:
              "La demande d’annulation et de remboursement a été envoyée.",

            actionError:
              "Impossible d’effectuer cette action.",

            sessionDate:
              "Date de la séance",

            sessionPast:
              "Séance passée",

            therapistTimeZone:
              "Heure du Liban · Asia/Beirut",
          }
        : {
            profileTitle:
              "Professional Specialist Profile",

            profileDescription:
              "Complete your professional information in your preferred language. The platform will automatically generate English, French and Arabic versions when you save.",

            basic:
              "Photo and Basic Information",

            choosePhoto:
              "Choose Profile Photo",

            photoHelp:
              "JPG, PNG or WebP, maximum 5 MB.",

            photoAlt:
              "Specialist photo",

            fullName:
              "Full name",

            professionalTitle:
              "Professional title",

            professionalTitlePlaceholder:
              "Example: Clinical Psychotherapist",

            specialty:
              "Specialty",

            specialtyPlaceholder:
              "Example: Integrative psychotherapy",

            experience:
              "Years of experience",

            biographySection:
              "Biography and Professional Experience",

            biography:
              "Professional biography",

            biographyPlaceholder:
              "Describe your experience, the people you work with and your main areas of support.",

            education:
              "Education and qualifications",

            educationPlaceholder:
              "Example: Master's degree in Clinical Psychology...",

            certifications:
              "Training and certifications",

            certificationsPlaceholder:
              "Enter each training or certification on a separate line.",

            approach:
              "Therapeutic approach",

            approachPlaceholder:
              "Explain your therapeutic style and how you work with clients.",

            servicesLanguages:
              "Services and Languages",

            services:
              "Services",

            servicesPlaceholder:
              "Enter one service per line.",

            languages:
              "Languages",

            languagesPlaceholder:
              "Enter one language per line.",

            sessionPrice:
              "Session Price",

            adminPrice:
              "Price managed by the administrator.",

            save:
              "Save Professional Profile",

            saving:
              "Saving and translating...",

            saved:
              "Profile saved and translated successfully into all three languages.",

            saveError:
              "Unable to save the profile.",

            translationError:
              "Automatic translation could not be completed. The profile was not saved to avoid incomplete translations.",

            fullNameRequired:
              "Please enter your full name.",

            professionalTitleRequired:
              "Please enter your professional title.",

            specialtyRequired:
              "Please enter your specialty.",

            experienceInvalid:
              "Please enter a valid whole number of experience years.",

            loginRequired:
              "You must be logged in.",

            availability:
              "Availability",

            addAvailability:
              "Add Availability",

            chooseDateTime:
              "Please choose a date and time.",

            addAvailabilityError:
              "Unable to add availability.",

            noAvailability:
              "No availability yet.",

            delete:
              "Delete",

            deleteConfirm:
              "Delete this availability?",

            deleteError:
              "Unable to delete the availability.",

            bookedSessions:
              "Booked Sessions",

            noBookings:
              "No paid bookings yet.",

            price:
              "Price",

            patientEmail:
              "Patient Email",

            unknown:
              "Unknown",

            status:
              "Status",

            created:
              "Created",

            startSession:
              "Start Session",

            meetingNotReady:
              "Session link not ready",

            requestReschedule:
              "Request reschedule",

            cancelSession:
              "Cancel session",

            rescheduleConfirm:
              "The patient will receive an email asking them to choose a new available slot. Continue?",

            cancelSessionConfirm:
              "The session will be cancelled, a refund will be requested, and the patient will receive an email. Continue?",

            actionSuccessReschedule:
              "The reschedule request was sent to the patient.",

            actionSuccessCancel:
              "The cancellation and refund request was sent.",

            actionError:
              "Unable to perform this action.",

            sessionDate:
              "Session date",

            sessionPast:
              "Past session",

            therapistTimeZone:
              "Lebanon time · Asia/Beirut",
          };

  /*
   * Chargement initial des disponibilités
   * et des réservations.
   */
  useEffect(() => {
    void getSlots();
    void getBookings();
    void getTherapistServices();
    void getGoogleConnection();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search,
    );

    const googleStatus =
      params.get("google");

    if (!googleStatus) {
      return;
    }

    const message =
      googleStatus === "connected"
        ? language === "ar"
          ? "تم ربط حساب Google بنجاح."
          : language === "fr"
            ? "Votre compte Google a été connecté avec succès."
            : "Your Google account was connected successfully."
        : googleStatus === "denied"
          ? language === "ar"
            ? "تم إلغاء ربط حساب Google."
            : language === "fr"
              ? "La connexion à Google a été annulée."
              : "Google connection was cancelled."
          : language === "ar"
            ? "تعذر ربط حساب Google. يرجى المحاولة مرة أخرى."
            : language === "fr"
              ? "Impossible de connecter le compte Google. Veuillez réessayer."
              : "Unable to connect the Google account. Please try again.";

    window.alert(message);

    if (googleStatus === "connected") {
      void getGoogleConnection();
    }

    params.delete("google");

    const cleanQuery =
      params.toString();

    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}${
        cleanQuery
          ? `?${cleanQuery}`
          : ""
      }${window.location.hash}`,
    );
  }, [language]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 15_000);

    return () => window.clearInterval(timer);
  }, []);

  /*
   * Recharge le contenu du profil
   * chaque fois que la langue de
   * l'interface change.
   */
  useEffect(() => {
    void getProfile();
  }, [language]);

  useEffect(() => {
    return () => {
      if (
        photoPreview.startsWith(
          "blob:",
        )
      ) {
        URL.revokeObjectURL(
          photoPreview,
        );
      }
    };
  }, [photoPreview]);

  const getCurrentUser =
    async () => {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      return user;
    };

  const syncTherapistServices =
    async () => {
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
        !session
      ) {
        throw new Error(
          text.loginRequired,
        );
      }

      const response =
        await fetch(
          "/api/therapist-services/sync",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${session.access_token}`,
            },
          },
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Unable to configure therapist services.",
        );
      }

      return result;
    };

  const getTherapistServices =
    async () => {
      const user =
        await getCurrentUser();

      if (!user) {
        setTherapistServices(
          [],
        );
        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from(
          "therapist_services",
        )
        .select(
          `
            id,
            therapist_id,
            service_type,
            price,
            duration_minutes,
            price_per_participant,
            min_participants,
            max_participants,
            is_active
          `,
        )
        .eq(
          "therapist_id",
          user.id,
        )
        .order(
          "service_type",
          {
            ascending: true,
          },
        );

      if (error) {
        console.error(
          "Therapist services error:",
          error,
        );

        setTherapistServices(
          [],
        );
        return;
      }

      const serviceOrder:
        Record<
          TherapistService["service_type"],
          number
        > = {
          individual: 1,
          couples: 2,
          family: 3,
          group: 4,
        };

      const normalized =
        (
          data as
            | TherapistService[]
            | null
        ) || [];

      setTherapistServices(
        [...normalized].sort(
          (
            a,
            b,
          ) =>
            serviceOrder[
              a.service_type
            ] -
            serviceOrder[
              b.service_type
            ],
        ),
      );
    };

  const getServiceLabel = (
    serviceType:
      TherapistService["service_type"],
  ) => {
    if (
      language === "ar"
    ) {
      return serviceType ===
        "individual"
        ? "فردية"
        : serviceType ===
            "couples"
          ? "زوجية"
          : serviceType ===
              "family"
            ? "عائلية"
            : "جماعية";
    }

    if (
      language === "fr"
    ) {
      return serviceType ===
        "individual"
        ? "Individuelle"
        : serviceType ===
            "couples"
          ? "Couple"
          : serviceType ===
              "family"
            ? "Famille"
            : "Groupe";
    }

    return serviceType ===
      "individual"
      ? "Individual"
      : serviceType ===
          "couples"
        ? "Couples"
        : serviceType ===
            "family"
          ? "Family"
          : "Group";
  };

  const formatServicePrice = (
    service:
      TherapistService,
  ) => {
    const locale =
      language === "ar"
        ? "ar-LB"
        : language === "fr"
          ? "fr-FR"
          : "en-US";

    const amount =
      new Intl.NumberFormat(
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
        service.price,
      );

    if (
      service.price_per_participant
    ) {
      return language === "ar"
        ? `${amount} / مشارك`
        : language === "fr"
          ? `${amount} / participant`
          : `${amount} / participant`;
    }

    return amount;
  };

  const getInitial = () =>
    fullName
      .trim()
      .charAt(0)
      .toUpperCase() || "A";

  const formatDate = (
    date: string | null,
  ) => {
    if (!date) {
      return language === "ar"
        ? "لا يوجد تاريخ"
        : language === "fr"
          ? "Aucune date"
          : "No date";
    }

    return new Date(
      `${date}T12:00:00`,
    ).toLocaleDateString(
      language === "ar"
        ? "ar-LB"
        : language === "fr"
          ? "fr-FR"
          : "en-US",
      {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric",
      },
    );
  };

  const getDayFromDate = (
    date: string,
  ) =>
    new Date(
      `${date}T12:00:00`,
    ).toLocaleDateString(
      "en-US",
      {
        weekday: "long",
      },
    );

  const getProfile =
    async () => {
      const user =
        await getCurrentUser();

      if (!user) {
        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from("therapists")
        .select(
          `
            full_name,
            full_name_ar,

            specialty,
            specialty_fr,
            specialty_ar,

            professional_title,
            professional_title_fr,
            professional_title_ar,

            experience_years,

            bio,
            bio_fr,
            bio_ar,

            education,
            education_fr,
            education_ar,

            certifications,
            certifications_fr,
            certifications_ar,

            therapeutic_approach,
            therapeutic_approach_fr,
            therapeutic_approach_ar,

            languages,
            languages_fr,
            languages_ar,

            price,
            photo_url
          `,
        )
        .eq("id", user.id)
        .single<TherapistProfile>();

      if (error) {
        console.error(
          "Profile error:",
          error,
        );

        return;
      }

      if (!data) {
        return;
      }

      /*
       * Le formulaire est automatiquement
       * rempli dans la langue actuellement
       * sélectionnée.
       */
      if (language === "ar") {
        setFullName(
          data.full_name_ar ||
            data.full_name ||
            "",
        );

        setProfessionalTitle(
          data.professional_title_ar ||
            data.professional_title ||
            "",
        );

        setSpecialty(
          data.specialty_ar ||
            data.specialty ||
            "",
        );

        setBio(
          data.bio_ar ||
            data.bio ||
            "",
        );

        setEducation(
          data.education_ar ||
            data.education ||
            "",
        );

        setCertifications(
          data.certifications_ar ||
            data.certifications ||
            "",
        );

        setTherapeuticApproach(
          data.therapeutic_approach_ar ||
            data.therapeutic_approach ||
            "",
        );

        setLanguages(
          data.languages_ar ||
            data.languages ||
            "",
        );
      } else if (
        language === "fr"
      ) {
        setFullName(
          data.full_name || "",
        );

        setProfessionalTitle(
          data.professional_title_fr ||
            data.professional_title ||
            "",
        );

        setSpecialty(
          data.specialty_fr ||
            data.specialty ||
            "",
        );

        setBio(
          data.bio_fr ||
            data.bio ||
            "",
        );

        setEducation(
          data.education_fr ||
            data.education ||
            "",
        );

        setCertifications(
          data.certifications_fr ||
            data.certifications ||
            "",
        );

        setTherapeuticApproach(
          data.therapeutic_approach_fr ||
            data.therapeutic_approach ||
            "",
        );

        setLanguages(
          data.languages_fr ||
            data.languages ||
            "",
        );
      } else {
        setFullName(
          data.full_name || "",
        );

        setProfessionalTitle(
          data.professional_title ||
            "",
        );

        setSpecialty(
          data.specialty || "",
        );

        setBio(
          data.bio || "",
        );

        setEducation(
          data.education || "",
        );

        setCertifications(
          data.certifications ||
            "",
        );

        setTherapeuticApproach(
          data.therapeutic_approach ||
            "",
        );

        setLanguages(
          data.languages || "",
        );
      }

      setExperienceYears(
        data.experience_years?.toString() ||
          "",
      );

      setPhotoUrl(
        data.photo_url || "",
      );
    };
      const handlePhotoChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile =
      event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    if (
      !selectedFile.type.startsWith(
        "image/",
      )
    ) {
      alert(
        language === "ar"
          ? "يرجى اختيار ملف صورة."
          : language === "fr"
            ? "Veuillez sélectionner une image."
            : "Please select an image file.",
      );

      event.target.value = "";
      return;
    }

    if (
      selectedFile.size >
      MAX_PHOTO_SIZE
    ) {
      alert(
        language === "ar"
          ? "يجب ألا يتجاوز حجم الصورة 5 ميغابايت."
          : language === "fr"
            ? "La photo doit faire moins de 5 Mo."
            : "The photo must be smaller than 5 MB.",
      );

      event.target.value = "";
      return;
    }

    if (
      photoPreview.startsWith(
        "blob:",
      )
    ) {
      URL.revokeObjectURL(
        photoPreview,
      );
    }

    setPhotoFile(
      selectedFile,
    );

    setPhotoPreview(
      URL.createObjectURL(
        selectedFile,
      ),
    );
  };

  const uploadProfilePhoto =
    async (
      userId: string,
    ) => {
      if (!photoFile) {
        return (
          photoUrl || null
        );
      }

      setUploadingPhoto(true);

      try {
        const extension =
          photoFile.name
            .split(".")
            .pop()
            ?.toLowerCase() ||
          "jpg";

        const filePath =
          `${userId}/profile-${Date.now()}.${extension}`;

        const {
          error: uploadError,
        } =
          await supabase.storage
            .from(
              "therapist-photos",
            )
            .upload(
              filePath,
              photoFile,
              {
                cacheControl:
                  "3600",

                upsert:
                  false,

                contentType:
                  photoFile.type,
              },
            );

        if (uploadError) {
          throw uploadError;
        }

        const {
          data: {
            publicUrl,
          },
        } =
          supabase.storage
            .from(
              "therapist-photos",
            )
            .getPublicUrl(
              filePath,
            );

        return publicUrl;
      } finally {
        setUploadingPhoto(
          false,
        );
      }
    };

  const requestTranslation =
    async (
      sourceLanguage: Language,
      targetLanguage: Language,
      fields: TranslationFields,
    ) => {
      if (
        sourceLanguage ===
        targetLanguage
      ) {
        return fields;
      }

      const response =
        await fetch(
          "/api/translate-content",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                sourceLanguage,
                targetLanguage,
                fields,
              }),
          },
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.translations
      ) {
        throw new Error(
          result.error ||
            "Translation failed.",
        );
      }

      return result.translations as TranslationFields;
    };

  const saveProfile =
    async () => {
      if (
        !fullName.trim()
      ) {
        alert(
          text.fullNameRequired,
        );
        return;
      }

      if (
        !professionalTitle.trim()
      ) {
        alert(
          text.professionalTitleRequired,
        );
        return;
      }

      if (
        !specialty.trim()
      ) {
        alert(
          text.specialtyRequired,
        );
        return;
      }

      const parsedExperience =
        experienceYears.trim()
          ? Number(
              experienceYears,
            )
          : null;

      if (
        parsedExperience !==
          null &&
        (!Number.isInteger(
          parsedExperience,
        ) ||
          parsedExperience <
            0 ||
          parsedExperience >
            80)
      ) {
        alert(
          text.experienceInvalid,
        );
        return;
      }

      setLoading(true);
      setTranslating(true);

      try {
        const user =
          await getCurrentUser();

        if (!user) {
          alert(
            text.loginRequired,
          );

          return;
        }

        const uploadedPhotoUrl =
          await uploadProfilePhoto(
            user.id,
          );

        /*
         * Tous les champs saisis sont considérés
         * comme étant dans la langue active.
         */
        const sourceFields: TranslationFields =
          {
            fullName:
              fullName.trim(),

            professionalTitle:
              professionalTitle.trim(),

            specialty:
              specialty.trim(),

            bio:
              bio.trim(),

            education:
              education.trim(),

            certifications:
              certifications.trim(),

            therapeuticApproach:
              therapeuticApproach.trim(),

            languages:
              languages.trim(),
          };

        const normalizeTranslation = (
          translated: TranslationFields,
        ): TranslationFields => ({
          fullName:
            translated.fullName ??
            "",

          professionalTitle:
            translated.professionalTitle ??
            "",

          specialty:
            translated.specialty ??
            "",

          bio:
            translated.bio ??
            "",

          education:
            translated.education ??
            "",

          certifications:
            translated.certifications ??
            "",

          therapeuticApproach:
            translated.therapeuticApproach ??
            "",

          languages:
            translated.languages ??
            "",
        });

        let englishFields: TranslationFields;
        let frenchFields: TranslationFields;
        let arabicFields: TranslationFields;

        if (language === "en") {
          englishFields =
            normalizeTranslation(
              sourceFields,
            );

          const [
            frenchTranslation,
            arabicTranslation,
          ] = await Promise.all([
            requestTranslation(
              "en",
              "fr",
              sourceFields,
            ),

            requestTranslation(
              "en",
              "ar",
              sourceFields,
            ),
          ]);

          frenchFields =
            normalizeTranslation(
              frenchTranslation,
            );

          arabicFields =
            normalizeTranslation(
              arabicTranslation,
            );
        } else if (
          language === "fr"
        ) {
          frenchFields =
            normalizeTranslation(
              sourceFields,
            );

          const [
            englishTranslation,
            arabicTranslation,
          ] = await Promise.all([
            requestTranslation(
              "fr",
              "en",
              sourceFields,
            ),

            requestTranslation(
              "fr",
              "ar",
              sourceFields,
            ),
          ]);

          englishFields =
            normalizeTranslation(
              englishTranslation,
            );

          arabicFields =
            normalizeTranslation(
              arabicTranslation,
            );
        } else {
          arabicFields =
            normalizeTranslation(
              sourceFields,
            );

          const [
            englishTranslation,
            frenchTranslation,
          ] = await Promise.all([
            requestTranslation(
              "ar",
              "en",
              sourceFields,
            ),

            requestTranslation(
              "ar",
              "fr",
              sourceFields,
            ),
          ]);

          englishFields =
            normalizeTranslation(
              englishTranslation,
            );

          frenchFields =
            normalizeTranslation(
              frenchTranslation,
            );
        }

        /*
         * Nom :
         *
         * - full_name = version latine principale
         * - full_name_ar = translittération arabe
         *
         * Pas besoin de full_name_fr.
         */
        const latinFullName =
          language === "ar"
            ? englishFields.fullName ||
              fullName.trim()
            : fullName.trim();

        const arabicFullName =
          language === "ar"
            ? fullName.trim()
            : arabicFields.fullName ||
              "";

        const {
          error,
        } = await supabase
          .from("therapists")
          .update({
            full_name:
              latinFullName,

            full_name_ar:
              arabicFullName,

            professional_title:
              englishFields.professionalTitle,

            professional_title_fr:
              frenchFields.professionalTitle,

            professional_title_ar:
              arabicFields.professionalTitle,

            specialty:
              englishFields.specialty,

            specialty_fr:
              frenchFields.specialty,

            specialty_ar:
              arabicFields.specialty,

            experience_years:
              parsedExperience,

            bio:
              englishFields.bio,

            bio_fr:
              frenchFields.bio,

            bio_ar:
              arabicFields.bio,

            education:
              englishFields.education,

            education_fr:
              frenchFields.education,

            education_ar:
              arabicFields.education,

            certifications:
              englishFields.certifications,

            certifications_fr:
              frenchFields.certifications,

            certifications_ar:
              arabicFields.certifications,

            therapeutic_approach:
              englishFields.therapeuticApproach,

            therapeutic_approach_fr:
              frenchFields.therapeuticApproach,

            therapeutic_approach_ar:
              arabicFields.therapeuticApproach,

            languages:
              englishFields.languages,

            languages_fr:
              frenchFields.languages,

            languages_ar:
              arabicFields.languages,

            photo_url:
              uploadedPhotoUrl,
          })
          .eq(
            "id",
            user.id,
          );

        if (error) {
          throw error;
        }

        /*
         * Les tarifs/services sont configurés côté serveur
         * à partir de experience_years.
         *
         * L'API crée uniquement les services manquants :
         * elle n'écrase jamais un tarif déjà personnalisé
         * par l'administration.
         */
        if (parsedExperience !== null) {
          await syncTherapistServices();
          await getTherapistServices();
        }

        setPhotoUrl(
          uploadedPhotoUrl ||
            "",
        );

        setPhotoFile(null);

        if (
          photoPreview.startsWith(
            "blob:",
          )
        ) {
          URL.revokeObjectURL(
            photoPreview,
          );
        }

        setPhotoPreview("");

        alert(
          text.saved,
        );

        await getProfile();
      } catch (error) {
        console.error(
          "Profile save/translation error:",
          error,
        );

        alert(
          error instanceof Error &&
            error.message
              .toLowerCase()
              .includes(
                "translation",
              )
            ? text.translationError
            : text.saveError,
        );
      } finally {
        setLoading(false);
        setUploadingPhoto(
          false,
        );
        setTranslating(false);
      }
    };

  const getSlots =
    async () => {
      const user =
        await getCurrentUser();

      if (!user) {
        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from(
          "availability_slots",
        )
        .select("*")
        .eq(
          "therapist_id",
          user.id,
        )
        .order(
          "slot_date",
          {
            ascending: true,
          },
        )
        .order("time", {
          ascending: true,
        });

      if (error) {
        console.error(
          "Slots error:",
          error,
        );

        return;
      }

      setSlots(
        (data as AvailabilitySlot[]) ||
          [],
      );
    };

  const addSlot =
    async () => {
      if (
        !slotDate ||
        !time
      ) {
        alert(
          text.chooseDateTime,
        );
        return;
      }

      const user =
        await getCurrentUser();

      if (!user) {
        return;
      }

      const {
        error,
      } = await supabase
        .from(
          "availability_slots",
        )
        .insert({
          therapist_id:
            user.id,

          slot_date:
            slotDate,

          day:
            getDayFromDate(
              slotDate,
            ),

          time,

          is_booked: false,
        });

      if (error) {
        console.error(
          "Availability creation error:",
          error,
        );

        alert(
          text.addAvailabilityError,
        );

        return;
      }

      setSlotDate("");
      setTime("");

      await getSlots();
    };

  const deleteSlot =
    async (
      id: string,
    ) => {
      const confirmed =
        window.confirm(
          text.deleteConfirm,
        );

      if (!confirmed) {
        return;
      }

      const {
        error,
      } = await supabase
        .from(
          "availability_slots",
        )
        .delete()
        .eq("id", id);

      if (error) {
        console.error(
          "Slot deletion error:",
          error,
        );

        alert(
          text.deleteError,
        );

        return;
      }

      await getSlots();
    };

  const getBookings =
    async () => {
      const user =
        await getCurrentUser();

      if (!user) {
        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from("bookings")
        .select("*")
        .eq(
          "therapist_id",
          user.id,
        )
        .eq(
          "status",
          "paid",
        )
        .order(
          "created_at",
          {
            ascending: false,
          },
        );

      if (error) {
        console.error(
          "Bookings error:",
          error,
        );

        return;
      }

      setBookings(
        (data as Booking[]) ||
          [],
      );
    };


  const formatBookingSessionDate = (
    booking: Booking,
  ) => {
    if (!booking.scheduled_start) {
      return booking.slot_day;
    }

    const value =
      new Date(
        booking.scheduled_start,
      );

    if (
      Number.isNaN(
        value.getTime(),
      )
    ) {
      return booking.slot_day;
    }

    return new Intl.DateTimeFormat(
      language === "ar"
        ? "ar-LB"
        : language === "fr"
          ? "fr-FR"
          : "en-GB",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Beirut",
      },
    ).format(value);
  };

  const formatBookingSessionTime = (
    booking: Booking,
  ) => {
    if (!booking.scheduled_start) {
      return booking.slot_time;
    }

    const value =
      new Date(
        booking.scheduled_start,
      );

    if (
      Number.isNaN(
        value.getTime(),
      )
    ) {
      return booking.slot_time;
    }

    return new Intl.DateTimeFormat(
      language === "ar"
        ? "ar-LB"
        : language === "fr"
          ? "fr-FR"
          : "en-GB",
      {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Beirut",
      },
    ).format(value);
  };

  const isPastBooking = (
    booking: Booking,
  ) => {
    if (!booking.scheduled_start) {
      return false;
    }

    const value =
      new Date(
        booking.scheduled_start,
      ).getTime();

    if (Number.isNaN(value)) {
      return false;
    }

    return value < nowMs;
  };


  const getGoogleConnection =
    async () => {
      setGoogleStatusLoading(true);

      try {
        const {
          data: {
            session,
          },
        } =
          await supabase.auth.getSession();

        if (!session) {
          setGoogleConnection({
            connected: false,
            email: null,
          });

          return;
        }

        const response =
          await fetch(
            "/api/google-calendar/status",
            {
              method: "GET",
              headers: {
                Authorization:
                  `Bearer ${session.access_token}`,
              },
            },
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result?.error ||
              "Unable to load Google connection.",
          );
        }

        setGoogleConnection({
          connected:
            Boolean(result.connected),
          email:
            result.googleEmail ||
            null,
        });
      } catch (error) {
        console.error(
          "Google status error:",
          error,
        );

        setGoogleConnection({
          connected: false,
          email: null,
        });
      } finally {
        setGoogleStatusLoading(
          false,
        );
      }
    };


  const disconnectGoogleCalendar =
    async () => {
      const confirmed =
        window.confirm(
          language === "ar"
            ? "هل تريد فصل حساب Google عن Platform Aan؟"
            : language === "fr"
              ? "Déconnecter ce compte Google de Platform Aan ?"
              : "Disconnect this Google account from Platform Aan?",
        );

      if (!confirmed) {
        return;
      }

      setDisconnectingGoogle(
        true,
      );

      try {
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
          !session
        ) {
          alert(
            text.loginRequired,
          );

          return;
        }

        const response =
          await fetch(
            "/api/google-calendar/disconnect",
            {
              method: "POST",
              headers: {
                Authorization:
                  `Bearer ${session.access_token}`,
              },
            },
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result?.error ||
              "Unable to disconnect Google.",
          );
        }

        setGoogleConnection({
          connected: false,
          email: null,
        });

        alert(
          language === "ar"
            ? "تم فصل حساب Google."
            : language === "fr"
              ? "Le compte Google a été déconnecté."
              : "Google account disconnected.",
        );
      } catch (error) {
        console.error(
          "Google disconnect error:",
          error,
        );

        alert(
          language === "ar"
            ? "تعذر فصل حساب Google."
            : language === "fr"
              ? "Impossible de déconnecter le compte Google."
              : "Unable to disconnect the Google account.",
        );
      } finally {
        setDisconnectingGoogle(
          false,
        );
      }
    };


  const connectGoogleCalendar =
    async () => {
      setConnectingGoogle(true);

      try {
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
          !session
        ) {
          alert(
            text.loginRequired,
          );

          window.location.href =
            "/login";

          return;
        }

        const response =
          await fetch(
            "/api/google-calendar/connect",
            {
              method: "GET",
              headers: {
                Authorization:
                  `Bearer ${session.access_token}`,
              },
            },
          );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.authorizationUrl
        ) {
          throw new Error(
            result?.error ||
              "Unable to start Google connection.",
          );
        }

        window.location.href =
          result.authorizationUrl;
      } catch (error) {
        console.error(
          "Google Calendar connection error:",
          error,
        );

        alert(
          language === "ar"
            ? "تعذر بدء الاتصال بـ Google. يرجى المحاولة مرة أخرى."
            : language === "fr"
              ? "Impossible de démarrer la connexion à Google. Veuillez réessayer."
              : "Unable to start the Google connection. Please try again.",
        );
      } finally {
        setConnectingGoogle(
          false,
        );
      }
    };


  const runBookingAction =
    async (
      booking: Booking,
      action:
        | "request_reschedule"
        | "cancel_and_refund",
    ) => {
      const confirmation =
        window.confirm(
          action ===
            "request_reschedule"
            ? text.rescheduleConfirm
            : text.cancelSessionConfirm,
        );

      if (!confirmation) {
        return;
      }

      setBookingActionId(
        booking.id,
      );

      try {
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
          !session
        ) {
          alert(
            text.loginRequired,
          );

          window.location.href =
            "/login";

          return;
        }

        const response =
          await fetch(
            "/api/booking/therapist-action",
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
                  bookingId:
                    booking.id,

                  action,

                  language,
                }),
            },
          );

        const result =
          await response.json();

        if (!response.ok) {
          alert(
            result.error ||
              text.actionError,
          );

          return;
        }

        alert(
          action ===
            "request_reschedule"
            ? text.actionSuccessReschedule
            : text.actionSuccessCancel,
        );

        await getBookings();
        await getSlots();
      } catch (error) {
        console.error(
          "Booking action error:",
          error,
        );

        alert(
          text.actionError,
        );
      } finally {
        setBookingActionId(
          null,
        );
      }
    };

  const getBeirutNowKey = () => {
    const parts =
      new Intl.DateTimeFormat(
        "en-CA",
        {
          timeZone:
            "Asia/Beirut",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        },
      ).formatToParts(
        new Date(nowMs),
      );

    const values =
      Object.fromEntries(
        parts.map((part) => [
          part.type,
          part.value,
        ]),
      );

    return `${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute}`;
  };

  const futureSlots =
    slots.filter((slot) => {
      if (!slot.slot_date) {
        return true;
      }

      return `${slot.slot_date} ${slot.time}` >=
        getBeirutNowKey();
    });

  const displayedSlots =
    showAllSlots
      ? futureSlots
      : futureSlots.slice(0, 3);

  const upcomingBookings = bookings
    .filter(
      (booking) =>
        !isPastBooking(booking),
    )
    .sort((a, b) => {
      const aTime =
        a.scheduled_start
          ? new Date(a.scheduled_start).getTime()
          : Number.MAX_SAFE_INTEGER;

      const bTime =
        b.scheduled_start
          ? new Date(b.scheduled_start).getTime()
          : Number.MAX_SAFE_INTEGER;

      return aTime - bTime;
    });

  const pastBookings = bookings
    .filter((booking) =>
      isPastBooking(booking),
    )
    .sort((a, b) => {
      const aTime =
        a.scheduled_start
          ? new Date(a.scheduled_start).getTime()
          : 0;

      const bTime =
        b.scheduled_start
          ? new Date(b.scheduled_start).getTime()
          : 0;

      return bTime - aTime;
    });

  const displayedUpcomingBookings =
    showAllUpcomingBookings
      ? upcomingBookings
      : upcomingBookings.slice(0, 3);

  const displayedPhoto =
    photoPreview ||
    photoUrl;

  const isSaving =
    loading ||
    uploadingPhoto ||
    translating;
      return (
    <ProtectedRoute
      allowedRoles={[
        "therapist",
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
          className="min-h-screen bg-aan-background"
        >
          <div className="mx-auto flex max-w-[1500px]">
            <aside className="sticky top-0 hidden h-[calc(100vh-1px)] w-64 shrink-0 border-r border-aan-border bg-white/80 px-5 py-8 backdrop-blur lg:flex lg:flex-col">
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() =>
                    setActiveView(
                      "dashboard",
                    )
                  }
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-bold transition ${
                    activeView ===
                    "dashboard"
                      ? "border border-aan-border bg-[#fbf8f3] text-aan-navy"
                      : "text-aan-secondary hover:bg-white hover:text-aan-navy"
                  }`}
                >
                  <span className="text-aan-gold">
                    ◫
                  </span>
                  {language === "ar"
                    ? "لوحة التحكم"
                    : language === "fr"
                      ? "Tableau de bord"
                      : "Dashboard"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveView(
                      "profile",
                    );
                    setShowProfileEditor(
                      false,
                    );
                  }}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-semibold transition ${
                    activeView ===
                    "profile"
                      ? "border border-aan-border bg-[#fbf8f3] text-aan-navy"
                      : "text-aan-secondary hover:bg-white hover:text-aan-navy"
                  }`}
                >
                  <span>◯</span>
                  {language === "ar"
                    ? "ملفي"
                    : language === "fr"
                      ? "Mon profil"
                      : "My profile"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setActiveView(
                      "availability",
                    )
                  }
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-semibold transition ${
                    activeView ===
                    "availability"
                      ? "border border-aan-border bg-[#fbf8f3] text-aan-navy"
                      : "text-aan-secondary hover:bg-white hover:text-aan-navy"
                  }`}
                >
                  <span>▣</span>
                  {text.availability}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setActiveView(
                      "sessions",
                    )
                  }
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-semibold transition ${
                    activeView ===
                    "sessions"
                      ? "border border-aan-border bg-[#fbf8f3] text-aan-navy"
                      : "text-aan-secondary hover:bg-white hover:text-aan-navy"
                  }`}
                >
                  <span>▤</span>
                  {text.bookedSessions}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setActiveView(
                      "services",
                    )
                  }
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-semibold transition ${
                    activeView ===
                    "services"
                      ? "border border-aan-border bg-[#fbf8f3] text-aan-navy"
                      : "text-aan-secondary hover:bg-white hover:text-aan-navy"
                  }`}
                >
                  <span>◇</span>
                  {language === "ar"
                    ? "الخدمات والأسعار"
                    : language === "fr"
                      ? "Services & tarifs"
                      : "Services & prices"}
                </button>
              </div>

              <div className="mt-auto rounded-2xl border border-aan-border bg-white p-4 shadow-[var(--aan-shadow-sm)]">
                {googleStatusLoading ? (
                  <p className="text-sm font-semibold text-aan-secondary">
                    {language === "ar"
                      ? "جارٍ التحقق من Google..."
                      : language === "fr"
                        ? "Vérification Google..."
                        : "Checking Google..."}
                  </p>
                ) : googleConnection.connected ? (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fbf8f3] font-black text-aan-gold">
                        G
                      </div>

                      <div className="min-w-0">
                        <p className="font-bold text-emerald-700">
                          {language === "ar"
                            ? "Google متصل ✓"
                            : language === "fr"
                              ? "Google connecté ✓"
                              : "Google connected ✓"}
                        </p>

                        <p className="mt-1 break-all text-xs text-aan-secondary">
                          {googleConnection.email}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        void disconnectGoogleCalendar()
                      }
                      disabled={
                        disconnectingGoogle
                      }
                      className="mt-4 w-full rounded-xl border border-aan-border bg-[#fbf8f3] px-3 py-2 text-sm font-bold text-aan-navy transition hover:bg-white disabled:opacity-60"
                    >
                      {disconnectingGoogle
                        ? language === "ar"
                          ? "جارٍ الفصل..."
                          : language === "fr"
                            ? "Déconnexion..."
                            : "Disconnecting..."
                        : language === "ar"
                          ? "فصل Google"
                          : language === "fr"
                            ? "Déconnecter Google"
                            : "Disconnect Google"}
                    </button>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-aan-navy">
                      Google Calendar
                    </p>

                    <p className="mt-1 text-xs leading-5 text-aan-secondary">
                      {language === "ar"
                        ? "اربط حسابك لإنشاء روابط Meet تلقائياً."
                        : language === "fr"
                          ? "Connectez votre compte pour générer les liens Meet automatiquement."
                          : "Connect your account to generate Meet links automatically."}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        void connectGoogleCalendar()
                      }
                      disabled={
                        connectingGoogle
                      }
                      className="aan-button mt-4 w-full py-2.5 text-sm disabled:opacity-60"
                    >
                      {connectingGoogle
                        ? language === "ar"
                          ? "جارٍ الاتصال..."
                          : language === "fr"
                            ? "Connexion..."
                            : "Connecting..."
                        : language === "ar"
                          ? "ربط Google"
                          : language === "fr"
                            ? "Connecter Google"
                            : "Connect Google"}
                    </button>
                  </>
                )}
              </div>
            </aside>

            <div
              id="dashboard"
              className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10"
            >
              <header className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.22em] text-aan-gold">
                    AAN Psychotherapy
                  </p>

                  <h1 className="aan-heading mt-2 text-4xl sm:text-5xl">
                    {activeView ===
                    "dashboard"
                      ? language === "ar"
                        ? `مرحباً، ${fullName || "أخصائي"}`
                        : language === "fr"
                          ? `Bienvenue, ${fullName || "spécialiste"}`
                          : `Welcome, ${fullName || "specialist"}`
                      : activeView ===
                          "profile"
                        ? language === "ar"
                          ? "ملفي المهني"
                          : language === "fr"
                            ? "Mon profil professionnel"
                            : "My professional profile"
                        : activeView ===
                            "availability"
                          ? text.availability
                          : activeView ===
                              "sessions"
                            ? text.bookedSessions
                            : language === "ar"
                              ? "الخدمات والأسعار"
                              : language === "fr"
                                ? "Services & tarifs"
                                : "Services & prices"}
                  </h1>

                  <p className="mt-2 text-aan-secondary">
                    {activeView ===
                    "dashboard"
                      ? language === "ar"
                        ? "نظرة سريعة على ملفك ومواعيدك وجلساتك."
                        : language === "fr"
                          ? "Voici un aperçu de votre profil, de vos disponibilités et de vos séances."
                          : "Here is an overview of your profile, availability and sessions."
                      : activeView ===
                          "profile"
                        ? language === "ar"
                          ? "راجع معلوماتك المهنية وعدّلها عند الحاجة."
                          : language === "fr"
                            ? "Consultez et modifiez vos informations professionnelles."
                            : "Review and edit your professional information."
                        : activeView ===
                            "availability"
                          ? language === "ar"
                            ? "أضف مواعيدك القادمة وأدرها بسهولة."
                            : language === "fr"
                              ? "Ajoutez et gérez vos prochaines disponibilités."
                              : "Add and manage your upcoming availability."
                          : activeView ===
                              "sessions"
                            ? language === "ar"
                              ? "تابع جلساتك القادمة والسابقة."
                              : language === "fr"
                                ? "Retrouvez vos séances à venir et vos séances passées."
                                : "Review your upcoming and past sessions."
                            : language === "ar"
                              ? "راجع الخدمات والأسعار المفعّلة لحسابك."
                              : language === "fr"
                                ? "Consultez les services et tarifs actifs de votre compte."
                                : "Review the active services and prices on your account."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 lg:hidden">
                  {googleConnection.connected ? (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
                      Google connecté ✓
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        void connectGoogleCalendar()
                      }
                      className="aan-button px-5 py-3"
                    >
                      Connecter Google
                    </button>
                  )}

                  {(activeView === "dashboard" ||
                    activeView === "availability") ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveView(
                          "availability",
                        );
                        setShowAvailabilityEditor(
                          true,
                        );
                      }}
                      className="aan-button px-5 py-3"
                    >
                      + {text.addAvailability}
                    </button>
                  ) : null}
                </div>
              </header>

              <div
                className={`grid gap-6 ${
                  activeView ===
                  "dashboard"
                    ? "xl:grid-cols-2"
                    : "grid-cols-1"
                }`}
              >
                {(activeView === "dashboard" ||
                  activeView === "profile") ? (
                <section
                  id="profile"
                  className="aan-card p-6 sm:p-7"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-xl font-bold text-aan-navy">
                      {language === "ar"
                        ? "ملفي"
                        : language === "fr"
                          ? "Mon profil"
                          : "My profile"}
                    </h2>

                    <button
                      type="button"
                      onClick={() =>
                        setShowProfileEditor(
                          (current) => !current,
                        )
                      }
                      className="rounded-xl border border-aan-border bg-white px-4 py-2 text-sm font-bold text-aan-navy transition hover:bg-[#fbf8f3]"
                    >
                      {showProfileEditor
                        ? language === "ar"
                          ? "إغلاق"
                          : language === "fr"
                            ? "Fermer"
                            : "Close"
                        : language === "ar"
                          ? "تعديل"
                          : language === "fr"
                            ? "Modifier"
                            : "Edit"}
                    </button>
                  </div>

                  <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
                    <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-2 border-aan-gold bg-[#f8f4ee]">
                      {displayedPhoto ? (
                        <Image
                          src={
                            displayedPhoto
                          }
                          alt={
                            fullName ||
                            text.photoAlt
                          }
                          fill
                          sizes="112px"
                          className="object-cover"
                          unoptimized={displayedPhoto.startsWith(
                            "blob:",
                          )}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-aan-button">
                          {getInitial()}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-2xl font-bold text-aan-navy">
                        {fullName ||
                          text.unknown}
                      </h3>

                      <p className="mt-1 text-aan-secondary">
                        {professionalTitle ||
                          specialty ||
                          text.unknown}
                      </p>

                      <span className="mt-3 inline-flex rounded-full border border-aan-border bg-[#fbf8f3] px-3 py-1 text-xs font-bold text-aan-secondary">
                        {language === "ar"
                          ? "أخصائي"
                          : language === "fr"
                            ? "Spécialiste"
                            : "Specialist"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-7 grid gap-4 border-t border-aan-border pt-5 sm:grid-cols-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-aan-gold">
                        {text.experience}
                      </p>
                      <p className="mt-1 font-semibold text-aan-navy">
                        {experienceYears
                          ? `${experienceYears} ${
                              language === "ar"
                                ? "سنوات"
                                : language === "fr"
                                  ? "ans"
                                  : "years"
                            }`
                          : "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-aan-gold">
                        {text.specialty}
                      </p>
                      <p className="mt-1 font-semibold text-aan-navy">
                        {specialty || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-aan-gold">
                        {text.languages}
                      </p>
                      <p className="mt-1 whitespace-pre-line font-semibold text-aan-navy">
                        {languages || "—"}
                      </p>
                    </div>
                  </div>
                </section>

                ) : null}

                {(activeView === "dashboard" ||
                  activeView === "availability") ? (
                <section
                  id="availability"
                  className="aan-card p-6 sm:p-7"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xl font-bold text-aan-navy">
                      {language === "ar"
                        ? "المواعيد القادمة"
                        : language === "fr"
                          ? "Disponibilités prochaines"
                          : "Upcoming availability"}
                    </h2>

                    <button
                      type="button"
                      onClick={() =>
                        setShowAvailabilityEditor(
                          (current) => !current,
                        )
                      }
                      className="aan-button px-4 py-2.5 text-sm"
                    >
                      + {text.addAvailability}
                    </button>
                  </div>

                  {showAvailabilityEditor ? (
                    <div className="mt-5 grid gap-3 rounded-2xl border border-aan-border bg-[#fbf8f3] p-4 sm:grid-cols-[1fr_1fr_auto]">
                      <input
                        type="date"
                        value={slotDate}
                        onChange={(
                          event,
                        ) =>
                          setSlotDate(
                            event.target.value,
                          )
                        }
                        className="aan-field p-3"
                      />

                      <input
                        type="time"
                        value={time}
                        onChange={(
                          event,
                        ) =>
                          setTime(
                            event.target.value,
                          )
                        }
                        className="aan-field p-3"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          void addSlot()
                        }
                        className="aan-button px-5 py-3"
                      >
                        {language === "ar"
                          ? "إضافة"
                          : language === "fr"
                            ? "Ajouter"
                            : "Add"}
                      </button>
                    </div>
                  ) : null}

                  <div className="mt-5 divide-y divide-aan-border overflow-hidden rounded-2xl border border-aan-border bg-white">
                    {displayedSlots.length ===
                    0 ? (
                      <p className="p-5 text-aan-secondary">
                        {text.noAvailability}
                      </p>
                    ) : (
                      displayedSlots.map(
                        (slot) => (
                          <div
                            key={slot.id}
                            className="flex items-center justify-between gap-4 px-4 py-4"
                          >
                            <div className="min-w-0">
                              <p className="font-bold capitalize text-aan-navy">
                                {formatDate(
                                  slot.slot_date,
                                )}
                              </p>

                              <p className="mt-1 text-sm text-aan-secondary">
                                {slot.time} ·{" "}
                                {
                                  text.therapistTimeZone
                                }
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                void deleteSlot(
                                  slot.id,
                                )
                              }
                              className="shrink-0 rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-50"
                            >
                              {text.delete}
                            </button>
                          </div>
                        ),
                      )
                    )}
                  </div>

                  {futureSlots.length > 3 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setShowAllSlots(
                          (current) => !current,
                        )
                      }
                      className="mt-4 w-full rounded-xl border border-aan-border bg-[#fbf8f3] px-4 py-3 text-sm font-bold text-aan-navy transition hover:bg-white"
                    >
                      {showAllSlots
                        ? language === "ar"
                          ? "عرض أقل"
                          : language === "fr"
                            ? "Réduire"
                            : "Show less"
                        : language === "ar"
                          ? `عرض كل المواعيد (${futureSlots.length})`
                          : language === "fr"
                            ? `Voir toutes les disponibilités (${futureSlots.length})`
                            : `View all availability (${futureSlots.length})`}
                    </button>
                  ) : null}
                </section>

                ) : null}

                {(activeView === "dashboard" ||
                  activeView === "sessions") ? (
                <section
                  id="sessions"
                  className="aan-card p-6 sm:p-7"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-bold text-aan-navy">
                      {language === "ar"
                        ? "الجلسات القادمة"
                        : language === "fr"
                          ? "Séances à venir"
                          : "Upcoming sessions"}
                    </h2>

                    <span className="rounded-full border border-aan-border bg-[#fbf8f3] px-3 py-1.5 text-xs font-bold text-aan-secondary">
                      {
                        upcomingBookings.length
                      }
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3">
                    {displayedUpcomingBookings.length ===
                    0 ? (
                      <div className="rounded-2xl border border-aan-border bg-[#fbf8f3] p-5 text-aan-secondary">
                        {language === "ar"
                          ? "لا توجد جلسات قادمة."
                          : language === "fr"
                            ? "Aucune séance à venir."
                            : "No upcoming sessions."}
                      </div>
                    ) : (
                      displayedUpcomingBookings.map(
                        (booking) => {
                          const sessionUrl =
                            booking.meeting_url ||
                            booking.zoom_start_url;

                          return (
                            <article
                              key={
                                booking.id
                              }
                              className="rounded-2xl border border-aan-border bg-white p-4"
                            >
                              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                  <p className="font-bold capitalize text-aan-navy">
                                    {formatBookingSessionDate(
                                      booking,
                                    )}{" "}
                                    ·{" "}
                                    {formatBookingSessionTime(
                                      booking,
                                    )}
                                  </p>

                                  <p className="mt-1 break-all text-sm text-aan-secondary">
                                    {text.patientEmail}:{" "}
                                    {booking.patient_email ||
                                      text.unknown}
                                  </p>
                                </div>

                                <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                                  {language === "ar"
                                    ? "مؤكدة"
                                    : language === "fr"
                                      ? "Confirmée"
                                      : "Confirmed"}
                                </span>
                              </div>

                              <div className="mt-4 flex flex-wrap gap-2">
                                {sessionUrl ? (
                                  <a
                                    href={
                                      sessionUrl
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="aan-button px-4 py-2 text-sm"
                                  >
                                    {text.startSession}
                                  </a>
                                ) : (
                                  <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-500">
                                    {text.meetingNotReady}
                                  </span>
                                )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    void runBookingAction(
                                      booking,
                                      "request_reschedule",
                                    )
                                  }
                                  disabled={
                                    bookingActionId ===
                                    booking.id
                                  }
                                  className="rounded-xl border border-aan-gold bg-white px-4 py-2 text-sm font-bold text-aan-navy"
                                >
                                  {text.requestReschedule}
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    void runBookingAction(
                                      booking,
                                      "cancel_and_refund",
                                    )
                                  }
                                  disabled={
                                    bookingActionId ===
                                    booking.id
                                  }
                                  className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700"
                                >
                                  {text.cancelSession}
                                </button>
                              </div>
                            </article>
                          );
                        },
                      )
                    )}
                  </div>

                  {upcomingBookings.length > 3 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setShowAllUpcomingBookings(
                          (current) => !current,
                        )
                      }
                      className="mt-4 w-full rounded-xl border border-aan-border bg-[#fbf8f3] px-4 py-3 text-sm font-bold text-aan-navy"
                    >
                      {showAllUpcomingBookings
                        ? language === "ar"
                          ? "عرض أقل"
                          : language === "fr"
                            ? "Réduire"
                            : "Show less"
                        : language === "ar"
                          ? `عرض الكل (${upcomingBookings.length})`
                          : language === "fr"
                            ? `Voir toutes les séances (${upcomingBookings.length})`
                            : `View all sessions (${upcomingBookings.length})`}
                    </button>
                  ) : null}

                  {pastBookings.length > 0 ? (
                    <div className="mt-5 border-t border-aan-border pt-4">
                      <button
                        type="button"
                        onClick={() =>
                          setShowPastBookings(
                            (current) => !current,
                          )
                        }
                        className="w-full rounded-xl border border-aan-border bg-white px-4 py-3 text-sm font-bold text-aan-secondary"
                      >
                        {showPastBookings
                          ? language === "ar"
                            ? "إخفاء الجلسات السابقة"
                            : language === "fr"
                              ? "Masquer les séances passées"
                              : "Hide past sessions"
                          : language === "ar"
                            ? `عرض الجلسات السابقة (${pastBookings.length})`
                            : language === "fr"
                              ? `Voir les séances passées (${pastBookings.length})`
                              : `View past sessions (${pastBookings.length})`}
                      </button>

                      {showPastBookings ? (
                        <div className="mt-3 grid gap-2">
                          {pastBookings.map(
                            (booking) => (
                              <div
                                key={
                                  booking.id
                                }
                                className="rounded-xl border border-aan-border bg-[#fbf8f3] px-4 py-3"
                              >
                                <p className="font-semibold capitalize text-aan-navy">
                                  {formatBookingSessionDate(
                                    booking,
                                  )}{" "}
                                  ·{" "}
                                  {formatBookingSessionTime(
                                    booking,
                                  )}
                                </p>

                                <p className="mt-1 text-sm text-aan-secondary">
                                  {booking.patient_email ||
                                    text.unknown}
                                </p>
                              </div>
                            ),
                          )}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </section>

                ) : null}

                {(activeView === "dashboard" ||
                  activeView === "services") ? (
                <section
                  id="services"
                  className="aan-card p-6 sm:p-7"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-aan-navy">
                        {language === "ar"
                          ? "الخدمات والأسعار"
                          : language === "fr"
                            ? "Mes services & tarifs"
                            : "My services & prices"}
                      </h2>

                      <p className="mt-1 text-xs text-aan-secondary">
                        {language === "ar"
                          ? "تُدار بواسطة AAN"
                          : language === "fr"
                            ? "Gérés par AAN"
                            : "Managed by AAN"}
                      </p>
                    </div>

                    <span className="rounded-full border border-aan-border bg-[#fbf8f3] px-3 py-1.5 text-xs font-bold text-aan-secondary">
                      {
                        therapistServices.length
                      }
                    </span>
                  </div>

                  <div className="mt-5 divide-y divide-aan-border overflow-hidden rounded-2xl border border-aan-border">
                    {therapistServices.length ===
                    0 ? (
                      <p className="p-5 text-aan-secondary">
                        {language === "ar"
                          ? "لا توجد خدمات مهيأة."
                          : language === "fr"
                            ? "Aucun service configuré."
                            : "No services configured."}
                      </p>
                    ) : (
                      therapistServices.map(
                        (
                          service,
                        ) => (
                          <div
                            key={
                              service.id
                            }
                            className="flex flex-col gap-3 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="font-bold text-aan-navy">
                                {getServiceLabel(
                                  service.service_type,
                                )}
                              </p>

                              <p className="mt-1 text-sm text-aan-secondary">
                                {
                                  service.duration_minutes
                                }{" "}
                                min
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="font-bold text-aan-navy">
                                {formatServicePrice(
                                  service,
                                )}
                              </span>

                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-bold ${
                                  service.is_active
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-slate-300 bg-slate-100 text-slate-600"
                                }`}
                              >
                                {service.is_active
                                  ? language === "ar"
                                    ? "نشط"
                                    : language === "fr"
                                      ? "Actif"
                                      : "Active"
                                  : language === "ar"
                                    ? "غير نشط"
                                    : language === "fr"
                                      ? "Inactif"
                                      : "Inactive"}
                              </span>
                            </div>
                          </div>
                        ),
                      )
                    )}
                  </div>
                </section>
                ) : null}

              </div>

              {(activeView === "dashboard" ||
                activeView === "profile") ? (
              <section className="aan-card mt-6 p-6 sm:p-7">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-bold text-aan-navy">
                    {language === "ar"
                      ? "نبذة عنك"
                      : language === "fr"
                        ? "À propos de vous"
                        : "About you"}
                  </h2>

                  <button
                    type="button"
                    onClick={() =>
                      setShowProfileEditor(
                        true,
                      )
                    }
                    className="rounded-xl border border-aan-border bg-white px-4 py-2 text-sm font-bold text-aan-navy"
                  >
                    {language === "ar"
                      ? "تعديل"
                      : language === "fr"
                        ? "Modifier"
                        : "Edit"}
                  </button>
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-aan-gold">
                      {text.experience}
                    </p>
                    <p className="mt-1 text-aan-secondary">
                      {experienceYears
                        ? `${experienceYears} ${
                            language === "fr"
                              ? "ans"
                              : language === "ar"
                                ? "سنوات"
                                : "years"
                          }`
                        : "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-aan-gold">
                      {text.specialty}
                    </p>
                    <p className="mt-1 text-aan-secondary">
                      {specialty || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-aan-gold">
                      {text.approach}
                    </p>
                    <p className="mt-1 line-clamp-3 whitespace-pre-line text-aan-secondary">
                      {therapeuticApproach ||
                        "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-aan-gold">
                      {text.languages}
                    </p>
                    <p className="mt-1 whitespace-pre-line text-aan-secondary">
                      {languages || "—"}
                    </p>
                  </div>
                </div>
              </section>

              ) : null}

              {showProfileEditor &&
              (activeView === "dashboard" ||
                activeView === "profile") ? (
                <section className="aan-card mt-6 p-6 sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.22em] text-aan-gold">
                        AAN Psychotherapy
                      </p>

                      <h2 className="aan-heading mt-2 text-3xl">
                        {text.profileTitle}
                      </h2>

                      <p className="mt-2 max-w-3xl text-sm leading-6 text-aan-secondary">
                        {text.profileDescription}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setShowProfileEditor(
                          false,
                        )
                      }
                      className="rounded-xl border border-aan-border bg-white px-4 py-2 text-sm font-bold text-aan-navy"
                    >
                      {language === "ar"
                        ? "إغلاق"
                        : language === "fr"
                          ? "Fermer"
                          : "Close"}
                    </button>
                  </div>

                  <div className="mt-7 grid gap-6 xl:grid-cols-2">
                    <div className="rounded-2xl border border-aan-border bg-[#fbf8f3] p-5">
                      <h3 className="text-xl font-bold text-aan-navy">
                        {text.basic}
                      </h3>

                      <div className="mt-5 flex flex-col items-center">
                        <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-aan-gold bg-white">
                          {displayedPhoto ? (
                            <Image
                              src={
                                displayedPhoto
                              }
                              alt={
                                fullName ||
                                text.photoAlt
                              }
                              fill
                              sizes="112px"
                              className="object-cover"
                              unoptimized={displayedPhoto.startsWith(
                                "blob:",
                              )}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-aan-button">
                              {getInitial()}
                            </div>
                          )}
                        </div>

                        <label className="mt-4 inline-flex cursor-pointer rounded-xl border border-aan-gold bg-white px-4 py-2 text-sm font-bold text-aan-navy">
                          {text.choosePhoto}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={
                              handlePhotoChange
                            }
                            className="hidden"
                          />
                        </label>
                      </div>

                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <label className="grid gap-2 text-sm font-bold text-aan-navy">
                          {text.fullName}
                          <input
                            type="text"
                            value={fullName}
                            onChange={(
                              event,
                            ) =>
                              setFullName(
                                event.target.value,
                              )
                            }
                            className="aan-field p-3 font-normal"
                          />
                        </label>

                        <label className="grid gap-2 text-sm font-bold text-aan-navy">
                          {text.experience}
                          <input
                            type="number"
                            min="0"
                            max="80"
                            step="1"
                            value={
                              experienceYears
                            }
                            onChange={(
                              event,
                            ) =>
                              setExperienceYears(
                                event.target.value,
                              )
                            }
                            className="aan-field p-3 font-normal"
                          />
                        </label>

                        <label className="grid gap-2 text-sm font-bold text-aan-navy sm:col-span-2">
                          {text.professionalTitle}
                          <input
                            type="text"
                            value={
                              professionalTitle
                            }
                            onChange={(
                              event,
                            ) =>
                              setProfessionalTitle(
                                event.target.value,
                              )
                            }
                            placeholder={
                              text.professionalTitlePlaceholder
                            }
                            className="aan-field p-3 font-normal"
                          />
                        </label>

                        <label className="grid gap-2 text-sm font-bold text-aan-navy sm:col-span-2">
                          {text.specialty}
                          <input
                            type="text"
                            value={specialty}
                            onChange={(
                              event,
                            ) =>
                              setSpecialty(
                                event.target.value,
                              )
                            }
                            placeholder={
                              text.specialtyPlaceholder
                            }
                            className="aan-field p-3 font-normal"
                          />
                        </label>

                        <label className="grid gap-2 text-sm font-bold text-aan-navy sm:col-span-2">
                          {text.languages}
                          <textarea
                            value={languages}
                            onChange={(
                              event,
                            ) =>
                              setLanguages(
                                event.target.value,
                              )
                            }
                            placeholder={
                              text.languagesPlaceholder
                            }
                            className="aan-field min-h-28 resize-y p-3 font-normal"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-aan-border bg-[#fbf8f3] p-5">
                      <h3 className="text-xl font-bold text-aan-navy">
                        {text.biographySection}
                      </h3>

                      <div className="mt-5 grid gap-4">
                        <label className="grid gap-2 text-sm font-bold text-aan-navy">
                          {text.biography}
                          <textarea
                            value={bio}
                            onChange={(
                              event,
                            ) =>
                              setBio(
                                event.target.value,
                              )
                            }
                            placeholder={
                              text.biographyPlaceholder
                            }
                            className="aan-field min-h-36 resize-y p-3 font-normal"
                          />
                        </label>

                        <label className="grid gap-2 text-sm font-bold text-aan-navy">
                          {text.education}
                          <textarea
                            value={education}
                            onChange={(
                              event,
                            ) =>
                              setEducation(
                                event.target.value,
                              )
                            }
                            placeholder={
                              text.educationPlaceholder
                            }
                            className="aan-field min-h-28 resize-y p-3 font-normal"
                          />
                        </label>

                        <label className="grid gap-2 text-sm font-bold text-aan-navy">
                          {text.certifications}
                          <textarea
                            value={
                              certifications
                            }
                            onChange={(
                              event,
                            ) =>
                              setCertifications(
                                event.target.value,
                              )
                            }
                            placeholder={
                              text.certificationsPlaceholder
                            }
                            className="aan-field min-h-28 resize-y p-3 font-normal"
                          />
                        </label>

                        <label className="grid gap-2 text-sm font-bold text-aan-navy">
                          {text.approach}
                          <textarea
                            value={
                              therapeuticApproach
                            }
                            onChange={(
                              event,
                            ) =>
                              setTherapeuticApproach(
                                event.target.value,
                              )
                            }
                            placeholder={
                              text.approachPlaceholder
                            }
                            className="aan-field min-h-32 resize-y p-3 font-normal"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                    <p className="text-sm text-aan-secondary">
                      {language === "ar"
                        ? "ستُنشأ الترجمات الإنجليزية والفرنسية والعربية تلقائياً عند الحفظ."
                        : language === "fr"
                          ? "Les versions anglaise et arabe seront générées automatiquement lors de l’enregistrement."
                          : "French and Arabic versions will be generated automatically when you save."}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        void saveProfile()
                      }
                      disabled={
                        isSaving
                      }
                      className="aan-button min-w-56 px-6 py-3 disabled:opacity-60"
                    >
                      {isSaving
                        ? text.saving
                        : text.save}
                    </button>
                  </div>
                </section>
              ) : null}
            </div>
          </div>
        </main>
      </>
    </ProtectedRoute>
  );
}

"use client";

import Image from "next/image";
import {
  ChangeEvent,
  useEffect,
  useState,
} from "react";

import Navbar from "../components/Navbar";
import ProtectedRoute from "../components/ProtectedRoute";

import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/i18n/LanguageProvider";

type Language = "en" | "fr" | "ar";

type AdminProfile = {
  full_name: string | null;
  full_name_ar?: string | null;

  job_title: string | null;
  job_title_ar?: string | null;

  specialty: string | null;
  specialty_ar?: string | null;

  experience_years: number | null;

  bio: string | null;
  bio_ar?: string | null;

  education: string | null;
  education_ar?: string | null;

  certifications: string | null;
  certifications_ar?: string | null;

  therapeutic_approach: string | null;
  therapeutic_approach_ar?: string | null;

  services: string | null;
  services_ar?: string | null;

  languages: string | null;
  languages_ar?: string | null;

  photo_url: string | null;
  role: string | null;
};

type TherapistProfile = {
  id: string;

  full_name: string | null;
  full_name_ar: string | null;

  professional_title: string | null;
  professional_title_fr: string | null;
  professional_title_ar: string | null;

  specialty: string | null;
  specialty_fr: string | null;
  specialty_ar: string | null;

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

  services: string | null;
  services_fr: string | null;
  services_ar: string | null;

  languages: string | null;
  languages_fr: string | null;
  languages_ar: string | null;

  price: number | null;
  photo_url: string | null;
};


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

type TranslationFields = {
  fullName: string;
  professionalTitle: string;
  specialty: string;
  bio: string;
  education: string;
  certifications: string;
  therapeuticApproach: string;
  services: string;
  languages: string;
};

type TranslationResult = {
  translations?: Record<string, string>;
  error?: string;
  details?: string;
};

const MAX_PHOTO_SIZE =
  5 * 1024 * 1024;

export default function AdminProfilePage() {
  const {
    language,
    isArabic,
  } = useLanguage();

  const [email, setEmail] =
    useState("");

  const [fullName, setFullName] =
    useState("");

  const [jobTitle, setJobTitle] =
    useState("");

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

  const [services, setServices] =
    useState("");

  const [languages, setLanguages] =
    useState("");

  const [photoUrl, setPhotoUrl] =
    useState("");

  const [
    photoFile,
    setPhotoFile,
  ] = useState<File | null>(
    null,
  );

  const [
    photoPreview,
    setPhotoPreview,
  ] = useState("");


  const [price, setPrice] =
    useState("");

  const [slotDate, setSlotDate] =
    useState("");

  const [time, setTime] =
    useState("");

  const [slots, setSlots] =
    useState<AvailabilitySlot[]>([]);

  const [bookings, setBookings] =
    useState<Booking[]>([]);

  const [nowMs, setNowMs] =
    useState(() => Date.now());

  const [
    bookingActionId,
    setBookingActionId,
  ] = useState<string | null>(
    null,
  );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const text =
    language === "ar"
      ? {
          title:
            "الملف المهني للمسؤول",

          description:
            "أدخل معلوماتك المهنية باللغة التي تفضلها. ستقوم المنصة بإنشاء النسخ الإنجليزية والفرنسية والعربية تلقائياً عند الحفظ.",

          translationNotice:
            "سيتم إنشاء النسختين الإنجليزية والفرنسية تلقائياً عند الحفظ.",

          loading:
            "جارٍ تحميل الملف...",

          basic:
            "الصورة والمعلومات الأساسية",

          biographySection:
            "السيرة والخبرة المهنية",

          choosePhoto:
            "اختيار صورة",

          photoHelp:
            "JPG أو PNG أو WebP، بحد أقصى 5 ميغابايت.",

          email:
            "البريد الإلكتروني",

          fullName:
            "الاسم الكامل",

          professionalTitle:
            "المسمى المهني",

          specialty:
            "التخصص",

          experience:
            "سنوات الخبرة",

          biography:
            "النبذة المهنية",

          education:
            "التعليم والمؤهلات",

          certifications:
            "التدريبات والشهادات",

          approach:
            "النهج العلاجي",

          services:
            "الخدمات",

          languages:
            "اللغات",

          save:
            "حفظ الملف المهني",

          saving:
            "جارٍ الحفظ والترجمة...",

          saved:
            "تم حفظ الملف وترجمته تلقائياً إلى اللغات الثلاث.",

          invalidPhoto:
            "يرجى اختيار صورة صالحة.",

          photoTooLarge:
            "يجب ألا يتجاوز حجم الصورة 5 ميغابايت.",

          fullNameRequired:
            "يرجى إدخال الاسم الكامل.",

          titleRequired:
            "يرجى إدخال المسمى المهني.",

          specialtyRequired:
            "يرجى إدخال التخصص.",

          experienceInvalid:
            "يرجى إدخال عدد صحيح صالح لسنوات الخبرة.",

          saveError:
            "تعذر حفظ الملف.",

          translationError:
            "تعذر إكمال الترجمة التلقائية.",

          sessionPrice:
            "سعر الجلسة",

          priceHelp:
            "يمكن للإدارة تعديل السعر في أي وقت. استخدم 0 لإيقاف الحجز مؤقتاً.",

          priceInvalid:
            "يرجى إدخال سعر صالح يساوي 0 أو أكثر.",

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

          priceLabel:
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

          photoAlt:
            "صورة المسؤول",
        }
      : language === "fr"
        ? {
            title:
              "Profil professionnel de l’administratrice",

            description:
              "Saisissez vos informations professionnelles dans la langue de votre choix. La plateforme générera automatiquement les versions française, anglaise et arabe lors de l’enregistrement.",

            translationNotice:
              "Les versions anglaise et arabe seront générées automatiquement lors de l’enregistrement.",

            loading:
              "Chargement du profil...",

            basic:
              "Photo et informations principales",

            biographySection:
              "Biographie et expérience professionnelle",

            choosePhoto:
              "Choisir une photo",

            photoHelp:
              "JPG, PNG ou WebP, maximum 5 Mo.",

            email:
              "E-mail",

            fullName:
              "Nom complet",

            professionalTitle:
              "Titre professionnel",

            specialty:
              "Spécialité",

            experience:
              "Années d’expérience",

            biography:
              "Biographie professionnelle",

            education:
              "Formation et qualifications",

            certifications:
              "Formations et certifications",

            approach:
              "Approche thérapeutique",

            services:
              "Services",

            languages:
              "Langues",

            save:
              "Enregistrer le profil professionnel",

            saving:
              "Enregistrement et traduction...",

            saved:
              "Le profil a été enregistré et traduit automatiquement dans les trois langues.",

            invalidPhoto:
              "Veuillez sélectionner une image valide.",

            photoTooLarge:
              "La photo doit faire moins de 5 Mo.",

            fullNameRequired:
              "Veuillez saisir votre nom complet.",

            titleRequired:
              "Veuillez saisir votre titre professionnel.",

            specialtyRequired:
              "Veuillez saisir votre spécialité.",

            experienceInvalid:
              "Veuillez saisir un nombre entier valide d’années d’expérience.",

            saveError:
              "Impossible d’enregistrer le profil.",

            translationError:
              "La traduction automatique n’a pas pu être terminée.",

            sessionPrice:
              "Prix de la séance",

            priceHelp:
              "L’administration peut modifier le prix à tout moment. Utilisez 0 pour suspendre temporairement les réservations.",

            priceInvalid:
              "Veuillez saisir un prix valide supérieur ou égal à 0.",

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

            priceLabel:
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

            photoAlt:
              "Photo de l’administratrice",
          }
        : {
            title:
              "Administrator Professional Profile",

            description:
              "Enter your professional information in the language you prefer. The platform will automatically generate English, French and Arabic versions when you save.",

            translationNotice:
              "French and Arabic versions will be generated automatically when you save.",

            loading:
              "Loading profile...",

            basic:
              "Photo and Basic Information",

            biographySection:
              "Biography and Professional Experience",

            choosePhoto:
              "Choose Profile Photo",

            photoHelp:
              "JPG, PNG or WebP, maximum 5 MB.",

            email:
              "Email",

            fullName:
              "Full name",

            professionalTitle:
              "Professional title",

            specialty:
              "Specialty",

            experience:
              "Years of experience",

            biography:
              "Professional biography",

            education:
              "Education and qualifications",

            certifications:
              "Training and certifications",

            approach:
              "Therapeutic approach",

            services:
              "Services",

            languages:
              "Languages",

            save:
              "Save Professional Profile",

            saving:
              "Saving and translating...",

            saved:
              "Profile saved and automatically translated into all three languages.",

            invalidPhoto:
              "Please select a valid image.",

            photoTooLarge:
              "The image must be smaller than 5 MB.",

            fullNameRequired:
              "Please enter your full name.",

            titleRequired:
              "Please enter your professional title.",

            specialtyRequired:
              "Please enter your specialty.",

            experienceInvalid:
              "Please enter a valid whole number of experience years.",

            saveError:
              "Unable to save the profile.",

            translationError:
              "Automatic translation could not be completed.",

            sessionPrice:
              "Session Price",

            priceHelp:
              "The administrator can change the price at any time. Use 0 to temporarily pause bookings.",

            priceInvalid:
              "Please enter a valid price greater than or equal to 0.",

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

            priceLabel:
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

            photoAlt:
              "Administrator photo",
          };


  useEffect(() => {
    void getSlots();
    void getBookings();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 15_000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    void loadProfile();
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

  const loadProfile =
    async () => {
      setLoading(true);
      setSuccessMessage("");

      try {
        const {
          data: { user },
          error: userError,
        } =
          await supabase.auth.getUser();

        if (
          userError ||
          !user
        ) {
          window.location.href =
            "/login";

          return;
        }

        setEmail(
          user.email || "",
        );

        /*
         * profiles sert à vérifier le rôle
         * et fournit également un fallback.
         */
        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select(
            `
              full_name,
              full_name_ar,
              job_title,
              job_title_ar,
              specialty,
              specialty_ar,
              experience_years,
              bio,
              bio_ar,
              education,
              education_ar,
              certifications,
              certifications_ar,
              therapeutic_approach,
              therapeutic_approach_ar,
              services,
              services_ar,
              languages,
              languages_ar,
              photo_url,
              role
            `,
          )
          .eq(
            "id",
            user.id,
          )
          .single<AdminProfile>();

        if (profileError) {
          throw profileError;
        }

        if (
          profile?.role !==
          "admin"
        ) {
          window.location.href =
            "/";

          return;
        }

        /*
         * La table therapists contient
         * les trois versions utilisées
         * publiquement sur /therapists.
         */
        const {
          data: therapist,
          error: therapistError,
        } = await supabase
          .from("therapists")
          .select(
            `
              id,
              full_name,
              full_name_ar,

              professional_title,
              professional_title_fr,
              professional_title_ar,

              specialty,
              specialty_fr,
              specialty_ar,

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

              services,
              services_fr,
              services_ar,

              languages,
              languages_fr,
              languages_ar,

              price,
              photo_url
            `,
          )
          .eq(
            "id",
            user.id,
          )
          .maybeSingle<TherapistProfile>();

        if (therapistError) {
          throw therapistError;
        }

        if (
          language === "ar"
        ) {
          setFullName(
            therapist?.full_name_ar ||
              profile.full_name_ar ||
              therapist?.full_name ||
              profile.full_name ||
              "",
          );

          setJobTitle(
            therapist?.professional_title_ar ||
              profile.job_title_ar ||
              therapist?.professional_title ||
              profile.job_title ||
              "",
          );

          setSpecialty(
            therapist?.specialty_ar ||
              profile.specialty_ar ||
              therapist?.specialty ||
              profile.specialty ||
              "",
          );

          setBio(
            therapist?.bio_ar ||
              profile.bio_ar ||
              therapist?.bio ||
              profile.bio ||
              "",
          );

          setEducation(
            therapist?.education_ar ||
              profile.education_ar ||
              therapist?.education ||
              profile.education ||
              "",
          );

          setCertifications(
            therapist?.certifications_ar ||
              profile.certifications_ar ||
              therapist?.certifications ||
              profile.certifications ||
              "",
          );

          setTherapeuticApproach(
            therapist?.therapeutic_approach_ar ||
              profile.therapeutic_approach_ar ||
              therapist?.therapeutic_approach ||
              profile.therapeutic_approach ||
              "",
          );

          setServices(
            therapist?.services_ar ||
              profile.services_ar ||
              therapist?.services ||
              profile.services ||
              "",
          );

          setLanguages(
            therapist?.languages_ar ||
              profile.languages_ar ||
              therapist?.languages ||
              profile.languages ||
              "",
          );
        } else if (
          language === "fr"
        ) {
          setFullName(
            therapist?.full_name ||
              profile.full_name ||
              "",
          );

          setJobTitle(
            therapist?.professional_title_fr ||
              therapist?.professional_title ||
              profile.job_title ||
              "",
          );

          setSpecialty(
            therapist?.specialty_fr ||
              therapist?.specialty ||
              profile.specialty ||
              "",
          );

          setBio(
            therapist?.bio_fr ||
              therapist?.bio ||
              profile.bio ||
              "",
          );

          setEducation(
            therapist?.education_fr ||
              therapist?.education ||
              profile.education ||
              "",
          );

          setCertifications(
            therapist?.certifications_fr ||
              therapist?.certifications ||
              profile.certifications ||
              "",
          );

          setTherapeuticApproach(
            therapist?.therapeutic_approach_fr ||
              therapist?.therapeutic_approach ||
              profile.therapeutic_approach ||
              "",
          );

          setServices(
            therapist?.services_fr ||
              therapist?.services ||
              profile.services ||
              "",
          );

          setLanguages(
            therapist?.languages_fr ||
              therapist?.languages ||
              profile.languages ||
              "",
          );
        } else {
          setFullName(
            therapist?.full_name ||
              profile.full_name ||
              "",
          );

          setJobTitle(
            therapist?.professional_title ||
              profile.job_title ||
              "",
          );

          setSpecialty(
            therapist?.specialty ||
              profile.specialty ||
              "",
          );

          setBio(
            therapist?.bio ||
              profile.bio ||
              "",
          );

          setEducation(
            therapist?.education ||
              profile.education ||
              "",
          );

          setCertifications(
            therapist?.certifications ||
              profile.certifications ||
              "",
          );

          setTherapeuticApproach(
            therapist?.therapeutic_approach ||
              profile.therapeutic_approach ||
              "",
          );

          setServices(
            therapist?.services ||
              profile.services ||
              "",
          );

          setLanguages(
            therapist?.languages ||
              profile.languages ||
              "",
          );
        }

        setExperienceYears(
          (
            therapist?.experience_years ??
            profile.experience_years
          )?.toString() || "",
        );

        setPhotoUrl(
          therapist?.photo_url ||
            profile.photo_url ||
            "",
        );

        setPrice(
          therapist?.price?.toString() ||
            "0",
        );
      } catch (error) {
        console.error(
          "Admin profile load error:",
          error,
        );
      } finally {
        setLoading(false);
      }
    };

  const getCurrentUser =
    async () => {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      return user;
    };

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

      const handlePhotoChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/",
      )
    ) {
      alert(
        text.invalidPhoto,
      );

      event.target.value = "";
      return;
    }

    if (
      file.size >
      MAX_PHOTO_SIZE
    ) {
      alert(
        text.photoTooLarge,
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

    setPhotoFile(file);

    setPhotoPreview(
      URL.createObjectURL(
        file,
      ),
    );

    setSuccessMessage("");
  };

  const uploadPhoto =
    async (
      userId: string,
    ) => {
      if (!photoFile) {
        return (
          photoUrl || null
        );
      }

      const extension =
        photoFile.name
          .split(".")
          .pop()
          ?.toLowerCase() ||
        "jpg";

      const filePath =
        `${userId}/admin-profile-${Date.now()}.${extension}`;

      const {
        error: uploadError,
      } =
        await supabase.storage
          .from(
            "profile-photos",
          )
          .upload(
            filePath,
            photoFile,
            {
              cacheControl:
                "3600",

              contentType:
                photoFile.type,

              upsert: false,
            },
          );

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } =
        supabase.storage
          .from(
            "profile-photos",
          )
          .getPublicUrl(
            filePath,
          );

      return publicUrl;
    };

  const normalizeFields = (
    fields:
      Partial<TranslationFields>,
  ): TranslationFields => ({
    fullName:
      fields.fullName?.trim() ||
      "",

    professionalTitle:
      fields.professionalTitle?.trim() ||
      "",

    specialty:
      fields.specialty?.trim() ||
      "",

    bio:
      fields.bio?.trim() ||
      "",

    education:
      fields.education?.trim() ||
      "",

    certifications:
      fields.certifications?.trim() ||
      "",

    therapeuticApproach:
      fields.therapeuticApproach?.trim() ||
      "",

    services:
      fields.services?.trim() ||
      "",

    languages:
      fields.languages?.trim() ||
      "",
  });

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

      const controller =
        new AbortController();

      const timeoutId =
        window.setTimeout(
          () =>
            controller.abort(),
          120000,
        );

      try {
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

              signal:
                controller.signal,
            },
          );

        const result =
          (await response.json()) as TranslationResult;

        if (
          !response.ok ||
          !result.translations
        ) {
          throw new Error(
            result.details ||
              result.error ||
              "Automatic translation failed.",
          );
        }

        return normalizeFields(
          result.translations,
        );
      } finally {
        window.clearTimeout(
          timeoutId,
        );
      }
    };

  const saveProfile =
    async () => {
      setSuccessMessage("");

      if (
        !fullName.trim()
      ) {
        alert(
          text.fullNameRequired,
        );

        return;
      }

      if (
        !jobTitle.trim()
      ) {
        alert(
          text.titleRequired,
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
          parsedExperience < 0 ||
          parsedExperience > 80)
      ) {
        alert(
          text.experienceInvalid,
        );

        return;
      }


      const parsedPrice =
        price.trim()
          ? Number(price)
          : 0;

      if (
        !Number.isFinite(
          parsedPrice,
        ) ||
        parsedPrice < 0
      ) {
        alert(
          text.priceInvalid,
        );
        return;
      }

      setSaving(true);

      try {
        const {
          data: { user },
          error: userError,
        } =
          await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          throw new Error(
            "User not authenticated",
          );
        }

        const uploadedPhotoUrl =
          await uploadPhoto(
            user.id,
          );

        /*
         * Le contenu est considéré
         * comme étant écrit dans
         * la langue actuellement active.
         */
        const sourceFields =
          normalizeFields({
            fullName:
              fullName.trim(),

            professionalTitle:
              jobTitle.trim(),

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

            services:
              services.trim(),

            languages:
              languages.trim(),
          });

        let englishFields:
          TranslationFields;

        let frenchFields:
          TranslationFields;

        let arabicFields:
          TranslationFields;

        /*
         * Traduire automatiquement
         * vers les deux autres langues.
         */
        if (
          language === "en"
        ) {
          englishFields =
            sourceFields;

          const [
            french,
            arabic,
          ] =
            await Promise.all([
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
            french;

          arabicFields =
            arabic;
        } else if (
          language === "fr"
        ) {
          frenchFields =
            sourceFields;

          const [
            english,
            arabic,
          ] =
            await Promise.all([
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
            english;

          arabicFields =
            arabic;
        } else {
          arabicFields =
            sourceFields;

          const [
            english,
            french,
          ] =
            await Promise.all([
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
            english;

          frenchFields =
            french;
        }

        /*
         * Nom latin pour EN / FR.
         * Nom arabe pour AR.
         */
        const latinFullName =
          language === "ar"
            ? englishFields.fullName
            : fullName.trim();

        const arabicFullName =
          language === "ar"
            ? fullName.trim()
            : arabicFields.fullName;

        /*
         * profiles :
         * conserver une version principale
         * en anglais + arabe pour compatibilité
         * avec le reste du projet.
         */
        const {
          error:
            profileError,
        } = await supabase
          .from("profiles")
          .update({
            full_name:
              latinFullName,

            full_name_ar:
              arabicFullName,

            job_title:
              englishFields.professionalTitle,

            job_title_ar:
              arabicFields.professionalTitle,

            specialty:
              englishFields.specialty,

            specialty_ar:
              arabicFields.specialty,

            experience_years:
              parsedExperience,

            bio:
              englishFields.bio,

            bio_ar:
              arabicFields.bio,

            education:
              englishFields.education,

            education_ar:
              arabicFields.education,

            certifications:
              englishFields.certifications,

            certifications_ar:
              arabicFields.certifications,

            therapeutic_approach:
              englishFields.therapeuticApproach,

            therapeutic_approach_ar:
              arabicFields.therapeuticApproach,

            services:
              englishFields.services,

            services_ar:
              arabicFields.services,

            languages:
              englishFields.languages,

            languages_ar:
              arabicFields.languages,

            photo_url:
              uploadedPhotoUrl,
          })
          .eq(
            "id",
            user.id,
          );

        if (profileError) {
          throw profileError;
        }

        /*
         * therapists :
         * c’est ici que sont conservées
         * LES TROIS LANGUES utilisées
         * sur la page publique.
         */
        const {
          error:
            therapistError,
        } = await supabase
          .from("therapists")
          .upsert(
            {
              id: user.id,

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

              services:
                englishFields.services,

              services_fr:
                frenchFields.services,

              services_ar:
                arabicFields.services,

              languages:
                englishFields.languages,

              languages_fr:
                frenchFields.languages,

              languages_ar:
                arabicFields.languages,

              photo_url:
                uploadedPhotoUrl,

              price:
                parsedPrice,
            },
            {
              onConflict:
                "id",
            },
          );

        if (therapistError) {
          throw therapistError;
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

        setSuccessMessage(
          text.saved,
        );

        /*
         * Recharge immédiatement
         * la version correspondant
         * à la langue active.
         */
        await loadProfile();
      } catch (error) {
        console.error(
          "Admin profile save error:",
          error,
        );

        const message =
          error instanceof Error
            ? error.message
            : text.saveError;

        alert(
          `${text.saveError} ${message}`,
        );
      } finally {
        setSaving(false);
      }
    };

  const displayedPhoto =
    photoPreview ||
    photoUrl;

  const initial =
    fullName
      .trim()
      .charAt(0)
      .toUpperCase() ||
    "A";
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
            <div className="aan-card p-7 sm:p-10 lg:p-12">
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-aan-gold">
                AAN Psychotherapy
              </p>

              <h1 className="aan-heading mt-4 text-4xl sm:text-5xl">
                {text.title}
              </h1>

              <p className="mt-5 max-w-3xl leading-8 text-aan-secondary">
                {
                  text.description
                }
              </p>

              <div className="mt-5 inline-flex rounded-full border border-aan-border bg-[#fbf8f3] px-4 py-2 text-sm font-semibold text-aan-secondary">
                ✓{" "}
                {
                  text.translationNotice
                }
              </div>

              {loading ? (
                <p className="mt-10 text-aan-secondary">
                  {
                    text.loading
                  }
                </p>
              ) : (
                <div className="mt-10 grid gap-8 lg:grid-cols-2">
                  <section className="rounded-[2rem] border border-aan-border bg-white p-7 shadow-[var(--aan-shadow-sm)] sm:p-9">
                    <h2 className="aan-heading text-3xl">
                      {
                        text.basic
                      }
                    </h2>

                    <div className="mt-8 flex flex-col items-center">
                      <div className="relative h-44 w-44 overflow-hidden rounded-full border-2 border-aan-gold bg-[#f8f4ee] shadow-[var(--aan-shadow-md)]">
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
                            sizes="176px"
                            className="object-cover"
                            unoptimized={displayedPhoto.startsWith(
                              "blob:",
                            )}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#f8f4ee_0%,#edf3f9_100%)]">
                            <span className="text-6xl font-bold text-aan-button">
                              {
                                initial
                              }
                            </span>
                          </div>
                        )}
                      </div>

                      <label className="mt-6 inline-flex cursor-pointer items-center justify-center rounded-xl border-2 border-aan-gold bg-white px-5 py-3 font-bold text-aan-navy transition hover:bg-aan-gold hover:text-white">
                        {
                          text.choosePhoto
                        }

                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={
                            handlePhotoChange
                          }
                          className="hidden"
                        />
                      </label>

                      <p className="mt-3 text-center text-sm text-aan-secondary">
                        {
                          text.photoHelp
                        }
                      </p>
                    </div>

                    <div className="mt-8 space-y-5">
                      <Field
                        label={
                          text.email
                        }
                      >
                        <input
                          type="email"
                          value={
                            email
                          }
                          disabled
                          className="aan-field bg-[#f4f1ec] p-4 font-normal opacity-75"
                        />
                      </Field>

                      <Field
                        label={
                          text.fullName
                        }
                      >
                        <input
                          type="text"
                          value={
                            fullName
                          }
                          onChange={(
                            event,
                          ) =>
                            setFullName(
                              event
                                .target
                                .value,
                            )
                          }
                          className="aan-field p-4 font-normal"
                        />
                      </Field>

                      <Field
                        label={
                          text.professionalTitle
                        }
                      >
                        <input
                          type="text"
                          value={
                            jobTitle
                          }
                          onChange={(
                            event,
                          ) =>
                            setJobTitle(
                              event
                                .target
                                .value,
                            )
                          }
                          className="aan-field p-4 font-normal"
                        />
                      </Field>

                      <Field
                        label={
                          text.specialty
                        }
                      >
                        <input
                          type="text"
                          value={
                            specialty
                          }
                          onChange={(
                            event,
                          ) =>
                            setSpecialty(
                              event
                                .target
                                .value,
                            )
                          }
                          className="aan-field p-4 font-normal"
                        />
                      </Field>

                      <Field
                        label={
                          text.experience
                        }
                      >
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
                              event
                                .target
                                .value,
                            )
                          }
                          className="aan-field p-4 font-normal"
                        />
                      </Field>
                    </div>
                  </section>

                  <section className="rounded-[2rem] border border-aan-border bg-white p-7 shadow-[var(--aan-shadow-sm)] sm:p-9">
                    <h2 className="aan-heading text-3xl">
                      {
                        text.biographySection
                      }
                    </h2>

                    <div className="mt-8 space-y-6">
                      <Field
                        label={
                          text.biography
                        }
                      >
                        <textarea
                          value={
                            bio
                          }
                          onChange={(
                            event,
                          ) =>
                            setBio(
                              event
                                .target
                                .value,
                            )
                          }
                          className="aan-field min-h-64 resize-y p-4 font-normal leading-7"
                        />
                      </Field>

                      <Field
                        label={
                          text.education
                        }
                      >
                        <textarea
                          value={
                            education
                          }
                          onChange={(
                            event,
                          ) =>
                            setEducation(
                              event
                                .target
                                .value,
                            )
                          }
                          className="aan-field min-h-40 resize-y p-4 font-normal leading-7"
                        />
                      </Field>

                      <Field
                        label={
                          text.certifications
                        }
                      >
                        <textarea
                          value={
                            certifications
                          }
                          onChange={(
                            event,
                          ) =>
                            setCertifications(
                              event
                                .target
                                .value,
                            )
                          }
                          className="aan-field min-h-40 resize-y p-4 font-normal leading-7"
                        />
                      </Field>

                      <Field
                        label={
                          text.approach
                        }
                      >
                        <textarea
                          value={
                            therapeuticApproach
                          }
                          onChange={(
                            event,
                          ) =>
                            setTherapeuticApproach(
                              event
                                .target
                                .value,
                            )
                          }
                          className="aan-field min-h-40 resize-y p-4 font-normal leading-7"
                        />
                      </Field>

                      <Field
                        label={
                          text.services
                        }
                      >
                        <textarea
                          value={
                            services
                          }
                          onChange={(
                            event,
                          ) =>
                            setServices(
                              event
                                .target
                                .value,
                            )
                          }
                          className="aan-field min-h-40 resize-y p-4 font-normal leading-7"
                        />
                      </Field>

                      <Field
                        label={
                          text.languages
                        }
                      >
                        <textarea
                          value={
                            languages
                          }
                          onChange={(
                            event,
                          ) =>
                            setLanguages(
                              event
                                .target
                                .value,
                            )
                          }
                          className="aan-field min-h-28 resize-y p-4 font-normal leading-7"
                        />
                      </Field>


                      <Field
                        label={
                          text.sessionPrice
                        }
                      >
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            price
                          }
                          onChange={(
                            event,
                          ) =>
                            setPrice(
                              event
                                .target
                                .value,
                            )
                          }
                          className="aan-field p-4 font-normal"
                        />

                        <span className="text-sm font-normal leading-6 text-aan-secondary">
                          {
                            text.priceHelp
                          }
                        </span>
                      </Field>

                      {successMessage && (
                        <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 font-semibold text-green-700">
                          {
                            successMessage
                          }
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          void saveProfile()
                        }
                        disabled={
                          saving
                        }
                        className="aan-button w-full py-4 text-lg disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving
                          ? text.saving
                          : text.save}
                      </button>
                    </div>
                  </section>

                  <section className="rounded-[2rem] border border-aan-border bg-white p-7 shadow-[var(--aan-shadow-sm)] sm:p-9">
                    <h2 className="aan-heading text-3xl">
                      {
                        text.availability
                      }
                    </h2>

                    <div className="mt-8 space-y-4">
                      <input
                        type="date"
                        value={
                          slotDate
                        }
                        onChange={(
                          event,
                        ) =>
                          setSlotDate(
                            event
                              .target
                              .value,
                          )
                        }
                        className="aan-field p-4"
                      />

                      <input
                        type="time"
                        value={
                          time
                        }
                        onChange={(
                          event,
                        ) =>
                          setTime(
                            event
                              .target
                              .value,
                          )
                        }
                        className="aan-field p-4"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          void addSlot()
                        }
                        className="aan-button w-full py-4 text-lg"
                      >
                        {
                          text.addAvailability
                        }
                      </button>
                    </div>

                    <div className="mt-8 space-y-4">
                      {slots.length ===
                      0 ? (
                        <p className="text-aan-secondary">
                          {
                            text.noAvailability
                          }
                        </p>
                      ) : (
                        slots.map(
                          (
                            slot,
                          ) => (
                            <div
                              key={
                                slot.id
                              }
                              className="flex items-center justify-between gap-4 rounded-2xl border border-aan-border bg-[#fbf8f3] p-4"
                            >
                              <div>
                                <p className="font-bold text-aan-navy">
                                  {formatDate(
                                    slot.slot_date,
                                  )}
                                </p>

                                <p className="mt-1 text-aan-secondary">
                                  {
                                    slot.time
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
                                className="rounded-xl border border-red-200 bg-white px-4 py-2 font-semibold text-red-700 transition hover:bg-red-50"
                              >
                                {
                                  text.delete
                                }
                              </button>
                            </div>
                          ),
                        )
                      )}
                    </div>
                  </section>

                  <section className="rounded-[2rem] border border-aan-border bg-white p-7 shadow-[var(--aan-shadow-sm)] sm:p-9">
                    <h2 className="aan-heading text-3xl">
                      {
                        text.bookedSessions
                      }
                    </h2>

                    {bookings.length ===
                    0 ? (
                      <p className="mt-8 text-aan-secondary">
                        {
                          text.noBookings
                        }
                      </p>
                    ) : (
                      <div className="mt-8 grid gap-6">
                        {bookings.map(
                          (
                            booking,
                          ) => {
                            const sessionUrl =
                              booking.meeting_url ||
                              booking.zoom_start_url;

                            return (
                              <article
                                key={
                                  booking.id
                                }
                                className="rounded-2xl border border-aan-border bg-[#fbf8f3] p-6"
                              >
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-aan-gold">
                                  {
                                    text.sessionDate
                                  }
                                </p>

                                <h3 className="mt-2 text-2xl font-bold capitalize text-aan-navy">
                                  {formatBookingSessionDate(
                                    booking,
                                  )}{" "}
                                  {language ===
                                  "fr"
                                    ? "à"
                                    : language ===
                                        "ar"
                                      ? "في"
                                      : "at"}{" "}
                                  {formatBookingSessionTime(
                                    booking,
                                  )}
                                </h3>

                                <p className="mt-1 text-sm font-semibold text-aan-secondary">
                                  {
                                    text.therapistTimeZone
                                  }
                                </p>

                                <p className="mt-4 text-aan-secondary">
                                  {
                                    text.priceLabel
                                  }
                                  : $
                                  {
                                    booking.price
                                  }
                                </p>

                                <p className="mt-2 break-words text-aan-secondary">
                                  {
                                    text.patientEmail
                                  }
                                  :{" "}
                                  <span className="font-semibold text-aan-navy">
                                    {booking.patient_email ||
                                      text.unknown}
                                  </span>
                                </p>

                                <p className="mt-2 font-bold text-green-700">
                                  {
                                    text.status
                                  }
                                  :{" "}
                                  {
                                    booking.status
                                  }
                                </p>

                                <p className="mt-2 text-sm text-aan-secondary">
                                  {
                                    text.created
                                  }
                                  :{" "}
                                  {new Date(
                                    booking.created_at,
                                  ).toLocaleString(
                                    language ===
                                    "ar"
                                      ? "ar-LB"
                                      : language ===
                                          "fr"
                                        ? "fr-FR"
                                        : "en-US",
                                  )}
                                </p>

                                {isPastBooking(
                                  booking,
                                ) ? (
                                  <div className="mt-5 rounded-2xl border border-aan-border bg-white px-5 py-4 text-center font-bold text-aan-secondary">
                                    {
                                      text.sessionPast
                                    }
                                  </div>
                                ) : (
                                  <>
                                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
                                        className="rounded-xl border border-aan-gold bg-white px-4 py-3 font-bold text-aan-navy transition hover:bg-[#fbf8f3] disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        {
                                          text.requestReschedule
                                        }
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
                                        className="rounded-xl border border-red-200 bg-white px-4 py-3 font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        {
                                          text.cancelSession
                                        }
                                      </button>
                                    </div>

                                    {sessionUrl ? (
                                      <a
                                        href={
                                          sessionUrl
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="aan-button mt-3 flex w-full py-3"
                                      >
                                        {
                                          text.startSession
                                        }
                                      </a>
                                    ) : (
                                      <button
                                        type="button"
                                        disabled
                                        className="mt-3 w-full rounded-2xl bg-slate-300 py-3 font-semibold text-white"
                                      >
                                        {
                                          text.meetingNotReady
                                        }
                                      </button>
                                    )}
                                  </>
                                )}
                              </article>
                            );
                          },
                        )}
                      </div>
                    )}
                  </section>
                </div>
              )}
            </div>
          </section>
        </main>
      </>
    </ProtectedRoute>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children:
    React.ReactNode;
}) {
  return (
    <label className="grid gap-2 font-bold text-aan-navy">
      {label}

      {children}
    </label>
  );
}
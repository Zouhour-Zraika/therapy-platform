"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "../components/Navbar";
import { Language } from "../lib/translations";

type BookingStep = 1 | 2 | 3 | 4;

type Therapist = {
  id: string;
  full_name: string;
  full_name_ar: string | null;
  specialty: string;
  specialty_ar: string | null;
  price: number;

  // Ces colonnes sont optionnelles.
  // La page continue à fonctionner même si elles n’existent pas encore.
  gender?: string | null;
  bio?: string | null;
  bio_ar?: string | null;
};

type Slot = {
  id: string;
  day: string;
  time: string;
  therapist_id: string;
  is_booked: boolean | null;
};

type SupportOption = {
  value: string;
  en: string;
  ar: string;
  keywords: string[];
};

const supportOptions: SupportOption[] = [
  {
    value: "depression",
    en: "Depression and low mood",
    ar: "الاكتئاب وتدنّي المزاج",
    keywords: ["depression", "depressive", "low mood", "mood", "اكتئاب", "مزاج"],
  },
  {
    value: "anxiety",
    en: "Anxiety and panic",
    ar: "القلق ونوبات الهلع",
    keywords: ["anxiety", "panic", "social anxiety", "قلق", "هلع"],
  },
  {
    value: "stress",
    en: "Stress and burnout",
    ar: "الضغط النفسي والإرهاق",
    keywords: ["stress", "burnout", "work stress", "ضغط", "إرهاق"],
  },
  {
    value: "ocd",
    en: "OCD and intrusive thoughts",
    ar: "الوسواس القهري والأفكار الملحّة",
    keywords: ["ocd", "obsessive", "intrusive", "وسواس"],
  },
  {
    value: "relationships",
    en: "Relationship difficulties",
    ar: "صعوبات العلاقات",
    keywords: ["relationship", "family", "couple", "زواج", "علاقة", "أسرة"],
  },
  {
    value: "couples-therapy",
    en: "Couples therapy",
    ar: "العلاج الزوجي",
    keywords: ["couples", "couple therapy", "marriage", "زوجي", "زواج"],
  },
  {
    value: "eating-disorders",
    en: "Eating difficulties",
    ar: "اضطرابات وصعوبات الأكل",
    keywords: ["eating", "food", "anorexia", "bulimia", "أكل", "غذاء"],
  },
  {
    value: "addiction",
    en: "Addiction",
    ar: "الإدمان",
    keywords: ["addiction", "substance", "إدمان"],
  },
  {
    value: "trauma",
    en: "Trauma and difficult experiences",
    ar: "الصدمات والتجارب الصعبة",
    keywords: ["trauma", "ptsd", "grief", "loss", "صدمة", "فقدان"],
  },
  {
    value: "unsure",
    en: "I am not sure yet",
    ar: "لست متأكدًا بعد",
    keywords: [],
  },
  {
    value: "other",
    en: "Other",
    ar: "أخرى",
    keywords: [],
  },
];

const therapistPreferences = [
  {
    value: "female",
    en: "Female therapist",
    ar: "معالِجة",
  },
  {
    value: "male",
    en: "Male therapist",
    ar: "معالِج",
  },
  {
    value: "none",
    en: "No preference",
    ar: "لا يوجد تفضيل",
  },
];

const availabilityOptions = [
  {
    value: "before-noon",
    en: "Before noon",
    ar: "قبل الظهر",
    descriptionEn: "Sessions before 12:00 PM",
    descriptionAr: "الجلسات قبل الساعة 12 ظهرًا",
  },
  {
    value: "after-noon",
    en: "After noon",
    ar: "بعد الظهر",
    descriptionEn: "Sessions from 12:00 PM onward",
    descriptionAr: "الجلسات من الساعة 12 ظهرًا وما بعد",
  },
  {
    value: "earliest",
    en: "Earliest available session",
    ar: "أقرب موعد متاح",
    descriptionEn: "Show the nearest available option",
    descriptionAr: "عرض أقرب موعد متاح",
  },
  {
    value: "none",
    en: "No preference",
    ar: "لا يوجد تفضيل",
    descriptionEn: "Show all available times",
    descriptionAr: "عرض جميع المواعيد المتاحة",
  },
];

function BookingContent() {
  const searchParams = useSearchParams();
  const directTherapistId = searchParams.get("therapistId");
  const supportFromUrl = searchParams.get("support");

  const bookingSectionRef = useRef<HTMLDivElement | null>(null);

  const [language, setLanguage] = useState<Language>("en");
  const [step, setStep] = useState<BookingStep>(1);

  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [allSlots, setAllSlots] = useState<Slot[]>([]);

  const [selectedSupport, setSelectedSupport] = useState<string[]>([]);
  const [therapistPreference, setTherapistPreference] = useState("");
  const [availabilityPreference, setAvailabilityPreference] = useState("");

  const [selectedTherapist, setSelectedTherapist] =
    useState<Therapist | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [dataError, setDataError] = useState("");

  const isArabic = language === "ar";

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language;

    if (savedLanguage === "en" || savedLanguage === "ar") {
      setLanguage(savedLanguage);
    }

    const handleLanguageChange = () => {
      const updatedLanguage = localStorage.getItem("language") as Language;

      if (updatedLanguage === "en" || updatedLanguage === "ar") {
        setLanguage(updatedLanguage);
      }
    };

    window.addEventListener("storage", handleLanguageChange);

    return () => {
      window.removeEventListener("storage", handleLanguageChange);
    };
  }, []);

  useEffect(() => {
    if (
      supportFromUrl &&
      supportOptions.some((option) => option.value === supportFromUrl)
    ) {
      setSelectedSupport([supportFromUrl]);
    }
  }, [supportFromUrl]);

  useEffect(() => {
    const loadBookingData = async () => {
      setLoading(true);
      setDataError("");

      const [
        { data: therapistData, error: therapistError },
        { data: slotData, error: slotError },
      ] = await Promise.all([
        supabase.from("therapists").select("*").order("full_name"),
        supabase
          .from("availability_slots")
          .select("*")
          .eq("is_booked", false)
          .order("day", { ascending: true })
          .order("time", { ascending: true }),
      ]);

      if (therapistError || slotError) {
        console.error("Therapists error:", therapistError);
        console.error("Slots error:", slotError);

        setDataError(
          isArabic
            ? "تعذر تحميل بيانات الحجز حاليًا."
            : "We could not load the booking information.",
        );

        setLoading(false);
        return;
      }

      const loadedTherapists = (therapistData || []) as Therapist[];
      const loadedSlots = ((slotData || []) as Slot[]).filter(
        (slot) => slot.is_booked !== true,
      );

      setTherapists(loadedTherapists);
      setAllSlots(loadedSlots);

      if (directTherapistId) {
        const directTherapist =
          loadedTherapists.find(
            (therapist) => therapist.id === directTherapistId,
          ) || null;

        if (directTherapist) {
          setSelectedTherapist(directTherapist);
          setStep(4);
        }
      }

      setLoading(false);
    };

    loadBookingData();
  }, [directTherapistId, isArabic]);

  const progress = useMemo(() => {
    if (step === 4) {
      return "100%";
    }

    return `${(step / 4) * 100}%`;
  }, [step]);

  const translateDay = (day: string) => {
    if (!isArabic) {
      return day;
    }

    const days: Record<string, string> = {
      Monday: "الاثنين",
      Tuesday: "الثلاثاء",
      Wednesday: "الأربعاء",
      Thursday: "الخميس",
      Friday: "الجمعة",
      Saturday: "السبت",
      Sunday: "الأحد",
    };

    return days[day] || day;
  };

  const getTherapistName = (therapist: Therapist) => {
    if (isArabic && therapist.full_name_ar) {
      return therapist.full_name_ar;
    }

    return therapist.full_name;
  };

  const getTherapistSpecialty = (therapist: Therapist) => {
    if (isArabic && therapist.specialty_ar) {
      return therapist.specialty_ar;
    }

    return therapist.specialty;
  };

  const getTherapistBio = (therapist: Therapist) => {
    if (isArabic && therapist.bio_ar) {
      return therapist.bio_ar;
    }

    if (therapist.bio) {
      return therapist.bio;
    }

    return isArabic
      ? "معالج نفسي يقدم جلسات علاجية عبر الإنترنت في بيئة آمنة وسرية."
      : "Psychotherapist offering professional online sessions in a safe and confidential environment.";
  };

  const normalizeGender = (gender?: string | null) => {
    if (!gender) {
      return "";
    }

    const value = gender.toLowerCase().trim();

    if (
      value === "female" ||
      value === "woman" ||
      value === "f" ||
      value === "أنثى"
    ) {
      return "female";
    }

    if (
      value === "male" ||
      value === "man" ||
      value === "m" ||
      value === "ذكر"
    ) {
      return "male";
    }

    return value;
  };

  const parseTimeHour = (time: string) => {
    const normalizedTime = time.trim().toUpperCase();
    const match = normalizedTime.match(
      /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/,
    );

    if (!match) {
      return null;
    }

    let hour = Number(match[1]);
    const period = match[3];

    if (period === "PM" && hour < 12) {
      hour += 12;
    }

    if (period === "AM" && hour === 12) {
      hour = 0;
    }

    return hour;
  };

  const slotMatchesAvailability = (slot: Slot) => {
    if (
    availabilityPreference === "" ||
    availabilityPreference === "none" ||
    availabilityPreference === "earliest"
  ) {
    return true;
  }

  const hour = parseTimeHour(slot.time);

  if (hour === null) {
    return true;
  }

  if (availabilityPreference === "before-noon") {
    return hour < 12;
  }

  if (availabilityPreference === "after-noon") {
    return hour >= 12;
  }

  return true;
  };

  const therapistMatchesSupport = (therapist: Therapist) => {
    if (
      selectedSupport.length === 0 ||
      selectedSupport.includes("unsure") ||
      selectedSupport.includes("other")
    ) {
      return true;
    }

    const searchableText = [
      therapist.specialty,
      therapist.specialty_ar,
      therapist.bio,
      therapist.bio_ar,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return selectedSupport.some((selectedValue) => {
      const option = supportOptions.find(
        (support) => support.value === selectedValue,
      );

      if (!option || option.keywords.length === 0) {
        return true;
      }

      return option.keywords.some((keyword) =>
        searchableText.includes(keyword.toLowerCase()),
      );
    });
  };

  const therapistMatchesGender = (therapist: Therapist) => {
    if (
      therapistPreference === "" ||
      therapistPreference === "none"
    ) {
      return true;
    }

    const therapistGender = normalizeGender(therapist.gender);

    // Tant que le genre n'est pas enregistré en base,
    // on ne masque pas automatiquement le thérapeute.
    if (!therapistGender) {
      return true;
    }

    return therapistGender === therapistPreference;
  };

  const matchingTherapists = useMemo(() => {
    let results = therapists.filter((therapist) => {
      const therapistSlots = allSlots.filter(
        (slot) => slot.therapist_id === therapist.id,
      );

      const hasMatchingSlot = therapistSlots.some(slotMatchesAvailability);

      return (
        therapistMatchesSupport(therapist) &&
        therapistMatchesGender(therapist) &&
        hasMatchingSlot
      );
    });

    if (results.length === 0) {
      results = therapists.filter((therapist) =>
        allSlots.some((slot) => slot.therapist_id === therapist.id),
      );
    }

    return results;
  }, [
    therapists,
    allSlots,
    selectedSupport,
    therapistPreference,
    availabilityPreference,
  ]);

  const selectedTherapistSlots = useMemo(() => {
    if (!selectedTherapist) {
      return [];
    }

    let slots = allSlots.filter(
      (slot) => slot.therapist_id === selectedTherapist.id,
    );

    if (
      availabilityPreference &&
      availabilityPreference !== "none" &&
      availabilityPreference !== "earliest"
    ) {
      const preferredSlots = slots.filter(slotMatchesAvailability);

      if (preferredSlots.length > 0) {
        slots = preferredSlots;
      }
    }

    return slots;
  }, [allSlots, selectedTherapist, availabilityPreference]);

  const toggleSupport = (value: string) => {
    setSelectedSupport((current) => {
      if (value === "unsure" || value === "other") {
        return current.includes(value) ? [] : [value];
      }

      const withoutGenericChoices = current.filter(
        (item) => item !== "unsure" && item !== "other",
      );

      if (withoutGenericChoices.includes(value)) {
        return withoutGenericChoices.filter((item) => item !== value);
      }

      return [...withoutGenericChoices, value];
    });
  };

  const canContinue =
    (step === 1 && selectedSupport.length > 0) ||
    (step === 2 && therapistPreference !== "") ||
    (step === 3 && availabilityPreference !== "");

  const goNext = () => {
    if (!canContinue) {
      return;
    }

    if (step < 3) {
      setStep((current) => (current + 1) as BookingStep);
      return;
    }

    setStep(4);
    setSelectedTherapist(null);
    setSelectedSlot(null);
  };

  const goBack = () => {
    if (directTherapistId) {
      window.location.href = "/therapists";
      return;
    }

    if (step === 4 && selectedTherapist) {
      setSelectedTherapist(null);
      setSelectedSlot(null);
      return;
    }

    if (step > 1) {
      setStep((current) => (current - 1) as BookingStep);
    }
  };

  const selectTherapist = (therapist: Therapist) => {
    setSelectedTherapist(therapist);
    setSelectedSlot(null);

    window.setTimeout(() => {
      bookingSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const confirmBooking = async () => {
    if (!selectedSlot || !selectedTherapist || bookingLoading) {
      return;
    }

    setBookingLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("User error:", userError);
      }

      if (!user) {
        const returnUrl =
          window.location.pathname + window.location.search;

        sessionStorage.setItem(
          "pendingBooking",
          JSON.stringify({
            therapistId: selectedTherapist.id,
            slotId: selectedSlot.id,
            returnUrl,
          }),
        );

        window.location.href = `/login?redirect=${encodeURIComponent(
          `/booking?therapistId=${selectedTherapist.id}&slotId=${selectedSlot.id}`,
        )}`;

        return;
      }

      const therapistName = getTherapistName(selectedTherapist);

      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          patient_id: user.id,
          patient_email: user.email,
          therapist_id: selectedTherapist.id,
          slot_id: selectedSlot.id,
          therapist_name: therapistName,
          slot_day: selectedSlot.day,
          slot_time: selectedSlot.time,
          price: selectedTherapist.price,
          status: "pending",
        })
        .select()
        .single();

      if (bookingError) {
        console.error("Booking error:", bookingError);

        alert(
          isArabic
            ? "تعذر إنشاء الحجز. يرجى المحاولة مرة أخرى."
            : "We could not create your booking. Please try again.",
        );

        return;
      }

      const paymentParams = new URLSearchParams({
        bookingId: bookingData.id,
        therapist: therapistName,
        price: String(selectedTherapist.price),
        slot: `${translateDay(selectedSlot.day)} ${selectedSlot.time}`,
      });

      window.location.href = `/payment?${paymentParams.toString()}`;
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <main
        dir={isArabic ? "rtl" : "ltr"}
        className="min-h-screen bg-[#f8f4ee] text-[#223748]"
      >
        <section className="px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#b39668]">
                {isArabic
                  ? "حجز جلسة عبر الإنترنت"
                  : "BOOK AN ONLINE SESSION"}
              </p>

              <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
                {directTherapistId
                  ? isArabic
                    ? "اختر موعد جلستك"
                    : "Choose your session time"
                  : isArabic
                    ? "لنساعدك على إيجاد الخيار المناسب"
                    : "Let us help you find the right option"}
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#66727a]">
                {directTherapistId
                  ? isArabic
                    ? "اختر أحد المواعيد المتاحة. سيُطلب منك تسجيل الدخول فقط عند تأكيد الحجز."
                    : "Select an available time. You will only be asked to sign in when confirming your booking."
                  : isArabic
                    ? "أجب عن بعض الأسئلة القصيرة لنساعدك على عرض الخيارات التي تتوافق مع احتياجاتك وتفضيلاتك."
                    : "Answer a few short questions to view options that correspond to your needs, preferences, and availability."}
              </p>
            </div>

            {!directTherapistId && (
              <div className="mx-auto mt-10 max-w-5xl">
                <div className="flex items-center justify-between text-sm font-semibold text-[#69747a]">
                  <span>
                    {isArabic
                      ? `الخطوة ${step} من 4`
                      : `Step ${step} of 4`}
                  </span>

                  <span>{Math.round(Number.parseFloat(progress))}%</span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e5dccd]">
                  <div
                    className="h-full rounded-full bg-[#415a72] transition-all duration-300"
                    style={{ width: progress }}
                  />
                </div>
              </div>
            )}

            {loading ? (
              <div className="mt-10 rounded-[2rem] bg-white p-12 text-center shadow-sm">
                <p className="text-lg text-[#66727a]">
                  {isArabic
                    ? "جارٍ تحميل خيارات الحجز..."
                    : "Loading booking options..."}
                </p>
              </div>
            ) : dataError ? (
              <div className="mt-10 rounded-[2rem] border border-red-200 bg-white p-10 text-center shadow-sm">
                <p className="text-lg text-red-700">{dataError}</p>
              </div>
            ) : (
              <div className="mt-10 rounded-[2.25rem] border border-[#e3d8c7] bg-white p-6 shadow-sm sm:p-10">
                {step === 1 && (
                  <div>
                    <p className="text-sm font-semibold text-[#b39668]">
                      {isArabic ? "احتياجاتك" : "YOUR NEEDS"}
                    </p>

                    <h2 className="mt-3 text-3xl font-bold">
                      {isArabic
                        ? "ما نوع الدعم الذي تبحث عنه؟"
                        : "What would you like support with?"}
                    </h2>

                    <p className="mt-3 text-[#69747a]">
                      {isArabic
                        ? "يمكنك اختيار أكثر من إجابة."
                        : "You may select more than one option."}
                    </p>

                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                      {supportOptions.map((option) => {
                        const selected = selectedSupport.includes(option.value);

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => toggleSupport(option.value)}
                            className={`rounded-2xl border px-5 py-4 text-start font-semibold transition ${
                              selected
                                ? "border-[#415a72] bg-[#eef2f5] text-[#223748]"
                                : "border-[#e3dbcf] text-[#4f5e68] hover:border-[#b39668]"
                            }`}
                          >
                            <span className="flex items-center justify-between gap-4">
                              <span>{isArabic ? option.ar : option.en}</span>

                              <span
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-sm ${
                                  selected
                                    ? "border-[#415a72] bg-[#415a72] text-white"
                                    : "border-[#c9c0b2]"
                                }`}
                              >
                                {selected ? "✓" : ""}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <p className="text-sm font-semibold text-[#b39668]">
                      {isArabic ? "تفضيلاتك" : "YOUR PREFERENCE"}
                    </p>

                    <h2 className="mt-3 text-3xl font-bold">
                      {isArabic
                        ? "هل لديك تفضيل يتعلق بالمعالج؟"
                        : "Do you have a therapist preference?"}
                    </h2>

                    <p className="mt-3 text-[#69747a]">
                      {isArabic
                        ? "اختر ما يجعلك تشعر براحة أكبر."
                        : "Choose the option that would make you feel most comfortable."}
                    </p>

                    <div className="mt-8 grid gap-4 sm:grid-cols-3">
                      {therapistPreferences.map((option) => {
                        const selected =
                          therapistPreference === option.value;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                              setTherapistPreference(option.value)
                            }
                            className={`rounded-2xl border px-5 py-7 text-center font-semibold transition ${
                              selected
                                ? "border-[#415a72] bg-[#eef2f5] text-[#223748]"
                                : "border-[#e3dbcf] text-[#4f5e68] hover:border-[#b39668]"
                            }`}
                          >
                            {isArabic ? option.ar : option.en}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <p className="text-sm font-semibold text-[#b39668]">
                      {isArabic ? "الموعد المناسب" : "YOUR AVAILABILITY"}
                    </p>

                    <h2 className="mt-3 text-3xl font-bold">
                      {isArabic
                        ? "متى تفضّل أن تكون جلستك؟"
                        : "When would you prefer your session?"}
                    </h2>

                    <p className="mt-3 text-[#69747a]">
                      {isArabic
                        ? "سنستخدم هذا الاختيار لعرض المواعيد الأقرب إلى تفضيلاتك."
                        : "We will use this choice to show the most relevant available sessions."}
                    </p>

                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                      {availabilityOptions.map((option) => {
                        const selected =
                          availabilityPreference === option.value;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                              setAvailabilityPreference(option.value)
                            }
                            className={`rounded-2xl border px-5 py-5 text-start transition ${
                              selected
                                ? "border-[#415a72] bg-[#eef2f5]"
                                : "border-[#e3dbcf] hover:border-[#b39668]"
                            }`}
                          >
                            <span className="block font-semibold text-[#223748]">
                              {isArabic ? option.ar : option.en}
                            </span>

                            <span className="mt-1 block text-sm text-[#69747a]">
                              {isArabic
                                ? option.descriptionAr
                                : option.descriptionEn}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {step === 4 && !selectedTherapist && (
                  <div>
                    <p className="text-sm font-semibold text-[#b39668]">
                      {isArabic ? "الخيارات المتاحة" : "AVAILABLE OPTIONS"}
                    </p>

                    <h2 className="mt-3 text-3xl font-bold">
                      {isArabic
                        ? "معالجون يتوافقون مع تفضيلاتك"
                        : "Therapists matching your preferences"}
                    </h2>

                    <p className="mt-3 text-[#69747a]">
                      {isArabic
                        ? "تستند هذه النتائج إلى المعلومات والتفضيلات التي اخترتها، ولا تمثّل توصية طبية."
                        : "These results are based on the information and preferences you selected. They are not a clinical recommendation."}
                    </p>

                    {matchingTherapists.length === 0 ? (
                      <div className="mt-8 rounded-2xl bg-[#f8f4ee] p-8 text-center">
                        <p className="text-[#66727a]">
                          {isArabic
                            ? "لا توجد مواعيد متاحة حاليًا تتوافق مع اختياراتك."
                            : "There are currently no available sessions matching your choices."}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-8 grid gap-6 lg:grid-cols-2">
                        {matchingTherapists.map((therapist) => {
                          const therapistSlots = allSlots.filter(
                            (slot) =>
                              slot.therapist_id === therapist.id &&
                              slotMatchesAvailability(slot),
                          );

                          const nextSlot =
                            therapistSlots[0] ||
                            allSlots.find(
                              (slot) =>
                                slot.therapist_id === therapist.id,
                            );

                          return (
                            <article
                              key={therapist.id}
                              className="flex h-full flex-col rounded-[1.75rem] border border-[#e4dacb] bg-[#fffdf9] p-6 transition hover:-translate-y-1 hover:shadow-lg"
                            >
                              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e8decd] text-2xl font-bold text-[#415a72]">
                                {therapist.full_name
                                  .trim()
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <h3 className="mt-5 text-2xl font-bold">
                                {getTherapistName(therapist)}
                              </h3>

                              <p className="mt-2 font-semibold text-[#9e8156]">
                                {getTherapistSpecialty(therapist)}
                              </p>

                              <p className="mt-4 line-clamp-3 leading-7 text-[#68747b]">
                                {getTherapistBio(therapist)}
                              </p>

                              {nextSlot && (
                                <div className="mt-5 rounded-2xl bg-[#f3eee6] p-4">
                                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8f744d]">
                                    {isArabic
                                      ? "أقرب موعد متاح"
                                      : "NEXT AVAILABLE SESSION"}
                                  </p>

                                  <p className="mt-2 font-semibold">
                                    {translateDay(nextSlot.day)} ·{" "}
                                    {nextSlot.time}
                                  </p>
                                </div>
                              )}

                              <div className="mt-auto flex items-end justify-between gap-4 pt-6">
                                <p className="text-xl font-bold">
                                  ${therapist.price}
                                  <span className="text-sm font-normal text-[#69747a]">
                                    {isArabic ? " / جلسة" : " / session"}
                                  </span>
                                </p>

                                <button
                                  type="button"
                                  onClick={() => selectTherapist(therapist)}
                                  className="rounded-xl bg-[#415a72] px-5 py-3 font-semibold text-white transition hover:bg-[#32495f]"
                                >
                                  {isArabic
                                    ? "اختر هذا المعالج"
                                    : "Select a Session"}
                                </button>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {step === 4 && selectedTherapist && (
                  <div ref={bookingSectionRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTherapist(null);
                        setSelectedSlot(null);
                      }}
                      className="text-sm font-semibold text-[#8f744d] hover:underline"
                    >
                      {isArabic
                        ? "← العودة إلى الخيارات"
                        : "← Back to therapist options"}
                    </button>

                    <div className="mt-6 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
                      <aside className="rounded-[1.75rem] bg-[#f4eee5] p-6">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-2xl font-bold text-[#415a72]">
                          {selectedTherapist.full_name
                            .trim()
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <h2 className="mt-5 text-3xl font-bold">
                          {getTherapistName(selectedTherapist)}
                        </h2>

                        <p className="mt-2 font-semibold text-[#9e8156]">
                          {getTherapistSpecialty(selectedTherapist)}
                        </p>

                        <p className="mt-5 leading-7 text-[#68747b]">
                          {getTherapistBio(selectedTherapist)}
                        </p>

                        <div className="mt-6 border-t border-[#d9cdbb] pt-5">
                          <p className="text-sm text-[#69747a]">
                            {isArabic
                              ? "جلسة علاج نفسي عبر الإنترنت"
                              : "Online psychotherapy session"}
                          </p>

                          <p className="mt-2 text-3xl font-bold">
                            ${selectedTherapist.price}
                          </p>
                        </div>
                      </aside>

                      <section>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b39668]">
                          {isArabic
                            ? "اختر موعدًا"
                            : "SELECT A SESSION TIME"}
                        </p>

                        <h2 className="mt-3 text-3xl font-bold">
                          {isArabic
                            ? "المواعيد المتاحة"
                            : "Available sessions"}
                        </h2>

                        {selectedTherapistSlots.length === 0 ? (
                          <div className="mt-6 rounded-2xl bg-[#f8f4ee] p-7">
                            <p className="text-[#66727a]">
                              {isArabic
                                ? "لا توجد مواعيد متاحة لهذا المعالج حاليًا."
                                : "There are currently no available sessions for this therapist."}
                            </p>
                          </div>
                        ) : (
                          <div className="mt-6 grid gap-3 sm:grid-cols-2">
                            {selectedTherapistSlots.map((slot) => {
                              const selected =
                                selectedSlot?.id === slot.id;

                              return (
                                <button
                                  key={slot.id}
                                  type="button"
                                  onClick={() => setSelectedSlot(slot)}
                                  className={`rounded-2xl border px-5 py-4 text-start font-semibold transition ${
                                    selected
                                      ? "border-[#415a72] bg-[#415a72] text-white"
                                      : "border-[#ddd2c2] text-[#415a72] hover:border-[#b39668] hover:bg-[#f8f4ee]"
                                  }`}
                                >
                                  <span className="block">
                                    {translateDay(slot.day)}
                                  </span>

                                  <span
                                    className={`mt-1 block text-sm ${
                                      selected
                                        ? "text-white/75"
                                        : "text-[#69747a]"
                                    }`}
                                  >
                                    {slot.time}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {selectedSlot && (
                          <div className="mt-6 rounded-2xl border border-[#dfd4c4] bg-[#fffdf9] p-5">
                            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#8f744d]">
                              {isArabic
                                ? "ملخص الحجز"
                                : "BOOKING SUMMARY"}
                            </p>

                            <div className="mt-4 space-y-2 text-[#56636c]">
                              <p>
                                <strong className="text-[#223748]">
                                  {isArabic ? "المعالج: " : "Therapist: "}
                                </strong>

                                {getTherapistName(selectedTherapist)}
                              </p>

                              <p>
                                <strong className="text-[#223748]">
                                  {isArabic ? "الموعد: " : "Session: "}
                                </strong>

                                {translateDay(selectedSlot.day)} ·{" "}
                                {selectedSlot.time}
                              </p>

                              <p>
                                <strong className="text-[#223748]">
                                  {isArabic ? "الإجمالي: " : "Total: "}
                                </strong>

                                ${selectedTherapist.price}
                              </p>
                            </div>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={confirmBooking}
                          disabled={!selectedSlot || bookingLoading}
                          className="mt-7 w-full rounded-2xl bg-[#415a72] px-7 py-4 text-lg font-semibold text-white shadow-md transition hover:bg-[#32495f] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {bookingLoading
                            ? isArabic
                              ? "جارٍ المتابعة..."
                              : "Continuing..."
                            : isArabic
                              ? "متابعة الحجز"
                              : "Continue Booking"}
                        </button>

                        <p className="mt-4 text-center text-sm leading-6 text-[#69747a]">
                          {isArabic
                            ? "سيُطلب منك تسجيل الدخول أو إنشاء حساب فقط بعد اختيار الموعد."
                            : "You will only be asked to sign in or create an account after selecting a session."}
                        </p>
                      </section>
                    </div>
                  </div>
                )}

                {!directTherapistId && step < 4 && (
                  <div className="mt-10 flex flex-col-reverse gap-3 border-t border-[#ece4d8] pt-7 sm:flex-row sm:justify-between">
                    <button
                      type="button"
                      onClick={goBack}
                      disabled={step === 1}
                      className="rounded-2xl border border-[#cfc4b4] px-7 py-3 font-semibold text-[#415a72] transition hover:bg-[#f6f1e9] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isArabic ? "السابق" : "Back"}
                    </button>

                    <button
                      type="button"
                      onClick={goNext}
                      disabled={!canContinue}
                      className="rounded-2xl bg-[#415a72] px-8 py-3 font-semibold text-white shadow-md transition hover:bg-[#32495f] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {step === 3
                        ? isArabic
                          ? "عرض الخيارات"
                          : "View Available Options"
                        : isArabic
                          ? "التالي"
                          : "Continue"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {!directTherapistId && (
              <p className="mx-auto mt-7 max-w-3xl text-center text-sm leading-7 text-[#6b7479]">
                {isArabic
                  ? "تساعد هذه الأسئلة على تصفية الخيارات وفقًا لاحتياجاتك وتفضيلاتك. ولا تمثل توصية أو تشخيصًا طبيًا."
                  : "These questions help filter available options according to your needs and preferences. They do not provide a clinical recommendation or diagnosis."}
              </p>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f8f4ee] p-10 text-center text-[#223748]">
          <p className="text-lg">Loading booking...</p>
        </main>
      }
    >
      <BookingContent />
    </Suspense>
  );
}
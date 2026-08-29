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
import { useLanguage } from "@/i18n/LanguageProvider";
import type { TranslationKey } from "@/i18n/config";
import Navbar from "../components/Navbar";

type BookingStep = 1 | 2 | 3 | 4;

type Therapist = {
  id: string;
  full_name: string;
  full_name_ar: string | null;
  specialty: string;
  specialty_ar: string | null;
  price: number;

  work_status:
    | "active"
    | "leaving"
    | "inactive";

  gender?: string | null;
  bio?: string | null;
  bio_ar?: string | null;
};

type Slot = {
  id: string;
  slot_date: string | null;
  day: string;
  time: string;
  therapist_id: string;
  is_booked: boolean | null;
  starts_at: string | null;
  ends_at: string | null;
};

type SupportOption = {
  value: string;
  keywords: string[];
};

const supportOptions: SupportOption[] = [
  {
    value: "depression",
    keywords: [
      "depression",
      "depressive",
      "low mood",
      "mood",
      "اكتئاب",
      "مزاج",
    ],
  },
  {
    value: "anxiety",
    keywords: [
      "anxiety",
      "panic",
      "social anxiety",
      "قلق",
      "هلع",
    ],
  },
  {
    value: "stress",
    keywords: [
      "stress",
      "burnout",
      "work stress",
      "ضغط",
      "إرهاق",
    ],
  },
  {
    value: "ocd",
    keywords: [
      "ocd",
      "obsessive",
      "intrusive",
      "وسواس",
    ],
  },
  {
    value: "relationships",
    keywords: [
      "relationship",
      "family",
      "couple",
      "زواج",
      "علاقة",
      "أسرة",
    ],
  },
  {
    value: "couples-therapy",
    keywords: [
      "couples",
      "couple therapy",
      "marriage",
      "زوجي",
      "زواج",
    ],
  },
  {
    value: "eating-disorders",
    keywords: [
      "eating",
      "food",
      "anorexia",
      "bulimia",
      "أكل",
      "غذاء",
    ],
  },
  {
    value: "addiction",
    keywords: [
      "addiction",
      "substance",
      "إدمان",
    ],
  },
  {
    value: "trauma",
    keywords: [
      "trauma",
      "ptsd",
      "grief",
      "loss",
      "صدمة",
      "فقدان",
    ],
  },
  {
    value: "unsure",
    keywords: [],
  },
  {
    value: "other",
    keywords: [],
  },
];

const therapistPreferences = [
  { value: "female" },
  { value: "male" },
  { value: "none" },
] as const;

const availabilityOptions = [
  { value: "before-noon" },
  { value: "after-noon" },
  { value: "earliest" },
  { value: "none" },
] as const;

const FALLBACK_TIME_ZONES = [
  "Asia/Beirut",
  "Europe/Paris",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Rome",
  "Europe/Madrid",
  "Europe/Athens",
  "Asia/Dubai",
  "Asia/Riyadh",
  "Asia/Qatar",
  "Asia/Kuwait",
  "Asia/Amman",
  "Asia/Jerusalem",
  "Africa/Cairo",
  "Africa/Casablanca",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Vancouver",
  "America/Sao_Paulo",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
] as const;

function BookingContent() {
  const searchParams = useSearchParams();

  const directTherapistId =
    searchParams.get("therapistId");

  const directSlotId =
    searchParams.get("slotId");

  const supportFromUrl =
    searchParams.get("support");

  const bookingSectionRef =
    useRef<HTMLDivElement | null>(null);

  const { language, isArabic, t } = useLanguage();

  const translate = (key: string) => {
    return t(key as TranslationKey);
  };

  const [step, setStep] =
    useState<BookingStep>(1);

  const [therapists, setTherapists] =
    useState<Therapist[]>([]);

  const [allSlots, setAllSlots] =
    useState<Slot[]>([]);

  const [
    selectedSupport,
    setSelectedSupport,
  ] = useState<string[]>([]);

  const [
    therapistPreference,
    setTherapistPreference,
  ] = useState("");

  const [
    availabilityPreference,
    setAvailabilityPreference,
  ] = useState("");

  const [
    selectedTherapist,
    setSelectedTherapist,
  ] = useState<Therapist | null>(null);

  const [
    selectedSlot,
    setSelectedSlot,
  ] = useState<Slot | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [
    bookingLoading,
    setBookingLoading,
  ] = useState(false);

  const [
    dataError,
    setDataError,
  ] = useState("");

  const [
    selectedTimeZone,
    setSelectedTimeZone,
  ] = useState("Asia/Beirut");

  const [
    timeZoneReady,
    setTimeZoneReady,
  ] = useState(false);

  useEffect(() => {
    try {
      const savedTimeZone =
        window.localStorage.getItem(
          "aan_booking_timezone",
        );

      const detectedTimeZone =
        Intl.DateTimeFormat()
          .resolvedOptions()
          .timeZone;

      const initialTimeZone =
        savedTimeZone ||
        detectedTimeZone ||
        "Asia/Beirut";

      setSelectedTimeZone(
        initialTimeZone,
      );
    } catch {
      setSelectedTimeZone(
        "Asia/Beirut",
      );
    } finally {
      setTimeZoneReady(true);
    }
  }, []);

  useEffect(() => {
    if (
      supportFromUrl &&
      supportOptions.some(
        (option) =>
          option.value === supportFromUrl,
      )
    ) {
      setSelectedSupport([
        supportFromUrl,
      ]);
    }
  }, [supportFromUrl]);

  useEffect(() => {
    const loadBookingData = async () => {
      setLoading(true);
      setDataError("");

      const [
        {
          data: therapistData,
          error: therapistError,
        },
        {
          data: slotData,
          error: slotError,
        },
      ] = await Promise.all([
        supabase
          .from("therapists")
          .select("*")
          .eq("work_status", "active")
          .order("full_name"),

        supabase
          .from("availability_slots")
          .select("*")
          .eq("is_booked", false)
          .order("slot_date", {
            ascending: true,
          })
          .order("time", {
            ascending: true,
          }),
      ]);

      if (
        therapistError ||
        slotError
      ) {
        console.error(
          "Therapists error:",
          therapistError,
        );

        console.error(
          "Slots error:",
          slotError,
        );

        setDataError(
          t("booking.errors.load"),
        );

        setLoading(false);
        return;
      }

      const loadedTherapists =
        (therapistData || []) as Therapist[];

      const loadedSlots =
        ((slotData || []) as Slot[]).filter(
          (slot) =>
            slot.is_booked !== true &&
            isSlotInFuture(
              slot,
            ),
        );

      setTherapists(
        loadedTherapists,
      );

      setAllSlots(
        loadedSlots,
      );

      if (directTherapistId) {
        const directTherapist =
          loadedTherapists.find(
            (therapist) =>
              therapist.id ===
              directTherapistId,
          ) || null;

        if (directTherapist) {
          setSelectedTherapist(
            directTherapist,
          );

          setStep(4);

          if (directSlotId) {
            const directSlot =
              loadedSlots.find(
                (slot) =>
                  slot.id ===
                    directSlotId &&
                  slot.therapist_id ===
                    directTherapist.id,
              ) || null;

            setSelectedSlot(
              directSlot,
            );
          }
        }
      }

      setLoading(false);
    };

    void loadBookingData();
  }, [
    directTherapistId,
    directSlotId,
    t,
  ]);

  const progress =
    useMemo(() => {
      if (step === 4) {
        return "100%";
      }

      return `${(step / 4) * 100}%`;
    }, [step]);

  const translateDay = (
    day: string,
  ) => {
    const key =
      `booking.days.${day.toLowerCase()}`;

    const translatedDay =
      translate(key);

    return translatedDay === key
      ? day
      : translatedDay;
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

  const getSupportedTimeZones = () => {
    try {
      const intlWithSupportedValues =
        Intl as typeof Intl & {
          supportedValuesOf?: (
            key: string,
          ) => string[];
        };

      const zones =
        intlWithSupportedValues.supportedValuesOf?.(
          "timeZone",
        );

      if (
        zones &&
        zones.length > 0
      ) {
        return zones;
      }
    } catch {
      // Fallback below.
    }

    return [
      ...FALLBACK_TIME_ZONES,
    ];
  };

  const timeZoneOptions =
    useMemo(() => {
      const zones =
        getSupportedTimeZones();

      if (
        !zones.includes(
          selectedTimeZone,
        )
      ) {
        return [
          selectedTimeZone,
          ...zones,
        ];
      }

      return zones;
    }, [
      selectedTimeZone,
    ]);

  const getTimeZoneOffsetLabel = (
    timeZone: string,
    date = new Date(),
  ) => {
    try {
      const parts =
        new Intl.DateTimeFormat(
          "en-US",
          {
            timeZone,
            timeZoneName:
              "shortOffset",
          },
        ).formatToParts(
          date,
        );

      const zoneName =
        parts.find(
          (part) =>
            part.type ===
            "timeZoneName",
        )?.value;

      return zoneName
        ? zoneName.replace(
            "GMT",
            "UTC",
          )
        : "";
    } catch {
      return "";
    }
  };

  const formatTimeZoneName = (
    timeZone: string,
  ) => {
    const offset =
      getTimeZoneOffsetLabel(
        timeZone,
      );

    return offset
      ? `${timeZone} (${offset})`
      : timeZone;
  };

  const formatSlotDate = (
    slot: Slot,
  ) => {
    const start =
      getScheduledStart(
        slot,
      );

    if (start) {
      return new Intl.DateTimeFormat(
        getLocale(),
        {
          timeZone:
            selectedTimeZone,
          weekday:
            "long",
          day:
            "numeric",
          month:
            "long",
          year:
            "numeric",
        },
      ).format(
        start,
      );
    }

    if (!slot.slot_date) {
      return translateDay(
        slot.day,
      );
    }

    return new Intl.DateTimeFormat(
      getLocale(),
      {
        weekday:
          "long",
        day:
          "numeric",
        month:
          "long",
        year:
          "numeric",
      },
    ).format(
      new Date(
        `${slot.slot_date}T12:00:00`,
      ),
    );
  };

  const formatSlotTime = (
    slot: Slot,
  ) => {
    const start =
      getScheduledStart(
        slot,
      );

    if (!start) {
      return slot.time;
    }

    return new Intl.DateTimeFormat(
      getLocale(),
      {
        timeZone:
          selectedTimeZone,
        hour:
          "2-digit",
        minute:
          "2-digit",
        hourCycle:
          "h23",
      },
    ).format(
      start,
    );
  };

  const formatBeirutTime = (
    slot: Slot,
  ) => {
    const start =
      getScheduledStart(
        slot,
      );

    if (!start) {
      return slot.time;
    }

    return new Intl.DateTimeFormat(
      getLocale(),
      {
        timeZone:
          "Asia/Beirut",
        hour:
          "2-digit",
        minute:
          "2-digit",
        hourCycle:
          "h23",
      },
    ).format(
      start,
    );
  };

  const handleTimeZoneChange = (
    value: string,
  ) => {
    setSelectedTimeZone(
      value,
    );

    try {
      window.localStorage.setItem(
        "aan_booking_timezone",
        value,
      );
    } catch {
      // The selector still works even if storage is unavailable.
    }
  };

  const getTimeZoneOffsetMs = (
    date: Date,
    timeZone: string,
  ) => {
    const formatter =
      new Intl.DateTimeFormat(
        "en-US",
        {
          timeZone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hourCycle: "h23",
        },
      );

    const parts =
      formatter.formatToParts(
        date,
      );

    const values =
      Object.fromEntries(
        parts
          .filter(
            (part) =>
              part.type !==
              "literal",
          )
          .map(
            (part) => [
              part.type,
              part.value,
            ],
          ),
      );

    const asUtc = Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
      Number(values.second),
    );

    return (
      asUtc -
      date.getTime()
    );
  };

  const parseSlotTime = (
    time: string,
  ) => {
    const normalized =
      time
        .trim()
        .toUpperCase();

    const match =
      normalized.match(
        /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/,
      );

    if (!match) {
      return null;
    }

    let hour =
      Number(match[1]);

    const minute =
      Number(
        match[2] || "0",
      );

    const period =
      match[3];

    if (
      Number.isNaN(hour) ||
      Number.isNaN(minute) ||
      minute < 0 ||
      minute > 59
    ) {
      return null;
    }

    if (period) {
      if (
        hour < 1 ||
        hour > 12
      ) {
        return null;
      }

      if (
        period === "PM" &&
        hour < 12
      ) {
        hour += 12;
      }

      if (
        period === "AM" &&
        hour === 12
      ) {
        hour = 0;
      }
    } else if (
      hour < 0 ||
      hour > 23
    ) {
      return null;
    }

    return {
      hour,
      minute,
    };
  };

  const getScheduledStart = (
    slot: Slot,
  ) => {
    if (slot.starts_at) {
      const existingStart =
        new Date(
          slot.starts_at,
        );

      if (
        !Number.isNaN(
          existingStart.getTime(),
        )
      ) {
        return existingStart;
      }
    }

    if (!slot.slot_date) {
      return null;
    }

    const parsedTime =
      parseSlotTime(
        slot.time,
      );

    if (!parsedTime) {
      return null;
    }

    const [
      year,
      month,
      day,
    ] =
      slot.slot_date
        .split("-")
        .map(Number);

    if (
      !year ||
      !month ||
      !day
    ) {
      return null;
    }

    const timeZone =
      "Asia/Beirut";

    const utcGuess =
      new Date(
        Date.UTC(
          year,
          month - 1,
          day,
          parsedTime.hour,
          parsedTime.minute,
          0,
        ),
      );

    let offset =
      getTimeZoneOffsetMs(
        utcGuess,
        timeZone,
      );

    let result =
      new Date(
        utcGuess.getTime() -
          offset,
      );

    const correctedOffset =
      getTimeZoneOffsetMs(
        result,
        timeZone,
      );

    if (
      correctedOffset !==
      offset
    ) {
      offset =
        correctedOffset;

      result =
        new Date(
          utcGuess.getTime() -
            offset,
        );
    }

    return result;
  };


  const isSlotInFuture = (
    slot: Slot,
  ) => {
    const start =
      getScheduledStart(
        slot,
      );

    if (!start) {
      return false;
    }

    return (
      start.getTime() >
      Date.now()
    );
  };
    const getTherapistName = (
    therapist: Therapist,
  ) => {
    if (
      isArabic &&
      therapist.full_name_ar
    ) {
      return therapist.full_name_ar;
    }

    return therapist.full_name;
  };

  const getTherapistSpecialty = (
    therapist: Therapist,
  ) => {
    if (
      isArabic &&
      therapist.specialty_ar
    ) {
      return therapist.specialty_ar;
    }

    return therapist.specialty;
  };

  const getTherapistBio = (
    therapist: Therapist,
  ) => {
    if (
      isArabic &&
      therapist.bio_ar
    ) {
      return therapist.bio_ar;
    }

    if (therapist.bio) {
      return therapist.bio;
    }

    return t(
      "booking.therapists.defaultBio",
    );
  };

  const normalizeGender = (
    gender?: string | null,
  ) => {
    if (!gender) {
      return "";
    }

    const value =
      gender
        .toLowerCase()
        .trim();

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

  const parseTimeHour = (
    time: string,
  ) => {
    const parsed =
      parseSlotTime(
        time,
      );

    if (!parsed) {
      return null;
    }

    return parsed.hour;
  };

  const slotMatchesAvailability = (
    slot: Slot,
  ) => {
    if (
      availabilityPreference ===
        "" ||
      availabilityPreference ===
        "none" ||
      availabilityPreference ===
        "earliest"
    ) {
      return true;
    }

    const start =
      getScheduledStart(
        slot,
      );

    let hour: number | null =
      null;

    if (start) {
      try {
        const parts =
          new Intl.DateTimeFormat(
            "en-US",
            {
              timeZone:
                selectedTimeZone,
              hour:
                "2-digit",
              hourCycle:
                "h23",
            },
          ).formatToParts(
            start,
          );

        const hourValue =
          parts.find(
            (part) =>
              part.type ===
              "hour",
          )?.value;

        if (hourValue) {
          hour =
            Number(
              hourValue,
            );
        }
      } catch {
        hour = null;
      }
    }

    if (
      hour === null ||
      Number.isNaN(hour)
    ) {
      hour =
        parseTimeHour(
          slot.time,
        );
    }

    if (hour === null) {
      return true;
    }

    if (
      availabilityPreference ===
      "before-noon"
    ) {
      return hour < 12;
    }

    if (
      availabilityPreference ===
      "after-noon"
    ) {
      return hour >= 12;
    }

    return true;
  };

  const therapistMatchesSupport = (
    therapist: Therapist,
  ) => {
    if (
      selectedSupport.length === 0 ||
      selectedSupport.includes(
        "unsure",
      ) ||
      selectedSupport.includes(
        "other",
      )
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

    return selectedSupport.some(
      (selectedValue) => {
        const option =
          supportOptions.find(
            (support) =>
              support.value ===
              selectedValue,
          );

        if (
          !option ||
          option.keywords.length === 0
        ) {
          return true;
        }

        return option.keywords.some(
          (keyword) =>
            searchableText.includes(
              keyword.toLowerCase(),
            ),
        );
      },
    );
  };

  const therapistMatchesGender = (
    therapist: Therapist,
  ) => {
    if (
      therapistPreference === "" ||
      therapistPreference === "none"
    ) {
      return true;
    }

    const therapistGender =
      normalizeGender(
        therapist.gender,
      );

    if (!therapistGender) {
      return true;
    }

    return (
      therapistGender ===
      therapistPreference
    );
  };

  const matchingTherapists =
    useMemo(() => {
      let results =
        therapists.filter(
          (therapist) => {
            const therapistSlots =
              allSlots.filter(
                (slot) =>
                  slot.therapist_id ===
                  therapist.id,
              );

            const hasMatchingSlot =
              therapistSlots.some(
                slotMatchesAvailability,
              );

            return (
              therapistMatchesSupport(
                therapist,
              ) &&
              therapistMatchesGender(
                therapist,
              ) &&
              hasMatchingSlot
            );
          },
        );

      if (
        results.length === 0
      ) {
        results =
          therapists.filter(
            (therapist) =>
              allSlots.some(
                (slot) =>
                  slot.therapist_id ===
                  therapist.id,
              ),
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

  const selectedTherapistSlots =
    useMemo(() => {
      if (!selectedTherapist) {
        return [];
      }

      let slots =
        allSlots.filter(
          (slot) =>
            slot.therapist_id ===
            selectedTherapist.id,
        );

      if (
        availabilityPreference &&
        availabilityPreference !==
          "none" &&
        availabilityPreference !==
          "earliest"
      ) {
        const preferredSlots =
          slots.filter(
            slotMatchesAvailability,
          );

        if (
          preferredSlots.length > 0
        ) {
          slots =
            preferredSlots;
        }
      }

      return slots;
    }, [
      allSlots,
      selectedTherapist,
      availabilityPreference,
    ]);

  const toggleSupport = (
    value: string,
  ) => {
    setSelectedSupport(
      (current) => {
        if (
          value === "unsure" ||
          value === "other"
        ) {
          return current.includes(
            value,
          )
            ? []
            : [value];
        }

        const withoutGenericChoices =
          current.filter(
            (item) =>
              item !== "unsure" &&
              item !== "other",
          );

        if (
          withoutGenericChoices.includes(
            value,
          )
        ) {
          return withoutGenericChoices.filter(
            (item) =>
              item !== value,
          );
        }

        return [
          ...withoutGenericChoices,
          value,
        ];
      },
    );
  };

  const canContinue =
    (step === 1 &&
      selectedSupport.length > 0) ||
    (step === 2 &&
      therapistPreference !== "") ||
    (step === 3 &&
      availabilityPreference !== "");

  const goNext = () => {
    if (!canContinue) {
      return;
    }

    if (step < 3) {
      setStep(
        (current) =>
          (current + 1) as BookingStep,
      );

      return;
    }

    setStep(4);
    setSelectedTherapist(null);
    setSelectedSlot(null);
  };

  const goBack = () => {
    if (directTherapistId) {
      window.location.href =
        "/therapists";

      return;
    }

    if (
      step === 4 &&
      selectedTherapist
    ) {
      setSelectedTherapist(
        null,
      );

      setSelectedSlot(null);

      return;
    }

    if (step > 1) {
      setStep(
        (current) =>
          (current - 1) as BookingStep,
      );
    }
  };

  const selectTherapist = (
    therapist: Therapist,
  ) => {
    setSelectedTherapist(
      therapist,
    );

    setSelectedSlot(null);

    window.setTimeout(() => {
      bookingSectionRef.current?.scrollIntoView(
        {
          behavior: "smooth",
          block: "start",
        },
      );
    }, 100);
  };

  const confirmBooking =
    async () => {
      if (
        !selectedSlot ||
        !selectedTherapist ||
        bookingLoading
      ) {
        return;
      }

      if (
        !isSlotInFuture(
          selectedSlot,
        )
      ) {
        setAllSlots(
          (
            current,
          ) =>
            current.filter(
              (
                slot,
              ) =>
                slot.id !==
                selectedSlot.id,
            ),
        );

        setSelectedSlot(
          null,
        );

        alert(
          language === "ar"
            ? "هذا الموعد أصبح في الماضي ولم يعد متاحاً للحجز."
            : language === "fr"
              ? "Ce créneau est maintenant passé et n’est plus disponible à la réservation."
              : "This slot is now in the past and is no longer available for booking.",
        );

        return;
      }

      setBookingLoading(true);

      try {
        const {
          data: {
            user,
          },
          error:
            userError,
        } =
          await supabase.auth.getUser();

        if (userError) {
          console.error(
            "User error:",
            userError,
          );
        }

        if (!user) {
          const returnUrl =
            window.location.pathname +
            window.location.search;

          sessionStorage.setItem(
            "pendingBooking",
            JSON.stringify({
              therapistId:
                selectedTherapist.id,

              slotId:
                selectedSlot.id,

              returnUrl,
            }),
          );

          window.location.href =
            `/login?redirect=${encodeURIComponent(
              `/booking?therapistId=${selectedTherapist.id}&slotId=${selectedSlot.id}`,
            )}`;

          return;
        }

        /*
         * IMPORTANT :
         *
         * La réservation temporaire n'est plus
         * créée directement depuis le navigateur.
         *
         * L'API serveur /api/booking/hold doit :
         * - vérifier que le spécialiste est active ;
         * - relire le vrai prix dans Supabase ;
         * - vérifier que le créneau est encore libre ;
         * - créer un hold de paiement de 10 minutes ;
         * - empêcher deux patients de réserver
         *   le même créneau en même temps ;
         * - retourner bookingId + holdExpiresAt.
         *
         * Si le paiement n'est pas effectué dans
         * les 10 minutes, le hold doit expirer et
         * le créneau doit redevenir disponible.
         */
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
          console.error(
            "Session error:",
            sessionError,
          );

          alert(
            language === "ar"
              ? "انتهت جلستك. يرجى تسجيل الدخول من جديد."
              : language === "fr"
                ? "Votre session a expiré. Veuillez vous reconnecter."
                : "Your session has expired. Please sign in again.",
          );

          window.location.href =
            "/login";

          return;
        }

        const response =
          await fetch(
            "/api/booking/hold",
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
                  therapistId:
                    selectedTherapist.id,

                  slotId:
                    selectedSlot.id,

                  language,
                }),
            },
          );

        const result =
          await response.json();

        if (!response.ok) {
          console.error(
            "Booking hold error:",
            result,
          );

          if (
            response.status ===
            409
          ) {
            setAllSlots(
              (
                current,
              ) =>
                current.filter(
                  (
                    slot,
                  ) =>
                    slot.id !==
                    selectedSlot.id,
                ),
            );

            setSelectedSlot(
              null,
            );

            alert(
              language === "ar"
                ? "هذا الموعد لم يعد متاحاً. يرجى اختيار موعد آخر."
                : language === "fr"
                  ? "Ce créneau n’est plus disponible. Veuillez en choisir un autre."
                  : "This slot is no longer available. Please choose another slot.",
            );

            return;
          }

          alert(
            result.error ||
              (language === "ar"
                ? "تعذر بدء حجز هذا الموعد. يرجى المحاولة مرة أخرى."
                : language === "fr"
                  ? "Impossible de préparer cette réservation. Veuillez réessayer."
                  : "Unable to prepare this booking. Please try again."),
          );

          return;
        }

        const bookingId =
          String(
            result.bookingId ||
              result.booking?.id ||
              "",
          );

        if (!bookingId) {
          console.error(
            "Booking hold response is missing bookingId:",
            result,
          );

          alert(
            language === "ar"
              ? "تعذر إنشاء الحجز المؤقت."
              : language === "fr"
                ? "Impossible de créer la réservation temporaire."
                : "Unable to create the temporary booking.",
          );

          return;
        }

        const therapistName =
          String(
            result.therapistName ||
              result.booking
                ?.therapist_name ||
              getTherapistName(
                selectedTherapist,
              ),
          );

        const currentPrice =
          Number(
            result.price ??
              result.booking?.price ??
              selectedTherapist.price,
          );

        const slotLabel =
          String(
            result.slotLabel ||
              `${formatSlotDate(
                selectedSlot,
              )} ${formatSlotTime(
                selectedSlot,
              )} (${selectedTimeZone})`,
          );

        const holdExpiresAt =
          typeof result.holdExpiresAt ===
            "string"
            ? result.holdExpiresAt
            : "";

        /*
         * On retire localement le créneau
         * pendant le hold.
         *
         * Le serveur reste la source de vérité.
         */
        setAllSlots(
          (
            current,
          ) =>
            current.filter(
              (
                slot,
              ) =>
                slot.id !==
                selectedSlot.id,
            ),
        );

        const paymentParams =
          new URLSearchParams({
            bookingId,

            therapist:
              therapistName,

            price:
              String(
                currentPrice,
              ),

            slot:
              slotLabel,

            timeZone:
              selectedTimeZone,
          });

        if (holdExpiresAt) {
          paymentParams.set(
            "holdUntil",
            holdExpiresAt,
          );
        }

        window.location.href =
          `/payment?${paymentParams.toString()}`;
      } catch (error) {
        console.error(
          "Booking hold error:",
          error,
        );

        alert(
          language === "ar"
            ? "حدث خطأ أثناء تحضير الحجز. يرجى المحاولة مرة أخرى."
            : language === "fr"
              ? "Une erreur est survenue pendant la préparation de la réservation. Veuillez réessayer."
              : "An error occurred while preparing the booking. Please try again.",
        );
      } finally {
        setBookingLoading(
          false,
        );
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
                {t("booking.hero.eyebrow")}
              </p>

              <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
                {directTherapistId
                  ? t(
                      "booking.hero.directTitle",
                    )
                  : t(
                      "booking.hero.title",
                    )}
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#66727a]">
                {directTherapistId
                  ? t(
                      "booking.hero.directDescription",
                    )
                  : t(
                      "booking.hero.description",
                    )}
              </p>
            </div>

            {!directTherapistId && (
              <div className="mx-auto mt-10 max-w-5xl">
                <div className="flex items-center justify-between text-sm font-semibold text-[#69747a]">
                  <span>
                    {t(
                      "booking.progress",
                    )
                      .replace(
                        "{step}",
                        String(step),
                      )
                      .replace(
                        "{total}",
                        "4",
                      )}
                  </span>

                  <span>
                    {Math.round(
                      Number.parseFloat(
                        progress,
                      ),
                    )}
                    %
                  </span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e5dccd]">
                  <div
                    className="h-full rounded-full bg-[#415a72] transition-all duration-300"
                    style={{
                      width: progress,
                    }}
                  />
                </div>
              </div>
            )}

            {loading ? (
              <div className="mt-10 rounded-[2rem] bg-white p-12 text-center shadow-sm">
                <p className="text-lg text-[#66727a]">
                  {t(
                    "booking.loading",
                  )}
                </p>
              </div>
            ) : dataError ? (
              <div className="mt-10 rounded-[2rem] border border-red-200 bg-white p-10 text-center shadow-sm">
                <p className="text-lg text-red-700">
                  {dataError}
                </p>
              </div>
            ) : (
              <div className="mt-10 rounded-[2.25rem] border border-[#e3d8c7] bg-white p-6 shadow-sm sm:p-10">
                {/* Step 1 */}

                {step === 1 && (
                  <div>
                    <p className="text-sm font-semibold text-[#b39668]">
                      {t(
                        "booking.steps.support.eyebrow",
                      )}
                    </p>

                    <h2 className="mt-3 text-3xl font-bold">
                      {t(
                        "booking.steps.support.title",
                      )}
                    </h2>

                    <p className="mt-3 text-[#69747a]">
                      {t(
                        "booking.steps.support.description",
                      )}
                    </p>

                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                      {supportOptions.map(
                        (option) => {
                          const selected =
                            selectedSupport.includes(
                              option.value,
                            );

                          return (
                            <button
                              key={
                                option.value
                              }
                              type="button"
                              onClick={() =>
                                toggleSupport(
                                  option.value,
                                )
                              }
                              className={`rounded-2xl border px-5 py-4 text-start font-semibold transition ${
                                selected
                                  ? "border-[#415a72] bg-[#eef2f5] text-[#223748]"
                                  : "border-[#e3dbcf] text-[#4f5e68] hover:border-[#b39668]"
                              }`}
                            >
                              <span className="flex items-center justify-between gap-4">
                                <span>
                                  {translate(
                                    `booking.supportOptions.${option.value}`,
                                  )}
                                </span>

                                <span
                                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-sm ${
                                    selected
                                      ? "border-[#415a72] bg-[#415a72] text-white"
                                      : "border-[#c9c0b2]"
                                  }`}
                                >
                                  {selected
                                    ? "✓"
                                    : ""}
                                </span>
                              </span>
                            </button>
                          );
                        },
                      )}
                    </div>
                  </div>
                )}

                {/* Step 2 */}

                {step === 2 && (
                  <div>
                    <p className="text-sm font-semibold text-[#b39668]">
                      {t(
                        "booking.steps.therapist.eyebrow",
                      )}
                    </p>

                    <h2 className="mt-3 text-3xl font-bold">
                      {t(
                        "booking.steps.therapist.title",
                      )}
                    </h2>

                    <p className="mt-3 text-[#69747a]">
                      {t(
                        "booking.steps.therapist.description",
                      )}
                    </p>

                    <div className="mt-8 grid gap-4 sm:grid-cols-3">
                      {therapistPreferences.map(
                        (option) => {
                          const selected =
                            therapistPreference ===
                            option.value;

                          return (
                            <button
                              key={
                                option.value
                              }
                              type="button"
                              onClick={() =>
                                setTherapistPreference(
                                  option.value,
                                )
                              }
                              className={`rounded-2xl border px-5 py-7 text-center font-semibold transition ${
                                selected
                                  ? "border-[#415a72] bg-[#eef2f5] text-[#223748]"
                                  : "border-[#e3dbcf] text-[#4f5e68] hover:border-[#b39668]"
                              }`}
                            >
                              {translate(
                                `booking.therapistPreferences.${option.value}`,
                              )}
                            </button>
                          );
                        },
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3 */}

                {step === 3 && (
                  <div>
                    <p className="text-sm font-semibold text-[#b39668]">
                      {t(
                        "booking.steps.availability.eyebrow",
                      )}
                    </p>

                    <h2 className="mt-3 text-3xl font-bold">
                      {t(
                        "booking.steps.availability.title",
                      )}
                    </h2>

                    <p className="mt-3 text-[#69747a]">
                      {t(
                        "booking.steps.availability.description",
                      )}
                    </p>

                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                      {availabilityOptions.map(
                        (option) => {
                          const selected =
                            availabilityPreference ===
                            option.value;

                          return (
                            <button
                              key={
                                option.value
                              }
                              type="button"
                              onClick={() =>
                                setAvailabilityPreference(
                                  option.value,
                                )
                              }
                              className={`rounded-2xl border px-5 py-5 text-start transition ${
                                selected
                                  ? "border-[#415a72] bg-[#eef2f5]"
                                  : "border-[#e3dbcf] hover:border-[#b39668]"
                              }`}
                            >
                              <span className="block font-semibold text-[#223748]">
                                {translate(
                                  `booking.availabilityOptions.${option.value}.title`,
                                )}
                              </span>

                              <span className="mt-1 block text-sm text-[#69747a]">
                                {translate(
                                  `booking.availabilityOptions.${option.value}.description`,
                                )}
                              </span>
                            </button>
                          );
                        },
                      )}
                    </div>
                  </div>
                )}

                {/* Therapist results */}

                {step === 4 &&
                  !selectedTherapist && (
                    <div>
                      <p className="text-sm font-semibold text-[#b39668]">
                        {t(
                          "booking.results.eyebrow",
                        )}
                      </p>

                      <h2 className="mt-3 text-3xl font-bold">
                        {t(
                          "booking.results.title",
                        )}
                      </h2>

                      <p className="mt-3 text-[#69747a]">
                        {t(
                          "booking.results.description",
                        )}
                      </p>

                      {matchingTherapists.length ===
                      0 ? (
                        <div className="mt-8 rounded-2xl bg-[#f8f4ee] p-8 text-center">
                          <p className="text-[#66727a]">
                            {t(
                              "booking.results.empty",
                            )}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-8 grid gap-6 lg:grid-cols-2">
                          {matchingTherapists.map(
                            (therapist) => {
                              const therapistSlots =
                                allSlots.filter(
                                  (
                                    slot,
                                  ) =>
                                    slot.therapist_id ===
                                      therapist.id &&
                                    slotMatchesAvailability(
                                      slot,
                                    ),
                                );

                              const nextSlot =
                                therapistSlots[0] ||
                                allSlots.find(
                                  (
                                    slot,
                                  ) =>
                                    slot.therapist_id ===
                                    therapist.id,
                                );

                              return (
                                <article
                                  key={
                                    therapist.id
                                  }
                                  className="flex h-full flex-col rounded-[1.75rem] border border-[#e4dacb] bg-[#fffdf9] p-6 transition hover:-translate-y-1 hover:shadow-lg"
                                >
                                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e8decd] text-2xl font-bold text-[#415a72]">
                                    {therapist.full_name
                                      .trim()
                                      .charAt(
                                        0,
                                      )
                                      .toUpperCase()}
                                  </div>

                                  <h3 className="mt-5 text-2xl font-bold">
                                    {getTherapistName(
                                      therapist,
                                    )}
                                  </h3>

                                  <p className="mt-2 font-semibold text-[#9e8156]">
                                    {getTherapistSpecialty(
                                      therapist,
                                    )}
                                  </p>

                                  <p className="mt-4 line-clamp-3 leading-7 text-[#68747b]">
                                    {getTherapistBio(
                                      therapist,
                                    )}
                                  </p>

                                  {nextSlot && (
                                    <div className="mt-5 rounded-2xl bg-[#f3eee6] p-4">
                                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8f744d]">
                                        {t(
                                          "booking.results.nextAvailable",
                                        )}
                                      </p>

                                      <p className="mt-2 font-semibold">
                                        {formatSlotDate(
                                          nextSlot,
                                        )}{" "}
                                        ·{" "}
                                        {
                                          formatSlotTime(
                                            nextSlot,
                                          )
                                        }
                                      </p>
                                    </div>
                                  )}

                                  <div className="mt-auto flex items-end justify-between gap-4 pt-6">
                                    <p className="text-xl font-bold">
                                      $
                                      {
                                        therapist.price
                                      }

                                      <span className="text-sm font-normal text-[#69747a]">
                                        {t(
                                          "booking.sessionPriceSuffix",
                                        )}
                                      </span>
                                    </p>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        selectTherapist(
                                          therapist,
                                        )
                                      }
                                      className="rounded-xl bg-[#415a72] px-5 py-3 font-semibold text-white transition hover:bg-[#32495f]"
                                    >
                                      {t(
                                        "booking.results.selectSession",
                                      )}
                                    </button>
                                  </div>
                                </article>
                              );
                            },
                          )}
                        </div>
                      )}
                    </div>
                  )}
                                  {/* Selected therapist + available sessions */}

                {step === 4 &&
                  selectedTherapist && (
                    <div
                      ref={
                        bookingSectionRef
                      }
                    >
                      <div className="flex flex-col gap-6 rounded-[1.75rem] bg-[#f8f4ee] p-6 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#e8decd] text-2xl font-bold text-[#415a72]">
                            {selectedTherapist.full_name
                              .trim()
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#9e8156]">
                              {t(
                                "booking.session.selectedTherapist",
                              )}
                            </p>

                            <h2 className="mt-1 text-2xl font-bold">
                              {getTherapistName(
                                selectedTherapist,
                              )}
                            </h2>

                            <p className="mt-1 text-[#69747a]">
                              {getTherapistSpecialty(
                                selectedTherapist,
                              )}
                            </p>
                          </div>
                        </div>

                        {!directTherapistId && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTherapist(
                                null,
                              );

                              setSelectedSlot(
                                null,
                              );
                            }}
                            className="rounded-xl border border-[#d9cebd] bg-white px-5 py-3 font-semibold text-[#415a72] transition hover:bg-[#f3eee6]"
                          >
                            {t(
                              "booking.session.changeTherapist",
                            )}
                          </button>
                        )}
                      </div>

                      <div className="mt-8">
                        <p className="text-sm font-semibold text-[#b39668]">
                          {t(
                            "booking.session.eyebrow",
                          )}
                        </p>

                        <h2 className="mt-3 text-3xl font-bold">
                          {t(
                            "booking.session.title",
                          )}
                        </h2>

                        <p className="mt-3 text-[#69747a]">
                          {t(
                            "booking.session.description",
                          )}
                        </p>

                        {timeZoneReady && (
                          <div className="mt-6 rounded-2xl border border-[#dfd5c5] bg-[#faf7f2] p-5 sm:p-6">
                            <div className="grid gap-4 sm:grid-cols-[1fr_minmax(260px,360px)] sm:items-center">
                              <div>
                                <p className="text-sm font-bold text-[#223748]">
                                  {language === "ar"
                                    ? "المنطقة الزمنية"
                                    : language === "fr"
                                      ? "Fuseau horaire"
                                      : "Time zone"}
                                </p>

                                <p className="mt-1 text-sm leading-6 text-[#69747a]">
                                  {language === "ar"
                                    ? "يتم عرض المواعيد حسب المنطقة الزمنية التي تختارها. يمكنك تغييرها في أي وقت."
                                    : language === "fr"
                                      ? "Les créneaux sont affichés dans le fuseau horaire que vous choisissez. Vous pouvez le changer à tout moment."
                                      : "Appointment times are shown in the time zone you choose. You can change it at any time."}
                                </p>
                              </div>

                              <label className="block">
                                <span className="sr-only">
                                  {language === "ar"
                                    ? "اختيار المنطقة الزمنية"
                                    : language === "fr"
                                      ? "Choisir le fuseau horaire"
                                      : "Choose a time zone"}
                                </span>

                                <select
                                  value={
                                    selectedTimeZone
                                  }
                                  onChange={(event) =>
                                    handleTimeZoneChange(
                                      event.target.value,
                                    )
                                  }
                                  className="w-full rounded-xl border border-[#d9cebd] bg-white px-4 py-3 font-semibold text-[#223748] outline-none transition focus:border-[#415a72] focus:ring-2 focus:ring-[#415a72]/15"
                                >
                                  {timeZoneOptions.map(
                                    (timeZone) => (
                                      <option
                                        key={
                                          timeZone
                                        }
                                        value={
                                          timeZone
                                        }
                                      >
                                        {formatTimeZoneName(
                                          timeZone,
                                        )}
                                      </option>
                                    ),
                                  )}
                                </select>
                              </label>
                            </div>

                            <p className="mt-4 text-xs leading-5 text-[#7a858b]">
                              {language === "ar"
                                ? `المواعيد المعروضة الآن حسب: ${formatTimeZoneName(
                                    selectedTimeZone,
                                  )}`
                                : language === "fr"
                                  ? `Créneaux affichés actuellement en : ${formatTimeZoneName(
                                      selectedTimeZone,
                                    )}`
                                  : `Appointments are currently shown in: ${formatTimeZoneName(
                                      selectedTimeZone,
                                    )}`}
                            </p>
                          </div>
                        )}

                        {selectedTherapistSlots.length ===
                        0 ? (
                          <div className="mt-8 rounded-2xl border border-dashed border-[#d8cebf] bg-[#faf7f2] p-8 text-center">
                            <p className="text-[#69747a]">
                              {t(
                                "booking.session.noSlots",
                              )}
                            </p>
                          </div>
                        ) : (
                          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {selectedTherapistSlots.map(
                              (slot) => {
                                const selected =
                                  selectedSlot?.id ===
                                  slot.id;

                                const start =
                                  getScheduledStart(
                                    slot,
                                  );

                                const end =
                                  start
                                    ? new Date(
                                        start.getTime() +
                                          2 *
                                            60 *
                                            60 *
                                            1000,
                                      )
                                    : null;

                                return (
                                  <button
                                    key={
                                      slot.id
                                    }
                                    type="button"
                                    onClick={() =>
                                      setSelectedSlot(
                                        slot,
                                      )
                                    }
                                    className={`rounded-2xl border p-5 text-start transition ${
                                      selected
                                        ? "border-[#415a72] bg-[#eef2f5] shadow-sm"
                                        : "border-[#e3dbcf] bg-[#fffdf9] hover:border-[#b39668]"
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-4">
                                      <div>
                                        <p className="font-bold text-[#223748]">
                                          {formatSlotDate(
                                            slot,
                                          )}
                                        </p>

                                        <p className="mt-2 text-lg font-semibold text-[#415a72]">
                                          {
                                            formatSlotTime(
                                              slot,
                                            )
                                          }
                                        </p>
                                      </div>

                                      <div
                                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                                          selected
                                            ? "border-[#415a72] bg-[#415a72] text-white"
                                            : "border-[#c9c0b2]"
                                        }`}
                                      >
                                        {selected
                                          ? "✓"
                                          : ""}
                                      </div>
                                    </div>

                                    {start && (
                                      <p className="mt-3 text-xs leading-5 text-[#7a858b]">
                                        {formatTimeZoneName(
                                          selectedTimeZone,
                                        )}
                                        {selectedTimeZone !==
                                          "Asia/Beirut" && (
                                          <>
                                            <br />
                                            {language === "ar"
                                              ? `الوقت المقابل في لبنان: ${formatBeirutTime(
                                                  slot,
                                                )}`
                                              : language === "fr"
                                                ? `Heure correspondante au Liban : ${formatBeirutTime(
                                                    slot,
                                                  )}`
                                                : `Corresponding time in Lebanon: ${formatBeirutTime(
                                                    slot,
                                                  )}`}
                                          </>
                                        )}
                                      </p>
                                    )}

                                    {start &&
                                      end && (
                                        <p className="mt-4 text-xs leading-5 text-[#7a858b]">
                                          {language === "ar"
                                            ? "مدة الجلسة: حتى ساعتين"
                                            : language === "fr"
                                              ? "Durée de la séance : jusqu’à 2 heures"
                                              : "Session duration: up to 2 hours"}
                                        </p>
                                      )}
                                  </button>
                                );
                              },
                            )}
                          </div>
                        )}
                      </div>

                      {selectedSlot && (
                        <div className="mt-8 rounded-[1.75rem] border border-[#dfd5c5] bg-[#faf7f2] p-6 sm:p-8">
                          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#9e8156]">
                            {isArabic
                              ? "ملخص الحجز"
                              : "Booking summary"}
                          </p>

                          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                              <p className="text-sm text-[#7a858b]">
                                {isArabic
                                  ? "المعالج"
                                  : "Therapist"}
                              </p>

                              <p className="mt-1 font-bold text-[#223748]">
                                {getTherapistName(
                                  selectedTherapist,
                                )}
                              </p>
                            </div>

                            <div>
                              <p className="text-sm text-[#7a858b]">
                                {isArabic
                                  ? "التاريخ"
                                  : "Date"}
                              </p>

                              <p className="mt-1 font-bold text-[#223748]">
                                {formatSlotDate(
                                  selectedSlot,
                                )}
                              </p>
                            </div>

                            <div>
                              <p className="text-sm text-[#7a858b]">
                                {isArabic
                                  ? "الوقت"
                                  : "Time"}
                              </p>

                              <p className="mt-1 font-bold text-[#223748]">
                                {
                                  formatSlotTime(
                                    selectedSlot,
                                  )
                                }
                              </p>

                              <p className="mt-1 text-xs leading-5 text-[#7a858b]">
                                {formatTimeZoneName(
                                  selectedTimeZone,
                                )}
                              </p>

                              {selectedTimeZone !==
                                "Asia/Beirut" && (
                                <p className="mt-1 text-xs leading-5 text-[#7a858b]">
                                  {language === "ar"
                                    ? `لبنان: ${formatBeirutTime(
                                        selectedSlot,
                                      )}`
                                    : language === "fr"
                                      ? `Liban : ${formatBeirutTime(
                                          selectedSlot,
                                        )}`
                                      : `Lebanon: ${formatBeirutTime(
                                          selectedSlot,
                                        )}`}
                                </p>
                              )}
                            </div>

                            <div>
                              <p className="text-sm text-[#7a858b]">
                                {isArabic
                                  ? "السعر"
                                  : "Price"}
                              </p>

                              <p className="mt-1 font-bold text-[#223748]">
                                $
                                {
                                  selectedTherapist.price
                                }
                              </p>
                            </div>
                          </div>

                          <div className="mt-6 rounded-2xl border border-[#e3d8c7] bg-white p-4">
                            <p className="text-sm leading-6 text-[#69747a]">
                              {language === "ar"
                                ? "عند المتابعة إلى الدفع، سيتم الاحتفاظ بهذا الموعد لك لمدة 10 دقائق فقط. إذا لم يتم الدفع خلال هذه المدة، سيصبح الموعد متاحاً من جديد. مدة الجلسة نفسها قد تصل إلى ساعتين."
                                : language === "fr"
                                  ? "En continuant vers le paiement, ce créneau vous sera réservé temporairement pendant 10 minutes. Sans paiement dans ce délai, il redeviendra disponible. La séance elle-même peut durer jusqu’à deux heures."
                                  : "When you continue to payment, this slot will be held for you for 10 minutes. If payment is not completed in that time, the slot will become available again. The session itself may last up to two hours."}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              void confirmBooking()
                            }
                            disabled={
                              bookingLoading
                            }
                            className="mt-7 w-full rounded-2xl bg-[#415a72] px-6 py-4 text-lg font-bold text-white transition hover:bg-[#32495f] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                          >
                            {bookingLoading
                              ? isArabic
                                ? "جارٍ إنشاء الحجز..."
                                : "Creating booking..."
                              : t(
                                  "booking.session.continueToPayment",
                                )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                {/* Navigation */}

                {!directTherapistId &&
                  step < 4 && (
                    <div className="mt-10 flex flex-col-reverse gap-3 border-t border-[#eee6db] pt-6 sm:flex-row sm:items-center sm:justify-between">
                      <button
                        type="button"
                        onClick={goBack}
                        disabled={
                          step === 1
                        }
                        className="rounded-xl border border-[#d9cebd] px-6 py-3 font-semibold text-[#415a72] transition hover:bg-[#f8f4ee] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {t(
                          "booking.actions.back",
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={goNext}
                        disabled={
                          !canContinue
                        }
                        className="rounded-xl bg-[#415a72] px-7 py-3 font-semibold text-white transition hover:bg-[#32495f] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {step === 3
                          ? t(
                              "booking.actions.seeMatches",
                            )
                          : t(
                              "booking.actions.continue",
                            )}
                      </button>
                    </div>
                  )}

                {step === 4 &&
                  selectedTherapist &&
                  !directTherapistId && (
                    <div className="mt-8 border-t border-[#eee6db] pt-6">
                      <button
                        type="button"
                        onClick={goBack}
                        className="rounded-xl border border-[#d9cebd] px-6 py-3 font-semibold text-[#415a72] transition hover:bg-[#f8f4ee]"
                      >
                        {t(
                          "booking.actions.back",
                        )}
                      </button>
                    </div>
                  )}
              </div>
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
        <main className="flex min-h-screen items-center justify-center bg-[#f8f4ee]">
          <p className="text-[#66727a]">
            Loading...
          </p>
        </main>
      }
    >
      <BookingContent />
    </Suspense>
     );
}

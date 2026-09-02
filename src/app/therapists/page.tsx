"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Image from "next/image";
import Link from "next/link";

import { supabase } from "@/lib/supabase";

import {
  useLanguage,
} from "@/i18n/LanguageProvider";

import Navbar from "../components/Navbar";

interface Therapist {
  id: string;

  // Nom latin utilisé en anglais et en français.
  // La version arabe est une translittération.
  full_name: string;
  full_name_ar: string | null;

  professional_title: string | null;
  professional_title_fr: string | null;
  professional_title_ar: string | null;

  specialty: string;
  specialty_fr: string | null;
  specialty_ar: string | null;

  experience_years: number | null;

  bio: string;
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

  price: number;

  photo_url: string | null;

  work_status: "active" | "leaving" | "inactive";
}

interface TherapistService {
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
}

interface Availability {
  id: number;
  therapist_id: string;
  day: string;
  time: string;
}

const DAY_TRANSLATIONS = {
  Monday: {
    en: "Monday",
    fr: "Lundi",
    ar: "الاثنين",
  },

  Tuesday: {
    en: "Tuesday",
    fr: "Mardi",
    ar: "الثلاثاء",
  },

  Wednesday: {
    en: "Wednesday",
    fr: "Mercredi",
    ar: "الأربعاء",
  },

  Thursday: {
    en: "Thursday",
    fr: "Jeudi",
    ar: "الخميس",
  },

  Friday: {
    en: "Friday",
    fr: "Vendredi",
    ar: "الجمعة",
  },

  Saturday: {
    en: "Saturday",
    fr: "Samedi",
    ar: "السبت",
  },

  Sunday: {
    en: "Sunday",
    fr: "Dimanche",
    ar: "الأحد",
  },
} as const;

function splitEntries(
  value: string | null | undefined,
) {
  if (!value?.trim()) {
    return [];
  }

  return value
    .split(/\r?\n|,\s*/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function TherapistsPage() {
  const [
    therapists,
    setTherapists,
  ] = useState<Therapist[]>([]);

  const [
    availabilities,
    setAvailabilities,
  ] = useState<Availability[]>([]);

  const [
    therapistServices,
    setTherapistServices,
  ] = useState<
    TherapistService[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    selectedTherapist,
    setSelectedTherapist,
  ] =
    useState<Therapist | null>(
      null,
    );

  const {
    language,
    isArabic,
    t,
  } = useLanguage();

  useEffect(() => {
    const loadPageData =
      async () => {
        setLoading(true);

        /*
         * La page publique ne doit afficher
         * que les spécialistes encore actifs.
         *
         * leaving  -> plus de nouvelles réservations
         * inactive -> invisible sur la plateforme
         */
        const therapistsResult =
          await supabase
            .from("therapists")
            .select("*")
            .eq(
              "work_status",
              "active",
            )
            .order(
              "full_name",
            );

        if (
          therapistsResult.error
        ) {
          console.error(
            "Unable to load therapists:",
            therapistsResult.error,
          );

          setTherapists([]);
          setAvailabilities([]);
          setTherapistServices([]);
          setLoading(false);

          return;
        }

        const activeTherapists =
          (therapistsResult.data as
            | Therapist[]
            | null) || [];

        setTherapists(
          activeTherapists,
        );

        const activeTherapistIds =
          activeTherapists.map(
            (
              therapist,
            ) => therapist.id,
          );

        /*
         * SOURCE UNIQUE DES SERVICES ET TARIFS
         * ------------------------------------
         * L'admin modifie therapist_services.
         * Cette page publique lit directement
         * la même table : aucune ressaisie.
         */
        const servicesResult =
          await supabase
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
            .in(
              "therapist_id",
              activeTherapistIds,
            )
            .eq(
              "is_active",
              true,
            );

        if (
          servicesResult.error
        ) {
          console.error(
            "Unable to load therapist services:",
            servicesResult.error,
          );

          setTherapistServices(
            [],
          );
        } else {
          setTherapistServices(
            (
              servicesResult.data as
                | TherapistService[]
                | null
            ) || [],
          );
        }

        /*
         * On ne charge que les créneaux
         * disponibles des spécialistes actifs.
         *
         * Cela empêche également les anciennes
         * disponibilités d'un spécialiste leaving
         * ou inactive d'apparaître côté patient.
         */
        if (
          activeTherapistIds.length ===
          0
        ) {
          setAvailabilities(
            [],
          );

          setTherapistServices(
            [],
          );

          setLoading(false);

          return;
        }

        const availabilitiesResult =
          await supabase
            .from(
              "availability_slots",
            )
            .select(
              `
                id,
                therapist_id,
                day,
                time
              `,
            )
            .in(
              "therapist_id",
              activeTherapistIds,
            )
            .eq(
              "is_booked",
              false,
            );

        if (
          availabilitiesResult.error
        ) {
          console.error(
            "Unable to load availability slots:",
            availabilitiesResult.error,
          );

          setAvailabilities([]);
        } else {
          setAvailabilities(
            (availabilitiesResult.data as
              | Availability[]
              | null) || [],
          );
        }

        setLoading(false);
      };

    void loadPageData();
  }, []);

  useEffect(() => {
    if (!selectedTherapist) {
      return;
    }

    const closeOnEscape = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key ===
        "Escape"
      ) {
        setSelectedTherapist(
          null,
        );
      }
    };

    document.body.style.overflow =
      "hidden";

    window.addEventListener(
      "keydown",
      closeOnEscape,
    );

    return () => {
      document.body.style.overflow =
        "";

      window.removeEventListener(
        "keydown",
        closeOnEscape,
      );
    };
  }, [selectedTherapist]);

  const availabilityByTherapist =
    useMemo(() => {
      const map =
        new Map<
          string,
          Availability[]
        >();

      for (
        const slot of availabilities
      ) {
        const current =
          map.get(
            slot.therapist_id,
          ) || [];

        current.push(slot);

        map.set(
          slot.therapist_id,
          current,
        );
      }

      return map;
    }, [availabilities]);

  const servicesByTherapist =
    useMemo(() => {
      const map =
        new Map<
          string,
          TherapistService[]
        >();

      const order:
        Record<
          TherapistService["service_type"],
          number
        > = {
          individual: 1,
          couples: 2,
          family: 3,
          group: 4,
        };

      for (
        const service
        of therapistServices
      ) {
        const current =
          map.get(
            service.therapist_id,
          ) || [];

        current.push(
          service,
        );

        current.sort(
          (
            a,
            b,
          ) =>
            order[
              a.service_type
            ] -
            order[
              b.service_type
            ],
        );

        map.set(
          service.therapist_id,
          current,
        );
      }

      return map;
    }, [
      therapistServices,
    ]);

  const localizedValue = (
    englishValue:
      | string
      | null
      | undefined,

    frenchValue:
      | string
      | null
      | undefined,

    arabicValue:
      | string
      | null
      | undefined,
  ) => {
    if (
      language === "fr" &&
      frenchValue?.trim()
    ) {
      return frenchValue.trim();
    }

    if (
      language === "ar" &&
      arabicValue?.trim()
    ) {
      return arabicValue.trim();
    }

    return (
      englishValue?.trim() ||
      frenchValue?.trim() ||
      arabicValue?.trim() ||
      ""
    );
  };

  const nameOf = (
    therapist: Therapist,
  ) => {
    if (
      language === "ar" &&
      therapist.full_name_ar?.trim()
    ) {
      return therapist.full_name_ar.trim();
    }

    return (
      therapist.full_name?.trim() ||
      ""
    );
  };

  const titleOf = (
   therapist: Therapist,
  ) =>
    localizedValue(
      therapist.professional_title ||
        therapist.specialty,

      therapist.professional_title_fr ||
        therapist.specialty_fr,

      therapist.professional_title_ar ||
        therapist.specialty_ar,
    );

  const specialtyOf = (
    therapist: Therapist,
  ) =>
    localizedValue(
      therapist.specialty,
      therapist.specialty_fr,
      therapist.specialty_ar,
    );

  const bioOf = (
    therapist: Therapist,
  ) =>
    localizedValue(
      therapist.bio,
      therapist.bio_fr,
      therapist.bio_ar,
    );

  const localizedList = (
    therapist: Therapist,

    key:
      | "education"
      | "certifications"
      | "therapeutic_approach"
      | "services"
      | "languages",
  ) => {
    const frenchKey =
      `${key}_fr` as keyof Therapist;

    const arabicKey =
      `${key}_ar` as keyof Therapist;

    return localizedValue(
      therapist[
        key
      ] as string | null,

      therapist[
        frenchKey
      ] as
        | string
        | null
        | undefined,

      therapist[
        arabicKey
      ] as
        | string
        | null
        | undefined,
    );
  };

  const serviceLabel = (
    serviceType:
      TherapistService["service_type"],
  ) => {
    if (
      language === "ar"
    ) {
      return serviceType === "individual"
        ? "فردية"
        : serviceType === "couples"
          ? "زوجية"
          : serviceType === "family"
            ? "عائلية"
            : "جماعية";
    }

    if (
      language === "fr"
    ) {
      return serviceType === "individual"
        ? "Individuelle"
        : serviceType === "couples"
          ? "Couple"
          : serviceType === "family"
            ? "Famille"
            : "Groupe";
    }

    return serviceType === "individual"
      ? "Individual"
      : serviceType === "couples"
        ? "Couples"
        : serviceType === "family"
          ? "Family"
          : "Group";
  };

  const servicePriceLabel = (
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

  const labels =
    language === "ar"
      ? {
          verified:
            "مختص معتمد",

          years:
            "سنة من الخبرة",

          languages:
            "اللغات",

          services:
            "الخدمات",

          session:
            "الجلسة",

          fullProfile:
            "عرض الملف الكامل",

          close:
            "إغلاق",

          education:
            "التعليم والمؤهلات",

          certifications:
            "التدريبات والشهادات",

          approach:
            "النهج العلاجي",

          specialty:
            "التخصصات",

          noDetails:
            "لم تتم إضافة تفاصيل إضافية بعد.",

          description:
            "تعرّف على المختصين المؤهلين، واطّلع على خبراتهم وخدماتهم، واختر الموعد الذي يناسب احتياجاتك.",

          loading:
            "جارٍ تحميل المختصين...",

          empty:
            "لا يوجد مختصون متاحون حالياً.",
        }
      : language === "fr"
        ? {
            verified:
              "Professionnel vérifié",

            years:
              "ans d’expérience",

            languages:
              "Langues",

            services:
              "Services",

            session:
              "Séance",

            fullProfile:
              "Voir le profil complet",

            close:
              "Fermer",

            education:
              "Formation et qualifications",

            certifications:
              "Formations et certifications",

            approach:
              "Approche thérapeutique",

            specialty:
              "Spécialités",

            noDetails:
              "Aucune information supplémentaire n’a encore été ajoutée.",

            description:
              "Découvrez les spécialistes qualifiés, consultez leur expérience et leurs services, puis choisissez une séance adaptée à vos besoins.",

            loading:
              "Chargement des spécialistes...",

            empty:
              "Aucun spécialiste n’est disponible pour le moment.",
          }
        : {
            verified:
              "Verified Professional",

            years:
              "years of experience",

            languages:
              "Languages",

            services:
              "Services",

            session:
              "Session",

            fullProfile:
              "View full profile",

            close:
              "Close",

            education:
              "Education and qualifications",

            certifications:
              "Training and certifications",

            approach:
              "Therapeutic approach",

            specialty:
              "Specialties",

            noDetails:
              "No additional profile details have been added yet.",

            description:
              "Explore qualified specialists, review their experience and services, and choose a session that suits your needs.",

            loading:
              "Loading specialists...",

            empty:
              "No specialists are available at the moment.",
          };

  const translateDay = (
    day: string,
  ) => {
    const translated =
      DAY_TRANSLATIONS[
        day as keyof typeof DAY_TRANSLATIONS
      ];

    if (!translated) {
      return day;
    }

    return translated[
      language
    ];
  };

  const formatTime = (
    time: string,
  ) => {
    if (!isArabic) {
      return time;
    }

    return time.replace(
      /\d/g,
      (digit) =>
        "٠١٢٣٤٥٦٧٨٩"[
          Number(digit)
        ],
    );
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
        className="min-h-screen bg-aan-background px-5 py-10 sm:px-8 lg:px-10"
      >
        <section className="mx-auto max-w-7xl">
          <div className="relative mb-12 overflow-hidden rounded-[2.25rem] border border-aan-border bg-white px-8 py-10 shadow-[var(--aan-shadow-md)] sm:px-12 sm:py-12 lg:px-14">
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute -top-28 h-80 w-80 rounded-full bg-aan-gold/10 blur-3xl ${
                isArabic
                  ? "-left-20"
                  : "-right-20"
              }`}
            />

            <div
              aria-hidden="true"
              className={`pointer-events-none absolute -bottom-32 h-64 w-64 rounded-full bg-aan-button/10 blur-3xl ${
                isArabic
                  ? "left-20"
                  : "right-20"
              }`}
            />

            <div className="relative">
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-aan-gold">
                AAN Psychotherapy
              </p>

              <h1 className="aan-heading mt-5 text-4xl sm:text-5xl lg:text-6xl">
                {t(
                  "therapists.title",
                )}
              </h1>

              <div className="mt-6 flex items-center gap-3">
                <div className="h-px w-32 bg-aan-gold" />

                <span className="h-2 w-2 rounded-full bg-aan-gold" />

                <span className="h-1.5 w-1.5 rounded-full bg-aan-gold/60" />
              </div>

              <p className="mt-7 max-w-3xl text-lg leading-8 text-aan-secondary">
                {
                  labels.description
                }
              </p>
            </div>
          </div>

          {loading ? (
            <div className="aan-card p-12 text-center">
              <p className="text-lg font-semibold text-aan-secondary">
                {
                  labels.loading
                }
              </p>
            </div>
          ) : therapists.length ===
            0 ? (
            <div className="aan-card p-12 text-center">
                  <p className="text-lg font-semibold text-aan-secondary">
                {
                  labels.empty
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 items-stretch gap-8 md:grid-cols-2 xl:grid-cols-3">
              {therapists.map(
                (
                  therapist,
                ) => {
                  const slots =
                    availabilityByTherapist.get(
                      therapist.id,
                    ) || [];

                  const configuredServices =
                    servicesByTherapist.get(
                      therapist.id,
                    ) || [];

                  const languages =
                    splitEntries(
                      localizedList(
                        therapist,
                        "languages",
                      ),
                    );

                  return (
                    <article
                      key={
                        therapist.id
                      }
                      className="group flex h-full flex-col rounded-[2rem] border border-aan-border bg-white p-7 shadow-[var(--aan-shadow-sm)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--aan-shadow-lg)]"
                    >
                      <div className="flex items-start gap-5">
                        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-aan-border bg-[#f8f4ee] shadow-[var(--aan-shadow-sm)]">
                          {therapist.photo_url ? (
                            <Image
                              src={
                                therapist.photo_url
                              }
                              alt={nameOf(
                                therapist,
                              )}
                              fill
                              sizes="96px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#f8f4ee_0%,#edf3f9_100%)]">
                              <span className="text-4xl font-bold text-aan-button">
                                {nameOf(
                                  therapist,
                                )
                                  .charAt(
                                    0,
                                  )
                                  .toUpperCase() ||
                                  "A"}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <span className="inline-flex items-center gap-2 rounded-full border border-aan-border bg-[#fbf8f3] px-3 py-1.5 text-xs font-bold text-aan-navy">
                            <span className="text-aan-gold">
                              ✓
                            </span>

                            {
                              labels.verified
                            }
                          </span>

                          <h2 className="aan-heading mt-4 text-2xl sm:text-3xl">
                            {nameOf(
                              therapist,
                            )}
                          </h2>

                          <p className="mt-2 text-base font-semibold text-aan-button">
                            {titleOf(
                              therapist,
                            )}
                          </p>

                          {!!therapist.experience_years && (
                            <p className="mt-2 text-sm font-bold text-aan-gold">
                              {
                                therapist.experience_years
                              }
                              +{" "}
                              {
                                labels.years
                              }
                            </p>
                          )}
                        </div>
                      </div>

                      {bioOf(
                        therapist,
                      ) && (
                        <p className="mt-6 line-clamp-4 min-h-[7rem] leading-7 text-aan-secondary">
                          {bioOf(
                            therapist,
                          )}
                        </p>
                      )}

                      {languages.length >
                        0 && (
                        <div className="mt-5">
                          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-aan-gold">
                            {
                              labels.languages
                            }
                          </p>

                          <div className="flex flex-wrap gap-2">
                            {languages
                              .slice(
                                0,
                                4,
                              )
                              .map(
                                (
                                  item,
                                ) => (
                                  <span
                                    key={
                                      item
                                    }
                                    className="rounded-full border border-aan-border bg-[#fbf8f3] px-3 py-1 text-xs font-semibold text-aan-navy"
                                  >
                                    {
                                      item
                                    }
                                  </span>
                                ),
                              )}
                          </div>
                        </div>
                      )}

                      {configuredServices.length >
                        0 && (
                        <div className="mt-5">
                          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-aan-gold">
                            {
                              labels.services
                            }
                          </p>

                          <div className="grid gap-2">
                            {configuredServices.map(
                              (
                                service,
                              ) => (
                                <div
                                  key={
                                    service.id
                                  }
                                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-aan-border bg-[#fbf8f3] px-3 py-2"
                                >
                                  <span className="text-sm font-bold text-aan-navy">
                                    {serviceLabel(
                                      service.service_type,
                                    )}
                                  </span>

                                  <span className="text-sm font-semibold text-aan-button">
                                    {servicePriceLabel(
                                      service,
                                    )}{" "}
                                    ·{" "}
                                    {
                                      service.duration_minutes
                                    }{" "}
                                    min
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                      <div className="mt-7 flex-1">
                        <h3 className="text-lg font-bold text-aan-navy">
                          {t(
                            "therapists.availability",
                          )}
                        </h3>

                        <div className="mt-4 flex flex-wrap gap-3">
                          {slots.length >
                          0 ? (
                            slots.map(
                              (
                                slot,
                              ) => (
                                <span
                                  key={
                                    slot.id
                                  }
                                  className="rounded-full border border-aan-border bg-[#fbf8f3] px-4 py-2 text-sm font-semibold text-aan-navy"
                                >
                                  {translateDay(
                                    slot.day,
                                  )}{" "}
                                  •{" "}
                                  {formatTime(
                                    slot.time,
                                  )}
                                </span>
                              ),
                            )
                          ) : (
                            <span className="text-sm text-aan-secondary">
                              {t(
                                "therapists.noAvailability",
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedTherapist(
                            therapist,
                          )
                        }
                        className="mt-7 flex w-full items-center justify-between rounded-2xl border border-aan-border bg-white px-5 py-4 font-bold text-aan-navy transition hover:bg-[#fbf8f3]"
                      >
                        <span>
                          {
                            labels.fullProfile
                          }
                        </span>

                        <span
                          aria-hidden="true"
                        >
                          {isArabic
                            ? "←"
                            : "→"}
                        </span>
                      </button>

                      <Link
                        href={`/booking?therapistId=${therapist.id}`}
                        className="aan-cta mt-4 flex w-full items-center justify-center rounded-2xl py-4 text-lg font-bold text-white"
                      >
                        {t(
                          "therapists.bookSession",
                        )}
                      </Link>
                    </article>
                  );
                },
              )}
            </div>
          )}
        </section>
      </main>

      {selectedTherapist && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#17263a]/55 p-4 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={nameOf(
            selectedTherapist,
          )}
          onMouseDown={(
            event,
          ) => {
            if (
              event.currentTarget ===
              event.target
            ) {
              setSelectedTherapist(
                null,
              );
            }
          }}
        >
          <div
            dir={
              isArabic
                ? "rtl"
                : "ltr"
            }
            className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-aan-border bg-white shadow-2xl"
          >
            <button
              type="button"
              onClick={() =>
                setSelectedTherapist(
                  null,
                )
              }
              className={`absolute top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-aan-border bg-white text-xl font-bold text-aan-navy shadow-md transition hover:bg-[#fbf8f3] ${
                isArabic
                  ? "left-5"
                  : "right-5"
              }`}
              aria-label={
                labels.close
              }
            >
              ×
            </button>

            <div className="grid lg:grid-cols-[320px_1fr]">
              <aside className="border-b border-aan-border bg-[linear-gradient(160deg,#fbf8f3_0%,#eef4fa_100%)] p-8 lg:border-b-0 lg:border-r">
                <div className="relative mx-auto h-44 w-44 overflow-hidden rounded-full border-2 border-aan-gold bg-white shadow-lg">
                  {selectedTherapist.photo_url ? (
                    <Image
                      src={
                        selectedTherapist.photo_url
                      }
                      alt={nameOf(
                        selectedTherapist,
                      )}
                      fill
                      sizes="176px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="text-6xl font-bold text-aan-button">
                        {nameOf(
                          selectedTherapist,
                                                  )
                          .charAt(0)
                          .toUpperCase() ||
                          "A"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-6 text-center">
                  <span className="inline-flex items-center gap-2 rounded-full border border-aan-border bg-white px-3 py-1.5 text-xs font-bold text-aan-navy">
                    <span className="text-aan-gold">
                      ✓
                    </span>

                    {
                      labels.verified
                    }
                  </span>

                  <h2 className="aan-heading mt-5 text-3xl">
                    {nameOf(
                      selectedTherapist,
                    )}
                  </h2>

                  <p className="mt-2 font-semibold text-aan-button">
                    {titleOf(
                      selectedTherapist,
                    )}
                  </p>

                  {!!selectedTherapist.experience_years && (
                    <p className="mt-2 text-sm font-bold text-aan-gold">
                      {
                        selectedTherapist.experience_years
                      }
                      +{" "}
                      {
                        labels.years
                      }
                    </p>
                  )}
                </div>

                <div className="mt-7 rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-aan-gold">
                    {
                      labels.services
                    }
                  </p>

                  <div className="mt-4 grid gap-3">
                    {(
                      servicesByTherapist.get(
                        selectedTherapist.id,
                      ) || []
                    ).length >
                    0 ? (
                      (
                        servicesByTherapist.get(
                          selectedTherapist.id,
                        ) || []
                      ).map(
                        (
                          service,
                        ) => (
                          <div
                            key={
                              service.id
                            }
                            className="rounded-xl border border-aan-border bg-[#fbf8f3] p-3"
                          >
                            <p className="font-bold text-aan-navy">
                              {serviceLabel(
                                service.service_type,
                              )}
                            </p>

                            <p className="mt-1 text-sm font-semibold text-aan-button">
                              {servicePriceLabel(
                                service,
                              )}{" "}
                              ·{" "}
                              {
                                service.duration_minutes
                              }{" "}
                              min
                            </p>
                          </div>
                        ),
                      )
                    ) : (
                      <p className="text-sm text-aan-secondary">
                        {language === "ar"
                          ? "لا توجد خدمات نشطة حالياً."
                          : language === "fr"
                            ? "Aucun service actif pour le moment."
                            : "No active services at the moment."}
                      </p>
                    )}
                  </div>
                </div>

                <Link
                  href={`/booking?therapistId=${selectedTherapist.id}`}
                  className="aan-cta mt-5 flex w-full items-center justify-center rounded-2xl py-4 text-lg font-bold text-white"
                >
                  {t(
                    "therapists.bookSession",
                  )}
                </Link>
              </aside>

              <div className="space-y-8 p-8 sm:p-10">
                {bioOf(
                  selectedTherapist,
                ) && (
                  <section>
                    <p className="whitespace-pre-line text-lg leading-8 text-aan-secondary">
                      {bioOf(
                        selectedTherapist,
                      )}
                    </p>
                  </section>
                )}

                {specialtyOf(
                  selectedTherapist,
                ) && (
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-[0.22em] text-aan-gold">
                      {
                        labels.specialty
                      }
                    </h3>

                    <p className="mt-3 leading-7 text-aan-secondary">
                      {specialtyOf(
                        selectedTherapist,
                      )}
                    </p>
                  </section>
                )}

                {localizedList(
                  selectedTherapist,
                  "education",
                ) && (
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-[0.22em] text-aan-gold">
                      {
                        labels.education
                      }
                    </h3>

                    <p className="mt-3 whitespace-pre-line leading-7 text-aan-secondary">
                      {localizedList(
                        selectedTherapist,
                        "education",
                      )}
                    </p>
                  </section>
                )}

                {splitEntries(
                  localizedList(
                    selectedTherapist,
                    "certifications",
                  ),
                ).length >
                  0 && (
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-[0.22em] text-aan-gold">
                      {
                        labels.certifications
                      }
                    </h3>

                    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                      {splitEntries(
                        localizedList(
                          selectedTherapist,
                          "certifications",
                        ),
                      ).map(
                        (
                          item,
                        ) => (
                          <li
                            key={
                              item
                            }
                            className="flex items-start gap-3 rounded-xl border border-aan-border bg-[#fbf8f3] p-4 leading-6 text-aan-secondary"
                          >
                            <span className="mt-1 text-aan-gold">
                              ✓
                            </span>

                            <span>
                              {
                                item
                              }
                            </span>
                          </li>
                        ),
                      )}
                    </ul>
                  </section>
                )}

                {localizedList(
                  selectedTherapist,
                  "therapeutic_approach",
                ) && (
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-[0.22em] text-aan-gold">
                      {
                        labels.approach
                      }
                    </h3>

                    <p className="mt-3 whitespace-pre-line leading-8 text-aan-secondary">
                      {localizedList(
                        selectedTherapist,
                        "therapeutic_approach",
                      )}
                    </p>
                  </section>
                )}

                {(servicesByTherapist.get(
                  selectedTherapist.id,
                ) || []).length >
                  0 && (
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-[0.22em] text-aan-gold">
                      {
                        labels.services
                      }
                    </h3>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {(servicesByTherapist.get(
                        selectedTherapist.id,
                      ) || []).map(
                        (
                          service,
                        ) => (
                          <div
                            key={
                              service.id
                            }
                            className="rounded-xl border border-aan-border bg-[#fbf8f3] p-4"
                          >
                            <p className="font-bold text-aan-navy">
                              {serviceLabel(
                                service.service_type,
                              )}
                            </p>

                            <p className="mt-1 text-sm font-semibold text-aan-button">
                              {servicePriceLabel(
                                service,
                              )}{" "}
                              ·{" "}
                              {
                                service.duration_minutes
                              }{" "}
                              min
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  </section>
                )}

                {splitEntries(
                  localizedList(
                    selectedTherapist,
                    "languages",
                  ),
                ).length >
                  0 && (
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-[0.22em] text-aan-gold">
                      {
                        labels.languages
                      }
                    </h3>

                    <div className="mt-4 flex flex-wrap gap-3">
                      {splitEntries(
                        localizedList(
                          selectedTherapist,
                          "languages",
                        ),
                      ).map(
                        (
                          item,
                        ) => (
                          <span
                            key={
                              item
                            }
                            className="rounded-full border border-aan-border bg-[#fbf8f3] px-4 py-2 text-sm font-semibold text-aan-navy"
                          >
                            {
                              item
                            }
                          </span>
                        ),
                      )}
                    </div>
                  </section>
                )}

                {!localizedList(
                  selectedTherapist,
                  "education",
                ) &&
                  !localizedList(
                    selectedTherapist,
                    "certifications",
                  ) &&
                  !localizedList(
                    selectedTherapist,
                    "therapeutic_approach",
                  ) &&
                  !(
                    servicesByTherapist.get(
                      selectedTherapist.id,
                    ) || []
                  ).length &&
                  !localizedList(
                    selectedTherapist,
                    "languages",
                  ) && (
                    <p className="rounded-2xl border border-aan-border bg-[#fbf8f3] p-6 text-aan-secondary">
                      {
                        labels.noDetails
                      }
                    </p>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
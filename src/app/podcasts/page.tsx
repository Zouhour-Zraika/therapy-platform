"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/i18n/LanguageProvider";

type Podcast = {
  id: string;
  title: string;
  title_ar: string | null;
  description: string;
  description_ar: string | null;
  content_type: "recorded" | "live" | null;
  audio_url: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  live_url: string | null;
  live_starts_at: string | null;
  live_ends_at: string | null;
  host_name: string | null;
  host_name_ar: string | null;
  guest_names: string | null;
  guest_names_ar: string | null;
  duration: string | null;
  language: string;
  topic: string;
  topic_ar: string | null;
  created_at: string;
};

export default function PodcastsPage() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [now, setNow] = useState(() => new Date());

  const { isArabic, t } = useLanguage();

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const getPodcasts = async () => {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Podcast fetch error:", error);
        setErrorMessage(t("podcasts.errors.load"));
        setLoading(false);
        return;
      }

      setPodcasts((data as Podcast[]) ?? []);
      setLoading(false);
    };

    void getPodcasts();
  }, [t]);

  const getLocalizedValue = (
    englishValue: string | null | undefined,
    arabicValue: string | null | undefined,
  ) => {
    if (isArabic && arabicValue?.trim()) {
      return arabicValue.trim();
    }

    return englishValue?.trim() || "";
  };

  const getTitle = (podcast: Podcast) =>
    getLocalizedValue(podcast.title, podcast.title_ar);

  const getDescription = (podcast: Podcast) =>
    getLocalizedValue(podcast.description, podcast.description_ar);

  const getTopic = (podcast: Podcast) =>
    getLocalizedValue(podcast.topic, podcast.topic_ar) ||
    t("podcasts.general");

  const getHostName = (podcast: Podcast) =>
    getLocalizedValue(podcast.host_name, podcast.host_name_ar);

  const getGuestNames = (podcast: Podcast) =>
    getLocalizedValue(podcast.guest_names, podcast.guest_names_ar);

  const getLanguageLabel = (language: string) => {
    const normalized = language?.toLowerCase();

    if (normalized === "ar") {
      return t("podcasts.languages.arabic");
    }

    if (normalized === "en") {
      return t("podcasts.languages.english");
    }

    return language?.toUpperCase() || t("podcasts.languages.unknown");
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat(isArabic ? "ar-LB" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  };

  const getLiveState = (podcast: Podcast) => {
    if (podcast.content_type !== "live" || !podcast.live_starts_at) {
      return "recorded";
    }

    const start = new Date(podcast.live_starts_at);
    const end = podcast.live_ends_at
      ? new Date(podcast.live_ends_at)
      : new Date(start.getTime() + 2 * 60 * 60 * 1000);

    if (now < start) {
      return "upcoming";
    }

    if (now >= start && now <= end) {
      return "live";
    }

    return "ended";
  };

  const copy = isArabic
    ? {
        description:
          "شاهد الحوارات المسجلة وانضم إلى اللقاءات المباشرة حول الصحة النفسية والعلاج والرفاه.",
        liveNow: "مباشر الآن",
        upcomingLive: "بث مباشر قريباً",
        joinLive: "الانضمام إلى البث المباشر",
        recordingUnavailable: "التسجيل غير متوفر حالياً.",
        liveSchedule: "موعد البث المباشر",
        host: "المقدّم",
        guests: "الضيوف",
        videoUnsupported: "المتصفح لا يدعم تشغيل الفيديو.",
        videoUnavailable: "لا يوجد فيديو متاح حالياً.",
      }
    : {
        description:
          "Watch recorded conversations and join live discussions about mental health, therapy and wellbeing.",
        liveNow: "LIVE NOW",
        upcomingLive: "Upcoming live",
        joinLive: "Join live session",
        recordingUnavailable: "Recording unavailable.",
        liveSchedule: "Live schedule",
        host: "Host",
        guests: "Guests",
        videoUnsupported: "Your browser does not support video playback.",
        videoUnavailable: "No video is available at the moment.",
      };

  return (
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

            <div className="relative max-w-4xl">
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-aan-gold">
                AAN Psychotherapy
              </p>

              <h1 className="aan-heading mt-4 text-4xl sm:text-5xl lg:text-6xl">
                {t("podcasts.title")}
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

          {loading ? (
            <div className="rounded-[2rem] border border-aan-border bg-white p-12 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-aan-border border-t-aan-button" />
              <p className="mt-5 font-semibold text-aan-secondary">
                {t("podcasts.loading")}
              </p>
            </div>
          ) : errorMessage ? (
            <div className="rounded-[2rem] border border-red-200 bg-red-50 p-8 text-center text-red-700">
              {errorMessage}
            </div>
          ) : podcasts.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-aan-border bg-white p-12 text-center">
              {t("podcasts.empty")}
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-2">
              {podcasts.map((podcast) => {
                const liveState = getLiveState(podcast);
                const hostName = getHostName(podcast);
                const guestNames = getGuestNames(podcast);

                return (
                  <article
                    key={podcast.id}
                    className="overflow-hidden rounded-[2rem] border border-aan-border bg-white shadow-[var(--aan-shadow-sm)] transition hover:-translate-y-1 hover:shadow-[var(--aan-shadow-lg)]"
                  >
                    <div className="relative bg-black">
                      {liveState === "live" ? (
                        <div
                          className="flex aspect-video items-center justify-center bg-cover bg-center p-8"
                          style={
                            podcast.thumbnail_url
                              ? {
                                  backgroundImage: `linear-gradient(rgba(0,0,0,.55), rgba(0,0,0,.55)), url("${podcast.thumbnail_url}")`,
                                }
                              : undefined
                          }
                        >
                          <div className="text-center text-white">
                            <span className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-bold">
                              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
                              {copy.liveNow}
                            </span>

                            <h2 className="mt-5 text-3xl font-bold">
                              {getTitle(podcast)}
                            </h2>

                            {podcast.live_url && (
                              <a
                                href={podcast.live_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-6 inline-flex rounded-2xl bg-white px-7 py-4 font-bold text-aan-navy"
                              >
                                {copy.joinLive}
                              </a>
                            )}
                          </div>
                        </div>
                      ) : podcast.video_url ? (
                        <video
                          controls
                          preload="metadata"
                          poster={podcast.thumbnail_url || undefined}
                          className="aspect-video w-full bg-black object-cover"
                        >
                          <source src={podcast.video_url} type="video/mp4" />
                          {copy.videoUnsupported}
                        </video>
                      ) : podcast.audio_url ? (
                        <div className="flex aspect-video items-center justify-center bg-aan-button p-8">
                          <div className="w-full rounded-2xl bg-white p-6">
                            <audio controls className="w-full">
                              <source
                                src={podcast.audio_url}
                                type="audio/mpeg"
                              />
                              {t("podcasts.audioUnsupported")}
                            </audio>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="flex aspect-video items-center justify-center bg-cover bg-center p-8"
                          style={
                            podcast.thumbnail_url
                              ? {
                                  backgroundImage: `linear-gradient(rgba(34,55,72,.65), rgba(34,55,72,.65)), url("${podcast.thumbnail_url}")`,
                                }
                              : undefined
                          }
                        >
                          <div className="text-center text-white">
                            {liveState === "upcoming" ? (
                              <>
                                <span className="rounded-full bg-aan-gold px-4 py-2 text-sm font-bold text-white">
                                  {copy.upcomingLive}
                                </span>

                                {podcast.live_starts_at && (
                                  <p className="mt-5 text-lg font-semibold">
                                    {formatDate(podcast.live_starts_at)}
                                  </p>
                                )}
                              </>
                            ) : (
                              <p>
                                {liveState === "recorded"
                                  ? copy.videoUnavailable
                                  : copy.recordingUnavailable}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {podcast.duration && (
                        <span className="absolute bottom-4 end-4 rounded-full bg-black/75 px-3 py-1.5 text-xs font-bold text-white">
                          {podcast.duration}
                        </span>
                      )}
                    </div>

                    <div className="p-6 sm:p-8">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="rounded-full border border-aan-border bg-[#fbf8f3] px-4 py-2 text-sm font-bold text-aan-navy">
                          {getTopic(podcast)}
                        </span>

                        <span className="text-sm font-semibold text-aan-secondary">
                          {getLanguageLabel(podcast.language)}
                        </span>
                      </div>

                      <h2 className="aan-heading mt-6 text-3xl sm:text-4xl">
                        {getTitle(podcast)}
                      </h2>

                      <p className="mt-4 whitespace-pre-line leading-8 text-aan-secondary">
                        {getDescription(podcast)}
                      </p>

                      {(hostName || guestNames) && (
                        <div className="mt-7 grid gap-4 sm:grid-cols-2">
                          {hostName && (
                            <div className="rounded-2xl bg-[#fbf8f3] p-5">
                              <p className="text-xs font-bold uppercase tracking-[0.2em] text-aan-gold">
                                {copy.host}
                              </p>
                              <p className="mt-2 font-semibold text-aan-navy">
                                {hostName}
                              </p>
                            </div>
                          )}

                          {guestNames && (
                            <div className="rounded-2xl bg-[#fbf8f3] p-5">
                              <p className="text-xs font-bold uppercase tracking-[0.2em] text-aan-gold">
                                {copy.guests}
                              </p>
                              <p className="mt-2 font-semibold text-aan-navy">
                                {guestNames}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {liveState === "upcoming" &&
                        podcast.live_starts_at && (
                          <div className="mt-6 rounded-2xl border border-aan-border bg-[#fbf8f3] p-5">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-aan-gold">
                              {copy.liveSchedule}
                            </p>
                            <p className="mt-2 font-bold text-aan-navy">
                              {formatDate(podcast.live_starts_at)}
                            </p>
                          </div>
                        )}

                      <p className="mt-7 border-t border-aan-border pt-5 text-sm text-aan-secondary">
                        {t("podcasts.publishedOn")}{" "}
                        <span className="font-semibold text-aan-navy">
                          {formatDate(podcast.created_at)}
                        </span>
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
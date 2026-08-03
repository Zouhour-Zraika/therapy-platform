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
  audio_url: string;
  language: string;
  topic: string;
  topic_ar: string | null;
  created_at: string;
};

export default function PodcastsPage() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const { isArabic, t } = useLanguage();

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

    getPodcasts();
  }, [t]);

  const getPodcastTitle = (podcast: Podcast) => {
    if (isArabic && podcast.title_ar?.trim()) {
      return podcast.title_ar;
    }

    return podcast.title;
  };

  const getPodcastDescription = (podcast: Podcast) => {
    if (isArabic && podcast.description_ar?.trim()) {
      return podcast.description_ar;
    }

    return podcast.description;
  };

  const getPodcastTopic = (podcast: Podcast) => {
    if (isArabic && podcast.topic_ar?.trim()) {
      return podcast.topic_ar;
    }

    return podcast.topic?.trim() || t("podcasts.general");
  };

  const getLanguageLabel = (language: string) => {
    const normalizedLanguage = language?.toLowerCase();

    if (normalizedLanguage === "ar") {
      return t("podcasts.languages.arabic");
    }

    if (normalizedLanguage === "en") {
      return t("podcasts.languages.english");
    }

    return language?.toUpperCase() || t("podcasts.languages.unknown");
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat(isArabic ? "ar" : "en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));
  };

  return (
    <>
      <Navbar />

      <main
        dir={isArabic ? "rtl" : "ltr"}
        className="min-h-screen bg-slate-100 px-5 py-10 sm:px-8 lg:px-10"
      >
        <div className="mx-auto max-w-6xl">
          <section className="mb-12 rounded-3xl bg-white p-8 shadow-xl sm:p-10">
            <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl lg:text-6xl">
              {t("podcasts.title")}
            </h1>

            <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-600 sm:text-2xl">
              {t("podcasts.description")}
            </p>
          </section>

          {loading ? (
            <div className="rounded-3xl bg-white p-10 shadow-xl">
              <p className="text-xl text-slate-600 sm:text-2xl">
                {t("podcasts.loading")}
              </p>
            </div>
          ) : errorMessage ? (
            <div className="rounded-3xl bg-white p-10 shadow-xl">
              <p className="text-xl text-red-700 sm:text-2xl">
                {errorMessage}
              </p>
            </div>
          ) : podcasts.length === 0 ? (
            <div className="rounded-3xl bg-white p-10 shadow-xl">
              <p className="text-xl text-slate-600 sm:text-2xl">
                {t("podcasts.empty")}
              </p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2">
              {podcasts.map((podcast) => (
                <article
                  key={podcast.id}
                  className="rounded-3xl bg-white p-8 shadow-xl"
                >
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <span className="rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                      {getPodcastTopic(podcast)}
                    </span>

                    <span className="text-sm text-slate-500">
                      {getLanguageLabel(podcast.language)}
                    </span>
                  </div>

                  <h2 className="text-3xl font-bold text-slate-900">
                    {getPodcastTitle(podcast)}
                  </h2>

                  <p className="mt-4 text-lg leading-relaxed text-slate-600">
                    {getPodcastDescription(podcast)}
                  </p>

                  <div className="mt-8">
                    <audio controls className="w-full">
                      <source
                        src={podcast.audio_url}
                        type="audio/mpeg"
                      />

                      {t("podcasts.audioUnsupported")}
                    </audio>
                  </div>

                  <p className="mt-5 text-sm text-slate-500">
                    {t("podcasts.publishedOn")}{" "}
                    {formatDate(podcast.created_at)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
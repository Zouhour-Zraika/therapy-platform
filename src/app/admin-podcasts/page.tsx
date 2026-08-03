"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import ProtectedRoute from "../components/ProtectedRoute";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/i18n/LanguageProvider";

type PodcastLanguage = "en" | "ar";

type Podcast = {
  id: string;
  title: string;
  title_ar: string | null;
  description: string;
  description_ar: string | null;
  audio_url: string;
  language: PodcastLanguage;
  topic: string;
  topic_ar: string | null;
  created_at: string;
};

type TranslationResponse = {
  translations?: Record<string, string>;
  error?: string;
  details?: string;
};

export default function AdminPodcastsPage() {
  const router = useRouter();
  const { isArabic } = useLanguage();

  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [podcasts, setPodcasts] = useState<Podcast[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [language, setLanguage] = useState<PodcastLanguage>("en");
  const [topic, setTopic] = useState("");

  const copy = isArabic
    ? {
        pageEyebrow: "إدارة المحتوى",
        pageTitle: "إدارة البودكاست",
        pageDescription:
          "أدخل محتوى البودكاست باللغة الإنجليزية أو العربية. سيتم إنشاء اللغة الأخرى تلقائياً قبل الحفظ.",

        sourceLanguage: "لغة المحتوى الأصلية",
        english: "الإنجليزية",
        arabic: "العربية",

        titlePlaceholder: "عنوان البودكاست",
        descriptionPlaceholder: "وصف البودكاست",
        audioPlaceholder: "رابط الملف الصوتي",
        topicPlaceholder: "الموضوع، مثال: القلق",

        addPodcast: "إضافة البودكاست",
        translatingAndSaving: "جارٍ الترجمة والحفظ...",

        existingPodcasts: "البودكاست الموجود",
        noPodcasts: "لا يوجد بودكاست حتى الآن.",

        originalLanguage: "اللغة الأصلية",
        noDescription: "لا يوجد وصف.",
        noTopic: "بدون موضوع",
        noArabicTranslation: "لا توجد ترجمة عربية لهذا المحتوى.",

        delete: "حذف",
        deleteQuestion: "هل تريد حذف هذا البودكاست؟",

        loading: "جارٍ التحميل...",
        loadError: "تعذر تحميل البودكاست.",
        requiredError: "العنوان ورابط الملف الصوتي مطلوبان.",
        translationError: "تعذرت الترجمة التلقائية.",
        translatedTitleMissing: "العنوان المترجم غير موجود.",
        addError: "تعذرت إضافة البودكاست.",
        deleteError: "تعذر حذف البودكاست.",
        success:
          "تمت إضافة البودكاست بنجاح وإنشاء اللغة الثانية تلقائياً.",

        audioUnsupported: "متصفحك لا يدعم تشغيل الصوت.",
      }
    : {
        pageEyebrow: "Content management",
        pageTitle: "Admin Podcasts",
        pageDescription:
          "Enter the podcast in English or Arabic. The other language will be generated automatically before the podcast is saved.",

        sourceLanguage: "Original content language",
        english: "English",
        arabic: "Arabic",

        titlePlaceholder: "Podcast title",
        descriptionPlaceholder: "Podcast description",
        audioPlaceholder: "Audio URL",
        topicPlaceholder: "Topic, for example: Anxiety",

        addPodcast: "Add Podcast",
        translatingAndSaving: "Translating and saving...",

        existingPodcasts: "Existing Podcasts",
        noPodcasts: "No podcasts yet.",

        originalLanguage: "Original language",
        noDescription: "No description.",
        noTopic: "No topic",
        noArabicTranslation:
          "No Arabic translation is available for this content.",

        delete: "Delete",
        deleteQuestion: "Delete this podcast?",

        loading: "Loading...",
        loadError: "Unable to load podcasts.",
        requiredError: "Title and audio URL are required.",
        translationError: "The automatic translation failed.",
        translatedTitleMissing: "The translated title is missing.",
        addError: "Unable to add the podcast.",
        deleteError: "Unable to delete the podcast.",
        success:
          "Podcast added successfully. The second language was generated automatically.",

        audioUnsupported:
          "Your browser does not support audio playback.",
      };

  const getPodcasts = useCallback(async () => {
    const { data, error } = await supabase
      .from("podcasts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Podcast fetch error:", error);
      alert(copy.loadError);
      return;
    }

    setPodcasts((data as Podcast[]) ?? []);
  }, [copy.loadError]);
    const checkAdmin = useCallback(async () => {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.push("/login");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      router.push("/");
      return;
    }

    setAllowed(true);
    await getPodcasts();
    setLoading(false);
  }, [getPodcasts, router]);

  useEffect(() => {
    checkAdmin();
  }, [checkAdmin]);

  const translateContent = async (
    sourceLanguage: PodcastLanguage,
    targetLanguage: PodcastLanguage,
    fields: Record<string, string>,
  ) => {
    const response = await fetch("/api/translate-content", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sourceLanguage,
        targetLanguage,
        fields,
      }),
    });

    const result = (await response.json()) as TranslationResponse;

    if (!response.ok || !result.translations) {
      const errorDetails = result.details
        ? `${result.error ?? copy.translationError}: ${result.details}`
        : result.error ?? copy.translationError;

      throw new Error(errorDetails);
    }

    return result.translations;
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setAudioUrl("");
    setLanguage("en");
    setTopic("");
  };

  const addPodcast = async () => {
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    const cleanAudioUrl = audioUrl.trim();
    const cleanTopic = topic.trim();

    if (!cleanTitle || !cleanAudioUrl) {
      alert(copy.requiredError);
      return;
    }

    setSubmitting(true);

    try {
      const targetLanguage: PodcastLanguage =
        language === "en" ? "ar" : "en";

      const fieldsToTranslate: Record<string, string> = {
        title: cleanTitle,
      };

      if (cleanDescription) {
        fieldsToTranslate.description = cleanDescription;
      }

      if (cleanTopic) {
        fieldsToTranslate.topic = cleanTopic;
      }

      const translations = await translateContent(
        language,
        targetLanguage,
        fieldsToTranslate,
      );

      const translatedTitle = translations.title?.trim();

      if (!translatedTitle) {
        throw new Error(copy.translatedTitleMissing);
      }

      const translatedDescription =
        translations.description?.trim() ?? "";

      const translatedTopic = translations.topic?.trim() ?? "";

      const podcastToInsert =
        language === "en"
          ? {
              title: cleanTitle,
              title_ar: translatedTitle,
              description: cleanDescription,
              description_ar: translatedDescription,
              audio_url: cleanAudioUrl,
              language: "en",
              topic: cleanTopic,
              topic_ar: translatedTopic,
            }
          : {
              title: translatedTitle,
              title_ar: cleanTitle,
              description: translatedDescription,
              description_ar: cleanDescription,
              audio_url: cleanAudioUrl,
              language: "ar",
              topic: translatedTopic,
              topic_ar: cleanTopic,
            };

      const { error } = await supabase
        .from("podcasts")
        .insert(podcastToInsert);

      if (error) {
        throw new Error(error.message);
      }

      resetForm();
      await getPodcasts();
      alert(copy.success);
    } catch (error) {
      console.error("Podcast creation error:", error);

      const message =
        error instanceof Error ? error.message : copy.addError;

      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  const deletePodcast = async (id: string) => {
    const confirmDelete = window.confirm(copy.deleteQuestion);

    if (!confirmDelete) {
      return;
    }

    const { error } = await supabase
      .from("podcasts")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Podcast deletion error:", error);
      alert(copy.deleteError);
      return;
    }

    await getPodcasts();
  };

  const getDisplayedTitle = (podcast: Podcast) => {
    if (isArabic) {
      return podcast.title_ar?.trim() || podcast.title;
    }

    return podcast.title;
  };

  const getDisplayedDescription = (podcast: Podcast) => {
    if (isArabic) {
      return (
        podcast.description_ar?.trim() ||
        podcast.description ||
        copy.noDescription
      );
    }

    return podcast.description?.trim() || copy.noDescription;
  };

  const getDisplayedTopic = (podcast: Podcast) => {
    if (isArabic) {
      return podcast.topic_ar?.trim() || podcast.topic || copy.noTopic;
    }

    return podcast.topic?.trim() || copy.noTopic;
  };

  const getOriginalLanguageLabel = (podcast: Podcast) => {
    return podcast.language === "ar" ? copy.arabic : copy.english;
  };
    if (loading) {
    return (
      <>
        <Navbar />

        <main
          dir={isArabic ? "rtl" : "ltr"}
          className="min-h-screen bg-[#f8f4ee] px-5 py-10 sm:px-8 lg:px-10"
        >
          <div className="mx-auto max-w-6xl rounded-[2rem] border border-[#e8dcc8] bg-white p-10 shadow-lg">
            <p className="text-xl text-[#5f686e]">
              {copy.loading}
            </p>
          </div>
        </main>
      </>
    );
  }

  if (!allowed) {
    return null;
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <>
        <Navbar />

        <main
          dir={isArabic ? "rtl" : "ltr"}
          className="min-h-screen bg-[#f8f4ee] px-5 py-10 sm:px-8 lg:px-10"
        >
          <section className="mx-auto max-w-6xl">
            <div className="mb-10 rounded-[2rem] border border-[#e8dcc8] bg-white p-8 shadow-lg sm:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#b39668]">
                {copy.pageEyebrow}
              </p>

              <h1 className="mt-4 text-4xl font-bold text-[#223748] sm:text-5xl">
                {copy.pageTitle}
              </h1>

              <p className="mt-4 max-w-4xl text-lg leading-8 text-[#5f686e]">
                {copy.pageDescription}
              </p>
            </div>

            <div className="mb-10 rounded-[2rem] border border-[#e8dcc8] bg-white p-8 shadow-lg sm:p-10">
              <div className="grid gap-5">
                <label className="grid gap-2 font-semibold text-[#223748]">
                  {copy.sourceLanguage}

                  <select
                    value={language}
                    onChange={(event) =>
                      setLanguage(
                        event.target.value as PodcastLanguage,
                      )
                    }
                    disabled={submitting}
                    className="rounded-2xl border border-[#d9cbb5] bg-white p-4 font-normal text-[#223748] outline-none transition focus:border-[#b39668] focus:ring-2 focus:ring-[#b39668]/20 disabled:opacity-60"
                  >
                    <option value="en">{copy.english}</option>
                    <option value="ar">{copy.arabic}</option>
                  </select>
                </label>

                <input
                  placeholder={copy.titlePlaceholder}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  disabled={submitting}
                  dir={language === "ar" ? "rtl" : "ltr"}
                  className="rounded-2xl border border-[#d9cbb5] p-4 text-[#223748] outline-none transition placeholder:text-[#8a9196] focus:border-[#b39668] focus:ring-2 focus:ring-[#b39668]/20 disabled:opacity-60"
                />

                <textarea
                  placeholder={copy.descriptionPlaceholder}
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  disabled={submitting}
                  dir={language === "ar" ? "rtl" : "ltr"}
                  className="h-36 resize-y rounded-2xl border border-[#d9cbb5] p-4 text-[#223748] outline-none transition placeholder:text-[#8a9196] focus:border-[#b39668] focus:ring-2 focus:ring-[#b39668]/20 disabled:opacity-60"
                />

                <input
                  placeholder={copy.audioPlaceholder}
                  value={audioUrl}
                  onChange={(event) =>
                    setAudioUrl(event.target.value)
                  }
                  disabled={submitting}
                  dir="ltr"
                  className="rounded-2xl border border-[#d9cbb5] p-4 text-[#223748] outline-none transition placeholder:text-[#8a9196] focus:border-[#b39668] focus:ring-2 focus:ring-[#b39668]/20 disabled:opacity-60"
                />

                <input
                  placeholder={copy.topicPlaceholder}
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  disabled={submitting}
                  dir={language === "ar" ? "rtl" : "ltr"}
                  className="rounded-2xl border border-[#d9cbb5] p-4 text-[#223748] outline-none transition placeholder:text-[#8a9196] focus:border-[#b39668] focus:ring-2 focus:ring-[#b39668]/20 disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={addPodcast}
                  disabled={submitting}
                  className="rounded-2xl bg-[#415a72] py-4 text-lg font-semibold text-white shadow-md transition hover:bg-[#354b60] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? copy.translatingAndSaving
                    : copy.addPodcast}
                </button>
              </div>
            </div>
                        <div className="rounded-[2rem] border border-[#e8dcc8] bg-white p-8 shadow-lg sm:p-10">
              <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#b39668]">
                    AAN Psychotherapy
                  </p>

                  <h2 className="mt-3 text-3xl font-bold text-[#223748]">
                    {copy.existingPodcasts}
                  </h2>
                </div>

                <span className="rounded-full bg-[#f0e8dc] px-4 py-2 text-sm font-semibold text-[#415a72]">
                  {podcasts.length}
                </span>
              </div>

              <div className="grid gap-6">
                {podcasts.length === 0 ? (
                  <p className="rounded-2xl bg-[#f8f4ee] p-6 text-[#5f686e]">
                    {copy.noPodcasts}
                  </p>
                ) : (
                  podcasts.map((podcast) => {
                    const displayedTitle =
                      getDisplayedTitle(podcast);

                    const displayedDescription =
                      getDisplayedDescription(podcast);

                    const displayedTopic =
                      getDisplayedTopic(podcast);

                    const isMissingArabic =
                      isArabic && !podcast.title_ar?.trim();

                    return (
                      <article
                        key={podcast.id}
                        className="rounded-[1.75rem] border border-[#eadfce] bg-[#fcfaf7] p-6 sm:p-8"
                      >
                        <div className="flex flex-col gap-6">
                          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                            <div className="min-w-0 flex-1">
                              <div className="mb-4 flex flex-wrap items-center gap-3">
                                <span className="rounded-full bg-[#f0e8dc] px-4 py-2 text-sm font-semibold text-[#415a72]">
                                  {displayedTopic}
                                </span>

                                <span className="text-sm text-[#69757d]">
                                  {copy.originalLanguage}:{" "}
                                  {getOriginalLanguageLabel(podcast)}
                                </span>
                              </div>

                              <h3 className="text-2xl font-bold text-[#223748] sm:text-3xl">
                                {displayedTitle}
                              </h3>

                              <p className="mt-4 max-w-4xl text-lg leading-8 text-[#5f686e]">
                                {displayedDescription}
                              </p>

                              {isMissingArabic && (
                                <p className="mt-4 rounded-xl border border-[#d8b36a] bg-[#fff8e8] px-4 py-3 text-sm text-[#7a5b20]">
                                  {copy.noArabicTranslation}
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                deletePodcast(podcast.id)
                              }
                              className="shrink-0 rounded-xl border border-red-200 bg-white px-5 py-3 font-semibold text-red-700 transition hover:bg-red-50"
                            >
                              {copy.delete}
                            </button>
                          </div>

                          <div className="border-t border-[#eadfce] pt-5">
                            <audio controls className="w-full">
                              <source
                                src={podcast.audio_url}
                                type="audio/mpeg"
                              />

                              {copy.audioUnsupported}
                            </audio>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        </main>
      </>
    </ProtectedRoute>
  );
}
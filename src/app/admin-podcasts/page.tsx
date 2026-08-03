"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import ProtectedRoute from "../components/ProtectedRoute";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/i18n/LanguageProvider";

type PodcastLanguage = "en" | "ar";
type PodcastContentType = "recorded" | "live";

type Podcast = {
  id: string;
  title: string;
  title_ar: string | null;
  description: string;
  description_ar: string | null;
  content_type: PodcastContentType | null;
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

  const [contentType, setContentType] =
    useState<PodcastContentType>("recorded");
  const [language, setLanguage] = useState<PodcastLanguage>("en");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topic, setTopic] = useState("");
  const [hostName, setHostName] = useState("");
  const [guestNames, setGuestNames] = useState("");

  const [audioUrl, setAudioUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [duration, setDuration] = useState("");

  const [liveUrl, setLiveUrl] = useState("");
  const [liveStartsAt, setLiveStartsAt] = useState("");
  const [liveEndsAt, setLiveEndsAt] = useState("");

  const copy = isArabic
    ? {
        pageEyebrow: "إدارة المحتوى",
        pageTitle: "إدارة الفيديو والبودكاست",
        pageDescription:
          "أضف فيديوهات مسجلة أو لقاءات مباشرة. سيتم إنشاء اللغة الثانية تلقائياً قبل الحفظ.",
        type: "نوع المحتوى",
        recorded: "مسجل",
        live: "مباشر",
        sourceLanguage: "لغة المحتوى الأصلية",
        english: "الإنجليزية",
        arabic: "العربية",
        title: "العنوان",
        description: "الوصف",
        topic: "الموضوع",
        host: "المقدّم",
        guests: "الضيوف",
        videoUrl: "رابط الفيديو",
        audioUrl: "رابط الصوت الاختياري",
        thumbnailUrl: "رابط الصورة المصغرة",
        duration: "المدة، مثال 42:10",
        liveUrl: "رابط البث المباشر",
        liveStartsAt: "بداية البث",
        liveEndsAt: "نهاية البث",
        add: "إضافة المحتوى",
        saving: "جارٍ الترجمة والحفظ...",
        existing: "المحتوى الموجود",
        empty: "لا يوجد محتوى حتى الآن.",
        originalLanguage: "اللغة الأصلية",
        delete: "حذف",
        deleteQuestion: "هل تريد حذف هذا المحتوى؟",
        loading: "جارٍ التحميل...",
        loadError: "تعذر تحميل المحتوى.",
        required:
          "العنوان مطلوب. أضف رابط فيديو للمحتوى المسجل أو رابط بث وموعد بداية للمحتوى المباشر.",
        translationError: "تعذرت الترجمة التلقائية.",
        addError: "تعذرت إضافة المحتوى.",
        deleteError: "تعذر حذف المحتوى.",
        success: "تمت إضافة المحتوى وترجمته بنجاح.",
        recordedBadge: "مسجل",
        liveBadge: "مباشر",
      }
    : {
        pageEyebrow: "Content management",
        pageTitle: "Manage Video Podcasts",
        pageDescription:
          "Add recorded videos or live sessions. The second language is generated automatically before saving.",
        type: "Content type",
        recorded: "Recorded",
        live: "Live",
        sourceLanguage: "Original content language",
        english: "English",
        arabic: "Arabic",
        title: "Title",
        description: "Description",
        topic: "Topic",
        host: "Host",
        guests: "Guests",
        videoUrl: "Video URL",
        audioUrl: "Optional audio URL",
        thumbnailUrl: "Thumbnail URL",
        duration: "Duration, for example 42:10",
        liveUrl: "Live session URL",
        liveStartsAt: "Live start",
        liveEndsAt: "Live end",
        add: "Add content",
        saving: "Translating and saving...",
        existing: "Existing content",
        empty: "No content yet.",
        originalLanguage: "Original language",
        delete: "Delete",
        deleteQuestion: "Delete this content?",
        loading: "Loading...",
        loadError: "Unable to load content.",
        required:
          "A title is required. Add a video URL for recorded content, or a live URL and start time for live content.",
        translationError: "Automatic translation failed.",
        addError: "Unable to add content.",
        deleteError: "Unable to delete content.",
        success: "Content added and translated successfully.",
        recordedBadge: "Recorded",
        liveBadge: "Live",
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
    void checkAdmin();
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
      throw new Error(
        result.details ||
          result.error ||
          copy.translationError,
      );
    }

    return result.translations;
  };

  const resetForm = () => {
    setContentType("recorded");
    setLanguage("en");
    setTitle("");
    setDescription("");
    setTopic("");
    setHostName("");
    setGuestNames("");
    setAudioUrl("");
    setVideoUrl("");
    setThumbnailUrl("");
    setDuration("");
    setLiveUrl("");
    setLiveStartsAt("");
    setLiveEndsAt("");
  };

  const addPodcast = async () => {
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    const cleanTopic = topic.trim();
    const cleanHostName = hostName.trim();
    const cleanGuestNames = guestNames.trim();
    const cleanAudioUrl = audioUrl.trim();
    const cleanVideoUrl = videoUrl.trim();
    const cleanThumbnailUrl = thumbnailUrl.trim();
    const cleanDuration = duration.trim();
    const cleanLiveUrl = liveUrl.trim();

    if (
      !cleanTitle ||
      (contentType === "recorded" &&
        !cleanVideoUrl &&
        !cleanAudioUrl) ||
      (contentType === "live" &&
        (!cleanLiveUrl || !liveStartsAt))
    ) {
      alert(copy.required);
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

      if (cleanHostName) {
        fieldsToTranslate.host_name = cleanHostName;
      }

      if (cleanGuestNames) {
        fieldsToTranslate.guest_names = cleanGuestNames;
      }

      const translations = await translateContent(
        language,
        targetLanguage,
        fieldsToTranslate,
      );

      const english =
        language === "en"
          ? {
              title: cleanTitle,
              description: cleanDescription,
              topic: cleanTopic,
              host_name: cleanHostName,
              guest_names: cleanGuestNames,
            }
          : {
              title: translations.title?.trim() || cleanTitle,
              description:
                translations.description?.trim() || "",
              topic: translations.topic?.trim() || "",
              host_name:
                translations.host_name?.trim() || "",
              guest_names:
                translations.guest_names?.trim() || "",
            };

      const arabic =
        language === "ar"
          ? {
              title: cleanTitle,
              description: cleanDescription,
              topic: cleanTopic,
              host_name: cleanHostName,
              guest_names: cleanGuestNames,
            }
          : {
              title: translations.title?.trim() || cleanTitle,
              description:
                translations.description?.trim() || "",
              topic: translations.topic?.trim() || "",
              host_name:
                translations.host_name?.trim() || "",
              guest_names:
                translations.guest_names?.trim() || "",
            };

      const podcastToInsert = {
        title: english.title,
        title_ar: arabic.title,
        description: english.description,
        description_ar: arabic.description,
        topic: english.topic,
        topic_ar: arabic.topic,
        host_name: english.host_name || null,
        host_name_ar: arabic.host_name || null,
        guest_names: english.guest_names || null,
        guest_names_ar: arabic.guest_names || null,
        content_type: contentType,
        language,
        audio_url: cleanAudioUrl || null,
        video_url: cleanVideoUrl || null,
        thumbnail_url: cleanThumbnailUrl || null,
        duration: cleanDuration || null,
        live_url:
          contentType === "live" ? cleanLiveUrl : null,
        live_starts_at:
          contentType === "live" && liveStartsAt
            ? new Date(liveStartsAt).toISOString()
            : null,
        live_ends_at:
          contentType === "live" && liveEndsAt
            ? new Date(liveEndsAt).toISOString()
            : null,
      };

      const { error } = await supabase
        .from("podcasts")
        .insert(podcastToInsert);

      if (error) {
        throw error;
      }

      resetForm();
      await getPodcasts();
      alert(copy.success);
    } catch (error) {
      console.error("Podcast creation error:", error);
      alert(
        error instanceof Error
          ? error.message
          : copy.addError,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const deletePodcast = async (id: string) => {
    if (!window.confirm(copy.deleteQuestion)) {
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

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-aan-background px-5 py-10">
          <div className="mx-auto max-w-6xl rounded-[2rem] border border-aan-border bg-white p-10">
            {copy.loading}
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
          className="min-h-screen bg-aan-background px-5 py-10 sm:px-8 lg:px-10"
        >
          <section className="mx-auto max-w-7xl">
            <header className="relative mb-10 overflow-hidden rounded-[2.25rem] border border-aan-border bg-white p-8 shadow-[var(--aan-shadow-md)] sm:p-10 lg:p-12">
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-aan-gold">
                {copy.pageEyebrow}
              </p>

              <h1 className="aan-heading mt-4 text-4xl sm:text-5xl lg:text-6xl">
                {copy.pageTitle}
              </h1>

              <p className="mt-5 max-w-4xl text-lg leading-8 text-aan-secondary">
                {copy.pageDescription}
              </p>
            </header>

            <section className="mb-10 rounded-[2rem] border border-aan-border bg-white p-7 shadow-[var(--aan-shadow-sm)] sm:p-9">
              <div className="grid gap-5 lg:grid-cols-2">
                <Field label={copy.type}>
                  <select
                    value={contentType}
                    onChange={(event) =>
                      setContentType(
                        event.target.value as PodcastContentType,
                      )
                    }
                    disabled={submitting}
                    className="aan-field p-4 font-normal"
                  >
                    <option value="recorded">{copy.recorded}</option>
                    <option value="live">{copy.live}</option>
                  </select>
                </Field>

                <Field label={copy.sourceLanguage}>
                  <select
                    value={language}
                    onChange={(event) =>
                      setLanguage(
                        event.target.value as PodcastLanguage,
                      )
                    }
                    disabled={submitting}
                    className="aan-field p-4 font-normal"
                  >
                    <option value="en">{copy.english}</option>
                    <option value="ar">{copy.arabic}</option>
                  </select>
                </Field>
              </div>

              <div className="mt-5 grid gap-5">
                <Field label={copy.title}>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    disabled={submitting}
                    dir={language === "ar" ? "rtl" : "ltr"}
                    className="aan-field p-4 font-normal"
                  />
                </Field>

                <Field label={copy.description}>
                  <textarea
                    value={description}
                    onChange={(event) =>
                      setDescription(event.target.value)
                    }
                    disabled={submitting}
                    dir={language === "ar" ? "rtl" : "ltr"}
                    className="aan-field min-h-36 resize-y p-4 font-normal"
                  />
                </Field>

                <div className="grid gap-5 lg:grid-cols-2">
                  <Field label={copy.topic}>
                    <input
                      value={topic}
                      onChange={(event) =>
                        setTopic(event.target.value)
                      }
                      disabled={submitting}
                      dir={language === "ar" ? "rtl" : "ltr"}
                      className="aan-field p-4 font-normal"
                    />
                  </Field>

                  <Field label={copy.duration}>
                    <input
                      value={duration}
                      onChange={(event) =>
                        setDuration(event.target.value)
                      }
                      disabled={submitting}
                      dir="ltr"
                      className="aan-field p-4 font-normal"
                    />
                  </Field>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <Field label={copy.host}>
                    <input
                      value={hostName}
                      onChange={(event) =>
                        setHostName(event.target.value)
                      }
                      disabled={submitting}
                      dir={language === "ar" ? "rtl" : "ltr"}
                      className="aan-field p-4 font-normal"
                    />
                  </Field>

                  <Field label={copy.guests}>
                    <textarea
                      value={guestNames}
                      onChange={(event) =>
                        setGuestNames(event.target.value)
                      }
                      disabled={submitting}
                      dir={language === "ar" ? "rtl" : "ltr"}
                      className="aan-field min-h-24 resize-y p-4 font-normal"
                    />
                  </Field>
                </div>

                <Field label={copy.thumbnailUrl}>
                  <input
                    value={thumbnailUrl}
                    onChange={(event) =>
                      setThumbnailUrl(event.target.value)
                    }
                    disabled={submitting}
                    dir="ltr"
                    className="aan-field p-4 font-normal"
                  />
                </Field>

                {contentType === "recorded" ? (
                  <div className="grid gap-5 lg:grid-cols-2">
                    <Field label={copy.videoUrl}>
                      <input
                        value={videoUrl}
                        onChange={(event) =>
                          setVideoUrl(event.target.value)
                        }
                        disabled={submitting}
                        dir="ltr"
                        className="aan-field p-4 font-normal"
                      />
                    </Field>

                    <Field label={copy.audioUrl}>
                      <input
                        value={audioUrl}
                        onChange={(event) =>
                          setAudioUrl(event.target.value)
                        }
                        disabled={submitting}
                        dir="ltr"
                        className="aan-field p-4 font-normal"
                      />
                    </Field>
                  </div>
                ) : (
                  <>
                    <Field label={copy.liveUrl}>
                      <input
                        value={liveUrl}
                        onChange={(event) =>
                          setLiveUrl(event.target.value)
                        }
                        disabled={submitting}
                        dir="ltr"
                        className="aan-field p-4 font-normal"
                      />
                    </Field>

                    <div className="grid gap-5 lg:grid-cols-2">
                      <Field label={copy.liveStartsAt}>
                        <input
                          type="datetime-local"
                          value={liveStartsAt}
                          onChange={(event) =>
                            setLiveStartsAt(event.target.value)
                          }
                          disabled={submitting}
                          className="aan-field p-4 font-normal"
                        />
                      </Field>

                      <Field label={copy.liveEndsAt}>
                        <input
                          type="datetime-local"
                          value={liveEndsAt}
                          onChange={(event) =>
                            setLiveEndsAt(event.target.value)
                          }
                          disabled={submitting}
                          className="aan-field p-4 font-normal"
                        />
                      </Field>
                    </div>
                  </>
                )}

                <button
                  type="button"
                  onClick={addPodcast}
                  disabled={submitting}
                  className="aan-cta rounded-2xl py-4 text-lg font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? copy.saving : copy.add}
                </button>
              </div>
            </section>

            <section className="rounded-[2rem] border border-aan-border bg-white p-7 shadow-[var(--aan-shadow-sm)] sm:p-9">
              <div className="mb-8 flex items-center justify-between gap-4">
                <h2 className="aan-heading text-3xl">
                  {copy.existing}
                </h2>

                <span className="rounded-full bg-[#fbf8f3] px-4 py-2 font-bold text-aan-navy">
                  {podcasts.length}
                </span>
              </div>

              {podcasts.length === 0 ? (
                <p className="rounded-2xl bg-[#fbf8f3] p-6 text-aan-secondary">
                  {copy.empty}
                </p>
              ) : (
                <div className="grid gap-6">
                  {podcasts.map((podcast) => (
                    <article
                      key={podcast.id}
                      className="rounded-[1.75rem] border border-aan-border bg-[#fbf8f3] p-6 sm:p-8"
                    >
                      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap gap-3">
                            <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-aan-navy">
                              {podcast.content_type === "live"
                                ? copy.liveBadge
                                : copy.recordedBadge}
                            </span>

                            <span className="rounded-full bg-white px-4 py-2 text-sm text-aan-secondary">
                              {copy.originalLanguage}:{" "}
                              {podcast.language === "ar"
                                ? copy.arabic
                                : copy.english}
                            </span>
                          </div>

                          <h3 className="aan-heading mt-5 text-3xl">
                            {getDisplayedTitle(podcast)}
                          </h3>

                          {podcast.description && (
                            <p className="mt-4 max-w-4xl whitespace-pre-line leading-8 text-aan-secondary">
                              {isArabic
                                ? podcast.description_ar ||
                                  podcast.description
                                : podcast.description}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            deletePodcast(podcast.id)
                          }
                          className="shrink-0 rounded-xl border border-red-200 bg-white px-5 py-3 font-bold text-red-700 hover:bg-red-50"
                        >
                          {copy.delete}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
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
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 font-bold text-aan-navy">
      {label}
      {children}
    </label>
  );
}

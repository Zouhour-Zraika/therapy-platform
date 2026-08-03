"use client";

import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
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

type UploadStatus =
  | "idle"
  | "uploading-thumbnail"
  | "uploading-video"
  | "translating"
  | "saving";

const VIDEO_BUCKET = "podcast-videos";
const THUMBNAIL_BUCKET = "podcast-thumbnails";

const MAX_VIDEO_SIZE = 500 * 1024 * 1024;
const MAX_THUMBNAIL_SIZE = 8 * 1024 * 1024;

export default function AdminPodcastsPage() {
  const router = useRouter();
  const { isArabic } = useLanguage();

  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] =
    useState<UploadStatus>("idle");

  const [podcasts, setPodcasts] = useState<Podcast[]>([]);

  const [contentType, setContentType] =
    useState<PodcastContentType>("recorded");

  const [language, setLanguage] =
    useState<PodcastLanguage>("en");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topic, setTopic] = useState("");
  const [hostName, setHostName] = useState("");
  const [guestNames, setGuestNames] = useState("");
  const [duration, setDuration] = useState("");

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] =
    useState<File | null>(null);

  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] =
    useState("");

  const [existingVideoUrl, setExistingVideoUrl] = useState("");
  

  const [audioUrl, setAudioUrl] = useState("");

  const [liveUrl, setLiveUrl] = useState("");
  const [liveStartsAt, setLiveStartsAt] = useState("");
  const [liveEndsAt, setLiveEndsAt] = useState("");

  const copy = isArabic
    ? {
        pageEyebrow: "إدارة المحتوى",
        pageTitle: "إدارة الفيديو والبودكاست",
        pageDescription:
          "أضف فيديوهات مسجلة أو لقاءات مباشرة مع ترجمة تلقائية إلى اللغة الثانية.",

        contentType: "نوع المحتوى",
        recorded: "فيديو مسجل",
        live: "بث مباشر",

        sourceLanguage: "لغة المحتوى الأصلية",
        english: "الإنجليزية",
        arabic: "العربية",

        title: "العنوان",
        description: "الوصف",
        topic: "الموضوع",
        host: "المقدّم",
        guests: "الضيوف",
        duration: "المدة، مثال 42:10",

        recordedSection: "الفيديو المسجل",
        chooseVideo: "اختيار ملف الفيديو",
        videoHelp: "MP4 أو WebM، بحد أقصى 500 ميغابايت.",
        selectedVideo: "الفيديو المحدد",
        optionalVideoUrl: "أو أدخل رابط فيديو جاهز",

        thumbnailSection: "الصورة المصغرة",
        chooseThumbnail: "اختيار صورة مصغرة",
        thumbnailHelp:
          "JPG أو PNG أو WebP، بحد أقصى 8 ميغابايت.",
        selectedThumbnail: "الصورة المحددة",
        optionalThumbnailUrl: "أو أدخل رابط صورة جاهز",

        audioUrl: "رابط صوت اختياري",

        liveSection: "إعدادات البث المباشر",
        liveUrl: "رابط Zoom أو Meet أو YouTube Live أو Jitsi",
        liveStartsAt: "بداية البث",
        liveEndsAt: "نهاية البث",

        add: "إضافة المحتوى",
        uploadingThumbnail: "جارٍ رفع الصورة المصغرة...",
        uploadingVideo: "جارٍ رفع الفيديو...",
        translating: "جارٍ إنشاء الترجمة...",
        saving: "جارٍ حفظ المحتوى...",

        existing: "المحتوى الموجود",
        empty: "لا يوجد محتوى حتى الآن.",
        originalLanguage: "اللغة الأصلية",
        delete: "حذف",
        deleteQuestion: "هل تريد حذف هذا المحتوى؟",

        loading: "جارٍ التحميل...",
        loadError: "تعذر تحميل المحتوى.",

        titleRequired: "يرجى إدخال العنوان.",
        recordedRequired:
          "يرجى اختيار فيديو أو إدخال رابط فيديو أو رابط صوت.",
        liveRequired:
          "يرجى إدخال رابط البث وتحديد موعد البداية.",

        invalidVideo:
          "يجب أن يكون الملف فيديو بصيغة MP4 أو WebM.",
        videoTooLarge:
          "حجم الفيديو يتجاوز 500 ميغابايت.",

        invalidThumbnail:
          "يجب أن تكون الصورة بصيغة JPG أو PNG أو WebP.",
        thumbnailTooLarge:
          "حجم الصورة يتجاوز 8 ميغابايت.",

        uploadError: "تعذر رفع الملف.",
        translationError: "تعذرت الترجمة التلقائية.",
        addError: "تعذرت إضافة المحتوى.",
        deleteError: "تعذر حذف المحتوى.",

        success:
          "تمت إضافة المحتوى ورفع الملفات وإنشاء الترجمة بنجاح.",

        recordedBadge: "مسجل",
        liveBadge: "مباشر",
        noDescription: "لا يوجد وصف.",
      }
    : {
        pageEyebrow: "Content management",
        pageTitle: "Manage Video Podcasts",
        pageDescription:
          "Add recorded videos or live sessions with automatic translation into the second language.",

        contentType: "Content type",
        recorded: "Recorded video",
        live: "Live session",

        sourceLanguage: "Original content language",
        english: "English",
        arabic: "Arabic",

        title: "Title",
        description: "Description",
        topic: "Topic",
        host: "Host",
        guests: "Guests",
        duration: "Duration, for example 42:10",

        recordedSection: "Recorded video",
        chooseVideo: "Choose video file",
        videoHelp: "MP4 or WebM, maximum 500 MB.",
        selectedVideo: "Selected video",
        optionalVideoUrl: "Or enter an existing video URL",

        thumbnailSection: "Thumbnail",
        chooseThumbnail: "Choose thumbnail",
        thumbnailHelp: "JPG, PNG or WebP, maximum 8 MB.",
        selectedThumbnail: "Selected image",
        optionalThumbnailUrl:
          "Or enter an existing thumbnail URL",

        audioUrl: "Optional audio URL",

        liveSection: "Live session settings",
        liveUrl:
          "Zoom, Meet, YouTube Live or Jitsi URL",
        liveStartsAt: "Live start",
        liveEndsAt: "Live end",

        add: "Add content",
        uploadingThumbnail: "Uploading thumbnail...",
        uploadingVideo: "Uploading video...",
        translating: "Generating translation...",
        saving: "Saving content...",

        existing: "Existing content",
        empty: "No content yet.",
        originalLanguage: "Original language",
        delete: "Delete",
        deleteQuestion: "Delete this content?",

        loading: "Loading...",
        loadError: "Unable to load content.",

        titleRequired: "Please enter a title.",
        recordedRequired:
          "Choose a video, enter a video URL or provide an audio URL.",
        liveRequired:
          "Enter a live session URL and select a start time.",

        invalidVideo:
          "The file must be an MP4 or WebM video.",
        videoTooLarge:
          "The video exceeds the 500 MB limit.",

        invalidThumbnail:
          "The image must be JPG, PNG or WebP.",
        thumbnailTooLarge:
          "The image exceeds the 8 MB limit.",

        uploadError: "Unable to upload the file.",
        translationError: "Automatic translation failed.",
        addError: "Unable to add content.",
        deleteError: "Unable to delete content.",

        success:
          "Content, files and automatic translation were saved successfully.",

        recordedBadge: "Recorded",
        liveBadge: "Live",
        noDescription: "No description.",
      };

  const submissionLabel = useMemo(() => {
    if (uploadStatus === "uploading-thumbnail") {
      return copy.uploadingThumbnail;
    }

    if (uploadStatus === "uploading-video") {
      return copy.uploadingVideo;
    }

    if (uploadStatus === "translating") {
      return copy.translating;
    }

    if (uploadStatus === "saving") {
      return copy.saving;
    }

    return copy.add;
  }, [copy, uploadStatus]);
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

  useEffect(() => {
    return () => {
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }

      if (thumbnailPreviewUrl) {
        URL.revokeObjectURL(thumbnailPreviewUrl);
      }
    };
  }, [videoPreviewUrl, thumbnailPreviewUrl]);

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

  const sanitizeFileName = (fileName: string) => {
    return fileName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9._-]/g, "");
  };

  const uploadFile = async (
    bucket: string,
    file: File,
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated.");
    }

    const cleanName =
      sanitizeFileName(file.name) || "file";

    const filePath = `${user.id}/${Date.now()}-${crypto.randomUUID()}-${cleanName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      throw new Error(
        uploadError.message || copy.uploadError,
      );
    }

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    if (!data.publicUrl) {
      throw new Error(copy.uploadError);
    }

    return data.publicUrl;
  };

  const handleVideoChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const validVideoTypes = [
      "video/mp4",
      "video/webm",
    ];

    if (!validVideoTypes.includes(file.type)) {
      alert(copy.invalidVideo);
      event.target.value = "";
      return;
    }

    if (file.size > MAX_VIDEO_SIZE) {
      alert(copy.videoTooLarge);
      event.target.value = "";
      return;
    }

    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }

    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
  };

  const handleThumbnailChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const validImageTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!validImageTypes.includes(file.type)) {
      alert(copy.invalidThumbnail);
      event.target.value = "";
      return;
    }

    if (file.size > MAX_THUMBNAIL_SIZE) {
      alert(copy.thumbnailTooLarge);
      event.target.value = "";
      return;
    }

    if (thumbnailPreviewUrl) {
      URL.revokeObjectURL(thumbnailPreviewUrl);
    }

    setThumbnailFile(file);
    setThumbnailPreviewUrl(URL.createObjectURL(file));
  };

  const clearVideoFile = () => {
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }

    setVideoFile(null);
    setVideoPreviewUrl("");
  };

  const clearThumbnailFile = () => {
    if (thumbnailPreviewUrl) {
      URL.revokeObjectURL(thumbnailPreviewUrl);
    }

    setThumbnailFile(null);
    setThumbnailPreviewUrl("");
  };

  const resetForm = () => {
    clearVideoFile();
    clearThumbnailFile();

    setContentType("recorded");
    setLanguage("en");

    setTitle("");
    setDescription("");
    setTopic("");
    setHostName("");
    setGuestNames("");
    setDuration("");

    setExistingVideoUrl("");
    setAudioUrl("");

    setLiveUrl("");
    setLiveStartsAt("");
    setLiveEndsAt("");

    setUploadStatus("idle");
  };

  const validateForm = () => {
    const cleanTitle = title.trim();

    if (!cleanTitle) {
      alert(copy.titleRequired);
      return false;
    }

    if (
      contentType === "recorded" &&
      !videoFile &&
      !existingVideoUrl.trim() &&
      !audioUrl.trim()
    ) {
      alert(copy.recordedRequired);
      return false;
    }

    if (
      contentType === "live" &&
      (!liveUrl.trim() || !liveStartsAt)
    ) {
      alert(copy.liveRequired);
      return false;
    }

    if (
      contentType === "live" &&
      liveEndsAt &&
      new Date(liveEndsAt) <=
        new Date(liveStartsAt)
    ) {
      alert(
        isArabic
          ? "يجب أن تكون نهاية البث بعد بداية البث."
          : "The live end time must be after the start time.",
      );
      return false;
    }

    return true;
  };

  const addPodcast = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    let uploadedVideoUrl = "";
    let uploadedThumbnailUrl = "";

    try {
      if (thumbnailFile) {
        setUploadStatus("uploading-thumbnail");

        uploadedThumbnailUrl = await uploadFile(
          THUMBNAIL_BUCKET,
          thumbnailFile,
        );
      }

      if (
        contentType === "recorded" &&
        videoFile
      ) {
        setUploadStatus("uploading-video");

        uploadedVideoUrl = await uploadFile(
          VIDEO_BUCKET,
          videoFile,
        );
      }

      setUploadStatus("translating");

      const cleanTitle = title.trim();
      const cleanDescription = description.trim();
      const cleanTopic = topic.trim();
      const cleanHostName = hostName.trim();
      const cleanGuestNames = guestNames.trim();

      const targetLanguage: PodcastLanguage =
        language === "en" ? "ar" : "en";

      const fieldsToTranslate: Record<string, string> = {
        title: cleanTitle,
      };

      if (cleanDescription) {
        fieldsToTranslate.description =
          cleanDescription;
      }

      if (cleanTopic) {
        fieldsToTranslate.topic = cleanTopic;
      }

      if (cleanHostName) {
        fieldsToTranslate.host_name =
          cleanHostName;
      }

      if (cleanGuestNames) {
        fieldsToTranslate.guest_names =
          cleanGuestNames;
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
              title:
                translations.title?.trim() ||
                cleanTitle,
              description:
                translations.description?.trim() ||
                "",
              topic:
                translations.topic?.trim() || "",
              host_name:
                translations.host_name?.trim() ||
                "",
              guest_names:
                translations.guest_names?.trim() ||
                "",
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
              title:
                translations.title?.trim() ||
                cleanTitle,
              description:
                translations.description?.trim() ||
                "",
              topic:
                translations.topic?.trim() || "",
              host_name:
                translations.host_name?.trim() ||
                "",
              guest_names:
                translations.guest_names?.trim() ||
                "",
            };

      setUploadStatus("saving");

      const finalVideoUrl =
        contentType === "recorded"
          ? uploadedVideoUrl ||
            existingVideoUrl.trim() ||
            null
          : null;

      const finalThumbnailUrl =
       uploadedThumbnailUrl || null;

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
        guest_names_ar:
          arabic.guest_names || null,

        content_type: contentType,
        language,

        video_url: finalVideoUrl,
        thumbnail_url: finalThumbnailUrl,

        audio_url:
          contentType === "recorded"
            ? audioUrl.trim() || null
            : null,

        duration:
          duration.trim() || null,

        live_url:
          contentType === "live"
            ? liveUrl.trim()
            : null,

        live_starts_at:
          contentType === "live" &&
          liveStartsAt
            ? new Date(
                liveStartsAt,
              ).toISOString()
            : null,

        live_ends_at:
          contentType === "live" &&
          liveEndsAt
            ? new Date(
                liveEndsAt,
              ).toISOString()
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
      console.error(
        "Podcast creation error:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : copy.addError,
      );
    } finally {
      setSubmitting(false);
      setUploadStatus("idle");
    }
  };
    const deletePodcast = async (id: string) => {
    if (!window.confirm(copy.deleteQuestion)) {
      return;
    }

    const podcastToDelete = podcasts.find(
      (podcast) => podcast.id === id,
    );

    const { error } = await supabase
      .from("podcasts")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Podcast deletion error:", error);
      alert(copy.deleteError);
      return;
    }

    const removeStorageFile = async (
      bucket: string,
      publicUrl: string | null,
    ) => {
      if (!publicUrl) {
        return;
      }

      try {
        const marker = `/storage/v1/object/public/${bucket}/`;
        const markerIndex = publicUrl.indexOf(marker);

        if (markerIndex === -1) {
          return;
        }

        const filePath = decodeURIComponent(
          publicUrl.slice(markerIndex + marker.length),
        );

        if (!filePath) {
          return;
        }

        const { error: storageError } =
          await supabase.storage
            .from(bucket)
            .remove([filePath]);

        if (storageError) {
          console.warn(
            `Unable to remove file from ${bucket}:`,
            storageError,
          );
        }
      } catch (storageError) {
        console.warn(
          `Storage cleanup failed for ${bucket}:`,
          storageError,
        );
      }
    };

    if (podcastToDelete) {
      await Promise.all([
        removeStorageFile(
          VIDEO_BUCKET,
          podcastToDelete.video_url,
        ),
        removeStorageFile(
          THUMBNAIL_BUCKET,
          podcastToDelete.thumbnail_url,
        ),
      ]);
    }

    await getPodcasts();
  };

  const getDisplayedTitle = (
    podcast: Podcast,
  ) => {
    if (isArabic) {
      return (
        podcast.title_ar?.trim() ||
        podcast.title
      );
    }

    return podcast.title;
  };

  const getDisplayedDescription = (
    podcast: Podcast,
  ) => {
    if (isArabic) {
      return (
        podcast.description_ar?.trim() ||
        podcast.description?.trim() ||
        copy.noDescription
      );
    }

    return (
      podcast.description?.trim() ||
      copy.noDescription
    );
  };

  const getDisplayedTopic = (
    podcast: Podcast,
  ) => {
    if (isArabic) {
      return (
        podcast.topic_ar?.trim() ||
        podcast.topic?.trim() ||
        ""
      );
    }

    return podcast.topic?.trim() || "";
  };

  const getDisplayedHost = (
    podcast: Podcast,
  ) => {
    if (isArabic) {
      return (
        podcast.host_name_ar?.trim() ||
        podcast.host_name?.trim() ||
        ""
      );
    }

    return podcast.host_name?.trim() || "";
  };

  const getDisplayedGuests = (
    podcast: Podcast,
  ) => {
    if (isArabic) {
      return (
        podcast.guest_names_ar?.trim() ||
        podcast.guest_names?.trim() ||
        ""
      );
    }

    return podcast.guest_names?.trim() || "";
  };

  const formatDate = (
    value: string | null,
  ) => {
    if (!value) {
      return "";
    }

    return new Intl.DateTimeFormat(
      isArabic ? "ar-LB" : "en-GB",
      {
        dateStyle: "medium",
        timeStyle: "short",
      },
    ).format(new Date(value));
  };

  const formatFileSize = (size: number) => {
    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(
      size /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <>
        <Navbar />

        <main
          dir={isArabic ? "rtl" : "ltr"}
          className="min-h-screen bg-aan-background px-5 py-10"
        >
          <div className="mx-auto max-w-6xl rounded-[2rem] border border-aan-border bg-white p-10 shadow-[var(--aan-shadow-sm)]">
            <div className="flex items-center gap-4">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-aan-border border-t-aan-button" />

              <p className="font-semibold text-aan-secondary">
                {copy.loading}
              </p>
            </div>
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
              <div
                aria-hidden="true"
                className={`absolute -top-24 h-72 w-72 rounded-full bg-aan-gold/10 blur-3xl ${
                  isArabic
                    ? "-left-20"
                    : "-right-20"
                }`}
              />

              <div className="relative max-w-4xl">
                <p className="text-sm font-bold uppercase tracking-[0.28em] text-aan-gold">
                  {copy.pageEyebrow}
                </p>

                <h1 className="aan-heading mt-4 text-4xl sm:text-5xl lg:text-6xl">
                  {copy.pageTitle}
                </h1>

                <div className="mt-6 flex items-center gap-3">
                  <div className="h-px w-28 bg-aan-gold" />
                  <span className="h-2 w-2 rounded-full bg-aan-gold" />
                  <span className="h-1.5 w-1.5 rounded-full bg-aan-gold/60" />
                </div>

                <p className="mt-6 max-w-4xl text-lg leading-8 text-aan-secondary">
                  {copy.pageDescription}
                </p>
              </div>
            </header>

            <section className="mb-10 rounded-[2rem] border border-aan-border bg-white p-7 shadow-[var(--aan-shadow-sm)] sm:p-9">
              <div className="grid gap-5 lg:grid-cols-2">
                <Field label={copy.contentType}>
                  <select
                    value={contentType}
                    onChange={(event) => {
                      const nextType =
                        event.target
                          .value as PodcastContentType;

                      setContentType(nextType);

                      if (
                        nextType === "live"
                      ) {
                        clearVideoFile();
                        setExistingVideoUrl("");
                        setAudioUrl("");
                      } else {
                        setLiveUrl("");
                        setLiveStartsAt("");
                        setLiveEndsAt("");
                      }
                    }}
                    disabled={submitting}
                    className="aan-field p-4 font-normal"
                  >
                    <option value="recorded">
                      {copy.recorded}
                    </option>

                    <option value="live">
                      {copy.live}
                    </option>
                  </select>
                </Field>

                <Field label={copy.sourceLanguage}>
                  <select
                    value={language}
                    onChange={(event) =>
                      setLanguage(
                        event.target
                          .value as PodcastLanguage,
                      )
                    }
                    disabled={submitting}
                    className="aan-field p-4 font-normal"
                  >
                    <option value="en">
                      {copy.english}
                    </option>

                    <option value="ar">
                      {copy.arabic}
                    </option>
                  </select>
                </Field>
              </div>

              <div className="mt-6 grid gap-5">
                <Field label={copy.title}>
                  <input
                    value={title}
                    onChange={(event) =>
                      setTitle(event.target.value)
                    }
                    disabled={submitting}
                    dir={
                      language === "ar"
                        ? "rtl"
                        : "ltr"
                    }
                    className="aan-field p-4 font-normal"
                  />
                </Field>

                <Field label={copy.description}>
                  <textarea
                    value={description}
                    onChange={(event) =>
                      setDescription(
                        event.target.value,
                      )
                    }
                    disabled={submitting}
                    dir={
                      language === "ar"
                        ? "rtl"
                        : "ltr"
                    }
                    className="aan-field min-h-40 resize-y p-4 font-normal"
                  />
                </Field>

                <div className="grid gap-5 lg:grid-cols-2">
                  <Field label={copy.topic}>
                    <input
                      value={topic}
                      onChange={(event) =>
                        setTopic(
                          event.target.value,
                        )
                      }
                      disabled={submitting}
                      dir={
                        language === "ar"
                          ? "rtl"
                          : "ltr"
                      }
                      className="aan-field p-4 font-normal"
                    />
                  </Field>

                  <Field label={copy.duration}>
                    <input
                      value={duration}
                      onChange={(event) =>
                        setDuration(
                          event.target.value,
                        )
                      }
                      disabled={submitting}
                      dir="ltr"
                      placeholder="42:10"
                      className="aan-field p-4 font-normal"
                    />
                  </Field>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <Field label={copy.host}>
                    <input
                      value={hostName}
                      onChange={(event) =>
                        setHostName(
                          event.target.value,
                        )
                      }
                      disabled={submitting}
                      dir={
                        language === "ar"
                          ? "rtl"
                          : "ltr"
                      }
                      className="aan-field p-4 font-normal"
                    />
                  </Field>

                  <Field label={copy.guests}>
                    <textarea
                      value={guestNames}
                      onChange={(event) =>
                        setGuestNames(
                          event.target.value,
                        )
                      }
                      disabled={submitting}
                      dir={
                        language === "ar"
                          ? "rtl"
                          : "ltr"
                      }
                      className="aan-field min-h-24 resize-y p-4 font-normal"
                    />
                  </Field>
                </div>
                                <div className="rounded-[1.75rem] border border-aan-border bg-[#fbf8f3] p-6">
                  <h2 className="text-xl font-bold text-aan-navy">
                    {copy.thumbnailSection}
                  </h2>

                  <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_280px]">
                    <div>
                      <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border-2 border-aan-gold bg-white px-6 py-4 font-bold text-aan-navy transition hover:bg-aan-gold hover:text-white">
                        {copy.chooseThumbnail}

                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleThumbnailChange}
                          disabled={submitting}
                          className="hidden"
                        />
                      </label>

                      <p className="mt-3 text-sm leading-6 text-aan-secondary">
                        {copy.thumbnailHelp}
                      </p>

                      {thumbnailFile && (
                        <div className="mt-4 rounded-2xl border border-aan-border bg-white p-4">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-aan-gold">
                            {copy.selectedThumbnail}
                          </p>

                          <p className="mt-2 break-all font-semibold text-aan-navy">
                            {thumbnailFile.name}
                          </p>

                          <p className="mt-1 text-sm text-aan-secondary">
                            {formatFileSize(thumbnailFile.size)}
                          </p>

                          <button
                            type="button"
                            onClick={clearThumbnailFile}
                            disabled={submitting}
                            className="mt-3 text-sm font-bold text-red-700"
                          >
                            × {copy.delete}
                          </button>
                        </div>
                      )}

                      
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-aan-border bg-white">
                     {thumbnailPreviewUrl ? (
                        <img
                          src={thumbnailPreviewUrl}
                          alt="Thumbnail preview"
                          className="aspect-video h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex aspect-video items-center justify-center bg-[linear-gradient(145deg,#f8f4ee_0%,#eef4fa_100%)] px-5 text-center text-sm text-aan-secondary">
                          {isArabic
                            ? "ستظهر معاينة الصورة هنا."
                            : "Thumbnail preview will appear here."}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {contentType === "recorded" ? (
                  <div className="rounded-[1.75rem] border border-aan-border bg-[#fbf8f3] p-6">
                    <h2 className="text-xl font-bold text-aan-navy">
                      {copy.recordedSection}
                    </h2>

                    <div className="mt-5">
                      <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl bg-aan-button px-6 py-4 font-bold text-white transition hover:bg-aan-hover">
                        {copy.chooseVideo}

                        <input
                          type="file"
                          accept="video/mp4,video/webm"
                          onChange={handleVideoChange}
                          disabled={submitting}
                          className="hidden"
                        />
                      </label>

                      <p className="mt-3 text-sm leading-6 text-aan-secondary">
                        {copy.videoHelp}
                      </p>

                      {videoFile && (
                        <div className="mt-4 rounded-2xl border border-aan-border bg-white p-4">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-aan-gold">
                            {copy.selectedVideo}
                          </p>

                          <p className="mt-2 break-all font-semibold text-aan-navy">
                            {videoFile.name}
                          </p>

                          <p className="mt-1 text-sm text-aan-secondary">
                            {formatFileSize(videoFile.size)}
                          </p>

                          <button
                            type="button"
                            onClick={clearVideoFile}
                            disabled={submitting}
                            className="mt-3 text-sm font-bold text-red-700"
                          >
                            × {copy.delete}
                          </button>
                        </div>
                      )}

                      {videoPreviewUrl && (
                        <video
                          controls
                          src={videoPreviewUrl}
                          className="mt-5 aspect-video w-full rounded-2xl bg-black"
                        />
                      )}

                      <div className="mt-5 grid gap-5 lg:grid-cols-2">
                        <Field label={copy.optionalVideoUrl}>
                          <input
                            value={existingVideoUrl}
                            onChange={(event) =>
                              setExistingVideoUrl(
                                event.target.value,
                              )
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
                              setAudioUrl(
                                event.target.value,
                              )
                            }
                            disabled={submitting}
                            dir="ltr"
                            className="aan-field p-4 font-normal"
                          />
                        </Field>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[1.75rem] border border-aan-border bg-[#fbf8f3] p-6">
                    <h2 className="text-xl font-bold text-aan-navy">
                      {copy.liveSection}
                    </h2>

                    <div className="mt-5 grid gap-5">
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
                              setLiveStartsAt(
                                event.target.value,
                              )
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
                              setLiveEndsAt(
                                event.target.value,
                              )
                            }
                            disabled={submitting}
                            className="aan-field p-4 font-normal"
                          />
                        </Field>
                      </div>

                      <div className="rounded-2xl border border-aan-border bg-white p-5">
                        <p className="text-sm leading-7 text-aan-secondary">
                          {isArabic
                            ? "يمكنك استخدام رابط Zoom أو Google Meet أو YouTube Live أو Jitsi. سيظهر المحتوى على الصفحة العامة كموعد قادم، ثم كمباشر أثناء الفترة المحددة."
                            : "You can use a Zoom, Google Meet, YouTube Live or Jitsi URL. The public page will show it as upcoming, then live during the scheduled period."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={addPodcast}
                  disabled={submitting}
                  className="aan-cta rounded-2xl py-4 text-lg font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submissionLabel}
                </button>
              </div>
            </section>

            <section className="rounded-[2rem] border border-aan-border bg-white p-7 shadow-[var(--aan-shadow-sm)] sm:p-9">
              <div className="mb-8 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.24em] text-aan-gold">
                    AAN Psychotherapy
                  </p>

                  <h2 className="aan-heading mt-3 text-3xl">
                    {copy.existing}
                  </h2>
                </div>

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
                  {podcasts.map((podcast) => {
                    const displayedTitle =
                      getDisplayedTitle(podcast);

                    const displayedDescription =
                      getDisplayedDescription(podcast);

                    const displayedTopic =
                      getDisplayedTopic(podcast);

                    const displayedHost =
                      getDisplayedHost(podcast);

                    const displayedGuests =
                      getDisplayedGuests(podcast);

                    return (
                      <article
                        key={podcast.id}
                        className="overflow-hidden rounded-[1.75rem] border border-aan-border bg-[#fbf8f3]"
                      >
                        <div className="grid lg:grid-cols-[260px_1fr]">
                          <div className="bg-aan-button">
                            {podcast.thumbnail_url ? (
                              <img
                                src={podcast.thumbnail_url}
                                alt={displayedTitle}
                                className="aspect-video h-full w-full object-cover lg:aspect-auto"
                              />
                            ) : (
                              <div className="flex min-h-52 items-center justify-center p-6 text-center font-semibold text-white">
                                {podcast.content_type === "live"
                                  ? copy.liveBadge
                                  : copy.recordedBadge}
                              </div>
                            )}
                          </div>

                          <div className="p-6 sm:p-8">
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

                                  {displayedTopic && (
                                    <span className="rounded-full bg-white px-4 py-2 text-sm text-aan-secondary">
                                      {displayedTopic}
                                    </span>
                                  )}
                                </div>

                                <h3 className="aan-heading mt-5 text-3xl">
                                  {displayedTitle}
                                </h3>

                                <p className="mt-4 max-w-4xl whitespace-pre-line leading-8 text-aan-secondary">
                                  {displayedDescription}
                                </p>

                                {(displayedHost ||
                                  displayedGuests) && (
                                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                    {displayedHost && (
                                      <div className="rounded-2xl bg-white p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-aan-gold">
                                          {copy.host}
                                        </p>

                                        <p className="mt-2 font-semibold text-aan-navy">
                                          {displayedHost}
                                        </p>
                                      </div>
                                    )}

                                    {displayedGuests && (
                                      <div className="rounded-2xl bg-white p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-aan-gold">
                                          {copy.guests}
                                        </p>

                                        <p className="mt-2 whitespace-pre-line font-semibold text-aan-navy">
                                          {displayedGuests}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {podcast.content_type ===
                                  "live" &&
                                  podcast.live_starts_at && (
                                    <p className="mt-5 text-sm font-semibold text-aan-secondary">
                                      {copy.liveStartsAt}:{" "}
                                      <span className="text-aan-navy">
                                        {formatDate(
                                          podcast.live_starts_at,
                                        )}
                                      </span>
                                    </p>
                                  )}
                              </div>
                                                            <button
                                type="button"
                                onClick={() =>
                                  deletePodcast(podcast.id)
                                }
                                className="shrink-0 rounded-xl border border-red-200 bg-white px-5 py-3 font-bold text-red-700 transition hover:bg-red-50"
                              >
                                {copy.delete}
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
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
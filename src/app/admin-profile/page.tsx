"use client";

import Image from "next/image";
import { ChangeEvent, useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import ProtectedRoute from "../components/ProtectedRoute";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/i18n/LanguageProvider";

type AdminProfile = {
  full_name: string | null;
  job_title: string | null;
  specialty: string | null;
  experience_years: number | null;
  bio: string | null;
  education: string | null;
  certifications: string | null;
  therapeutic_approach: string | null;
  services: string | null;
  languages: string | null;
  photo_url: string | null;
  role: string | null;
};

type TranslationResult = {
  translations?: Record<string, string>;
  error?: string;
  details?: string;
};

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

export default function AdminProfilePage() {
  const { isArabic } = useLanguage();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [bio, setBio] = useState("");
  const [education, setEducation] = useState("");
  const [certifications, setCertifications] = useState("");
  const [therapeuticApproach, setTherapeuticApproach] = useState("");
  const [services, setServices] = useState("");
  const [languages, setLanguages] = useState("");

  const [photoUrl, setPhotoUrl] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    void loadProfile();
  }, []);

  useEffect(() => {
    return () => {
      if (photoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const loadProfile = async () => {
    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        window.location.href = "/login";
        return;
      }

      setEmail(user.email || "");

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "full_name, job_title, specialty, experience_years, bio, education, certifications, therapeutic_approach, services, languages, photo_url, role",
        )
        .eq("id", user.id)
        .single<AdminProfile>();

      if (error) {
        console.error("Admin profile load error:", error);
        return;
      }

      if (data?.role !== "admin") {
        window.location.href = "/";
        return;
      }

      setFullName(data.full_name || "");
      setJobTitle(data.job_title || "");
      setSpecialty(data.specialty || "");
      setExperienceYears(data.experience_years?.toString() || "");
      setBio(data.bio || "");
      setEducation(data.education || "");
      setCertifications(data.certifications || "");
      setTherapeuticApproach(data.therapeutic_approach || "");
      setServices(data.services || "");
      setLanguages(data.languages || "");
      setPhotoUrl(data.photo_url || "");
    } catch (error) {
      console.error("Unexpected admin profile load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert(isArabic ? "يرجى اختيار صورة صالحة." : "Please select a valid image.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_PHOTO_SIZE) {
      alert(
        isArabic
          ? "يجب ألا يتجاوز حجم الصورة 5 ميغابايت."
          : "The image must be smaller than 5 MB.",
      );
      event.target.value = "";
      return;
    }

    if (photoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setSuccessMessage("");
  };

  const uploadPhoto = async (userId: string) => {
    if (!photoFile) return photoUrl || null;

    const extension = photoFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const filePath = `${userId}/admin-profile-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("profile-photos")
      .upload(filePath, photoFile, {
        cacheControl: "3600",
        contentType: photoFile.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from("profile-photos").getPublicUrl(filePath);

    return publicUrl;
  };

  const translateToArabic = async (fields: Record<string, string>) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 120000);

    try {
      const response = await fetch("/api/translate-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceLanguage: "en",
          targetLanguage: "ar",
          fields,
        }),
        signal: controller.signal,
      });

      const result = (await response.json()) as TranslationResult;

      if (!response.ok || !result.translations) {
        throw new Error(
          result.details || result.error || "Automatic translation failed.",
        );
      }

      return result.translations;
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const saveProfile = async () => {
    setSuccessMessage("");

    if (!fullName.trim()) {
      alert(isArabic ? "يرجى إدخال الاسم الكامل." : "Please enter your full name.");
      return;
    }

    if (!jobTitle.trim()) {
      alert(
        isArabic
          ? "يرجى إدخال المسمى المهني."
          : "Please enter your professional title.",
      );
      return;
    }

    if (!specialty.trim()) {
      alert(isArabic ? "يرجى إدخال التخصص." : "Please enter your specialty.");
      return;
    }

    const parsedExperience = experienceYears.trim()
      ? Number(experienceYears)
      : null;

    if (
      parsedExperience !== null &&
      (!Number.isInteger(parsedExperience) ||
        parsedExperience < 0 ||
        parsedExperience > 80)
    ) {
      alert(
        isArabic
          ? "يرجى إدخال عدد صحيح صالح لسنوات الخبرة."
          : "Please enter a valid whole number of experience years.",
      );
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("User not authenticated");

      const uploadedPhotoUrl = await uploadPhoto(user.id);

      const englishFields = {
        full_name: fullName.trim(),
        professional_title: jobTitle.trim(),
        specialty: specialty.trim(),
        bio: bio.trim(),
        education: education.trim(),
        certifications: certifications.trim(),
        therapeutic_approach: therapeuticApproach.trim(),
        services: services.trim(),
        languages: languages.trim(),
      };

      // Save the English profile first. The profile is never lost if translation is slow.
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: englishFields.full_name,
          job_title: englishFields.professional_title,
          specialty: englishFields.specialty,
          experience_years: parsedExperience,
          bio: englishFields.bio,
          education: englishFields.education,
          certifications: englishFields.certifications,
          therapeutic_approach: englishFields.therapeutic_approach,
          services: englishFields.services,
          languages: englishFields.languages,
          photo_url: uploadedPhotoUrl,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      const { error: therapistError } = await supabase
        .from("therapists")
        .upsert(
          {
            id: user.id,
            full_name: englishFields.full_name,
            professional_title: englishFields.professional_title,
            specialty: englishFields.specialty,
            experience_years: parsedExperience,
            bio: englishFields.bio,
            education: englishFields.education,
            certifications: englishFields.certifications,
            therapeutic_approach: englishFields.therapeutic_approach,
            services: englishFields.services,
            languages: englishFields.languages,
            photo_url: uploadedPhotoUrl,
            price: 25,
          },
          { onConflict: "id" },
        );

      if (therapistError) throw therapistError;

      let translationCompleted = false;

      try {
        const arabic = await translateToArabic(englishFields);

        const { error: profileArabicError } = await supabase
          .from("profiles")
          .update({
            full_name_ar: arabic.full_name || null,
            job_title_ar: arabic.professional_title || null,
            specialty_ar: arabic.specialty || null,
            bio_ar: arabic.bio || null,
            education_ar: arabic.education || null,
            certifications_ar: arabic.certifications || null,
            therapeutic_approach_ar: arabic.therapeutic_approach || null,
            services_ar: arabic.services || null,
            languages_ar: arabic.languages || null,
          })
          .eq("id", user.id);

        if (profileArabicError) throw profileArabicError;

        const { error: therapistArabicError } = await supabase
          .from("therapists")
          .update({
            full_name_ar: arabic.full_name || null,
            professional_title_ar: arabic.professional_title || null,
            specialty_ar: arabic.specialty || null,
            bio_ar: arabic.bio || null,
            education_ar: arabic.education || null,
            certifications_ar: arabic.certifications || null,
            therapeutic_approach_ar: arabic.therapeutic_approach || null,
            services_ar: arabic.services || null,
            languages_ar: arabic.languages || null,
          })
          .eq("id", user.id);

        if (therapistArabicError) throw therapistArabicError;

        translationCompleted = true;
      } catch (translationError) {
        console.error("Automatic translation warning:", translationError);
      }

      setPhotoUrl(uploadedPhotoUrl || "");
      setPhotoFile(null);

      if (photoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreview);
      }

      setPhotoPreview("");
      setSuccessMessage(
        translationCompleted
          ? isArabic
            ? "تم حفظ الملف وترجمته إلى العربية بنجاح."
            : "Profile saved and translated into Arabic successfully."
          : isArabic
            ? "تم حفظ الملف. تعذر إكمال الترجمة الآن."
            : "Profile saved. Automatic translation could not finish right now.",
      );

      await loadProfile();
    } catch (error) {
      console.error("Admin profile save error:", error);

      const message =
        error instanceof Error ? error.message : "Unknown save error.";

      alert(
        isArabic
          ? `تعذر حفظ الملف: ${message}`
          : `Unable to save the profile: ${message}`,
      );
    } finally {
      setSaving(false);
    }
  };

  const displayedPhoto = photoPreview || photoUrl;
  const initial = fullName.trim().charAt(0).toUpperCase() || "A";

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <>
        <Navbar />

        <main
          dir={isArabic ? "rtl" : "ltr"}
          className="min-h-screen bg-aan-background px-5 py-10 sm:px-8 lg:px-10"
        >
          <section className="mx-auto max-w-7xl">
            <div className="aan-card p-7 sm:p-10 lg:p-12">
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-aan-gold">
                AAN Psychotherapy
              </p>

              <h1 className="aan-heading mt-4 text-4xl sm:text-5xl">
                {isArabic
                  ? "الملف المهني للمسؤول"
                  : "Administrator Professional Profile"}
              </h1>

              <p className="mt-5 max-w-3xl leading-8 text-aan-secondary">
                {isArabic
                  ? "أدخل المعلومات باللغة الإنجليزية. ستتم ترجمتها إلى العربية تلقائياً عند الحفظ."
                  : "Enter the information in English. It will be translated into Arabic automatically when saved."}
              </p>

              {loading ? (
                <p className="mt-10 text-aan-secondary">
                  {isArabic ? "جارٍ تحميل الملف..." : "Loading profile..."}
                </p>
              ) : (
                <div className="mt-10 grid gap-8 lg:grid-cols-2">
                  <section className="rounded-[2rem] border border-aan-border bg-white p-7 shadow-[var(--aan-shadow-sm)] sm:p-9">
                    <h2 className="aan-heading text-3xl">
                      {isArabic
                        ? "الصورة والمعلومات الأساسية"
                        : "Photo and Basic Information"}
                    </h2>

                    <div className="mt-8 flex flex-col items-center">
                      <div className="relative h-44 w-44 overflow-hidden rounded-full border-2 border-aan-gold bg-[#f8f4ee] shadow-[var(--aan-shadow-md)]">
                        {displayedPhoto ? (
                          <Image
                            src={displayedPhoto}
                            alt={fullName || "Administrator photo"}
                            fill
                            sizes="176px"
                            className="object-cover"
                            unoptimized={displayedPhoto.startsWith("blob:")}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#f8f4ee_0%,#edf3f9_100%)]">
                            <span className="text-6xl font-bold text-aan-button">
                              {initial}
                            </span>
                          </div>
                        )}
                      </div>

                      <label className="mt-6 inline-flex cursor-pointer items-center justify-center rounded-xl border-2 border-aan-gold bg-white px-5 py-3 font-bold text-aan-navy transition hover:bg-aan-gold hover:text-white">
                        {isArabic ? "اختيار صورة" : "Choose Profile Photo"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="mt-8 space-y-5">
                      <Field label={isArabic ? "البريد الإلكتروني" : "Email"}>
                        <input
                          type="email"
                          value={email}
                          disabled
                          className="aan-field bg-[#f4f1ec] p-4 font-normal opacity-75"
                        />
                      </Field>

                      <Field label={isArabic ? "الاسم الكامل" : "Full name"}>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(event) => setFullName(event.target.value)}
                          className="aan-field p-4 font-normal"
                        />
                      </Field>

                      <Field
                        label={isArabic ? "المسمى المهني" : "Professional title"}
                      >
                        <input
                          type="text"
                          value={jobTitle}
                          onChange={(event) => setJobTitle(event.target.value)}
                          className="aan-field p-4 font-normal"
                        />
                      </Field>

                      <Field label={isArabic ? "التخصص" : "Specialty"}>
                        <input
                          type="text"
                          value={specialty}
                          onChange={(event) => setSpecialty(event.target.value)}
                          className="aan-field p-4 font-normal"
                        />
                      </Field>

                      <Field
                        label={isArabic ? "سنوات الخبرة" : "Years of experience"}
                      >
                        <input
                          type="number"
                          min="0"
                          max="80"
                          step="1"
                          value={experienceYears}
                          onChange={(event) => setExperienceYears(event.target.value)}
                          className="aan-field p-4 font-normal"
                        />
                      </Field>
                    </div>
                  </section>

                  <section className="rounded-[2rem] border border-aan-border bg-white p-7 shadow-[var(--aan-shadow-sm)] sm:p-9">
                    <h2 className="aan-heading text-3xl">
                      {isArabic
                        ? "السيرة والخبرة المهنية"
                        : "Biography and Professional Experience"}
                    </h2>

                    <div className="mt-8 space-y-6">
                      <Field
                        label={isArabic ? "النبذة المهنية" : "Professional biography"}
                      >
                        <textarea
                          value={bio}
                          onChange={(event) => setBio(event.target.value)}
                          className="aan-field min-h-64 resize-y p-4 font-normal leading-7"
                        />
                      </Field>

                      <Field
                        label={isArabic
                          ? "التعليم والمؤهلات"
                          : "Education and qualifications"}
                      >
                        <textarea
                          value={education}
                          onChange={(event) => setEducation(event.target.value)}
                          className="aan-field min-h-40 resize-y p-4 font-normal leading-7"
                        />
                      </Field>

                      <Field
                        label={isArabic
                          ? "التدريبات والشهادات"
                          : "Training and certifications"}
                      >
                        <textarea
                          value={certifications}
                          onChange={(event) => setCertifications(event.target.value)}
                          className="aan-field min-h-40 resize-y p-4 font-normal leading-7"
                        />
                      </Field>

                      <Field
                        label={isArabic ? "النهج العلاجي" : "Therapeutic approach"}
                      >
                        <textarea
                          value={therapeuticApproach}
                          onChange={(event) =>
                            setTherapeuticApproach(event.target.value)
                          }
                          className="aan-field min-h-40 resize-y p-4 font-normal leading-7"
                        />
                      </Field>

                      <Field label={isArabic ? "الخدمات" : "Services"}>
                        <textarea
                          value={services}
                          onChange={(event) => setServices(event.target.value)}
                          className="aan-field min-h-40 resize-y p-4 font-normal leading-7"
                        />
                      </Field>

                      <Field label={isArabic ? "اللغات" : "Languages"}>
                        <textarea
                          value={languages}
                          onChange={(event) => setLanguages(event.target.value)}
                          className="aan-field min-h-28 resize-y p-4 font-normal leading-7"
                        />
                      </Field>

                      {successMessage && (
                        <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 font-semibold text-green-700">
                          {successMessage}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={saveProfile}
                        disabled={saving}
                        className="aan-button w-full py-4 text-lg disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving
                          ? isArabic
                            ? "جارٍ الحفظ والترجمة..."
                            : "Saving and translating..."
                          : isArabic
                            ? "حفظ وترجمة الملف المهني"
                            : "Save and Translate Professional Profile"}
                      </button>
                    </div>
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
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 font-bold text-aan-navy">
      {label}
      {children}
    </label>
  );
}
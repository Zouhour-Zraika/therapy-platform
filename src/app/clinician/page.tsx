"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/i18n/LanguageProvider";

type LoginMode = "client" | "therapist";
type ApplicationLanguage = "en" | "fr" | "ar";

export default function ClinicianPage() {
  const router = useRouter();
  const { language, isArabic, t } = useLanguage();

  const [loginMode, setLoginMode] =
    useState<LoginMode>("client");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] =
    useState("");
  const [showPassword, setShowPassword] =
    useState(false);

  const [applicationLanguage, setApplicationLanguage] =
    useState<ApplicationLanguage>("en");

  const [fullName, setFullName] = useState("");
  const [applicationEmail, setApplicationEmail] =
    useState("");
  const [specialty, setSpecialty] = useState("");
  const [message, setMessage] = useState("");

  const [loginLoading, setLoginLoading] =
    useState(false);
  const [applicationLoading, setApplicationLoading] =
    useState(false);

  const [loginError, setLoginError] = useState("");
  const [applicationError, setApplicationError] =
    useState("");
  const [applicationSuccess, setApplicationSuccess] =
    useState("");

  const handleLogin = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setLoginError("");

    const email = loginEmail.trim();

    if (!email || !loginPassword) {
      setLoginError(
        t("clinician.errors.loginRequired")
      );
      return;
    }

    try {
      setLoginLoading(true);

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email,
          password: loginPassword,
        });

      if (error) {
        setLoginError(t("clinician.errors.invalidCredentials"));
        return;
      }

      if (!data.user) {
        setLoginError(
          t("clinician.errors.accountUnavailable")
        );
        return;
      }

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();

        setLoginError(
          t("clinician.errors.profileMissing")
        );
        return;
      }

      if (profile.role === "admin") {
        router.push("/admin");
        router.refresh();
        return;
      }

      if (profile.role === "therapist") {
        if (loginMode !== "therapist") {
          await supabase.auth.signOut();

          setLoginError(
            t("clinician.errors.selectTherapist")
          );
          return;
        }

        router.push("/therapist-dashboard");
        router.refresh();
        return;
      }

      if (
        profile.role === "client" ||
        profile.role === "patient" ||
        !profile.role
      ) {
        if (loginMode !== "client") {
          await supabase.auth.signOut();

          setLoginError(
            t("clinician.errors.selectClient")
          );
          return;
        }

        router.push("/dashboard");
        router.refresh();
        return;
      }

      await supabase.auth.signOut();

      setLoginError(
        t("clinician.errors.noAccess")
      );
    } catch (error) {
      console.error("Login error:", error);

      setLoginError(
        t("clinician.errors.unexpected")
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const submitApplication = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setApplicationError("");
    setApplicationSuccess("");

    const cleanName = fullName.trim();
    const cleanEmail = applicationEmail.trim();
    const cleanSpecialty = specialty.trim();
    const cleanMessage = message.trim();

    if (!cleanName || !cleanEmail) {
      setApplicationError(
        t("clinician.errors.applicationRequired")
      );
      return;
    }

    const sourceLanguage = applicationLanguage;

    const sourceFields: Record<string, string> = {
      specialty: cleanSpecialty,
      message: cleanMessage,
    };

    const translateContent = async (
      targetLanguage: ApplicationLanguage
    ) => {
      const response = await fetch("/api/translate-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceLanguage,
          targetLanguage,
          fields: sourceFields,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result?.translations) {
        throw new Error(
          result?.error ||
            "Automatic translation failed."
        );
      }

      return result.translations as Record<string, string>;
    };

    try {
      setApplicationLoading(true);

      const targetLanguages = (
        ["en", "fr", "ar"] as ApplicationLanguage[]
      ).filter(
        (targetLanguage) =>
          targetLanguage !== sourceLanguage
      );

      const [firstTranslation, secondTranslation] =
        await Promise.all([
          translateContent(targetLanguages[0]),
          translateContent(targetLanguages[1]),
        ]);

      const translationsByLanguage: Record<
        ApplicationLanguage,
        Record<string, string>
      > = {
        en: {},
        fr: {},
        ar: {},
      };

      translationsByLanguage[sourceLanguage] =
        sourceFields;

      translationsByLanguage[targetLanguages[0]] =
        firstTranslation;

      translationsByLanguage[targetLanguages[1]] =
        secondTranslation;

      const translatedValue = (
        targetLanguage: ApplicationLanguage,
        field: "specialty" | "message"
      ) => {
        return (
          translationsByLanguage[targetLanguage]?.[
            field
          ]?.trim() ||
          sourceFields[field]?.trim() ||
          ""
        );
      };

      /*
       * A person's name should not be "translated".
       * We keep the same name in all language columns.
       */
      const { error } = await supabase
        .from("therapist_applications")
        .insert({
          full_name: cleanName,
          full_name_fr: cleanName,
          full_name_ar: cleanName,

          email: cleanEmail,

          specialty: translatedValue(
            "en",
            "specialty"
          ),
          specialty_fr: translatedValue(
            "fr",
            "specialty"
          ),
          specialty_ar: translatedValue(
            "ar",
            "specialty"
          ),

          message: translatedValue("en", "message"),
          message_fr: translatedValue(
            "fr",
            "message"
          ),
          message_ar: translatedValue(
            "ar",
            "message"
          ),

          status: "pending",
        });

      if (error) {
        console.error(error);

        setApplicationError(
          t("clinician.errors.applicationSubmit")
        );
        return;
      }

      setApplicationSuccess(
        t("clinician.application.success")
      );

      setFullName("");
      setApplicationEmail("");
      setSpecialty("");
      setMessage("");
    } catch (error) {
      console.error(
        "Therapist application translation/submission error:",
        error
      );

      setApplicationError(
        error instanceof Error
          ? error.message
          : t("clinician.errors.unexpected")
      );
    } finally {
      setApplicationLoading(false);
    }
  };

  const scrollToApplication = () => {
    document
      .getElementById("therapist-application")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  const applicationLanguageCopy =
    language === "ar"
      ? {
          label: "لغة المحتوى الذي ستكتبه",
          help: "اختر لغة النص الذي ستكتبه في التخصص والرسالة. سيقوم النظام بإنشاء اللغتين الأخريين تلقائياً.",
          english: "الإنجليزية",
          french: "الفرنسية",
          arabic: "العربية",
        }
      : language === "fr"
        ? {
            label: "Langue du contenu saisi",
            help: "Choisissez la langue dans laquelle vous allez écrire la spécialité et le message. Les deux autres versions seront générées automatiquement.",
            english: "Anglais",
            french: "Français",
            arabic: "Arabe",
          }
        : {
            label: "Language of the content you are entering",
            help: "Choose the language you will use for the specialty and message. The other two versions will be generated automatically.",
            english: "English",
            french: "French",
            arabic: "Arabic",
          };

  return (
    <>
      <Navbar />

      <main
          dir={isArabic ? "rtl" : "ltr"}
          className="min-h-screen bg-[#f8f4ee] text-[#223748]"
        >
        {/* Login area */}
        <section className="relative overflow-hidden px-5 py-12 sm:px-8 lg:px-12 lg:py-20">
          <div className="pointer-events-none absolute -right-28 -top-32 h-80 w-80 rounded-full bg-[#223748]" />
          <div className="pointer-events-none absolute right-24 top-4 h-52 w-52 rounded-full border border-[#b39668]" />

          <div className="mx-auto grid max-w-7xl items-stretch gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            {/* Login card */}
            <div className="relative z-10 rounded-[2rem] border border-[#e9dfd0] bg-white p-6 shadow-[0_20px_60px_rgba(34,55,72,0.10)] sm:p-9 lg:p-11">
              <div className="text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#b39668]">
                  {t("clinician.login.eyebrow")}
                </p>

                <h1 className="mt-4 font-serif text-4xl font-semibold text-[#223748] sm:text-5xl">
                  {t("clinician.login.title")}
                </h1>

                <p className="mt-4 text-base leading-7 text-[#67737b]">
                  {t("clinician.login.description")}
                </p>
              </div>

              <form
                onSubmit={handleLogin}
                className="mt-9"
              >
                <p className="mb-3 text-center text-sm font-semibold text-[#223748]">
                  {t("clinician.login.signInAs")}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode("client");
                      setLoginError("");
                    }}
                    className={`flex min-h-14 items-center justify-center gap-3 rounded-xl border px-4 font-semibold transition ${
                      loginMode === "client"
                        ? "border-[#223748] bg-[#223748] text-white shadow-md"
                        : "border-[#d9dee2] bg-white text-[#223748] hover:border-[#b39668]"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="text-xl"
                    >
                      ♙
                    </span>

                    {t("clinician.login.clientLabel")}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode("therapist");
                      setLoginError("");
                    }}
                    className={`flex min-h-14 items-center justify-center gap-3 rounded-xl border px-4 font-semibold transition ${
                      loginMode === "therapist"
                        ? "border-[#223748] bg-[#223748] text-white shadow-md"
                        : "border-[#d9dee2] bg-white text-[#223748] hover:border-[#b39668]"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="text-xl"
                    >
                      ♧
                    </span>

                    {t("clinician.login.therapistLabel")}
                  </button>
                </div>

                <div className="mt-7">
                  <label
                    htmlFor="login-email"
                    className="mb-2 block text-sm font-semibold"
                  >{t("clinician.form.email")}
                  </label>

                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={loginEmail}
                    onChange={(event) =>
                      setLoginEmail(event.target.value)
                    }
                    placeholder={t("clinician.form.emailPlaceholder")}
                    className="w-full rounded-xl border border-[#d6dce0] bg-white px-4 py-4 text-[#223748] outline-none transition placeholder:text-[#8a949b] focus:border-[#415a72] focus:ring-4 focus:ring-[#415a72]/10"
                  />
                </div>

                <div className="mt-5">
                  <label
                    htmlFor="login-password"
                    className="mb-2 block text-sm font-semibold"
                  >{t("clinician.form.password")}
                  </label>

                  <div className="relative">
                    <input
                      id="login-password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={(event) =>
                        setLoginPassword(
                          event.target.value
                        )
                      }
                      placeholder={t("clinician.form.passwordPlaceholder")}
                      className={`w-full rounded-xl border border-[#d6dce0] bg-white px-4 py-4 ${isArabic ? "pl-14" : "pr-14"} text-[#223748] outline-none transition placeholder:text-[#8a949b] focus:border-[#415a72] focus:ring-4 focus:ring-[#415a72]/10`}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (current) => !current
                        )
                      }
                      aria-label={
                        showPassword
                          ? t("clinician.form.hidePassword")
                          : t("clinician.form.showPassword")
                      }
                      className={`absolute inset-y-0 flex w-14 ${isArabic ? "left-0" : "right-0"} items-center justify-center text-xl text-[#66737c] hover:text-[#223748]`}
                    >
                      {showPassword ? "◉" : "◎"}
                    </button>
                  </div>
                </div>

                <div className={isArabic ? "mt-3 text-left" : "mt-3 text-right"}>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-semibold text-[#415a72] hover:text-[#b39668]"
                  >
                    {t("clinician.login.forgotPassword")}
                  </Link>
                </div>

                {loginError && (
                  <div
                    role="alert"
                    className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
                  >
                    {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="mt-6 w-full rounded-xl bg-[#223748] px-6 py-4 text-lg font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#415a72] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loginLoading
                    ? t("clinician.login.signingIn")
                    : t("clinician.login.continue")}
                </button>
              </form>

              <div className="mt-7 rounded-2xl border border-[#ebe2d5] bg-[#fcfaf7] text-center">
                <div className="p-5">
                  <p className="text-sm text-[#67737b]">
                    {t("clinician.login.noClientAccount")}
                  </p>

                  <Link
                    href="/signup"
                    className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-[#b39668] bg-white px-5 py-3 font-semibold text-[#8f6f40] transition hover:bg-[#b39668] hover:text-white"
                  >
                    {t("clinician.login.createClientAccount")}
                  </Link>
                </div>

                <div className="border-t border-[#ebe2d5] p-5">
                  <p className="text-sm font-medium text-[#223748]">
                    {t("clinician.login.qualifiedTherapist")}
                  </p>

                  <button
                    type="button"
                    onClick={scrollToApplication}
                    className="mt-2 inline-flex items-center gap-2 font-semibold text-[#b08343] transition hover:text-[#223748]"
                  >
                    {t("clinician.login.applyToJoin")} →
                  </button>
                </div>
              </div>

              <p className="mt-6 text-center text-xs leading-6 text-[#728089]">
                {t("clinician.login.privacyNotice")}
              </p>
            </div>
                        {/* Editorial panel */}
            <div className="relative hidden min-h-[760px] overflow-hidden rounded-[2.5rem] border border-[#e9dfd0] bg-[#fbf8f3] p-12 lg:block">
              <div className="relative z-10 max-w-lg">
                <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#b39668]">
                  {t("common.brandName")}
                </p>

                <h2 className="mt-10 font-serif text-6xl font-semibold leading-[1.08] text-[#223748]">
                  {t("clinician.editorial.title.line1")}
                  <br />
                  {t("clinician.editorial.title.line2")}
                  <br />
                  {t("clinician.editorial.title.line3")}
                  <br />
                  {t("clinician.editorial.title.line4")}
                </h2>

                <div className="mt-8 h-px w-20 bg-[#b39668]" />

                <p className="mt-8 max-w-sm text-lg leading-8 text-[#5f6c74]">
                  {t("clinician.editorial.description")}
                </p>
              </div>

              <div className="absolute -bottom-36 left-12 h-[470px] w-[570px] rounded-[50%_50%_35%_65%/55%_44%_56%_45%] bg-[#cbd7d0]" />

              <div className="absolute -bottom-24 right-[-110px] h-[390px] w-[390px] rounded-full border border-[#b39668]" />

              <div className="absolute bottom-28 right-24 h-64 w-40">
                <div className="absolute bottom-0 left-1/2 h-56 w-px bg-[#526d66]" />

                <div className="absolute left-10 top-10 h-24 w-px -rotate-[35deg] bg-[#526d66]" />
                <div className="absolute left-3 top-5 h-20 w-8 -rotate-[48deg] rounded-[100%_0] border border-[#526d66]" />

                <div className="absolute right-10 top-20 h-24 w-px rotate-[34deg] bg-[#526d66]" />
                <div className="absolute right-1 top-10 h-20 w-8 rotate-[42deg] rounded-[0_100%] border border-[#526d66]" />

                <div className="absolute left-12 top-28 h-24 w-px -rotate-[28deg] bg-[#526d66]" />
                <div className="absolute left-4 top-20 h-20 w-8 -rotate-[42deg] rounded-[100%_0] border border-[#526d66]" />
              </div>
            </div>
          </div>
        </section>

        {/* {t("clinician.login.therapist")} application */}
        <section
          id="therapist-application"
          className="scroll-mt-24 px-5 pb-16 sm:px-8 lg:px-12 lg:pb-24"
        >
          <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2.5rem] border border-[#e8dfd2] bg-white shadow-[0_20px_60px_rgba(34,55,72,0.08)] lg:grid-cols-[0.85fr_1.15fr]">
            <div className="bg-[#fcfaf7] p-8 sm:p-12 lg:p-14">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#b39668]">
                {t("clinician.application.eyebrow")}
              </p>

              <h2 className="mt-4 font-serif text-4xl font-semibold leading-tight text-[#223748] sm:text-5xl">
                {t("clinician.application.title")}
              </h2>

              <p className="mt-6 max-w-md text-lg leading-8 text-[#637078]">
                {t("clinician.application.description")}
              </p>

              <div className="mt-10 space-y-8">
                <div className="flex gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#f2ece3] text-2xl">
                    ♧
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#223748]">
                      {t("clinician.application.benefits.impact.title")}
                    </h3>

                    <p className="mt-1 leading-7 text-[#68757d]">
                      {t("clinician.application.benefits.impact.description")}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#f2ece3] text-2xl">
                    ♢
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#223748]">
                      {t("clinician.application.benefits.professional.title")}
                    </h3>

                    <p className="mt-1 leading-7 text-[#68757d]">
                      {t("clinician.application.benefits.professional.description")}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#f2ece3] text-2xl">
                    ♡
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#223748]">
                      {t("clinician.application.benefits.community.title")}
                    </h3>

                    <p className="mt-1 leading-7 text-[#68757d]">
                      {t("clinician.application.benefits.community.description")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <form
              onSubmit={submitApplication}
              className="p-8 sm:p-12 lg:p-14"
            >
              <div className="mb-7 rounded-2xl border border-[#e8dfd2] bg-[#fcfaf7] p-5">
                <label
                  htmlFor="application-language"
                  className="mb-2 block text-sm font-semibold text-[#223748]"
                >
                  {applicationLanguageCopy.label}
                </label>

                <select
                  id="application-language"
                  value={applicationLanguage}
                  onChange={(event) =>
                    setApplicationLanguage(
                      event.target.value as ApplicationLanguage
                    )
                  }
                  disabled={applicationLoading}
                  className="w-full rounded-xl border border-[#d6dce0] bg-white px-4 py-4 text-[#223748] outline-none transition focus:border-[#415a72] focus:ring-4 focus:ring-[#415a72]/10"
                >
                  <option value="en">
                    {applicationLanguageCopy.english}
                  </option>
                  <option value="fr">
                    {applicationLanguageCopy.french}
                  </option>
                  <option value="ar">
                    {applicationLanguageCopy.arabic}
                  </option>
                </select>

                <p className="mt-3 text-sm leading-6 text-[#6d7981]">
                  {applicationLanguageCopy.help}
                </p>
              </div>

              <div>
                <label
                  htmlFor="application-full-name"
                  className="mb-2 block text-sm font-semibold"
                >{t("clinician.application.form.fullName")}
                </label>

                <input
                  id="application-full-name"
                  type="text"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(event.target.value)
                  }
                  placeholder={t("clinician.application.form.fullNamePlaceholder")}
                  className="w-full rounded-xl border border-[#d6dce0] px-4 py-4 outline-none transition placeholder:text-[#8a949b] focus:border-[#415a72] focus:ring-4 focus:ring-[#415a72]/10"
                />
              </div>

              <div className="mt-5">
                <label
                  htmlFor="application-email"
                  className="mb-2 block text-sm font-semibold"
                >{t("clinician.application.form.professionalEmail")}
                </label>

                <input
                  id="application-email"
                  type="email"
                  value={applicationEmail}
                  onChange={(event) =>
                    setApplicationEmail(
                      event.target.value
                    )
                  }
                  placeholder={t("clinician.application.form.professionalEmailPlaceholder")}
                  className="w-full rounded-xl border border-[#d6dce0] px-4 py-4 outline-none transition placeholder:text-[#8a949b] focus:border-[#415a72] focus:ring-4 focus:ring-[#415a72]/10"
                />
              </div>

              <div className="mt-5">
                <label
                  htmlFor="application-specialty"
                  className="mb-2 block text-sm font-semibold"
                >{t("clinician.application.form.specialty")}
                </label>

                <input
                  id="application-specialty"
                  type="text"
                  value={specialty}
                  onChange={(event) =>
                    setSpecialty(event.target.value)
                  }
                  placeholder={t("clinician.application.form.specialtyPlaceholder")}
                  dir={applicationLanguage === "ar" ? "rtl" : "ltr"}
                  className="w-full rounded-xl border border-[#d6dce0] px-4 py-4 outline-none transition placeholder:text-[#8a949b] focus:border-[#415a72] focus:ring-4 focus:ring-[#415a72]/10"
                />
              </div>

              <div className="mt-5">
                <label
                  htmlFor="application-message"
                  className="mb-2 block text-sm font-semibold"
                >{t("clinician.application.form.about")}
                </label>

                <textarea
                  id="application-message"
                  value={message}
                  onChange={(event) =>
                    setMessage(event.target.value)
                  }
                  placeholder={t("clinician.application.form.aboutPlaceholder")}
                  dir={applicationLanguage === "ar" ? "rtl" : "ltr"}
                  className="min-h-36 w-full resize-y rounded-xl border border-[#d6dce0] px-4 py-4 outline-none transition placeholder:text-[#8a949b] focus:border-[#415a72] focus:ring-4 focus:ring-[#415a72]/10"
                />
              </div>

              {applicationError && (
                <div
                  role="alert"
                  className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
                >
                  {applicationError}
                </div>
              )}

              {applicationSuccess && (
                <div
                  role="status"
                  className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800"
                >
                  {applicationSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={applicationLoading}
                className="mt-6 w-full rounded-xl bg-[#223748] px-6 py-4 text-lg font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#415a72] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {applicationLoading
                  ? t("clinician.application.submitting")
                  : t("clinician.application.submit")}
              </button>

              <p className="mt-5 text-center text-sm leading-6 text-[#6d7981]">
                {t("clinician.application.confidentiality")}
              </p>
            </form>
          </div>
        </section>

        {/* Trust points */}
        <section className="px-5 pb-20 sm:px-8 lg:px-12">
          <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] border border-[#e8dfd2] bg-white shadow-sm md:grid-cols-3">
            <div className="flex gap-4 p-7 sm:p-8">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f4eee5] text-xl">
                ♢
              </div>

              <div>
                <h3 className="font-semibold">
                  {t("clinician.trust.private.title")}
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#69757d]">
                  {t("clinician.trust.private.description")}
                </p>
              </div>
            </div>

            <div className="flex gap-4 border-y border-[#ebe2d6] p-7 sm:p-8 md:border-x md:border-y-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f4eee5] text-xl">
                ♧
              </div>

              <div>
                <h3 className="font-semibold">
                  {t("clinician.trust.reviewed.title")}
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#69757d]">
                  {t("clinician.trust.reviewed.description")}
                  
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-7 sm:p-8">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f4eee5] text-xl">
                ✓
              </div>

              <div>
                <h3 className="font-semibold">
                  {t("clinician.trust.trusted.title")}
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#69757d]">
                  {t("clinician.trust.trusted.description")}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
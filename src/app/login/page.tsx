"use client";

import {
  useState,
} from "react";

import Link from "next/link";
import {
  useRouter,
} from "next/navigation";

import {
  supabase,
} from "@/lib/supabase";

import {
  useLanguage,
} from "@/i18n/LanguageProvider";

import Navbar from "../components/Navbar";

type LoginMode =
  | "patient"
  | "therapist";

export default function LoginPage() {
  const router =
    useRouter();

  const {
    language,
    isArabic,
  } = useLanguage();

  const [
    loginMode,
    setLoginMode,
  ] =
    useState<LoginMode>(
      "patient",
    );

  const [email, setEmail] =
    useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const text =
    language === "ar"
      ? {
          eyebrow:
            "الوصول إلى المنصة",

          title:
            "تسجيل الدخول أو إنشاء حساب",

          subtitle:
            "ادخل إلى حسابك الخاص أو أنشئ حساباً لبدء رحلتك مع AAN.",

          loginAs:
            "تسجيل الدخول بصفة",

          patient:
            "مريض",

          therapist:
            "مختص",

          email:
            "البريد الإلكتروني",

          password:
            "كلمة المرور",

          show:
            "إظهار",

          hide:
            "إخفاء",

          forgot:
            "نسيت كلمة المرور؟",

          continue:
            "متابعة",

          connecting:
            "جارٍ تسجيل الدخول...",

          newPatient:
            "مريض جديد؟",

          signUp:
            "إنشاء حساب",

          emailRequired:
            "يرجى إدخال البريد الإلكتروني.",

          passwordRequired:
            "يرجى إدخال كلمة المرور.",

          invalidCredentials:
            "البريد الإلكتروني أو كلمة المرور غير صحيحة.",

          profileNotFound:
            "تعذر العثور على ملف الحساب.",

          wrongPatient:
            "هذا الحساب ليس حساب مريض. يرجى اختيار «مختص» إذا كنت مختصاً.",

          wrongTherapist:
            "هذا الحساب ليس حساب مختص. يرجى اختيار «مريض» إذا كنت مريضاً.",

          genericError:
            "تعذر تسجيل الدخول. يرجى المحاولة مرة أخرى.",

          patientHelp:
            "للوصول إلى المواعيد والحجوزات والمتابعة.",

          therapistHelp:
            "للوصول إلى الملف المهني والمواعيد والجلسات.",
        }
      : language === "fr"
        ? {
            eyebrow:
              "Accès à la plateforme",

            title:
              "Se connecter ou créer un compte",

            subtitle:
              "Accédez à votre compte privé ou créez un compte pour commencer votre parcours avec AAN.",

            loginAs:
              "Se connecter en tant que",

            patient:
              "Patient",

            therapist:
              "Spécialiste",

            email:
              "E-mail",

            password:
              "Mot de passe",

            show:
              "Afficher",

            hide:
              "Masquer",

            forgot:
              "Mot de passe oublié ?",

            continue:
              "Continuer",

            connecting:
              "Connexion en cours...",

            newPatient:
              "Vous n’avez pas de compte ?",

            signUp:
              "Créer un compte",

            emailRequired:
              "Veuillez saisir votre adresse e-mail.",

            passwordRequired:
              "Veuillez saisir votre mot de passe.",

            invalidCredentials:
              "L’adresse e-mail ou le mot de passe est incorrect.",

            profileNotFound:
              "Le profil associé à ce compte est introuvable.",

            wrongPatient:
              "Ce compte n’est pas un compte patient. Sélectionnez « Spécialiste » si vous êtes spécialiste.",

            wrongTherapist:
              "Ce compte n’est pas un compte spécialiste. Sélectionnez « Patient » si vous êtes patient.",

            genericError:
              "Impossible de vous connecter. Veuillez réessayer.",

            patientHelp:
              "Pour accéder à vos rendez-vous, réservations et suivi.",

            therapistHelp:
              "Pour accéder à votre profil professionnel, vos disponibilités et vos séances.",
          }
        : {
            eyebrow:
              "Platform access",

            title:
              "Sign in or create an account",

            subtitle:
              "Access your private account or create one to begin your journey with AAN.",

            loginAs:
              "Sign in as",

            patient:
              "Patient",

            therapist:
              "Specialist",

            email:
              "Email",

            password:
              "Password",

            show:
              "Show",

            hide:
              "Hide",

            forgot:
              "Forgot password?",

            continue:
              "Continue",

            connecting:
              "Signing in...",

            newPatient:
              "Don't have an account?",

            signUp:
              "Create account",

            emailRequired:
              "Please enter your email address.",

            passwordRequired:
              "Please enter your password.",

            invalidCredentials:
              "The email address or password is incorrect.",

            profileNotFound:
              "The profile associated with this account could not be found.",

            wrongPatient:
              "This is not a patient account. Select “Specialist” if you are a specialist.",

            wrongTherapist:
              "This is not a specialist account. Select “Patient” if you are a patient.",

            genericError:
              "Unable to sign in. Please try again.",

            patientHelp:
              "Access your appointments, bookings and follow-up.",

            therapistHelp:
              "Access your professional profile, availability and sessions.",
          };

  const handleLogin =
    async () => {
      if (isLoading) {
        return;
      }

      setErrorMessage("");

      const cleanEmail =
        email.trim().toLowerCase();

      if (!cleanEmail) {
        setErrorMessage(
          text.emailRequired,
        );

        return;
      }

      if (!password) {
        setErrorMessage(
          text.passwordRequired,
        );

        return;
      }

      setIsLoading(true);

      try {
        const {
          data,
          error,
        } =
          await supabase.auth.signInWithPassword(
            {
              email:
                cleanEmail,

              password,
            },
          );

        if (
          error ||
          !data.user
        ) {
          console.error(
            "Login error:",
            error,
          );

          setErrorMessage(
            text.invalidCredentials,
          );

          return;
        }

        const user =
          data.user;

        const {
          data: profile,
          error:
            profileError,
        } =
          await supabase
            .from(
              "profiles",
            )
            .select(
              "role",
            )
            .eq(
              "id",
              user.id,
            )
            .maybeSingle<{
              role:
                | string
                | null;
            }>();

        if (
          profileError
        ) {
          console.error(
            "Profile lookup error:",
            profileError,
          );

          await supabase.auth.signOut();

          setErrorMessage(
            text.profileNotFound,
          );

          return;
        }

        if (!profile) {
          await supabase.auth.signOut();

          setErrorMessage(
            text.profileNotFound,
          );

          return;
        }

        /*
         * L'admin n'a pas besoin
         * d'un troisième bouton.
         *
         * Si le compte est admin,
         * on l'envoie directement
         * vers l'administration.
         */
        if (
          profile.role ===
          "admin"
        ) {
          router.replace(
            "/admin",
          );

          return;
        }

        /*
         * Vérifier que le type
         * sélectionné correspond
         * réellement au rôle du compte.
         */
        if (
          loginMode ===
            "therapist" &&
          profile.role !==
            "therapist"
        ) {
          await supabase.auth.signOut();

          setErrorMessage(
            text.wrongTherapist,
          );

          return;
        }

        if (
          loginMode ===
            "patient" &&
          profile.role ===
            "therapist"
        ) {
          await supabase.auth.signOut();

          setErrorMessage(
            text.wrongPatient,
          );

          return;
        }

        if (
          profile.role ===
          "therapist"
        ) {
          router.replace(
            "/therapist-dashboard",
          );

          return;
        }

        router.replace(
          "/dashboard",
        );
      } catch (error) {
        console.error(
          "Unexpected login error:",
          error,
        );

        setErrorMessage(
          text.genericError,
        );
      } finally {
        setIsLoading(
          false,
        );
      }
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
        className="relative flex min-h-[calc(100vh-80px)] items-center justify-center overflow-hidden bg-aan-background px-4 py-12 sm:px-6"
      >
        {/* Décor AAN */}
        <div
          aria-hidden="true"
          className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-aan-gold/10 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="absolute -bottom-28 -right-24 h-96 w-96 rounded-full bg-aan-button/10 blur-3xl"
        />

        <section className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-aan-border bg-white shadow-[var(--aan-shadow-md)]">
          <div className="px-7 pb-6 pt-9 text-center sm:px-12 sm:pt-11">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-aan-gold">
              AAN Psychotherapy
            </p>

            <h1 className="aan-heading mx-auto mt-5 max-w-xl text-4xl leading-tight sm:text-5xl">
              {text.title}
            </h1>

            <div className="mx-auto mt-6 flex items-center justify-center gap-3">
              <div className="h-px w-20 bg-aan-gold" />

              <span className="h-2 w-2 rounded-full bg-aan-gold" />

              <div className="h-px w-20 bg-aan-gold" />
            </div>

            <p className="mx-auto mt-6 max-w-lg leading-7 text-aan-secondary">
              {text.subtitle}
            </p>
          </div>

          <div className="border-t border-aan-border px-7 py-8 sm:px-12 sm:py-10">
            <p className="mb-4 text-center text-sm font-bold text-aan-navy">
              {text.loginAs}
            </p>

            {/* Patient / spécialiste */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setLoginMode(
                    "patient",
                  );

                  setErrorMessage(
                    "",
                  );
                }}
                disabled={
                  isLoading
                }
                className={`rounded-2xl border px-4 py-4 text-base font-bold transition ${
                  loginMode ===
                  "patient"
                    ? "border-aan-button bg-aan-button text-white shadow-md"
                    : "border-aan-border bg-white text-aan-navy hover:border-aan-gold hover:bg-[#fbf8f3]"
                }`}
              >
                <span className="mr-2">
                  ♙
                </span>

                {text.patient}
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginMode(
                    "therapist",
                  );

                  setErrorMessage(
                    "",
                  );
                }}
                disabled={
                  isLoading
                }
                className={`rounded-2xl border px-4 py-4 text-base font-bold transition ${
                  loginMode ===
                  "therapist"
                    ? "border-aan-button bg-aan-button text-white shadow-md"
                    : "border-aan-border bg-white text-aan-navy hover:border-aan-gold hover:bg-[#fbf8f3]"
                }`}
              >
                <span className="mr-2">
                  ♧
                </span>

                {text.therapist}
              </button>
            </div>

            <p className="mt-3 text-center text-xs leading-5 text-aan-secondary">
              {loginMode ===
              "therapist"
                ? text.therapistHelp
                : text.patientHelp}
            </p>

            {/* Formulaire */}
            <div className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="login-email"
                  className="mb-2 block text-sm font-bold text-aan-navy"
                >
                  {text.email}
                </label>

                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  disabled={
                    isLoading
                  }
                  onChange={(
                    event,
                  ) => {
                    setEmail(
                      event
                        .target
                        .value,
                    );

                    setErrorMessage(
                      "",
                    );
                  }}
                  placeholder={
                    text.email
                  }
                  className="aan-field w-full p-4"
                />
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="mb-2 block text-sm font-bold text-aan-navy"
                >
                  {
                    text.password
                  }
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
                    value={
                      password
                    }
                    disabled={
                      isLoading
                    }
                    onChange={(
                      event,
                    ) => {
                      setPassword(
                        event
                          .target
                          .value,
                      );

                      setErrorMessage(
                        "",
                      );
                    }}
                    onKeyDown={(
                      event,
                    ) => {
                      if (
                        event.key ===
                        "Enter"
                      ) {
                        void handleLogin();
                      }
                    }}
                    placeholder={
                      text.password
                    }
                    className={`aan-field w-full p-4 ${
                      isArabic
                        ? "pl-24"
                        : "pr-24"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (
                          previous,
                        ) =>
                          !previous,
                      )
                    }
                    className={`absolute top-1/2 -translate-y-1/2 rounded-lg px-3 py-2 text-xs font-bold text-aan-button transition hover:bg-aan-background ${
                      isArabic
                        ? "left-2"
                        : "right-2"
                    }`}
                  >
                    {showPassword
                      ? text.hide
                      : text.show}
                  </button>
                </div>
              </div>

              <div
                className={`flex ${
                  isArabic
                    ? "justify-start"
                    : "justify-end"
                }`}
              >
                <Link
                  href="/forgot-password"
                  className="text-sm font-bold text-aan-button transition hover:text-aan-navy hover:underline"
                >
                  {text.forgot}
                </Link>
              </div>

              {errorMessage && (
                <div
                  role="alert"
                  className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold leading-6 text-red-700"
                >
                  {errorMessage}
                </div>
              )}

              <button
                type="button"
                onClick={() =>
                  void handleLogin()
                }
                disabled={
                  isLoading
                }
                className="aan-cta w-full rounded-2xl px-6 py-4 text-lg font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading
                  ? text.connecting
                  : text.continue}
              </button>
            </div>

            {/* Création patient */}
            <div className="mt-7 rounded-2xl border border-aan-border bg-[#fbf8f3] px-5 py-5 text-center">
              <span className="text-aan-secondary">
                {
                  text.newPatient
                }{" "}
              </span>

              <Link
                href="/signup"
                className="font-bold text-aan-navy underline decoration-aan-gold decoration-2 underline-offset-4"
              >
                {text.signUp}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
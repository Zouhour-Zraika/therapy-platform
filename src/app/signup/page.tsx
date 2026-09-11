"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import Navbar from "../components/Navbar";
import { useLanguage } from "@/i18n/LanguageProvider";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const { language, isArabic } = useLanguage();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const copy =
    language === "ar"
      ? {
          eyebrow: "مساحتك الآمنة تبدأ هنا",
          title: "إنشاء حساب مريض",
          description:
            "أنشئ حسابك لحجز الجلسات وإدارتها والوصول إلى مساحة AAN الخاصة بك بأمان.",
          fullName: "الاسم الكامل",
          fullNamePlaceholder: "أدخل اسمك الكامل",
          email: "البريد الإلكتروني",
          emailPlaceholder: "name@example.com",
          password: "كلمة المرور",
          passwordPlaceholder: "8 أحرف على الأقل",
          passwordHint: "استخدم 8 أحرف على الأقل.",
          submit: "إنشاء الحساب",
          submitting: "جارٍ إنشاء الحساب...",
          existingAccount: "لديك حساب بالفعل؟",
          login: "تسجيل الدخول",
          specialistNote:
            "حسابات المختصين تُنشأ وتُدار حصرياً من قِبل إدارة AAN.",
          benefitTitle: "خطوة أولى نحو دعم يناسبك",
          benefitText:
            "من خلال حسابك، يمكنك اختيار المختص المناسب، حجز جلساتك، وإدارة مواعيدك في مكان واحد.",
          privacyText:
            "نحافظ على خصوصية معلوماتك ونستخدمها فقط لتقديم خدمات المنصة وإدارة حسابك.",
          fullNameRequired: "يرجى إدخال اسمك الكامل.",
          emailRequired: "يرجى إدخال بريدك الإلكتروني.",
          passwordRequired: "يرجى إدخال كلمة مرور.",
          passwordLength: "يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل.",
          profileError:
            "تم إنشاء الحساب، ولكن تعذر حفظ ملف المريض. يرجى التواصل مع الدعم.",
          success:
            "تم إنشاء حسابك بنجاح. يرجى التحقق من بريدك الإلكتروني لتأكيد الحساب.",
          genericError: "تعذر إنشاء الحساب. يرجى المحاولة مرة أخرى.",
        }
      : language === "fr"
        ? {
            eyebrow: "Votre espace sécurisé commence ici",
            title: "Créer un compte patient",
            description:
              "Créez votre compte pour réserver vos séances, gérer vos rendez-vous et accéder à votre espace AAN en toute sécurité.",
            fullName: "Nom complet",
            fullNamePlaceholder: "Votre nom complet",
            email: "E-mail",
            emailPlaceholder: "nom@exemple.com",
            password: "Mot de passe",
            passwordPlaceholder: "8 caractères minimum",
            passwordHint: "Utilisez au moins 8 caractères.",
            submit: "Créer mon compte",
            submitting: "Création du compte...",
            existingAccount: "Vous avez déjà un compte ?",
            login: "Se connecter",
            specialistNote:
              "Les comptes spécialistes sont créés et gérés exclusivement par l’administration AAN.",
            benefitTitle: "Un premier pas vers un accompagnement qui vous correspond",
            benefitText:
              "Depuis votre espace, vous pourrez choisir votre spécialiste, réserver vos séances et gérer vos rendez-vous au même endroit.",
            privacyText:
              "Vos informations restent confidentielles et sont utilisées uniquement pour fournir les services de la plateforme et gérer votre compte.",
            fullNameRequired: "Veuillez saisir votre nom complet.",
            emailRequired: "Veuillez saisir votre adresse e-mail.",
            passwordRequired: "Veuillez saisir un mot de passe.",
            passwordLength:
              "Le mot de passe doit contenir au moins 8 caractères.",
            profileError:
              "Le compte a été créé, mais le profil patient n’a pas pu être enregistré. Veuillez contacter le support.",
            success:
              "Votre compte a été créé. Consultez votre e-mail pour confirmer votre inscription.",
            genericError:
              "Impossible de créer le compte. Veuillez réessayer.",
          }
        : {
            eyebrow: "Your secure space starts here",
            title: "Create a patient account",
            description:
              "Create your account to book sessions, manage appointments and access your AAN space securely.",
            fullName: "Full name",
            fullNamePlaceholder: "Your full name",
            email: "Email",
            emailPlaceholder: "name@example.com",
            password: "Password",
            passwordPlaceholder: "At least 8 characters",
            passwordHint: "Use at least 8 characters.",
            submit: "Create my account",
            submitting: "Creating account...",
            existingAccount: "Already have an account?",
            login: "Sign in",
            specialistNote:
              "Specialist accounts are created and managed exclusively by AAN administrators.",
            benefitTitle: "A first step toward care that fits you",
            benefitText:
              "From your space, you can choose your specialist, book sessions and manage your appointments in one place.",
            privacyText:
              "Your information remains confidential and is used only to provide platform services and manage your account.",
            fullNameRequired: "Please enter your full name.",
            emailRequired: "Please enter your email.",
            passwordRequired: "Please enter a password.",
            passwordLength: "Password must contain at least 8 characters.",
            profileError:
              "The account was created, but the patient profile could not be saved. Please contact support.",
            success:
              "Your account was created. Please check your email to confirm your registration.",
            genericError:
              "Unable to create the account. Please try again.",
          };

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    setErrorMessage("");
    setSuccessMessage("");

    if (!cleanName) {
      setErrorMessage(copy.fullNameRequired);
      return;
    }

    if (!cleanEmail) {
      setErrorMessage(copy.emailRequired);
      return;
    }

    if (!password) {
      setErrorMessage(copy.passwordRequired);
      return;
    }

    if (password.length < 8) {
      setErrorMessage(copy.passwordLength);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            role: "patient",
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (data.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: data.user.id,
            email: cleanEmail,
            full_name: cleanName,
            role: "patient",
          });

        if (profileError) {
          console.error("Patient profile save error:", profileError);
          setErrorMessage(copy.profileError);
          return;
        }
      }

      setSuccessMessage(copy.success);
      setFullName("");
      setEmail("");
      setPassword("");
    } catch (error) {
      console.error("Patient signup error:", error);
      setErrorMessage(copy.genericError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />

      <main
        dir={isArabic ? "rtl" : "ltr"}
        className="min-h-[calc(100vh-72px)] bg-aan-background px-5 py-8 sm:px-8 sm:py-12 lg:px-10 lg:py-16"
      >
        <section className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-aan-border bg-white shadow-[var(--aan-shadow-lg)] lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative hidden overflow-hidden bg-aan-navy p-10 text-white lg:flex lg:min-h-[660px] lg:flex-col lg:justify-between xl:p-14">
            <div
              aria-hidden="true"
              className="absolute -right-20 -top-16 h-80 w-80 rounded-full border border-white/10"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-28 -left-24 h-96 w-96 rounded-full border border-aan-gold/25"
            />

            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-aan-gold">
                AAN Psychotherapy
              </p>

              <h2 className="aan-heading mt-7 max-w-lg text-4xl leading-tight text-white xl:text-5xl">
                {copy.benefitTitle}
              </h2>

              <p className="mt-6 max-w-xl text-base leading-8 text-white/75 xl:text-lg">
                {copy.benefitText}
              </p>
            </div>

            <div className="relative rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-aan-gold">
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path d="M12 3 19 6v5c0 4.7-2.8 8-7 10-4.2-2-7-5.3-7-10V6z" />
                  <path d="m9.2 12 1.8 1.8 4-4" />
                </svg>
              </div>

              <p className="text-sm leading-6 text-white/70">
                {copy.privacyText}
              </p>
            </div>
          </div>

          <div className="flex items-center px-6 py-9 sm:px-10 sm:py-12 lg:px-14 xl:px-16">
            <div className="mx-auto w-full max-w-xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-aan-gold">
                {copy.eyebrow}
              </p>

              <h1 className="aan-heading mt-4 text-4xl leading-tight text-aan-navy sm:text-5xl">
                {copy.title}
              </h1>

              <p className="mt-4 max-w-lg text-base leading-7 text-aan-secondary sm:text-lg">
                {copy.description}
              </p>

              <form onSubmit={handleSignup} className="mt-8 space-y-5">
                <div>
                  <label
                    htmlFor="full-name"
                    className="mb-2 block text-sm font-semibold text-aan-navy"
                  >
                    {copy.fullName}
                  </label>

                  <input
                    id="full-name"
                    className="w-full rounded-2xl border border-aan-border bg-white px-4 py-3.5 text-aan-navy outline-none transition placeholder:text-slate-400 focus:border-aan-gold focus:ring-2 focus:ring-aan-gold/10"
                    placeholder={copy.fullNamePlaceholder}
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label
                    htmlFor="signup-email"
                    className="mb-2 block text-sm font-semibold text-aan-navy"
                  >
                    {copy.email}
                  </label>

                  <input
                    id="signup-email"
                    className="w-full rounded-2xl border border-aan-border bg-white px-4 py-3.5 text-aan-navy outline-none transition placeholder:text-slate-400 focus:border-aan-gold focus:ring-2 focus:ring-aan-gold/10"
                    placeholder={copy.emailPlaceholder}
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label
                    htmlFor="signup-password"
                    className="mb-2 block text-sm font-semibold text-aan-navy"
                  >
                    {copy.password}
                  </label>

                  <input
                    id="signup-password"
                    className="w-full rounded-2xl border border-aan-border bg-white px-4 py-3.5 text-aan-navy outline-none transition placeholder:text-slate-400 focus:border-aan-gold focus:ring-2 focus:ring-aan-gold/10"
                    placeholder={copy.passwordPlaceholder}
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={loading}
                  />

                  <p className="mt-2 text-xs text-aan-secondary">
                    {copy.passwordHint}
                  </p>
                </div>

                {errorMessage ? (
                  <div
                    role="alert"
                    className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-700"
                  >
                    {errorMessage}
                  </div>
                ) : null}

                {successMessage ? (
                  <div
                    role="status"
                    className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium leading-6 text-emerald-800"
                  >
                    {successMessage}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-aan-button px-5 py-3.5 text-base font-bold text-white shadow-[var(--aan-shadow-sm)] transition hover:bg-aan-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? copy.submitting : copy.submit}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-aan-secondary">
                {copy.existingAccount}{" "}
                <Link
                  href="/login"
                  className="font-bold text-aan-navy underline decoration-aan-gold decoration-2 underline-offset-4 transition hover:text-aan-hover"
                >
                  {copy.login}
                </Link>
              </div>

              <div className="mt-8 border-t border-aan-border pt-6">
                <p className="text-center text-xs leading-5 text-aan-secondary">
                  {copy.specialistNote}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

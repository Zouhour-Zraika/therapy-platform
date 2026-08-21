"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function ResetPasswordPage() {
  const router = useRouter();

  const { language, isArabic } =
    useLanguage();

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    isUpdating,
    setIsUpdating,
  ] = useState(false);

  const text = {
    eyebrow:
      language === "ar"
        ? "أمان الحساب"
        : language === "fr"
          ? "Sécurité du compte"
          : "Account security",

    title:
      language === "ar"
        ? "إنشاء كلمة مرور جديدة"
        : language === "fr"
          ? "Créer un nouveau mot de passe"
          : "Create a New Password",

    description:
      language === "ar"
        ? "اختر كلمة مرور قوية وآمنة للوصول إلى حسابك على منصة AAN."
        : language === "fr"
          ? "Choisissez un mot de passe fort et sécurisé pour accéder à votre compte AAN."
          : "Choose a strong and secure password to access your AAN account.",

    newPassword:
      language === "ar"
        ? "كلمة المرور الجديدة"
        : language === "fr"
          ? "Nouveau mot de passe"
          : "New password",

    confirmPassword:
      language === "ar"
        ? "تأكيد كلمة المرور"
        : language === "fr"
          ? "Confirmer le mot de passe"
          : "Confirm password",

    show:
      language === "ar"
        ? "إظهار"
        : language === "fr"
          ? "Afficher"
          : "Show",

    hide:
      language === "ar"
        ? "إخفاء"
        : language === "fr"
          ? "Masquer"
          : "Hide",

    update:
      language === "ar"
        ? "تحديث كلمة المرور"
        : language === "fr"
          ? "Mettre à jour le mot de passe"
          : "Update Password",

    updating:
      language === "ar"
        ? "جارٍ تحديث كلمة المرور..."
        : language === "fr"
          ? "Mise à jour du mot de passe..."
          : "Updating password...",

    mismatch:
      language === "ar"
        ? "كلمتا المرور غير متطابقتين."
        : language === "fr"
          ? "Les mots de passe ne correspondent pas."
          : "Passwords do not match.",

    genericError:
      language === "ar"
        ? "تعذر تحديث كلمة المرور. يرجى المحاولة مرة أخرى."
        : language === "fr"
          ? "Impossible de mettre à jour le mot de passe. Veuillez réessayer."
          : "Unable to update the password. Please try again.",

    success:
      language === "ar"
        ? "تم تحديث كلمة المرور بنجاح."
        : language === "fr"
          ? "Votre mot de passe a été mis à jour avec succès."
          : "Your password has been updated successfully.",

    requirementsTitle:
      language === "ar"
        ? "يجب أن تحتوي كلمة المرور على:"
        : language === "fr"
          ? "Votre mot de passe doit contenir :"
          : "Your password must contain:",

    minLength:
      language === "ar"
        ? "8 أحرف على الأقل"
        : language === "fr"
          ? "Au moins 8 caractères"
          : "At least 8 characters",

    uppercase:
      language === "ar"
        ? "حرف كبير واحد على الأقل"
        : language === "fr"
          ? "Au moins une majuscule"
          : "At least one uppercase letter",

    lowercase:
      language === "ar"
        ? "حرف صغير واحد على الأقل"
        : language === "fr"
          ? "Au moins une minuscule"
          : "At least one lowercase letter",

    number:
      language === "ar"
        ? "رقم واحد على الأقل"
        : language === "fr"
          ? "Au moins un chiffre"
          : "At least one number",

    special:
      language === "ar"
        ? "رمز خاص واحد على الأقل مثل & أو ! أو @"
        : language === "fr"
          ? "Au moins un caractère spécial comme &, ! ou @"
          : "At least one special character such as &, ! or @",

    invalidPassword:
      language === "ar"
        ? "كلمة المرور لا تستوفي جميع شروط الأمان."
        : language === "fr"
          ? "Le mot de passe ne respecte pas toutes les conditions de sécurité."
          : "The password does not meet all security requirements.",

    returnPortal:
      language === "ar"
        ? "العودة إلى بوابة المختصين"
        : language === "fr"
          ? "Retour à l’espace spécialiste"
          : "Back to Specialist Portal",
  };

  const passwordChecks = useMemo(() => {
    return {
      minLength:
        password.length >= 8,

      uppercase:
        /[A-Z]/.test(password),

      lowercase:
        /[a-z]/.test(password),

      number:
        /\d/.test(password),

      special:
        /[^A-Za-z0-9]/.test(password),
    };
  }, [password]);

  const passwordIsValid =
    passwordChecks.minLength &&
    passwordChecks.uppercase &&
    passwordChecks.lowercase &&
    passwordChecks.number &&
    passwordChecks.special;

  const passwordsMatch =
    confirmPassword.length > 0 &&
    password === confirmPassword;

  const handleUpdatePassword =
    async () => {
      if (isUpdating) {
        return;
      }

      if (
        !password ||
        !confirmPassword
      ) {
        alert(
          language === "ar"
            ? "يرجى إدخال كلمة المرور وتأكيدها."
            : language === "fr"
              ? "Veuillez saisir et confirmer votre mot de passe."
              : "Please enter and confirm your password.",
        );

        return;
      }

      if (!passwordIsValid) {
        alert(
          text.invalidPassword,
        );

        return;
      }

      if (
        password !==
        confirmPassword
      ) {
        alert(
          text.mismatch,
        );

        return;
      }

      setIsUpdating(true);

      try {
        const { error } =
          await supabase.auth.updateUser({
            password,
          });

        if (error) {
          console.error(
            "Password update error:",
            error,
          );

          alert(
            error.message ||
              text.genericError,
          );

          return;
        }

        alert(
          text.success,
        );

        router.replace(
          "/clinician",
        );
      } catch (error) {
        console.error(
          "Unexpected password update error:",
          error,
        );

        alert(
          text.genericError,
        );
      } finally {
        setIsUpdating(false);
      }
    };

  const RequirementItem = ({
    valid,
    label,
  }: {
    valid: boolean;
    label: string;
  }) => {
    return (
      <div className="flex items-center gap-3">
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
            valid
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-aan-border bg-white text-aan-secondary"
          }`}
        >
          {valid ? "✓" : "•"}
        </span>

        <span
          className={`text-sm ${
            valid
              ? "font-semibold text-emerald-700"
              : "text-aan-secondary"
          }`}
        >
          {label}
        </span>
      </div>
    );
  };

  return (
    <main
      dir={
        isArabic
          ? "rtl"
          : "ltr"
      }
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-aan-background px-4 py-10 sm:px-6"
    >
      <div
        aria-hidden="true"
        className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-aan-gold/10 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-aan-button/10 blur-3xl"
      />

      <section className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-aan-border bg-white shadow-[var(--aan-shadow-md)]">
        <div className="border-b border-aan-border px-7 pb-6 pt-8 text-center sm:px-10 sm:pt-10">
          <p className="text-[1.65rem] font-extrabold tracking-[0.32em] text-aan-heading">
            AAN
          </p>

          <p className="mt-1 text-xs font-bold uppercase tracking-[0.22em] text-aan-gold">
            Psychotherapy
          </p>

          <div className="mx-auto mt-6 h-px w-20 bg-aan-gold" />

          <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-aan-gold">
            {text.eyebrow}
          </p>

          <h1 className="aan-heading mt-3 text-3xl sm:text-4xl">
            {text.title}
          </h1>

          <p className="mx-auto mt-4 max-w-md leading-7 text-aan-secondary">
            {text.description}
          </p>
        </div>

        <div className="px-7 py-8 sm:px-10 sm:py-10">
          <div className="space-y-5">
            <div>
              <label
                htmlFor="new-password"
                className="mb-2 block text-sm font-bold text-aan-navy"
              >
                {text.newPassword}
              </label>

              <div className="relative">
                <input
                  id="new-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="new-password"
                  placeholder={
                    text.newPassword
                  }
                  value={password}
                  disabled={
                    isUpdating
                  }
                  onChange={(
                    event,
                  ) =>
                    setPassword(
                      event.target.value,
                    )
                  }
                  className={`w-full rounded-2xl border border-aan-border bg-white px-4 py-4 text-aan-navy outline-none transition focus:border-aan-gold focus:ring-4 focus:ring-aan-gold/10 disabled:cursor-not-allowed disabled:opacity-60 ${
                    isArabic
                      ? "pl-20"
                      : "pr-20"
                  }`}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (previous) =>
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

            <div className="rounded-2xl border border-aan-border bg-[#fbf8f3] p-5">
              <p className="mb-4 text-sm font-bold text-aan-navy">
                {
                  text.requirementsTitle
                }
              </p>

              <div className="space-y-3">
                <RequirementItem
                  valid={
                    passwordChecks.minLength
                  }
                  label={
                    text.minLength
                  }
                />

                <RequirementItem
                  valid={
                    passwordChecks.uppercase
                  }
                  label={
                    text.uppercase
                  }
                />

                <RequirementItem
                  valid={
                    passwordChecks.lowercase
                  }
                  label={
                    text.lowercase
                  }
                />

                <RequirementItem
                  valid={
                    passwordChecks.number
                  }
                  label={
                    text.number
                  }
                />

                <RequirementItem
                  valid={
                    passwordChecks.special
                  }
                  label={
                    text.special
                  }
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="mb-2 block text-sm font-bold text-aan-navy"
              >
                {
                  text.confirmPassword
                }
              </label>

              <input
                id="confirm-password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                autoComplete="new-password"
                placeholder={
                  text.confirmPassword
                }
                value={
                  confirmPassword
                }
                disabled={
                  isUpdating
                }
                onChange={(
                  event,
                ) =>
                  setConfirmPassword(
                    event.target.value,
                  )
                }
                onKeyDown={(
                  event,
                ) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    void handleUpdatePassword();
                  }
                }}
                className={`w-full rounded-2xl border bg-white px-4 py-4 text-aan-navy outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${
                  confirmPassword.length === 0
                    ? "border-aan-border focus:border-aan-gold focus:ring-aan-gold/10"
                    : passwordsMatch
                      ? "border-emerald-300 focus:border-emerald-400 focus:ring-emerald-100"
                      : "border-red-300 focus:border-red-400 focus:ring-red-100"
                }`}
              />

              {confirmPassword.length > 0 && (
                <p
                  className={`mt-2 text-sm font-semibold ${
                    passwordsMatch
                      ? "text-emerald-700"
                      : "text-red-600"
                  }`}
                >
                  {passwordsMatch
                    ? language === "ar"
                      ? "✓ كلمتا المرور متطابقتان."
                      : language === "fr"
                        ? "✓ Les mots de passe correspondent."
                        : "✓ Passwords match."
                    : text.mismatch}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              void handleUpdatePassword()
            }
            disabled={
              isUpdating ||
              !passwordIsValid ||
              !passwordsMatch
            }
            className="aan-cta mt-7 w-full rounded-2xl px-6 py-4 text-lg font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUpdating
              ? text.updating
              : text.update}
          </button>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/clinician",
              )
            }
            disabled={
              isUpdating
            }
            className="mt-4 w-full rounded-2xl border border-aan-border bg-white px-6 py-4 font-bold text-aan-navy transition hover:border-aan-gold hover:bg-aan-background disabled:opacity-60"
          >
            {text.returnPortal}
          </button>
        </div>
      </section>
    </main>
  );
}
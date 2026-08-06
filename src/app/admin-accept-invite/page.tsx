"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/i18n/LanguageProvider";

function AcceptAdminInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isArabic } = useLanguage();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [checkingSession, setCheckingSession] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const copy = isArabic
    ? {
        eyebrow: "دعوة مسؤول",
        title: "إنشاء كلمة المرور",
        description:
          "اختر كلمة مرور آمنة لإكمال تفعيل حساب المسؤول الخاص بك.",
        password: "كلمة المرور",
        confirmPassword: "تأكيد كلمة المرور",
        passwordPlaceholder: "أدخل كلمة المرور",
        confirmPasswordPlaceholder: "أعد إدخال كلمة المرور",
        save: "تفعيل حساب المسؤول",
        saving: "جارٍ التفعيل...",
        sessionError:
          "رابط الدعوة غير صالح أو انتهت صلاحيته. يرجى طلب دعوة جديدة.",
        passwordRequired:
          "يرجى إدخال كلمة المرور وتأكيدها.",
        passwordLength:
          "يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل.",
        passwordMismatch:
          "كلمتا المرور غير متطابقتين.",
        updateError:
          "تعذر إنشاء كلمة المرور.",
        success:
          "تم تفعيل حساب المسؤول بنجاح.",
      }
    : {
        eyebrow: "Administrator invitation",
        title: "Create your password",
        description:
          "Choose a secure password to finish activating your administrator account.",
        password: "Password",
        confirmPassword: "Confirm password",
        passwordPlaceholder: "Enter your password",
        confirmPasswordPlaceholder: "Enter your password again",
        save: "Activate administrator account",
        saving: "Activating...",
        sessionError:
          "This invitation link is invalid or has expired. Please request a new invitation.",
        passwordRequired:
          "Please enter and confirm your password.",
        passwordLength:
          "Your password must contain at least 8 characters.",
        passwordMismatch:
          "The passwords do not match.",
        updateError:
          "Unable to create your password.",
        success:
          "Your administrator account has been activated successfully.",
      };

  useEffect(() => {
    const initialiseInviteSession = async () => {
      setCheckingSession(true);
      setErrorMessage("");

      try {
        const code = searchParams.get("code");

        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error(
              "Admin invitation code exchange error:",
              exchangeError,
            );
          }
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          setErrorMessage(copy.sessionError);
          setCheckingSession(false);
          return;
        }

        setCheckingSession(false);
      } catch (error) {
        console.error(
          "Admin invitation initialisation error:",
          error,
        );

        setErrorMessage(copy.sessionError);
        setCheckingSession(false);
      }
    };

    void initialiseInviteSession();
  }, [copy.sessionError, searchParams]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!password || !confirmPassword) {
      setErrorMessage(copy.passwordRequired);
      return;
    }

    if (password.length < 8) {
      setErrorMessage(copy.passwordLength);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(copy.passwordMismatch);
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setErrorMessage(copy.sessionError);
        setSaving(false);
        return;
      }

      const { error: passwordError } =
        await supabase.auth.updateUser({
          password,
        });

      if (passwordError) {
        throw passwordError;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          role: "admin",
          email: user.email ?? null,
        })
        .eq("id", user.id);

      if (profileError) {
        throw profileError;
      }

      setSuccessMessage(copy.success);

      window.setTimeout(() => {
        router.replace("/admin");
      }, 1200);
    } catch (error) {
      console.error(
        "Admin password creation error:",
        error,
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : copy.updateError,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navbar />

      <main
        dir={isArabic ? "rtl" : "ltr"}
        className="min-h-screen bg-aan-background px-5 py-12 sm:px-8"
      >
        <section className="mx-auto max-w-xl">
          <div className="aan-card p-7 sm:p-9">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-aan-gold">
              {copy.eyebrow}
            </p>

            <h1 className="aan-heading mt-4 text-4xl sm:text-5xl">
              {copy.title}
            </h1>

            <p className="mt-4 text-lg leading-8 text-aan-secondary">
              {copy.description}
            </p>

            {checkingSession ? (
              <div className="mt-8 rounded-2xl border border-aan-border bg-aan-background p-6">
                <p className="text-aan-secondary">
                  {isArabic
                    ? "جارٍ التحقق من رابط الدعوة..."
                    : "Checking your invitation link..."}
                </p>
              </div>
            ) : errorMessage &&
              !successMessage &&
              !(
                password ||
                confirmPassword
              ) ? (
              <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
                {errorMessage}
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mt-8 grid gap-5"
              >
                <label className="grid gap-2 font-semibold text-aan-navy">
                  {copy.password}

                  <input
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder={copy.passwordPlaceholder}
                    autoComplete="new-password"
                    className="aan-field p-4 font-normal"
                  />
                </label>

                <label className="grid gap-2 font-semibold text-aan-navy">
                  {copy.confirmPassword}

                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value,
                      )
                    }
                    placeholder={
                      copy.confirmPasswordPlaceholder
                    }
                    autoComplete="new-password"
                    className="aan-field p-4 font-normal"
                  />
                </label>

                {errorMessage && (
                  <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                    {errorMessage}
                  </p>
                )}

                {successMessage && (
                  <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                    {successMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="aan-cta mt-2 rounded-2xl px-5 py-4 font-bold text-white disabled:opacity-60"
                >
                  {saving ? copy.saving : copy.save}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

export default function AcceptAdminInvitePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AcceptAdminInviteContent />
    </Suspense>
  );
}
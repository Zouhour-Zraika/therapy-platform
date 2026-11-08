"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function ForgotPasswordPage() {
  const { language, isArabic } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const copy = language === "ar" ? {
    title: "إعادة تعيين كلمة المرور", description: "أدخل بريدك الإلكتروني لتلقي رابط إعادة تعيين كلمة المرور.", email: "البريد الإلكتروني", send: "إرسال رابط إعادة التعيين", sending: "جارٍ الإرسال...", back: "العودة إلى تسجيل الدخول", required: "يرجى إدخال بريد إلكتروني صالح.", success: "إذا كان الحساب موجودًا، فستصلك رسالة لإعادة تعيين كلمة المرور.", failed: "تعذر إرسال الرابط. يرجى المحاولة لاحقًا."
  } : language === "en" ? {
    title: "Reset your password", description: "Enter your email address to receive a password reset link.", email: "Email address", send: "Send reset link", sending: "Sending...", back: "Back to login", required: "Please enter a valid email address.", success: "If the account exists, you will receive a password reset email.", failed: "Unable to send the link. Please try again later."
  } : {
    title: "Réinitialiser le mot de passe", description: "Saisissez votre adresse e-mail pour recevoir un lien de réinitialisation.", email: "Adresse e-mail", send: "Envoyer le lien", sending: "Envoi en cours...", back: "Retour à la connexion", required: "Veuillez saisir une adresse e-mail valide.", success: "Si ce compte existe, vous recevrez un e-mail de réinitialisation.", failed: "Impossible d'envoyer le lien. Veuillez réessayer plus tard."
  };

  async function handleReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setErrorMessage("");
    setMessage("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setErrorMessage(copy.required);
      return;
    }
    setLoading(true);
    try {
      // Utilise l'origine courante : localhost en TEST, domaine déployé dans son environnement.
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo });
      if (error) {
        console.error("Password reset request failed:", error.message);
        setErrorMessage(copy.failed);
      } else {
        setMessage(copy.success);
      }
    } catch (error) {
      console.error("Password reset request failed:", error);
      setErrorMessage(copy.failed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main dir={isArabic ? "rtl" : "ltr"} className="flex min-h-screen items-center justify-center bg-aan-background p-6 text-aan-heading">
      <section className="w-full max-w-md rounded-3xl border border-aan-border bg-white p-8 shadow-lg sm:p-10">
        <h1 className="aan-heading mb-4 text-center text-3xl font-bold">{copy.title}</h1>
        <p className="mb-6 text-center text-aan-secondary">{copy.description}</p>
        <form onSubmit={handleReset} className="space-y-4">
          <label htmlFor="reset-email" className="block text-sm font-bold">{copy.email}</label>
          <input id="reset-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} disabled={loading} className="aan-field w-full rounded-2xl p-4" />
          {errorMessage && <p role="alert" className="text-sm text-red-700">{errorMessage}</p>}
          {message && <p role="status" className="text-sm text-aan-secondary">{message}</p>}
          <button type="submit" disabled={loading} className="aan-cta w-full rounded-2xl px-6 py-4 font-bold text-white disabled:opacity-60">{loading ? copy.sending : copy.send}</button>
        </form>
        <p className="mt-6 text-center"><Link href="/login" className="font-semibold text-aan-button underline">{copy.back}</Link></p>
      </section>
    </main>
  );
}

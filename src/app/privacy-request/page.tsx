"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { useLanguage } from "@/i18n/LanguageProvider";

type RequestType =
  | "access"
  | "correction"
  | "deletion"
  | "restriction"
  | "portability"
  | "objection"
  | "other";

type FormData = {
  fullName: string;
  email: string;
  requestType: RequestType;
  message: string;
  confirmation: boolean;
};

const initialForm: FormData = {
  fullName: "",
  email: "",
  requestType: "access",
  message: "",
  confirmation: false,
};

export default function PrivacyRequestPage() {
  const { isArabic } = useLanguage();

  const [form, setForm] = useState<FormData>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const copy = isArabic
    ? {
        eyebrow: "الخصوصية والبيانات الشخصية",

        title: "طلب متعلق ببياناتك الشخصية",

        description:
          "يمكنك استخدام هذا النموذج للتواصل مع AAN بشأن البيانات الشخصية المرتبطة بك وطلب الوصول إليها أو تصحيحها أو حذفها أو تقديم طلب آخر متعلق بالخصوصية.",

        importantTitle: "قبل إرسال طلبك",

        importantText:
          "قد تحتاج AAN إلى التحقق من هويتك قبل تنفيذ بعض الطلبات، وذلك لحماية بياناتك ومنع أي شخص آخر من الوصول إليها أو تعديلها دون إذن.",

        nameLabel: "الاسم الكامل",
        namePlaceholder: "أدخل اسمك الكامل",

        emailLabel: "البريد الإلكتروني",
        emailPlaceholder:
          "استخدم البريد الإلكتروني المرتبط بحسابك إن أمكن",

        requestLabel: "نوع الطلب",

        requestTypes: {
          access: "الوصول إلى بياناتي",
          correction: "تصحيح بياناتي",
          deletion: "حذف بياناتي",
          restriction: "تقييد استخدام بياناتي",
          portability: "الحصول على نسخة من بياناتي",
          objection: "الاعتراض على استخدام بياناتي",
          other: "طلب آخر متعلق بالخصوصية",
        },

        messageLabel: "تفاصيل الطلب",

        messagePlaceholder:
          "اشرح طلبك وأي معلومات قد تساعدنا على تحديد البيانات المعنية.",

        confirmation:
          "أؤكد أن المعلومات الواردة في هذا الطلب صحيحة وأن الطلب يتعلق ببياناتي الشخصية أو أنني مخول قانوناً بتقديمه نيابة عن الشخص المعني.",

        submit: "إرسال الطلب",
        submitting: "جارٍ إرسال الطلب...",

        successTitle: "تم استلام طلبك",
        successText:
          "تم إرسال طلب الخصوصية بنجاح. ستتم مراجعته وسيتم التواصل معك عبر البريد الإلكتروني إذا كانت هناك حاجة إلى معلومات إضافية.",

        sendAnother: "إرسال طلب آخر",

        errorGeneric:
          "تعذر إرسال الطلب حالياً. يرجى المحاولة مرة أخرى.",

        privacyLink: "سياسة الخصوصية",
        cookieLink: "سياسة ملفات تعريف الارتباط",

        securityTitle: "حماية هويتك",

        securityText:
          "لا ترسل كلمات المرور أو بيانات البطاقات المصرفية أو معلومات حساسة غير ضرورية من خلال هذا النموذج. إذا كان التحقق الإضافي من الهوية مطلوباً، ستخبرك AAN بالطريقة المناسبة.",

        responseTitle: "معالجة الطلب",

        responseText:
          "سيتم تسجيل الطلب ومراجعته وفقاً للقوانين والالتزامات المتعلقة بحماية البيانات المطبقة على AAN. قد لا يكون من الممكن تنفيذ بعض الطلبات بالكامل عندما توجد التزامات قانونية أو مهنية تتطلب الاحتفاظ ببعض المعلومات.",
      }
    : {
        eyebrow: "Privacy & personal data",

        title: "Request concerning your personal data",

        description:
          "You can use this form to contact AAN about personal data relating to you and request access, correction, deletion or another privacy-related action.",

        importantTitle: "Before submitting your request",

        importantText:
          "AAN may need to verify your identity before completing certain requests. This helps protect your information and prevents another person from accessing or changing your data without authorisation.",

        nameLabel: "Full name",
        namePlaceholder: "Enter your full name",

        emailLabel: "Email address",
        emailPlaceholder:
          "Use the email associated with your account where possible",

        requestLabel: "Type of request",

        requestTypes: {
          access: "Access my personal data",
          correction: "Correct my personal data",
          deletion: "Delete my personal data",
          restriction: "Restrict the use of my personal data",
          portability: "Receive a copy of my personal data",
          objection: "Object to the use of my personal data",
          other: "Other privacy request",
        },

        messageLabel: "Request details",

        messagePlaceholder:
          "Explain your request and provide any information that may help us identify the relevant data.",

        confirmation:
          "I confirm that the information provided in this request is accurate and that this request concerns my own personal data, or that I am legally authorised to submit it on behalf of the person concerned.",

        submit: "Submit request",
        submitting: "Submitting request...",

        successTitle: "Your request has been received",

        successText:
          "Your privacy request has been submitted successfully. It will be reviewed and you will be contacted by email if additional information is required.",

        sendAnother: "Submit another request",

        errorGeneric:
          "We could not submit your request at this time. Please try again.",

        privacyLink: "Privacy Policy",
        cookieLink: "Cookie Policy",

        securityTitle: "Protecting your identity",

        securityText:
          "Do not submit passwords, bank card details or unnecessary sensitive information through this form. If additional identity verification is required, AAN will provide appropriate instructions.",

        responseTitle: "How requests are handled",

        responseText:
          "Requests will be recorded and reviewed in accordance with the data-protection laws and obligations applicable to AAN. Certain requests may not be fulfilled completely where legal or professional obligations require some information to be retained.",
      };

  const requestOptions: {
    value: RequestType;
    label: string;
  }[] = [
    {
      value: "access",
      label: copy.requestTypes.access,
    },
    {
      value: "correction",
      label: copy.requestTypes.correction,
    },
    {
      value: "deletion",
      label: copy.requestTypes.deletion,
    },
    {
      value: "restriction",
      label: copy.requestTypes.restriction,
    },
    {
      value: "portability",
      label: copy.requestTypes.portability,
    },
    {
      value: "objection",
      label: copy.requestTypes.objection,
    },
    {
      value: "other",
      label: copy.requestTypes.other,
    },
  ];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setSuccess(false);

    if (
      !form.fullName.trim() ||
      !form.email.trim() ||
      !form.message.trim() ||
      !form.confirmation
    ) {
      setError(
        isArabic
          ? "يرجى إكمال جميع الحقول المطلوبة وتأكيد صحة الطلب."
          : "Please complete all required fields and confirm the request.",
      );

      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/privacy-request", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim().toLowerCase(),
          requestType: form.requestType,
          message: form.message.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Privacy request failed");
      }

      setSuccess(true);
      setForm(initialForm);
    } catch (submitError) {
      console.error(
        "Privacy request submission error:",
        submitError,
      );

      setError(copy.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSuccess(false);
    setError("");
    setForm(initialForm);
  };

  return (
    <>
      <Navbar />

      <main
        dir={isArabic ? "rtl" : "ltr"}
        className="min-h-screen bg-aan-background px-5 py-10 sm:px-8 lg:px-10"
      >
        <section className="mx-auto max-w-5xl">
          {/* Header */}

          <div className="aan-card p-7 sm:p-10 lg:p-12">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-aan-gold">
              {copy.eyebrow}
            </p>

            <h1 className="aan-heading mt-4 text-4xl sm:text-5xl lg:text-6xl">
              {copy.title}
            </h1>

            <p className="mt-5 max-w-4xl text-lg leading-8 text-aan-secondary">
              {copy.description}
            </p>

            <div className="mt-7 flex flex-wrap gap-4 text-sm font-semibold">
              <Link
                href="/privacy"
                className="text-aan-navy underline decoration-aan-gold underline-offset-4"
              >
                {copy.privacyLink}
              </Link>

              <Link
                href="/cookies"
                className="text-aan-navy underline decoration-aan-gold underline-offset-4"
              >
                {copy.cookieLink}
              </Link>
            </div>
          </div>

          {/* Important notice */}

          <div className="mt-7 rounded-[2rem] border border-aan-border bg-white p-6 shadow-[var(--aan-shadow-sm)] sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#edf3f9] font-bold text-aan-button">
                i
              </div>

              <div>
                <h2 className="text-xl font-bold text-aan-navy">
                  {copy.importantTitle}
                </h2>

                <p className="mt-2 leading-7 text-aan-secondary">
                  {copy.importantText}
                </p>
              </div>
            </div>
          </div>

          {/* Form */}

          <section className="mt-7 aan-card p-7 sm:p-10">
            {success ? (
              <div className="py-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl font-bold text-emerald-700">
                  ✓
                </div>

                <h2 className="aan-heading mt-6 text-3xl sm:text-4xl">
                  {copy.successTitle}
                </h2>

                <p className="mx-auto mt-4 max-w-2xl leading-8 text-aan-secondary">
                  {copy.successText}
                </p>

                <button
                  type="button"
                  onClick={resetForm}
                  className="aan-cta mt-7 rounded-2xl px-6 py-3 font-bold text-white"
                >
                  {copy.sendAnother}
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="grid gap-7"
              >
                {/* Full name */}

                <div>
                  <label
                    htmlFor="privacy-full-name"
                    className="block font-bold text-aan-navy"
                  >
                    {copy.nameLabel}
                    <span className="text-red-600"> *</span>
                  </label>

                  <input
                    id="privacy-full-name"
                    type="text"
                    autoComplete="name"
                    required
                    maxLength={150}
                    value={form.fullName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        fullName: event.target.value,
                      }))
                    }
                    placeholder={copy.namePlaceholder}
                    className="mt-3 w-full rounded-2xl border border-aan-border bg-white px-4 py-3.5 text-aan-navy outline-none transition focus:border-aan-button focus:ring-2 focus:ring-aan-button/15"
                  />
                </div>

                {/* Email */}

                <div>
                  <label
                    htmlFor="privacy-email"
                    className="block font-bold text-aan-navy"
                  >
                    {copy.emailLabel}
                    <span className="text-red-600"> *</span>
                  </label>

                  <input
                    id="privacy-email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder={copy.emailPlaceholder}
                    className="mt-3 w-full rounded-2xl border border-aan-border bg-white px-4 py-3.5 text-aan-navy outline-none transition focus:border-aan-button focus:ring-2 focus:ring-aan-button/15"
                  />
                </div>

                {/* Request type */}

                <div>
                  <label
                    htmlFor="privacy-request-type"
                    className="block font-bold text-aan-navy"
                  >
                    {copy.requestLabel}
                    <span className="text-red-600"> *</span>
                  </label>

                  <select
                    id="privacy-request-type"
                    required
                    value={form.requestType}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        requestType:
                          event.target.value as RequestType,
                      }))
                    }
                    className="mt-3 w-full rounded-2xl border border-aan-border bg-white px-4 py-3.5 text-aan-navy outline-none transition focus:border-aan-button focus:ring-2 focus:ring-aan-button/15"
                  >
                    {requestOptions.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Message */}

                <div>
                  <label
                    htmlFor="privacy-message"
                    className="block font-bold text-aan-navy"
                  >
                    {copy.messageLabel}
                    <span className="text-red-600"> *</span>
                  </label>

                  <textarea
                    id="privacy-message"
                    required
                    rows={7}
                    maxLength={5000}
                    value={form.message}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        message: event.target.value,
                      }))
                    }
                    placeholder={copy.messagePlaceholder}
                    className="mt-3 w-full resize-y rounded-2xl border border-aan-border bg-white px-4 py-3.5 leading-7 text-aan-navy outline-none transition focus:border-aan-button focus:ring-2 focus:ring-aan-button/15"
                  />

                  <p className="mt-2 text-sm text-aan-secondary">
                    {form.message.length} / 5000
                  </p>
                </div>

                {/* Confirmation */}

                <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-aan-border bg-aan-background p-5">
                  <input
                    type="checkbox"
                    required
                    checked={form.confirmation}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        confirmation: event.target.checked,
                      }))
                    }
                    className="mt-1 h-5 w-5 shrink-0 accent-aan-button"
                  />

                  <span className="text-sm leading-7 text-aan-secondary">
                    {copy.confirmation}
                  </span>
                </label>

                {/* Error */}

                {error && (
                  <div
                    role="alert"
                    className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
                  >
                    {error}
                  </div>
                )}

                {/* Submit */}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="aan-cta rounded-2xl px-7 py-3.5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting
                      ? copy.submitting
                      : copy.submit}
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* Security */}

          <section className="mt-7 grid gap-6 md:grid-cols-2">
            <div className="rounded-[2rem] border border-aan-border bg-white p-7 shadow-[var(--aan-shadow-sm)]">
              <h2 className="text-xl font-bold text-aan-navy">
                {copy.securityTitle}
              </h2>

              <p className="mt-3 leading-7 text-aan-secondary">
                {copy.securityText}
              </p>
            </div>

            <div className="rounded-[2rem] border border-aan-border bg-white p-7 shadow-[var(--aan-shadow-sm)]">
              <h2 className="text-xl font-bold text-aan-navy">
                {copy.responseTitle}
              </h2>

              <p className="mt-3 leading-7 text-aan-secondary">
                {copy.responseText}
              </p>
            </div>
          </section>
        </section>
      </main>
    </>
  );
}
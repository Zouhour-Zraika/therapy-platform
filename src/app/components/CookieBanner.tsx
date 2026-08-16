"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/i18n/LanguageProvider";

type CookiePreferences = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

const STORAGE_KEY = "aan_cookie_consent";

const defaultPreferences: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
};

export default function CookieBanner() {
  const { isArabic } = useLanguage();

  const [visible, setVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const copy = isArabic
    ? {
        title: "خصوصيتك مهمة لنا",
        description:
          "نستخدم ملفات تعريف الارتباط الضرورية لتشغيل منصة AAN Psychotherapy. لا يتم تفعيل ملفات التحليل أو التسويق إلا بعد موافقتك.",
        acceptAll: "قبول الكل",
        rejectAll: "رفض غير الضروري",
        customise: "إدارة التفضيلات",
        save: "حفظ التفضيلات",
        close: "إغلاق",
        privacy: "سياسة الخصوصية",
        cookies: "سياسة ملفات الارتباط",
        cookieSettings: "إعدادات ملفات الارتباط",

        settingsTitle: "إدارة ملفات تعريف الارتباط",

        necessaryTitle: "ملفات ضرورية",
        necessaryDescription:
          "ضرورية لتسجيل الدخول والأمان وتشغيل الوظائف الأساسية للمنصة. لا يمكن تعطيلها.",

        analyticsTitle: "ملفات التحليل",
        analyticsDescription:
          "تساعدنا على فهم كيفية استخدام المنصة وتحسين الأداء وتجربة المستخدم.",

        marketingTitle: "ملفات التسويق",
        marketingDescription:
          "يمكن استخدامها لقياس الحملات أو تخصيص المحتوى التسويقي. لا يتم تفعيلها دون موافقة.",
      }
    : {
        title: "Your privacy matters",
        description:
          "We use strictly necessary cookies to operate AAN Psychotherapy. Analytics and marketing cookies are only activated if you choose to allow them.",
        acceptAll: "Accept all",
        rejectAll: "Reject non-essential",
        customise: "Manage preferences",
        save: "Save preferences",
        close: "Close",
        privacy: "Privacy Policy",
        cookies: "Cookie Policy",
        cookieSettings: "Cookie settings",

        settingsTitle: "Manage cookie preferences",

        necessaryTitle: "Strictly necessary cookies",
        necessaryDescription:
          "Required for authentication, security and essential platform functionality. These cookies cannot be disabled.",

        analyticsTitle: "Analytics cookies",
        analyticsDescription:
          "Help us understand how the platform is used so we can improve performance and user experience.",

        marketingTitle: "Marketing cookies",
        marketingDescription:
          "May be used to measure campaigns or personalise marketing content. They are not activated without consent.",
      };

  useEffect(() => {
    try {
      const savedConsent = localStorage.getItem(STORAGE_KEY);

      if (!savedConsent) {
        setVisible(true);
        return;
      }

      const parsed = JSON.parse(
        savedConsent,
      ) as CookiePreferences;

      setAnalytics(
        Boolean(parsed.analytics),
      );

      setMarketing(
        Boolean(parsed.marketing),
      );
    } catch (error) {
      console.error(
        "Cookie consent load error:",
        error,
      );

      setVisible(true);
    }
  }, []);

  const savePreferences = (
    preferences: CookiePreferences,
  ) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(preferences),
      );

      window.dispatchEvent(
        new CustomEvent(
          "aan-cookie-consent-changed",
          {
            detail: preferences,
          },
        ),
      );

      setAnalytics(
        preferences.analytics,
      );

      setMarketing(
        preferences.marketing,
      );

      setVisible(false);
      setSettingsOpen(false);
    } catch (error) {
      console.error(
        "Cookie consent save error:",
        error,
      );
    }
  };

  const acceptAll = () => {
    savePreferences({
      necessary: true,
      analytics: true,
      marketing: true,
    });
  };

  const rejectAll = () => {
    savePreferences({
      necessary: true,
      analytics: false,
      marketing: false,
    });
  };

  const saveCustomPreferences = () => {
    savePreferences({
      necessary: true,
      analytics,
      marketing,
    });
  };

  const openCookieSettings = () => {
    setVisible(true);
    setSettingsOpen(true);
  };

  if (!visible) {
    return (
      <button
        type="button"
        onClick={openCookieSettings}
        dir={isArabic ? "rtl" : "ltr"}
        className={`fixed bottom-5 z-[190] rounded-full border border-aan-border bg-white px-4 py-3 text-sm font-bold text-aan-navy shadow-xl transition hover:bg-aan-background ${
          isArabic ? "left-5" : "right-5"
        }`}
      >
        {copy.cookieSettings}
      </button>
    );
  }

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="fixed inset-x-0 bottom-0 z-[200] px-4 pb-4 sm:px-6 sm:pb-6"
    >
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-aan-border bg-white p-5 shadow-2xl sm:p-7">
        {!settingsOpen ? (
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-aan-gold">
                AAN Psychotherapy
              </p>

              <h2 className="mt-2 text-2xl font-semibold text-aan-navy sm:text-3xl">
                {copy.title}
              </h2>

              <p className="mt-3 text-sm leading-7 text-aan-secondary sm:text-base">
                {copy.description}
              </p>

              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
                <a
                  href="/privacy"
                  className="text-aan-navy underline decoration-aan-gold underline-offset-4"
                >
                  {copy.privacy}
                </a>

                <a
                  href="/cookies"
                  className="text-aan-navy underline decoration-aan-gold underline-offset-4"
                >
                  {copy.cookies}
                </a>
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <button
                type="button"
                onClick={() =>
                  setSettingsOpen(true)
                }
                className="rounded-2xl border border-aan-border bg-white px-5 py-3 font-bold text-aan-navy transition hover:bg-aan-background"
              >
                {copy.customise}
              </button>

              <button
                type="button"
                onClick={rejectAll}
                className="rounded-2xl border border-aan-border bg-aan-background px-5 py-3 font-bold text-aan-navy transition hover:bg-white"
              >
                {copy.rejectAll}
              </button>

              <button
                type="button"
                onClick={acceptAll}
                className="aan-cta rounded-2xl px-5 py-3 font-bold text-white"
              >
                {copy.acceptAll}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-aan-gold">
                  AAN Psychotherapy
                </p>

                <h2 className="mt-2 text-2xl font-semibold text-aan-navy sm:text-3xl">
                  {copy.settingsTitle}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSettingsOpen(false)
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-aan-border text-2xl text-aan-navy"
                aria-label={copy.close}
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <div className="rounded-2xl border border-aan-border bg-aan-background p-5">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <h3 className="font-bold text-aan-navy">
                      {copy.necessaryTitle}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-aan-secondary">
                      {copy.necessaryDescription}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700">
                    {isArabic
                      ? "دائماً مفعّلة"
                      : "Always active"}
                  </span>
                </div>
              </div>

              <label className="flex cursor-pointer items-start justify-between gap-5 rounded-2xl border border-aan-border bg-aan-background p-5">
                <div>
                  <h3 className="font-bold text-aan-navy">
                    {copy.analyticsTitle}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-aan-secondary">
                    {copy.analyticsDescription}
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(event) =>
                    setAnalytics(
                      event.target.checked,
                    )
                  }
                  className="mt-1 h-5 w-5 shrink-0 accent-aan-button"
                />
              </label>

              <label className="flex cursor-pointer items-start justify-between gap-5 rounded-2xl border border-aan-border bg-aan-background p-5">
                <div>
                  <h3 className="font-bold text-aan-navy">
                    {copy.marketingTitle}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-aan-secondary">
                    {copy.marketingDescription}
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(event) =>
                    setMarketing(
                      event.target.checked,
                    )
                  }
                  className="mt-1 h-5 w-5 shrink-0 accent-aan-button"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={rejectAll}
                className="rounded-2xl border border-aan-border bg-white px-5 py-3 font-bold text-aan-navy"
              >
                {copy.rejectAll}
              </button>

              <button
                type="button"
                onClick={saveCustomPreferences}
                className="aan-cta rounded-2xl px-5 py-3 font-bold text-white"
              >
                {copy.save}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
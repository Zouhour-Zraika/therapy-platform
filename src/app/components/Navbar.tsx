"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { translations, Language } from "../lib/translations";

export default function Navbar() {
  const [language, setLanguage] = useState<Language>("en");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language;

    if (savedLanguage) {
      setLanguage(savedLanguage);

      if (savedLanguage === "ar") {
        document.documentElement.dir = "rtl";
      } else {
        document.documentElement.dir = "ltr";
      }
    }

    checkUser();
  }, []);

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setIsLoggedIn(!!user);
  };

  const changeLanguage = (lang: Language) => {
    localStorage.setItem("language", lang);

    if (lang === "ar") {
      document.documentElement.dir = "rtl";
    } else {
      document.documentElement.dir = "ltr";
    }

    window.location.reload();
  };

  const t = translations[language];

  const handleLogout = async () => {
    await supabase.auth.signOut();

    alert(language === "ar" ? "تم تسجيل الخروج" : "Logged out");

    window.location.href = "/";
  };

  return (
    <nav className="flex items-center justify-between px-10 py-6">
      <Link href="/" className="text-3xl font-bold text-slate-900">
        {language === "ar" ? "ثيراكير" : "TheraCare"}
      </Link>

      <div className="flex items-center gap-6 text-slate-900">
        <button
          onClick={() => changeLanguage("en")}
          className="text-sm font-semibold"
        >
          EN
        </button>

        <button
          onClick={() => changeLanguage("ar")}
          className="text-sm font-semibold"
        >
          العربية
        </button>

        <Link href="/">{t.home}</Link>

        <Link href="/therapists">{t.therapists}</Link>

        <Link href="/podcasts">Podcasts</Link>

        <Link href="/session">{t.session}</Link>

        {isLoggedIn ? (
          <>
            <Link
              href="/dashboard"
              className="rounded-xl border border-black px-4 py-2"
            >
              Dashboard
            </Link>

            <button
              onClick={handleLogout}
              className="rounded-xl bg-black px-4 py-2 text-white"
            >
              {t.logout}
            </button>
          </>
        ) : (
          <Link
            href="/clinician"
            className="rounded-xl border border-black px-4 py-2"
          >
            Clinician Portal
          </Link>
        )}
      </div>
    </nav>
  );
}
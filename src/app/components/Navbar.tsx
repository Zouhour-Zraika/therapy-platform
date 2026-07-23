"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { translations, Language } from "../lib/translations";

type UserRole = "patient" | "therapist" | "admin" | null;

export default function Navbar() {
  const [language, setLanguage] = useState<Language>("en");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<UserRole>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language;

    if (savedLanguage === "ar" || savedLanguage === "en") {
      setLanguage(savedLanguage);
      document.documentElement.dir =
        savedLanguage === "ar" ? "rtl" : "ltr";
    }

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    setLoadingUser(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setIsLoggedIn(false);
      setRole(null);
      setLoadingUser(false);
      return;
    }

    setIsLoggedIn(true);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Navbar profile error:", profileError);
      setRole(null);
    } else {
      setRole((profile?.role as UserRole) || null);
    }

    setLoadingUser(false);
  };

  const changeLanguage = (lang: Language) => {
    localStorage.setItem("language", lang);
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

    setLanguage(lang);
    setMenuOpen(false);

    window.location.reload();
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(
        language === "ar"
          ? "حدث خطأ أثناء تسجيل الخروج"
          : "Error while logging out"
      );

      return;
    }

    alert(language === "ar" ? "تم تسجيل الخروج" : "Logged out");

    window.location.href = "/";
  };

  const getDashboardLink = () => {
    if (role === "admin") {
      return "/admin";
    }

    if (role === "therapist") {
      return "/therapist-dashboard";
    }

    return "/dashboard";
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const t = translations[language];
  const isArabic = language === "ar";

  return (
    <header className="sticky top-0 z-50 border-b border-[#e7dcc9] bg-[#fffdf9]/95 backdrop-blur">
      <nav className="mx-auto flex min-h-[88px] max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          onClick={closeMenu}
          className="flex items-center"
          aria-label="AAN Psychotherapy home"
        >
          <div className={isArabic ? "text-right" : "text-left"}>
            <p className="text-2xl font-bold tracking-[0.32em] text-[#415a72]">
              AAN
            </p>

            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b39668] sm:text-xs">
              Psychotherapy
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-5 text-sm font-semibold text-[#415a72] lg:flex">
          <Link href="/" className="transition hover:text-[#b39668]">
            {t.home}
          </Link>

          <Link
            href="/therapists"
            className="transition hover:text-[#b39668]"
          >
            {t.therapists}
          </Link>

          <Link
            href="/support"
            className="transition hover:text-[#b39668]"
          >
            {isArabic ? "مجالات الدعم" : "Areas of Support"}
          </Link>

          <Link
            href="/podcasts"
            className="transition hover:text-[#b39668]"
          >
            {isArabic ? "البودكاست" : "Podcasts"}
          </Link>

          <div className="mx-1 h-6 w-px bg-[#ded1bc]" />

          <button
            type="button"
            onClick={() => changeLanguage("en")}
            className={`rounded-lg px-3 py-2 transition ${
              language === "en"
                ? "bg-[#415a72] text-white"
                : "hover:bg-[#f0e8dc]"
            }`}
          >
            EN
          </button>

          <button
            type="button"
            onClick={() => changeLanguage("ar")}
            className={`rounded-lg px-3 py-2 transition ${
              language === "ar"
                ? "bg-[#415a72] text-white"
                : "hover:bg-[#f0e8dc]"
            }`}
          >
            العربية
          </button>

          {!loadingUser &&
            (isLoggedIn ? (
              <>
                <Link
                  href={getDashboardLink()}
                  className="rounded-xl border-2 border-[#b39668] px-4 py-2 text-[#415a72] transition hover:bg-[#b39668] hover:text-white"
                >
                  {isArabic ? "لوحة التحكم" : "Dashboard"}
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl bg-[#415a72] px-4 py-2 text-white transition hover:bg-[#32495f]"
                >
                  {t.logout}
                </button>
              </>
            ) : (
              <Link
                href="/clinician"
                className="rounded-xl bg-[#415a72] px-5 py-2.5 text-white transition hover:bg-[#32495f]"
              >
                {isArabic ? "بوابة المعالج" : "Clinician Portal"}
              </Link>
            ))}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((previous) => !previous)}
          aria-label={isArabic ? "فتح القائمة" : "Open menu"}
          aria-expanded={menuOpen}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#d8c8aa] bg-white text-[#415a72] lg:hidden"
        >
          {menuOpen ? (
            <span className="text-3xl leading-none">×</span>
          ) : (
            <div className="space-y-1.5">
              <span className="block h-0.5 w-6 bg-[#415a72]" />
              <span className="block h-0.5 w-6 bg-[#415a72]" />
              <span className="block h-0.5 w-6 bg-[#415a72]" />
            </div>
          )}
        </button>
      </nav>

      {menuOpen && (
        <div className="border-t border-[#e7dcc9] bg-[#fffdf9] px-4 py-5 lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-3">
            <Link
              href="/"
              onClick={closeMenu}
              className="rounded-xl px-4 py-3 text-lg font-semibold text-[#415a72] hover:bg-[#f3ede3]"
            >
              {t.home}
            </Link>

            <Link
              href="/therapists"
              onClick={closeMenu}
              className="rounded-xl px-4 py-3 text-lg font-semibold text-[#415a72] hover:bg-[#f3ede3]"
            >
              {t.therapists}
            </Link>

            <Link
              href="/support"
              onClick={closeMenu}
              className="rounded-xl px-4 py-3 text-lg font-semibold text-[#415a72] hover:bg-[#f3ede3]"
            >
              {isArabic ? "مجالات الدعم" : "Areas of Support"}
            </Link>

            <Link
              href="/podcasts"
              onClick={closeMenu}
              className="rounded-xl px-4 py-3 text-lg font-semibold text-[#415a72] hover:bg-[#f3ede3]"
            >
              {isArabic ? "البودكاست" : "Podcasts"}
            </Link>

            <div className="my-2 h-px bg-[#e7dcc9]" />

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => changeLanguage("en")}
                className={`rounded-xl border px-4 py-3 font-semibold ${
                  language === "en"
                    ? "border-[#415a72] bg-[#415a72] text-white"
                    : "border-[#d8c8aa] bg-white text-[#415a72]"
                }`}
              >
                English
              </button>

              <button
                type="button"
                onClick={() => changeLanguage("ar")}
                className={`rounded-xl border px-4 py-3 font-semibold ${
                  language === "ar"
                    ? "border-[#415a72] bg-[#415a72] text-white"
                    : "border-[#d8c8aa] bg-white text-[#415a72]"
                }`}
              >
                العربية
              </button>
            </div>

            {!loadingUser &&
              (isLoggedIn ? (
                <div className="mt-3 grid gap-3">
                  <Link
                    href={getDashboardLink()}
                    onClick={closeMenu}
                    className="rounded-xl border-2 border-[#b39668] px-4 py-3 text-center text-lg font-semibold text-[#415a72]"
                  >
                    {isArabic ? "لوحة التحكم" : "Dashboard"}
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-xl bg-[#415a72] px-4 py-3 text-lg font-semibold text-white"
                  >
                    {t.logout}
                  </button>
                </div>
              ) : (
                <div className="mt-3 grid gap-3">
                  <Link
                    href="/clinician"
                    onClick={closeMenu}
                    className="rounded-xl bg-[#415a72] px-4 py-3 text-center text-lg font-semibold text-white"
                  >
                    {isArabic ? "بوابة المعالج" : "Clinician Portal"}
                  </Link>
                </div>
              ))}
          </div>
        </div>
      )}
    </header>
  );
}
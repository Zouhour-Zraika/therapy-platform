"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/i18n/LanguageProvider";

type UserRole = "patient" | "therapist" | "admin" | null;

type NavigationItem = {
  href: string;
  label: string;
};

type Language = "en" | "fr" | "ar";

export default function Navbar() {
  const pathname = usePathname();

  const {
    language,
    isArabic,
    changeLanguage,
    t,
  } = useLanguage();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<UserRole>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  const checkUser = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    void checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void checkUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkUser]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(t("navbar.logoutError"));
      return;
    }

    alert(t("navbar.logoutSuccess"));
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

  const handleLanguageChange = (newLanguage: Language) => {
    changeLanguage(newLanguage);
    setMenuOpen(false);
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  };

  const navigationItems: NavigationItem[] = [
    {
      href: "/",
      label: t("navbar.home"),
    },
    {
      href: "/therapists",
      label: t("navbar.therapists"),
    },
    {
      href: "/support",
      label: t("navbar.support"),
    },
    {
      href: "/podcasts",
      label: t("navbar.podcasts"),
    },
  ];

  const desktopLinkClass = (href: string) =>
    `relative rounded-lg px-2.5 py-2 text-[15px] font-bold tracking-[0.01em] transition duration-200 ${
      isActive(href)
        ? "text-aan-heading"
        : "text-aan-navy hover:text-aan-heading"
    }`;

  const mobileLinkClass = (href: string) =>
    `rounded-xl border px-4 py-3 text-lg font-bold transition duration-200 ${
      isActive(href)
        ? "border-aan-gold/50 bg-[#f3ece1] text-aan-heading"
        : "border-transparent text-aan-navy hover:border-aan-border hover:bg-aan-background hover:text-aan-heading"
    }`;

  const languageButtonClass = (currentLanguage: Language) =>
    `rounded-lg px-3.5 py-2.5 text-sm font-bold transition duration-200 ${
      language === currentLanguage
        ? "bg-aan-button text-white shadow-sm"
        : "text-aan-navy hover:bg-white hover:text-aan-heading"
    }`;

  const mobileLanguageButtonClass = (currentLanguage: Language) =>
    `rounded-xl px-3 py-3 font-bold transition duration-200 ${
      language === currentLanguage
        ? "bg-aan-button text-white shadow-sm"
        : "text-aan-navy hover:bg-white hover:text-aan-heading"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-aan-border bg-[#fffdf9]/97 shadow-[0_4px_18px_rgba(39,59,82,0.06)] backdrop-blur-md">
      <nav
        dir={isArabic ? "rtl" : "ltr"}
        className="mx-auto flex min-h-[92px] max-w-7xl items-center justify-between gap-5 px-4 py-3 sm:px-6 lg:px-8"
      >
        <Link
          href="/"
          onClick={closeMenu}
          aria-label="AAN Psychotherapy home"
          className="group flex shrink-0 items-center"
        >
          <div className={isArabic ? "text-right" : "text-left"}>
            <p className="text-[1.65rem] font-extrabold tracking-[0.32em] text-aan-heading transition duration-200 group-hover:text-aan-button">
              AAN
            </p>

            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.22em] text-aan-gold sm:text-xs">
              Psychotherapy
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-2 lg:flex">
          <div className="flex items-center gap-1">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={desktopLinkClass(item.href)}
              >
                {item.label}

                {isActive(item.href) && (
                  <span className="absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full bg-aan-gold" />
                )}
              </Link>
            ))}
          </div>

          <div className="mx-2 h-7 w-px bg-aan-border" />

          <div className="flex items-center rounded-xl border border-aan-border bg-aan-background p-1">
            <button
              type="button"
              onClick={() => handleLanguageChange("en")}
              aria-pressed={language === "en"}
              className={languageButtonClass("en")}
            >
              EN
            </button>

            <button
              type="button"
              onClick={() => handleLanguageChange("fr")}
              aria-pressed={language === "fr"}
              className={languageButtonClass("fr")}
            >
              FR
            </button>

            <button
              type="button"
              onClick={() => handleLanguageChange("ar")}
              aria-pressed={language === "ar"}
              className={languageButtonClass("ar")}
            >
              العربية
            </button>
          </div>

          {!loadingUser &&
            (isLoggedIn ? (
              <>
                <Link
                  href={getDashboardLink()}
                  className="ml-1 rounded-xl border-2 border-aan-gold bg-white px-5 py-2.5 text-sm font-bold text-aan-heading transition duration-200 hover:bg-aan-gold hover:text-white"
                >
                  {t("navbar.dashboard")}
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl bg-aan-button px-5 py-2.5 text-sm font-bold text-white shadow-sm transition duration-200 hover:bg-aan-hover hover:shadow-md"
                >
                  {t("navbar.logout")}
                </button>
              </>
            ) : (
              <Link
                href="/clinician"
                className="ml-1 rounded-xl bg-aan-button px-5 py-2.5 text-sm font-bold text-white shadow-sm transition duration-200 hover:bg-aan-hover hover:shadow-md"
              >
                {t("navbar.signInRegister")}
              </Link>
            ))}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((previous) => !previous)}
          aria-label={t("navbar.openMenu")}
          aria-expanded={menuOpen}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-aan-border bg-white text-aan-heading shadow-sm transition duration-200 hover:border-aan-gold hover:bg-aan-background lg:hidden"
        >
          {menuOpen ? (
            <span className="text-3xl leading-none">×</span>
          ) : (
            <div className="space-y-1.5">
              <span className="block h-0.5 w-6 rounded-full bg-aan-heading" />
              <span className="block h-0.5 w-6 rounded-full bg-aan-heading" />
              <span className="block h-0.5 w-6 rounded-full bg-aan-heading" />
            </div>
          )}
        </button>
      </nav>

      {menuOpen && (
        <div
          dir={isArabic ? "rtl" : "ltr"}
          className="border-t border-aan-border bg-[#fffdf9] px-4 py-5 shadow-lg lg:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className={mobileLinkClass(item.href)}
              >
                {item.label}
              </Link>
            ))}

            <div className="my-3 h-px bg-aan-border" />

            <div className="grid grid-cols-3 gap-3 rounded-2xl border border-aan-border bg-aan-background p-2">
              <button
                type="button"
                onClick={() => handleLanguageChange("en")}
                aria-pressed={language === "en"}
                className={mobileLanguageButtonClass("en")}
              >
                EN
              </button>

              <button
                type="button"
                onClick={() => handleLanguageChange("fr")}
                aria-pressed={language === "fr"}
                className={mobileLanguageButtonClass("fr")}
              >
                FR
              </button>

              <button
                type="button"
                onClick={() => handleLanguageChange("ar")}
                aria-pressed={language === "ar"}
                className={mobileLanguageButtonClass("ar")}
              >
                العربية
              </button>
            </div>

            {!loadingUser &&
              (isLoggedIn ? (
                <div className="mt-4 grid gap-3">
                  <Link
                    href={getDashboardLink()}
                    onClick={closeMenu}
                    className="rounded-xl border-2 border-aan-gold bg-white px-4 py-3 text-center text-lg font-bold text-aan-heading transition duration-200 hover:bg-aan-gold hover:text-white"
                  >
                    {t("navbar.dashboard")}
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-xl bg-aan-button px-4 py-3 text-lg font-bold text-white shadow-sm transition duration-200 hover:bg-aan-hover"
                  >
                    {t("navbar.logout")}
                  </button>
                </div>
              ) : (
                <div className="mt-4">
                  <Link
                    href="/clinician"
                    onClick={closeMenu}
                    className="block rounded-xl bg-aan-button px-4 py-3 text-center text-lg font-bold text-white shadow-sm transition duration-200 hover:bg-aan-hover"
                  >
                    {t("navbar.signInRegister")}
                  </Link>
                </div>
              ))}
          </div>
        </div>
      )}
    </header>
  );
}
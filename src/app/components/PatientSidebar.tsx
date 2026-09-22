"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageProvider";

type PatientSection =
  | "dashboard"
  | "sessions"
  | "profile"
  | "documents"
  | "help";

type PatientSidebarProps = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

type NavItem = {
  section: PatientSection;
  href: string;
  label: string;
  icon: React.ReactNode;
};

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V21h13V9.5" />
      <path d="M9.5 21v-7h5v7" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M7 3v4M17 3v4M3 10h18" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21c.8-4.3 3.3-6.5 7.5-6.5s6.7 2.2 7.5 6.5" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 3h8l4 4v14H6V3Z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.8 9a2.4 2.4 0 0 1 4.7.7c0 1.7-1.3 2.2-2.1 2.8-.6.4-.9.8-.9 1.5M12 17h.01" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20.8 4.8a5.2 5.2 0 0 0-7.4 0L12 6.2l-1.4-1.4a5.2 5.2 0 1 0-7.4 7.4L12 21l8.8-8.8a5.2 5.2 0 0 0 0-7.4Z" />
    </svg>
  );
}

const VALID_SECTIONS: PatientSection[] = [
  "dashboard",
  "sessions",
  "profile",
  "documents",
  "help",
];

export default function PatientSidebar({
  mobileOpen = false,
  onMobileClose,
}: PatientSidebarProps) {
  const searchParams = useSearchParams();
  const { language, isArabic } = useLanguage();

  const requestedSection = searchParams.get("section");

  const normalizedSection =
    requestedSection === "appointments" || requestedSection === "packs"
      ? "sessions"
      : requestedSection;

  const activeSection: PatientSection =
    normalizedSection &&
    VALID_SECTIONS.includes(normalizedSection as PatientSection)
      ? (normalizedSection as PatientSection)
      : "dashboard";

  const copy =
    language === "ar"
      ? {
          dashboard: "لوحة التحكم",
          sessions: "جلساتي",
          profile: "ملفي الشخصي",
          documents: "مستنداتي",
          help: "المساعدة والأسئلة الشائعة",
          wellbeingTitle: "اعتنِ بنفسك",
          wellbeingText: "رفاهك هو أولويتنا.",
          close: "إغلاق القائمة",
        }
      : language === "fr"
        ? {
            dashboard: "Tableau de bord",
            sessions: "Mes séances",
            profile: "Mon profil",
            documents: "Mes documents",
            help: "Aide & FAQ",
            wellbeingTitle: "Prenez soin de vous",
            wellbeingText: "Votre bien-être est notre priorité.",
            close: "Fermer le menu",
          }
        : {
            dashboard: "Dashboard",
            sessions: "My sessions",
            profile: "My profile",
            documents: "My documents",
            help: "Help & FAQ",
            wellbeingTitle: "Take care of yourself",
            wellbeingText: "Your well-being is our priority.",
            close: "Close menu",
          };

  const items: NavItem[] = [
    {
      section: "dashboard",
      href: "/dashboard",
      label: copy.dashboard,
      icon: <DashboardIcon />,
    },
    {
      section: "sessions",
      href: "/dashboard?section=sessions",
      label: copy.sessions,
      icon: <CalendarIcon />,
    },
    {
      section: "profile",
      href: "/dashboard?section=profile",
      label: copy.profile,
      icon: <UserIcon />,
    },
    {
      section: "documents",
      href: "/dashboard?section=documents",
      label: copy.documents,
      icon: <DocumentIcon />,
    },
    {
      section: "help",
      href: "/dashboard?section=help",
      label: copy.help,
      icon: <HelpIcon />,
    },
  ];

  const sidebar = (
    <aside
      dir={isArabic ? "rtl" : "ltr"}
      className="flex h-full w-[270px] flex-col border-e border-aan-border bg-white px-4 py-5"
    >
      {onMobileClose && (
        <div className="mb-2 flex justify-end lg:hidden">
          <button
            type="button"
            onClick={onMobileClose}
            className="rounded-xl p-2 text-aan-secondary hover:bg-[#f4f7fb]"
            aria-label={copy.close}
          >
            ✕
          </button>
        </div>
      )}

      <nav className="space-y-1.5">
        {items.map((item) => {
          const active = activeSection === item.section;

          return (
            <Link
              key={item.section}
              href={item.href}
              onClick={onMobileClose}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition ${
                active
                  ? "bg-[#eaf3ff] text-[#0d4384]"
                  : "text-aan-navy hover:bg-[#f5f8fc]"
              }`}
            >
              <span className={active ? "text-[#0d4384]" : "text-aan-navy"}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pb-2 pt-5">
        <div className="rounded-2xl border border-[#dce8f7] bg-[#f5f9ff] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#6f64d9] shadow-sm">
              <HeartIcon />
            </div>

            <div>
              <p className="text-xs font-bold text-aan-navy">
                {copy.wellbeingTitle}
              </p>
              <p className="mt-1 text-[11px] leading-4 text-aan-secondary">
                {copy.wellbeingText}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden h-[calc(100vh-92px)] shrink-0 lg:sticky lg:top-[92px] lg:block">
        {sidebar}
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <button
            type="button"
            aria-label={copy.close}
            onClick={onMobileClose}
            className="absolute inset-0 bg-aan-navy/35"
          />

          <div
            className={`absolute inset-y-0 ${
              isArabic ? "right-0" : "left-0"
            } shadow-2xl`}
          >
            {sidebar}
          </div>
        </div>
      )}
    </>
  );
}

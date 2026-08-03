"use client";

import Link from "next/link";
import Navbar from "../components/Navbar";
import ProtectedRoute from "../components/ProtectedRoute";
import { useLanguage } from "@/i18n/LanguageProvider";

type AdminSection = {
  href: string;
  title: string;
  description: string;
  icon: "profile" | "applications" | "therapists" | "podcasts";
};

function SectionIcon({ type }: { type: AdminSection["icon"] }) {
  if (type === "profile") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-7 w-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="12" cy="8" r="3.25" />
        <path d="M5.5 19c.7-3.6 3.05-5.5 6.5-5.5s5.8 1.9 6.5 5.5" />
        <path d="M18.5 5.5 20 7l-3.6 3.6-1.9.4.4-1.9z" />
      </svg>
    );
  }

  if (type === "applications") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-7 w-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M7 3.75h7.5L19 8.25V20.25H7z" />
        <path d="M14.5 3.75v4.5H19" />
        <path d="M10 12h6M10 15.5h6" />
      </svg>
    );
  }

  if (type === "therapists") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-7 w-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="9" cy="8" r="3" />
        <circle cx="16.5" cy="9" r="2.25" />
        <path d="M3.75 19c.6-3.7 2.75-5.6 6.25-5.6 3.45 0 5.6 1.9 6.2 5.6" />
        <path d="M15 14.5c2.9.1 4.65 1.6 5.2 4.5" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="8" y="3.5" width="8" height="12" rx="4" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5M9.5 20.5h5" />
    </svg>
  );
}

export default function AdminPage() {
  const { isArabic } = useLanguage();

  const copy = isArabic
    ? {
        eyebrow: "لوحة الإدارة",
        title: "إدارة منصة AAN",
        description:
          "إدارة الملف الشخصي للمسؤول وطلبات المعالجين وملفات المعالجين ومحتوى البودكاست من لوحة تحكم آمنة واحدة.",

        profileTitle: "ملفي الشخصي",
        profileDescription:
          "تحديث صورة المسؤول والاسم والمسمى الوظيفي والنبذة المهنية.",

        applicationsTitle: "طلبات المعالجين",
        applicationsDescription:
          "مراجعة طلبات المعالجين الجدد والموافقة عليها أو رفضها.",

        therapistsTitle: "إدارة المعالجين",
        therapistsDescription:
          "إدارة ملفات المعالجين المعتمدين وأسعار الجلسات.",

        podcastsTitle: "إدارة البودكاست",
        podcastsDescription:
          "إضافة محتوى البودكاست وترجمته وحذفه.",

        comingSoonTitle: "المزيد من أدوات الإدارة قريباً",
        comingSoonDescription:
          "ستتم إضافة إدارة الحجوزات وإعدادات المنصة والتقارير في المرحلة القادمة.",
      }
    : {
        eyebrow: "Administration dashboard",
        title: "AAN Administration",
        description:
          "Manage your administrator profile, therapist applications, approved therapists and bilingual podcast content from one secure dashboard.",

        profileTitle: "My Admin Profile",
        profileDescription:
          "Update your administrator photo, name, professional title and biography.",

        applicationsTitle: "Therapist Applications",
        applicationsDescription:
          "Review, approve or reject new therapist applications.",

        therapistsTitle: "Manage Therapists",
        therapistsDescription:
          "Manage approved therapist profiles and session prices.",

        podcastsTitle: "Manage Podcasts",
        podcastsDescription:
          "Add, translate and delete mental health podcasts.",

        comingSoonTitle: "More administration tools are coming soon",
        comingSoonDescription:
          "Booking management, platform settings and reporting will be added in the next development phase.",
      };

  const adminSections: AdminSection[] = [
    {
      href: "/admin-profile",
      title: copy.profileTitle,
      description: copy.profileDescription,
      icon: "profile",
    },
    {
      href: "/admin-applications",
      title: copy.applicationsTitle,
      description: copy.applicationsDescription,
      icon: "applications",
    },
    {
      href: "/admin-therapists",
      title: copy.therapistsTitle,
      description: copy.therapistsDescription,
      icon: "therapists",
    },
    {
      href: "/admin-podcasts",
      title: copy.podcastsTitle,
      description: copy.podcastsDescription,
      icon: "podcasts",
    },
  ];

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <>
        <Navbar />

        <main
          dir={isArabic ? "rtl" : "ltr"}
          className="min-h-screen bg-aan-background px-5 py-10 sm:px-8 lg:px-10"
        >
          <section className="mx-auto max-w-7xl">
            <div className="aan-card relative mb-10 overflow-hidden p-8 sm:p-10 lg:p-12">
              <div
                aria-hidden="true"
                className={`absolute top-0 h-full w-56 opacity-40 ${
                  isArabic ? "left-0" : "right-0"
                }`}
              >
                <svg
                  viewBox="0 0 240 220"
                  className="h-full w-full text-[#d8b675]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M190 35c-24 23-45 56-54 93" />
                  <path d="M183 40c16 3 30 11 40 23-18 5-34 1-48-10" />
                  <path d="M157 76c16 2 31 10 41 22-18 5-35 1-49-9" />
                  <path d="M140 113c15 2 29 10 39 21-17 5-33 1-47-9" />
                </svg>
              </div>

              <div className="relative max-w-4xl">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-aan-gold">
                  {copy.eyebrow}
                </p>

                <h1 className="aan-heading mt-4 text-4xl sm:text-5xl lg:text-6xl">
                  {copy.title}
                </h1>

                <p className="mt-5 text-lg leading-8 text-aan-secondary sm:text-xl">
                  {copy.description}
                </p>
              </div>
            </div>

            <div className="grid gap-7 md:grid-cols-2">
              {adminSections.map((section) => (
                <Link
                  key={section.href}
                  href={section.href}
                  className="group aan-card p-7 transition duration-200 hover:-translate-y-1 hover:shadow-[var(--aan-shadow-lg)] sm:p-8"
                >
                  <div className="flex h-full items-start gap-5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-aan-button text-white shadow-[var(--aan-shadow-sm)] transition group-hover:bg-aan-hover">
                      <SectionIcon type={section.icon} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="text-2xl font-semibold text-aan-navy sm:text-3xl">
                        {section.title}
                      </h2>

                      <p className="mt-3 text-base leading-7 text-aan-secondary sm:text-lg">
                        {section.description}
                      </p>
                    </div>

                    <span
                      aria-hidden="true"
                      className={`mt-2 text-3xl text-aan-navy transition ${
                        isArabic
                          ? "group-hover:-translate-x-1"
                          : "group-hover:translate-x-1"
                      }`}
                    >
                      {isArabic ? "←" : "→"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-10 rounded-[2rem] border border-aan-border bg-[linear-gradient(135deg,#ffffff_0%,#eef4fa_100%)] p-7 shadow-[var(--aan-shadow-sm)] sm:p-9">
              <div className="flex items-start gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-aan-gold bg-white text-aan-gold">
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="h-7 w-7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M12 3.5 14 9l5.5 2-5.5 2-2 5.5-2-5.5-5.5-2 5.5-2z" />
                  </svg>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold text-aan-navy sm:text-3xl">
                    {copy.comingSoonTitle}
                  </h2>

                  <p className="mt-3 max-w-3xl text-base leading-7 text-aan-secondary sm:text-lg">
                    {copy.comingSoonDescription}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>
      </>
    </ProtectedRoute>
  );
}
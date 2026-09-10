"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import ProtectedRoute from "../components/ProtectedRoute";
import { useLanguage } from "@/i18n/LanguageProvider";
import { supabase } from "@/lib/supabase";

type AdminSection = {
  href: string;
  title: string;
  description: string;
  icon:
    | "profile"
    | "applications"
    | "therapists"
    | "podcasts"
    | "admins"
    | "privacy"
    | "settings";
};

function SectionIcon({
  type,
}: {
  type: AdminSection["icon"];
}) {
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

  if (type === "admins") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-7 w-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="8" cy="8" r="3" />

        <circle cx="16" cy="8" r="3" />

        <path d="M3 19c.5-3.5 2.2-5.3 5-5.3s4.5 1.8 5 5.3" />

        <path d="M11 19c.5-3.5 2.2-5.3 5-5.3s4.5 1.8 5 5.3" />
      </svg>
    );
  }

  if (type === "settings") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-7 w-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="12" cy="12" r="3.25" />
        <path d="M19 12a7 7 0 0 0-.12-1.27l2-1.56-2-3.46-2.46.99A7.16 7.16 0 0 0 14.25 5L14 2.35h-4L9.75 5a7.16 7.16 0 0 0-2.17 1.7l-2.46-.99-2 3.46 2 1.56A7 7 0 0 0 5 12c0 .43.04.85.12 1.27l-2 1.56 2 3.46 2.46-.99A7.16 7.16 0 0 0 9.75 19L10 21.65h4l.25-2.65a7.16 7.16 0 0 0 2.17-1.7l2.46.99 2-3.46-2-1.56c.08-.42.12-.84.12-1.27Z" />
      </svg>
    );
  }

  if (type === "privacy") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-7 w-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M12 3 19 6v5c0 4.7-2.8 8-7 10-4.2-2-7-5.3-7-10V6z" />

        <path d="m9.2 12 1.8 1.8 4-4" />
      </svg>
    );
  }

  // Podcasts
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect
        x="8"
        y="3.5"
        width="8"
        height="12"
        rx="4"
      />

      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5M9.5 20.5h5" />
    </svg>
  );
}

export default function AdminPage() {
  const { language, isArabic } = useLanguage();

  const [businessSettings, setBusinessSettings] = useState({
    aanCommissionRate: "30",
    standardSubscriptionPrice: "59",
    premiumSubscriptionPrice: "99",
    patientPackSessions: "4",
    patientPackDiscountRate: "10",
    patientPackValidityMonths: "3",
  });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");
  const [settingsError, setSettingsError] = useState("");

  const specialistRate = useMemo(() => {
    const commission = Number(businessSettings.aanCommissionRate);
    if (!Number.isFinite(commission)) return 0;
    return Math.max(0, Math.min(100, 100 - commission));
  }, [businessSettings.aanCommissionRate]);

  useEffect(() => {
    const loadBusinessSettings = async () => {
      setSettingsLoading(true);
      setSettingsError("");

      const { data, error } = await supabase
        .from("platform_business_settings")
        .select("aan_commission_rate, standard_subscription_price, premium_subscription_price, patient_pack_sessions, patient_pack_discount_rate, patient_pack_validity_months")
        .eq("id", 1)
        .maybeSingle();

      if (error) {
        console.error("Business settings load error:", error);
        setSettingsError(
          language === "ar"
            ? "تعذر تحميل الإعدادات المالية."
            : language === "fr"
              ? "Impossible de charger les paramètres financiers."
              : "Unable to load financial settings.",
        );
        setSettingsLoading(false);
        return;
      }

      if (data) {
        setBusinessSettings({
          aanCommissionRate: String(data.aan_commission_rate ?? 30),
          standardSubscriptionPrice: String(data.standard_subscription_price ?? 59),
          premiumSubscriptionPrice: String(data.premium_subscription_price ?? 99),
          patientPackSessions: String(data.patient_pack_sessions ?? 4),
          patientPackDiscountRate: String(data.patient_pack_discount_rate ?? 10),
          patientPackValidityMonths: String(data.patient_pack_validity_months ?? 3),
        });
      }

      setSettingsLoading(false);
    };

    void loadBusinessSettings();
  }, [language]);

  const saveBusinessSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const commission = Number(businessSettings.aanCommissionRate);
    const standardPrice = Number(businessSettings.standardSubscriptionPrice);
    const premiumPrice = Number(businessSettings.premiumSubscriptionPrice);
    const packSessions = Number(businessSettings.patientPackSessions);
    const packDiscount = Number(businessSettings.patientPackDiscountRate);
    const packMonths = Number(businessSettings.patientPackValidityMonths);

    const invalid =
      !Number.isFinite(commission) || commission < 0 || commission > 100 ||
      !Number.isFinite(standardPrice) || standardPrice < 0 ||
      !Number.isFinite(premiumPrice) || premiumPrice < 0 ||
      !Number.isInteger(packSessions) || packSessions < 1 ||
      !Number.isFinite(packDiscount) || packDiscount < 0 || packDiscount > 100 ||
      !Number.isInteger(packMonths) || packMonths < 1;

    if (invalid) {
      setSettingsMessage("");
      setSettingsError(
        language === "ar"
          ? "يرجى إدخال قيم صحيحة قبل الحفظ."
          : language === "fr"
            ? "Veuillez saisir des valeurs valides avant d’enregistrer."
            : "Please enter valid values before saving.",
      );
      return;
    }

    setSettingsSaving(true);
    setSettingsMessage("");
    setSettingsError("");

    const { error } = await supabase
      .from("platform_business_settings")
      .update({
        aan_commission_rate: commission,
        standard_subscription_price: standardPrice,
        premium_subscription_price: premiumPrice,
        patient_pack_sessions: packSessions,
        patient_pack_discount_rate: packDiscount,
        patient_pack_validity_months: packMonths,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    if (error) {
      console.error("Business settings update error:", error);
      setSettingsError(
        language === "ar"
          ? "تعذر حفظ الإعدادات."
          : language === "fr"
            ? "Impossible d’enregistrer les paramètres."
            : "Unable to save settings.",
      );
      setSettingsSaving(false);
      return;
    }

    setSettingsMessage(
      language === "ar"
        ? "تم حفظ إعدادات الأعمال بنجاح."
        : language === "fr"
          ? "Paramètres commerciaux enregistrés."
          : "Business settings saved.",
    );
    setSettingsSaving(false);
  };

  const copy = isArabic
    ? {
        eyebrow: "لوحة الإدارة",

        title: "إدارة منصة AAN",

        description:
          "إدارة الملف الشخصي للمسؤول وطلبات المعالجين وملفات المعالجين ومحتوى البودكاست وحسابات المسؤولين وطلبات الخصوصية من لوحة تحكم آمنة واحدة.",

        profileTitle: "ملفي الشخصي",

        profileDescription:
          "تحديث صورة المسؤول والاسم والمسمى الوظيفي والنبذة المهنية.",

        applicationsTitle:
          "طلبات المعالجين",

        applicationsDescription:
          "مراجعة طلبات المعالجين الجدد والموافقة عليها أو رفضها.",

        therapistsTitle:
          "إدارة المعالجين",

        therapistsDescription:
          "إدارة ملفات المعالجين المعتمدين وأسعار الجلسات.",

        podcastsTitle:
          "إدارة البودكاست",

        podcastsDescription:
          "إضافة محتوى البودكاست وترجمته وحذفه.",

        adminsTitle:
          "إدارة المسؤولين",

        adminsDescription:
          "دعوة مسؤول جديد وإدارة حسابات المسؤولين المصرح لهم.",

        privacyTitle:
          "طلبات الخصوصية",

        privacyDescription:
          "مراجعة وإدارة طلبات الوصول إلى البيانات وتصحيحها وحذفها وطلبات الخصوصية الأخرى.",

        businessTitle: "الإعدادات المالية والتجارية",
        businessDescription: "إدارة عمولة AAN وحزمة المرضى وأسعار اشتراكات الأخصائيين.",
        commissionTitle: "العمولة والإيرادات",
        aanCommissionLabel: "عمولة AAN",
        specialistShareLabel: "حصة الأخصائي",
        patientPackTitle: "حزمة المريض",
        packSessionsLabel: "عدد الجلسات",
        packDiscountLabel: "الخصم",
        packValidityLabel: "الصلاحية بالأشهر",
        subscriptionsTitle: "اشتراكات الأخصائيين",
        standardLabel: "Standard / شهرياً",
        premiumLabel: "Premium / شهرياً",
        saveSettings: "حفظ الإعدادات",
        savingSettings: "جارٍ الحفظ...",

        comingSoonTitle:
          "المزيد من أدوات الإدارة قريباً",

        comingSoonDescription:
          "ستتم إضافة إدارة الحجوزات وإعدادات المنصة والتقارير في المرحلة القادمة.",
      }
    : language === "fr"
      ? {
          eyebrow:
            "Tableau de bord administrateur",

          title:
            "Administration AAN",

          description:
            "Gérez votre profil administrateur, les candidatures des thérapeutes, les thérapeutes approuvés, le contenu des podcasts en trois langues, les comptes administrateurs et les demandes de confidentialité depuis un tableau de bord sécurisé.",

          profileTitle:
            "Mon profil administrateur",

          profileDescription:
            "Mettez à jour votre photo, votre nom, votre titre professionnel et votre biographie.",

          applicationsTitle:
            "Candidatures des thérapeutes",

          applicationsDescription:
            "Examinez, approuvez ou refusez les nouvelles candidatures de thérapeutes.",

          therapistsTitle:
            "Gérer les thérapeutes",

          therapistsDescription:
            "Gérez les profils des thérapeutes approuvés et les tarifs des séances.",

          podcastsTitle:
            "Gérer les podcasts",

          podcastsDescription:
            "Ajoutez, traduisez et supprimez les podcasts sur la santé mentale.",

          adminsTitle:
            "Gérer les administrateurs",

          adminsDescription:
            "Invitez un nouvel administrateur et gérez les comptes administrateurs autorisés.",

          privacyTitle:
            "Demandes de confidentialité",

          privacyDescription:
            "Examinez et gérez les demandes d’accès, de rectification ou de suppression des données personnelles ainsi que les autres demandes liées à la confidentialité.",

          businessTitle: "Paramètres financiers et commerciaux",
          businessDescription: "Gérez la commission AAN, le pack patient et les tarifs des abonnements spécialistes.",
          commissionTitle: "Commission et revenus",
          aanCommissionLabel: "Commission AAN",
          specialistShareLabel: "Part spécialiste",
          patientPackTitle: "Pack patient",
          packSessionsLabel: "Nombre de séances",
          packDiscountLabel: "Réduction",
          packValidityLabel: "Validité en mois",
          subscriptionsTitle: "Abonnements spécialistes",
          standardLabel: "Standard / mois",
          premiumLabel: "Premium / mois",
          saveSettings: "Enregistrer les paramètres",
          savingSettings: "Enregistrement...",

          comingSoonTitle:
            "D’autres outils d’administration arrivent bientôt",

          comingSoonDescription:
            "La gestion des réservations, les paramètres de la plateforme et les rapports seront ajoutés lors de la prochaine phase de développement.",
        }
      : {
        eyebrow:
          "Administration dashboard",

        title:
          "AAN Administration",

        description:
          "Manage your administrator profile, therapist applications, approved therapists, bilingual podcast content, administrator accounts and privacy requests from one secure dashboard.",

        profileTitle:
          "My Admin Profile",

        profileDescription:
          "Update your administrator photo, name, professional title and biography.",

        applicationsTitle:
          "Therapist Applications",

        applicationsDescription:
          "Review, approve or reject new therapist applications.",

        therapistsTitle:
          "Manage Therapists",

        therapistsDescription:
          "Manage approved therapist profiles and session prices.",

        podcastsTitle:
          "Manage Podcasts",

        podcastsDescription:
          "Add, translate and delete mental health podcasts.",

        adminsTitle:
          "Manage Administrators",

        adminsDescription:
          "Invite a new administrator and manage authorised admin accounts.",

        privacyTitle:
          "Privacy Requests",

        privacyDescription:
          "Review and manage requests to access, correct or delete personal data and other privacy requests.",

        businessTitle: "Financial & Business Settings",
        businessDescription: "Manage the AAN commission, patient pack and specialist subscription prices.",
        commissionTitle: "Commission & Revenue",
        aanCommissionLabel: "AAN Commission",
        specialistShareLabel: "Specialist Share",
        patientPackTitle: "Patient Pack",
        packSessionsLabel: "Number of sessions",
        packDiscountLabel: "Discount",
        packValidityLabel: "Validity in months",
        subscriptionsTitle: "Specialist Subscriptions",
        standardLabel: "Standard / month",
        premiumLabel: "Premium / month",
        saveSettings: "Save settings",
        savingSettings: "Saving...",

        comingSoonTitle:
          "More administration tools are coming soon",

        comingSoonDescription:
          "Booking management, platform settings and reporting will be added in the next development phase.",
      };
        const adminSections: AdminSection[] = [
    {
      href: "/admin-profile",
      title: copy.profileTitle,
      description:
        copy.profileDescription,
      icon: "profile",
    },
    {
      href: "/admin-applications",
      title: copy.applicationsTitle,
      description:
        copy.applicationsDescription,
      icon: "applications",
    },
    {
      href: "/admin-therapists",
      title: copy.therapistsTitle,
      description:
        copy.therapistsDescription,
      icon: "therapists",
    },
    {
      href: "/admin-podcasts",
      title: copy.podcastsTitle,
      description:
        copy.podcastsDescription,
      icon: "podcasts",
    },
    {
      href: "/admin-users",
      title: copy.adminsTitle,
      description:
        copy.adminsDescription,
      icon: "admins",
    },
    {
      href: "/admin-privacy",
      title: copy.privacyTitle,
      description:
        copy.privacyDescription,
      icon: "privacy",
    },
    {
      href: "#business-settings",
      title: copy.businessTitle,
      description: copy.businessDescription,
      icon: "settings",
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
                        <form
              id="business-settings"
              onSubmit={saveBusinessSettings}
              className="mt-10 rounded-[2rem] border border-aan-border bg-white p-7 shadow-[var(--aan-shadow-sm)] sm:p-9"
            >
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-aan-gold">
                  {copy.businessTitle}
                </p>
                <p className="mt-2 max-w-3xl text-base leading-7 text-aan-secondary sm:text-lg">
                  {copy.businessDescription}
                </p>
              </div>

              {settingsLoading ? (
                <p className="mt-7 text-aan-secondary">
                  {language === "ar" ? "جارٍ تحميل الإعدادات..." : language === "fr" ? "Chargement des paramètres..." : "Loading settings..."}
                </p>
              ) : (
                <>
                  <div className="mt-8 grid gap-7 lg:grid-cols-3">
                    <section className="rounded-3xl border border-aan-border bg-aan-background p-6">
                      <h3 className="text-xl font-semibold text-aan-navy">{copy.commissionTitle}</h3>
                      <label className="mt-5 block text-sm font-semibold text-aan-navy">
                        {copy.aanCommissionLabel}
                        <div className="mt-2 flex items-center gap-2">
                          <input type="number" min="0" max="100" step="0.01" value={businessSettings.aanCommissionRate} onChange={(e) => setBusinessSettings((c) => ({ ...c, aanCommissionRate: e.target.value }))} className="w-full rounded-2xl border border-aan-border bg-white px-4 py-3 text-aan-navy outline-none focus:border-aan-gold" />
                          <span className="font-semibold text-aan-secondary">%</span>
                        </div>
                      </label>
                      <div className="mt-5 rounded-2xl border border-aan-border bg-white px-4 py-4">
                        <p className="text-sm font-semibold text-aan-secondary">{copy.specialistShareLabel}</p>
                        <p className="mt-1 text-3xl font-bold text-aan-navy">{specialistRate.toFixed(2).replace(/\.00$/, "")}%</p>
                        <p className="mt-2 text-xs leading-5 text-aan-secondary">
                          {language === "ar" ? "يتم احتسابها تلقائياً: 100% ناقص عمولة AAN." : language === "fr" ? "Calculée automatiquement : 100 % moins la commission AAN." : "Calculated automatically: 100% minus the AAN commission."}
                        </p>
                      </div>
                    </section>

                    <section className="rounded-3xl border border-aan-border bg-aan-background p-6">
                      <h3 className="text-xl font-semibold text-aan-navy">{copy.patientPackTitle}</h3>
                      <label className="mt-5 block text-sm font-semibold text-aan-navy">{copy.packSessionsLabel}
                        <input type="number" min="1" step="1" value={businessSettings.patientPackSessions} onChange={(e) => setBusinessSettings((c) => ({ ...c, patientPackSessions: e.target.value }))} className="mt-2 w-full rounded-2xl border border-aan-border bg-white px-4 py-3 text-aan-navy outline-none focus:border-aan-gold" />
                      </label>
                      <label className="mt-4 block text-sm font-semibold text-aan-navy">{copy.packDiscountLabel}
                        <div className="mt-2 flex items-center gap-2">
                          <input type="number" min="0" max="100" step="0.01" value={businessSettings.patientPackDiscountRate} onChange={(e) => setBusinessSettings((c) => ({ ...c, patientPackDiscountRate: e.target.value }))} className="w-full rounded-2xl border border-aan-border bg-white px-4 py-3 text-aan-navy outline-none focus:border-aan-gold" />
                          <span className="font-semibold text-aan-secondary">%</span>
                        </div>
                      </label>
                      <label className="mt-4 block text-sm font-semibold text-aan-navy">{copy.packValidityLabel}
                        <input type="number" min="1" step="1" value={businessSettings.patientPackValidityMonths} onChange={(e) => setBusinessSettings((c) => ({ ...c, patientPackValidityMonths: e.target.value }))} className="mt-2 w-full rounded-2xl border border-aan-border bg-white px-4 py-3 text-aan-navy outline-none focus:border-aan-gold" />
                      </label>
                    </section>

                    <section className="rounded-3xl border border-aan-border bg-aan-background p-6">
                      <h3 className="text-xl font-semibold text-aan-navy">{copy.subscriptionsTitle}</h3>
                      <label className="mt-5 block text-sm font-semibold text-aan-navy">{copy.standardLabel}
                        <div className="mt-2 flex items-center gap-2"><span className="font-semibold text-aan-secondary">$</span><input type="number" min="0" step="0.01" value={businessSettings.standardSubscriptionPrice} onChange={(e) => setBusinessSettings((c) => ({ ...c, standardSubscriptionPrice: e.target.value }))} className="w-full rounded-2xl border border-aan-border bg-white px-4 py-3 text-aan-navy outline-none focus:border-aan-gold" /></div>
                      </label>
                      <label className="mt-4 block text-sm font-semibold text-aan-navy">{copy.premiumLabel}
                        <div className="mt-2 flex items-center gap-2"><span className="font-semibold text-aan-secondary">$</span><input type="number" min="0" step="0.01" value={businessSettings.premiumSubscriptionPrice} onChange={(e) => setBusinessSettings((c) => ({ ...c, premiumSubscriptionPrice: e.target.value }))} className="w-full rounded-2xl border border-aan-border bg-white px-4 py-3 text-aan-navy outline-none focus:border-aan-gold" /></div>
                      </label>
                      <div className="mt-5 rounded-2xl border border-aan-border bg-white px-4 py-4 text-sm leading-6 text-aan-secondary">
                        {language === "ar" ? "هذه الرسوم منفصلة عن عمولة AAN على الجلسات." : language === "fr" ? "Ces abonnements restent séparés de la commission AAN appliquée aux consultations." : "These subscriptions remain separate from the AAN commission applied to consultations."}
                      </div>
                    </section>
                  </div>

                  {settingsError ? <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{settingsError}</p> : null}
                  {settingsMessage ? <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{settingsMessage}</p> : null}

                  <div className="mt-7 flex justify-end">
                    <button type="submit" disabled={settingsSaving} className="rounded-2xl bg-aan-button px-6 py-3 font-semibold text-white transition hover:bg-aan-hover disabled:cursor-not-allowed disabled:opacity-60">
                      {settingsSaving ? copy.savingSettings : copy.saveSettings}
                    </button>
                  </div>
                </>
              )}
            </form>

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
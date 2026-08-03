"use client";

import Image from "next/image";
import Link from "next/link";
import Navbar from "./components/Navbar";
import SupportIllustration from "./components/SupportIllustration";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { TranslationKey } from "@/i18n/config";

const supportTopics = [
  {
    slug: "anxiety",
    number: "01",
  },
  {
    slug: "depression",
    number: "02",
  },
  {
    slug: "relationships",
    number: "03",
  },
  {
    slug: "trauma",
    number: "04",
  },
  {
    slug: "stress-burnout",
    number: "05",
  },
  {
    slug: "self-esteem",
    number: "06",
  },
] as const;

const bookingSteps = [
  {
    id: "support",
    number: "01",
  },
  {
    id: "matching",
    number: "02",
  },
  {
    id: "confirmation",
    number: "03",
  },
] as const;

const benefits = [
  {
    id: "confidential",
  },
  {
    id: "guided",
  },
  {
    id: "qualified",
  },
] as const;

export default function Home() {
  const { isArabic, t } = useLanguage();

  const translate = (key: string) => {
    return t(key as TranslationKey);
  };

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-aan-background text-aan-heading"
    >
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden px-5 pb-20 pt-10 sm:px-8 lg:px-12 lg:pb-28 lg:pt-16">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-[#cbb48c]/20 blur-3xl" />

          <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-aan-button/10 blur-3xl" />
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
          <div className={isArabic ? "text-right" : "text-left"}>
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-aan-gold">
              {t("home.hero.eyebrow")}
            </p>

            <h1 className="aan-heading max-w-3xl text-4xl sm:text-5xl lg:text-7xl">
              {t("home.hero.title")}
            </h1>

            <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-[#2f445d] sm:text-xl">
              {t("home.hero.description")}
            </p>

            <div className="mt-9">
              <Link
                href="/booking"
                className="aan-cta inline-flex items-center justify-center rounded-2xl px-9 py-4 text-center text-lg font-bold tracking-[0.02em] text-white"
              >
                {t("home.hero.bookSession")}
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-5 text-sm font-semibold text-aan-secondary">
              <span className="flex items-center gap-2">
                <span className="text-aan-gold">✓</span>
                {t("home.hero.features.private")}
              </span>

              <span className="flex items-center gap-2">
                <span className="text-aan-gold">✓</span>
                {t("home.hero.features.secure")}
              </span>

              <span className="flex items-center gap-2">
                <span className="text-aan-gold">✓</span>
                {t("home.hero.features.languages")}
              </span>
            </div>
          </div>

          {/* Photo originale intégrée sans cadre */}
          <div className="flex w-full items-center justify-center lg:justify-end">
            <Image
              src="/aan-logo-clean.png"
              alt={t("home.hero.imageAlt")}
              width={1023}
              height={1537}
              priority
              quality={75}
              sizes="(max-width: 1024px) 92vw, 580px"
              className="
                  h-auto
                  w-full
                  max-w-[580px]
                  object-contain
                  [mask-image:radial-gradient(ellipse_at_center,black_68%,transparent_100%)]
                  [-webkit-mask-image:radial-gradient(ellipse_at_center,black_68%,transparent_100%)]
                "
            />
          </div>
        </div>
      </section>
            {/* Areas of support introduction */}
      <section className="px-5 pb-8 pt-20 sm:px-8 lg:px-12 lg:pt-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-aan-gold">
                {t("home.support.eyebrow")}
              </p>
            </div>

            <div>
              <h2 className="aan-heading max-w-4xl text-3xl sm:text-5xl lg:text-6xl">
                {t("home.support.title")}
              </h2>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-aan-secondary">
                {t("home.support.description")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Areas of support editorial cards */}
      <section className="px-5 pb-20 pt-10 sm:px-8 lg:px-12 lg:pb-28">
        <div className="mx-auto max-w-7xl space-y-8 lg:space-y-12">
          {supportTopics.slice(0, 4).map((topic, index) => {
            const illustrationFirst = index % 2 !== 0;
            const translationKey = `home.support.topics.${topic.slug}`;

            return (
              <article
                key={topic.slug}
                className="overflow-hidden rounded-[2.5rem] border border-aan-border bg-white shadow-[var(--aan-shadow-sm)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--aan-shadow-lg)]"
              >
                <div className="grid lg:grid-cols-2">
                  <div
                    className={`relative min-h-[300px] overflow-hidden sm:min-h-[390px] ${
                      illustrationFirst ? "lg:order-1" : "lg:order-2"
                    }`}
                  >
                    <SupportIllustration
                      slug={topic.slug}
                      showNumber
                      className="min-h-[300px] sm:min-h-[390px]"
                    />
                  </div>

                  <div
                    className={`flex min-h-[300px] flex-col justify-center p-8 sm:p-12 lg:p-16 ${
                      illustrationFirst ? "lg:order-2" : "lg:order-1"
                    }`}
                  >
                    <p className="text-sm font-bold uppercase tracking-[0.24em] text-aan-gold">
                      {t("home.support.cardEyebrow")}
                    </p>

                    <h3 className="aan-heading mt-4 text-3xl sm:text-5xl">
                      {translate(`${translationKey}.title`)}
                    </h3>

                    <p className="mt-5 text-xl font-semibold leading-8 text-aan-button">
                      {translate(`${translationKey}.subtitle`)}
                    </p>

                    <p className="mt-4 max-w-xl leading-8 text-aan-secondary">
                      {translate(`${translationKey}.description`)}
                    </p>

                    <Link
                      href={`/support/${topic.slug}`}
                      className="mt-8 inline-flex w-fit items-center gap-3 border-b-2 border-aan-gold pb-2 font-bold text-aan-navy transition hover:text-aan-button"
                    >
                      {t("common.learnMore")}

                      <span
                        aria-hidden="true"
                        className={`transition ${
                          isArabic ? "rotate-180" : ""
                        }`}
                      >
                        →
                      </span>
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}

          <div className="pt-4 text-center">
            <Link
              href="/support"
              className="aan-button-outline px-8 py-4 text-lg"
            >
              {t("home.support.exploreAll")}
            </Link>
          </div>
        </div>
      </section>
            {/* Booking journey */}
      <section className="bg-aan-heading px-5 py-20 text-white sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#d4be95]">
              {t("home.booking.eyebrow")}
            </p>

            <h2 className="mt-4 font-serif text-3xl font-semibold text-white sm:text-5xl">
              {t("home.booking.title")}
            </h2>

            <p className="mt-6 text-lg leading-8 text-white/75">
              {t("home.booking.description")}
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {bookingSteps.map((step) => {
              const translationKey = `home.booking.steps.${step.id}`;

              return (
                <article
                  key={step.id}
                  className="rounded-3xl border border-white/15 bg-white/[0.07] p-8 shadow-lg backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:bg-white/[0.11]"
                >
                  <span className="text-5xl font-bold text-[#d4be95]">
                    {step.number}
                  </span>

                  <h3 className="mt-6 text-2xl font-bold text-white">
                    {translate(`${translationKey}.title`)}
                  </h3>

                  <p className="mt-5 leading-7 text-white/75">
                    {translate(`${translationKey}.description`)}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-aan-gold">
              {t("home.benefits.eyebrow")}
            </p>

            <h2 className="aan-heading mt-4 text-3xl sm:text-5xl">
              {t("home.benefits.title")}
            </h2>
          </div>

          <div className="mt-14 grid gap-7 lg:grid-cols-3">
            {benefits.map((benefit, index) => {
              const translationKey = `home.benefits.items.${benefit.id}`;

              return (
                <article
                  key={benefit.id}
                  className="group rounded-[2rem] border border-aan-border bg-white p-8 shadow-[var(--aan-shadow-sm)] transition duration-300 hover:-translate-y-2 hover:shadow-[var(--aan-shadow-lg)]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf3f9] text-xl font-bold text-aan-button transition duration-300 group-hover:bg-aan-button group-hover:text-white">
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <div className="mx-5 h-px flex-1 bg-aan-border" />

                    <span className="text-2xl text-aan-gold">✦</span>
                  </div>

                  <h3 className="mt-7 text-2xl font-bold text-aan-heading">
                    {translate(`${translationKey}.title`)}
                  </h3>

                  <p className="mt-5 leading-8 text-aan-secondary">
                    {translate(`${translationKey}.description`)}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
            {/* Unsure section */}
      <section className="px-5 pb-24 pt-10 sm:px-8 lg:px-12 lg:pb-32">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] border border-aan-border bg-[linear-gradient(135deg,#efe6d8_0%,#f8f4ee_55%,#edf3f9_100%)] shadow-[var(--aan-shadow-md)]">
          <div className="grid items-center gap-10 p-8 sm:p-12 lg:grid-cols-[1.15fr_0.85fr] lg:p-16">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-aan-gold">
                {t("home.unsure.eyebrow")}
              </p>

              <h2 className="aan-heading mt-4 max-w-3xl text-3xl sm:text-5xl">
                {t("home.unsure.title")}
              </h2>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-aan-secondary">
                {t("home.unsure.description")}
              </p>

              <div className="mt-8">
                <Link
                  href="/booking"
                  className="aan-cta inline-flex items-center justify-center rounded-2xl px-8 py-4 text-lg font-bold text-white"
                >
                  {t("home.hero.bookSession")}
                </Link>
              </div>
            </div>

            <div className="relative mx-auto min-h-[290px] w-full max-w-[420px]">
              <div className="absolute inset-0 rounded-[45%_55%_52%_48%/48%_43%_57%_52%] bg-aan-button/10" />

              <div className="absolute left-[12%] top-[14%] h-[70%] w-[70%] rounded-[54%_46%_61%_39%/43%_57%_43%_57%] bg-aan-button/15" />

              <div className="absolute right-[8%] top-[12%] h-24 w-24 rounded-full border border-aan-gold/50" />

              <div className="absolute bottom-[9%] left-[8%] h-28 w-28 rounded-full border border-aan-button/30" />

              <div className="absolute bottom-[17%] right-[16%] h-20 w-20 rounded-full bg-aan-gold/30" />

              <div className="absolute left-[46%] top-[28%] h-32 w-px rotate-[18deg] bg-aan-heading/25" />

              <div className="absolute bottom-[27%] left-[18%] h-px w-40 -rotate-[23deg] bg-aan-heading/20" />

              <div className="absolute right-[31%] top-[25%] h-14 w-14 rounded-full bg-white/75 shadow-[var(--aan-shadow-sm)]" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
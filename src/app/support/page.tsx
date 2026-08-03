"use client";

import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { TranslationKey } from "@/i18n/config";
import Navbar from "../components/Navbar";
import SupportIllustration from "../components/SupportIllustration";

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

const additionalTopics = [
  {
    slug: "ocd",
    number: "07",
  },
  {
    slug: "grief",
    number: "08",
  },
  {
    slug: "parenting",
    number: "09",
  },
  {
    slug: "eating-disorders",
    number: "10",
  },
] as const;

const psychotherapyBenefits = [
  {
    id: "patterns",
    number: "01",
  },
  {
    id: "emotions",
    number: "02",
  },
  {
    id: "relationships",
    number: "03",
  },
  {
    id: "change",
    number: "04",
  },
] as const;

export default function SupportPage() {
  const { language, t } = useLanguage();
  const isArabic = language === "ar";

  const translate = (key: string) => {
    return t(key as TranslationKey);
  };

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-[#f8f4ee] text-[#223748]"
    >
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden px-5 pb-20 pt-16 sm:px-8 lg:px-12 lg:pb-28 lg:pt-24">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -right-20 top-0 h-80 w-80 rounded-full bg-[#cbb48c]/20 blur-3xl" />

          <div className="absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-[#415a72]/10 blur-3xl" />
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div className={isArabic ? "text-right" : "text-left"}>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#b39668]">
              {t("support.hero.eyebrow")}
            </p>

            <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-tight text-[#223748] sm:text-6xl lg:text-7xl">
              {t("support.hero.title")}
            </h1>

            <p className="mt-7 max-w-3xl text-lg leading-8 text-[#5e6b73] sm:text-xl">
              {t("support.hero.description")}
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-5">
              <Link
                href="/booking"
                className="inline-flex items-center justify-center rounded-2xl bg-[#415a72] px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#32495f]"
              >
                {t("common.bookOnlineSession")}
              </Link>

              <a
                href="#support-topics"
                className="inline-flex items-center gap-3 border-b border-[#b39668] pb-2 font-semibold text-[#415a72] transition hover:text-[#987449]"
              >
                {t("support.hero.exploreTopics")}

                <span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>

          <div className="relative mx-auto min-h-[390px] w-full max-w-[520px] overflow-hidden rounded-[3rem] bg-[#d9e3dd] sm:min-h-[500px]">
            <div className="absolute left-[8%] top-[10%] h-[78%] w-[78%] rounded-[54%_46%_61%_39%/43%_57%_43%_57%] bg-[#a8b8ad]/55" />

            <div className="absolute left-[22%] top-[22%] h-[52%] w-[52%] rounded-[58%_42%_47%_53%/42%_58%_42%_58%] bg-[#7d9585]" />

            <div className="absolute right-[10%] top-[12%] h-24 w-24 rounded-full border border-white/80" />

            <div className="absolute bottom-[10%] left-[10%] h-28 w-28 rounded-full border border-[#415a72]/25" />

            <div className="absolute bottom-[14%] right-[12%] h-24 w-24 rounded-full bg-[#f7f3eb]" />

            <div className="absolute bottom-[24%] right-[29%] h-12 w-12 rounded-full bg-[#c8ad7e]" />

            <div className="absolute left-[47%] top-[28%] h-[36%] w-px rotate-[18deg] bg-white/70" />

            <div className="absolute bottom-[28%] left-[18%] h-px w-44 -rotate-[25deg] bg-[#415a72]/30" />

            <div className="absolute right-[29%] top-[25%] h-16 w-16 rounded-full bg-white/35" />

            <span className="absolute left-9 top-8 text-xs font-bold tracking-[0.32em] text-[#415a72]/50">
              {t("support.hero.visualLabel")}
            </span>
          </div>
        </div>
      </section>

      {/* Introductory statement */}
      <section className="px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 border-y border-[#ddd1bf] py-12 lg:grid-cols-[0.7fr_1.3fr] lg:items-start lg:py-16">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#a58455]">
              {t("support.introduction.eyebrow")}
            </p>

            <div className="max-w-4xl">
              <h2 className="text-3xl font-bold leading-[1.15] text-[#223748] sm:text-5xl">
                {t("support.introduction.title")}
              </h2>

              <p className="mt-7 max-w-3xl text-[19px] leading-9 text-[#66727a]">
                {t("support.introduction.description")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main support topics */}
      <section
        id="support-topics"
        className="scroll-mt-28 px-5 pb-24 pt-10 sm:px-8 lg:px-12 lg:pb-32"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#b39668]">
              {t("support.topics.eyebrow")}
            </p>

            <h2 className="mt-4 text-3xl font-bold text-[#223748] sm:text-5xl">
              {t("support.topics.title")}
            </h2>

            <p className="mt-6 text-lg leading-8 text-[#66727a]">
              {t("support.topics.description")}
            </p>
          </div>

          <div className="mt-16 space-y-10 lg:space-y-16">
            {supportTopics.map((topic, index) => {
              const illustrationFirst = index % 2 !== 0;
              const translationKey = `support.topics.items.${topic.slug}`;

              return (
                <article
                  key={topic.slug}
                  className="overflow-hidden rounded-[2.75rem] border border-[#e2d7c6] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="grid lg:grid-cols-2">
                    <div
                      className={`relative min-h-[330px] overflow-hidden rounded-[2.75rem] sm:min-h-[440px] ${
                        illustrationFirst ? "lg:order-1" : "lg:order-2"
                      }`}
                    >
                      <SupportIllustration slug={topic.slug} />
                    </div>

                    <div
                      className={`flex min-h-[330px] flex-col justify-center p-8 sm:p-12 lg:p-16 ${
                        illustrationFirst ? "lg:order-2" : "lg:order-1"
                      }`}
                    >
                      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#a38253]">
                        {t("support.topics.cardEyebrow")}
                      </p>

                      <h3 className="mt-4 text-3xl font-bold text-[#223748] sm:text-5xl">
                        {translate(`${translationKey}.title`)}
                      </h3>

                      <p className="mt-5 text-xl font-medium leading-8 text-[#415a72]">
                        {translate(`${translationKey}.subtitle`)}
                      </p>

                      <p className="mt-5 max-w-xl leading-8 text-[#68747b]">
                        {translate(`${translationKey}.description`)}
                      </p>

                      <p className="mt-4 max-w-xl leading-8 text-[#68747b]">
                        {translate(`${translationKey}.details`)}
                      </p>

                      <Link
                        href={`/support/${topic.slug}`}
                        className="mt-8 inline-flex w-fit items-center gap-3 border-b border-[#b39668] pb-2 font-semibold text-[#415a72] transition hover:text-[#987449]"
                      >
                        {t("support.topics.learnAboutArea")}

                        <span
                          aria-hidden="true"
                          className={isArabic ? "rotate-180" : ""}
                        >
                          →
                        </span>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
                    <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {additionalTopics.map((topic) => {
              const translationKey =
                `support.additionalTopics.items.${topic.slug}`;

              return (
                <Link
                  key={topic.slug}
                  href={`/support/${topic.slug}`}
                  className="group overflow-hidden rounded-[2rem] border border-[#ddd1bf] bg-white shadow-sm transition hover:-translate-y-1 hover:border-[#b39668] hover:shadow-lg"
                >
                  <div className="relative h-56 overflow-hidden">
                    <SupportIllustration
                      slug={topic.slug}
                      showNumber={false}
                      className="h-full min-h-0"
                    />

                    <span className="absolute left-7 top-6 text-sm font-bold tracking-[0.24em] text-[#415a72]/60">
                      {topic.number}
                    </span>
                  </div>

                  <div className="p-7 sm:p-8">
                    <div className="flex items-start justify-between gap-6">
                      <h3 className="text-2xl font-bold text-[#223748] sm:text-3xl">
                        {translate(`${translationKey}.title`)}
                      </h3>

                      <span
                        aria-hidden="true"
                        className={`text-2xl text-[#415a72] transition group-hover:translate-x-1 ${
                          isArabic ? "rotate-180" : ""
                        }`}
                      >
                        →
                      </span>
                    </div>

                    <p className="mt-5 leading-8 text-[#68747b]">
                      {translate(`${translationKey}.description`)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* What psychotherapy may offer */}
      <section className="px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[2.75rem] bg-[#223748] p-8 text-white sm:p-12 lg:p-16">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#d4be95]">
                  {t("support.psychotherapy.eyebrow")}
                </p>

                <h2 className="mt-5 text-3xl font-bold leading-tight sm:text-5xl">
                  {t("support.psychotherapy.title")}
                </h2>
              </div>

              <div className="grid gap-8 sm:grid-cols-2">
                {psychotherapyBenefits.map((benefit) => {
                  const translationKey =
                    `support.psychotherapy.items.${benefit.id}`;

                  return (
                    <article
                      key={benefit.id}
                      className="border-t border-white/20 pt-6"
                    >
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#d4be95]">
                        {benefit.number}
                      </p>

                      <h3 className="mt-4 text-xl font-bold">
                        {translate(`${translationKey}.title`)}
                      </h3>

                      <p className="mt-3 leading-7 text-white/70">
                        {translate(`${translationKey}.description`)}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Unsure section */}
      <section className="px-5 pb-20 sm:px-8 lg:px-12 lg:pb-28">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.75rem] border border-[#dfd2bf] bg-[#ece2d2]">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#8f744d]">
                {t("support.unsure.eyebrow")}
              </p>

              <h2 className="mt-5 max-w-3xl text-3xl font-bold leading-tight text-[#223748] sm:text-5xl">
                {t("support.unsure.title")}
              </h2>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5f686e]">
                {t("support.unsure.description")}
              </p>

              <div className="mt-9">
                <Link
                  href="/booking"
                  className="inline-flex items-center justify-center rounded-2xl bg-[#415a72] px-8 py-4 text-center text-lg font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#32495f]"
                >
                  {t("common.bookOnlineSession")}
                </Link>
              </div>
            </div>

            <div className="relative min-h-[340px] overflow-hidden bg-[#d7e1dc] sm:min-h-[430px]">
              <div className="absolute left-[18%] top-[17%] h-[62%] w-[62%] rounded-[56%_44%_37%_63%/42%_58%_42%_58%] bg-[#819688]" />

              <div className="absolute right-[13%] top-[16%] h-24 w-24 rounded-full bg-[#efe6d8]" />

              <div className="absolute bottom-[14%] left-[12%] h-28 w-28 rounded-full border border-[#415a72]/30" />

              <div className="absolute bottom-[17%] right-[16%] h-20 w-20 rounded-[60%_40%_60%_40%] bg-[#b79b72]" />

              <div className="absolute left-[48%] top-[31%] h-28 w-px rotate-[17deg] bg-white/65" />

              <div className="absolute bottom-[28%] left-[22%] h-px w-40 -rotate-[25deg] bg-[#415a72]/30" />

              <div className="absolute right-[37%] top-[25%] h-16 w-16 rounded-full bg-white/45" />
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-5 pb-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl rounded-[2.8rem] bg-[#223748] px-8 py-16 text-center text-white sm:px-12 lg:px-16 lg:py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#d4be95]">
            {t("common.brandName")}
          </p>

          <h2 className="mx-auto mt-5 max-w-4xl text-4xl font-bold leading-tight sm:text-6xl">
            {t("support.finalCta.title")}
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-white/70">
            {t("support.finalCta.description")}
          </p>

          <div className="mt-10">
            <Link
              href="/booking"
              className="inline-flex items-center justify-center rounded-2xl bg-[#d4be95] px-10 py-5 text-lg font-semibold text-[#223748] transition hover:-translate-y-0.5 hover:bg-[#e5d3b2]"
            >
              {t("common.bookOnlineSession")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { translations, Language } from "../lib/translations";

export default function Hero() {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language;

    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  const t = translations[language];

  return (
    <section className="flex flex-col items-center justify-center px-6 pt-24 text-center">
      <div className="max-w-4xl">
        <h1 className="mb-6 text-6xl font-bold leading-tight text-slate-900">
          {t.heroTitle}
        </h1>

        <p className="mb-10 text-xl text-slate-600">
          {t.heroText}
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/therapists"
            className="rounded-2xl bg-black px-8 py-4 text-lg font-medium text-white"
          >
            {t.findTherapist}
          </Link>

          <button className="rounded-2xl border border-black px-8 py-4 text-lg font-medium text-black">
            {t.learnMore}
          </button>
        </div>
      </div>
    </section>
  );
}
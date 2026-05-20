"use client";

import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import FeatureCard from "./components/FeatureCard";
import { translations, Language } from "./lib/translations";

export default function Home() {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language;

    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  const t = translations[language];

  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar />

      <Hero />

      <section className="mt-24 grid gap-6 px-10 pb-20 md:grid-cols-3">
        <FeatureCard title={t.videoSessions} description={t.videoText} />

        <FeatureCard title={t.securePayments} description={t.paymentText} />

        <FeatureCard title={t.tracking} description={t.trackingText} />
      </section>
    </main>
  );
}
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import FeatureCard from "./components/FeatureCard";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar />

      <Hero />

      <section className="mt-24 grid gap-6 px-10 pb-20 md:grid-cols-3">
        <FeatureCard
          title="Sessions Vidéo"
          description="Consultez votre thérapeute directement en ligne."
        />

        <FeatureCard
          title="Paiement Sécurisé"
          description="Réservez et payez vos séances facilement."
        />

        <FeatureCard
          title="Suivi Thérapeutique"
          description="Homework, notes et historique des sessions."
        />
      </section>
    </main>
  );
}
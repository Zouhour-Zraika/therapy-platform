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
          title="Video Sessions"
          description="Consult with your therapist directly online."
        />

        <FeatureCard
          title="Secure Payments"
          description="Book and pay for your sessions easily."
        />

        <FeatureCard
          title="Therapy Tracking"
          description="Homework, notes, and session history."
        />
      </section>
    </main>
  );
}
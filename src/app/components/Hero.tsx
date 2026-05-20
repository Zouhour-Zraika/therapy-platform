import Link from "next/link";

export default function Hero() {
  return (
    <section className="flex flex-col items-center justify-center px-6 pt-24 text-center">
      <div className="max-w-4xl">
        <h1 className="mb-6 text-6xl font-bold leading-tight text-slate-900">
          Your Mental Health Journey Starts Here
        </h1>

        <p className="mb-10 text-xl text-slate-600">
          Réservez des séances avec des thérapeutes qualifiés
          directement en ligne via une plateforme sécurisée et moderne.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/therapists"
            className="rounded-2xl bg-black px-8 py-4 text-lg font-medium text-white"
          >
            Trouver un thérapeute
          </Link>

          <button className="rounded-2xl border border-black px-8 py-4 text-lg font-medium text-black">
            En savoir plus
          </button>
        </div>
      </div>
    </section>
  );
}
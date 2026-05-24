"use client";

import Link from "next/link";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-slate-100">
      <nav className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-6">
        <h1 className="text-5xl font-bold text-slate-900">
          TheraCare Admin
        </h1>

        <div className="flex items-center gap-6 text-xl text-slate-900">
          <Link href="/">Home</Link>
          <Link href="/therapists">Therapists</Link>
          <Link href="/podcasts">Podcasts</Link>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl p-10">
        <div className="mb-10 rounded-3xl bg-white p-10 shadow-lg">
          <h2 className="mb-4 text-6xl font-bold text-slate-900">
            Platform Admin Dashboard
          </h2>

          <p className="text-2xl text-slate-600">
            Manage therapists, podcasts, bookings and platform settings.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <Link
            href="/admin-podcasts"
            className="rounded-3xl bg-white p-10 shadow-lg transition hover:scale-[1.02]"
          >
            <h3 className="mb-4 text-4xl font-bold text-slate-900">
              Manage Podcasts
            </h3>

            <p className="text-xl text-slate-600">
              Add, edit and delete mental health podcasts.
            </p>
          </Link>

          <div className="rounded-3xl bg-white p-10 shadow-lg">
            <h3 className="mb-4 text-4xl font-bold text-slate-900">
              Manage Therapists
            </h3>

            <p className="text-xl text-slate-600">
              Approve therapist accounts and manage therapist profiles.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-10 shadow-lg">
            <h3 className="mb-4 text-4xl font-bold text-slate-900">
              View Bookings
            </h3>

            <p className="text-xl text-slate-600">
              Monitor therapy sessions and platform bookings.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-10 shadow-lg">
            <h3 className="mb-4 text-4xl font-bold text-slate-900">
              Platform Settings
            </h3>

            <p className="text-xl text-slate-600">
              Configure platform settings and future integrations.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
import Link from "next/link";

export default function Hero() {
  return (
    <section className="flex flex-col items-center justify-center px-6 pt-24 text-center">
      <div className="max-w-4xl">
        <h1 className="mb-6 text-6xl font-bold leading-tight text-slate-900">
          Your Mental Health Journey Starts Here
        </h1>

        <p className="mb-10 text-xl text-slate-600">
          Book sessions with qualified therapists online through a secure
          and modern platform.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/therapists"
            className="rounded-2xl bg-black px-8 py-4 text-lg font-medium text-white"
          >
            Find a Therapist
          </Link>

          <button className="rounded-2xl border border-black px-8 py-4 text-lg font-medium text-black">
            Learn More
          </button>
        </div>
      </div>
    </section>
  );
}
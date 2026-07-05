"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "@/lib/supabase";
import { translations, Language } from "../lib/translations";

type Podcast = {
  id: string;
  title: string;
  description: string;
  audio_url: string;
  language: string;
  topic: string;
  created_at: string;
};

export default function PodcastsPage() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPodcasts();
  }, []);

  const getPodcasts = async () => {
    const { data, error } = await supabase
      .from("podcasts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log("Podcast fetch error:", error);
      setLoading(false);
      return;
    }

    setPodcasts(data || []);
    setLoading(false);
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-100 p-10">
        <div className="mx-auto max-w-6xl">
          <section className="mb-12 rounded-3xl bg-white p-10 shadow-xl">
            <h1 className="text-6xl font-bold text-slate-900">
              Mental Health Podcasts
            </h1>

            <p className="mt-4 text-2xl text-slate-600">
              Listen to psychology, therapy, anxiety, trauma and wellbeing
              discussions.
            </p>
          </section>

          {loading ? (
            <div className="rounded-3xl bg-white p-10 shadow-xl">
              <p className="text-2xl text-slate-600">
                Loading podcasts...
              </p>
            </div>
          ) : podcasts.length === 0 ? (
            <div className="rounded-3xl bg-white p-10 shadow-xl">
              <p className="text-2xl text-slate-600">
                No podcasts available yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2">
              {podcasts.map((podcast) => (
                <article
                  key={podcast.id}
                  className="rounded-3xl bg-white p-8 shadow-xl"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <span className="rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                      {podcast.topic || "General"}
                    </span>

                    <span className="text-sm text-slate-500">
                      {podcast.language?.toUpperCase()}
                    </span>
                  </div>

                  <h2 className="text-3xl font-bold text-slate-900">
                    {podcast.title}
                  </h2>

                  <p className="mt-4 text-lg leading-relaxed text-slate-600">
                    {podcast.description}
                  </p>

                  <div className="mt-8">
                    <audio controls className="w-full">
                      <source
                        src={podcast.audio_url}
                        type="audio/mpeg"
                      />

                      Your browser does not support audio playback.
                    </audio>
                  </div>

                  <p className="mt-5 text-sm text-slate-500">
                    Published on{" "}
                    {new Date(
                      podcast.created_at
                    ).toLocaleDateString()}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
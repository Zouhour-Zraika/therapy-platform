"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { supabase } from "@/lib/supabase";
import ProtectedRoute from "../components/ProtectedRoute";

type Podcast = {
  id: string;
  title: string;
  description: string;
  audio_url: string;
  language: string;
  topic: string;
  created_at: string;
};

export default function AdminPodcastsPage() {
  const router = useRouter();

  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  const [podcasts, setPodcasts] = useState<Podcast[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [language, setLanguage] = useState("en");
  const [topic, setTopic] = useState("");

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      router.push("/");
      return;
    }

    setAllowed(true);
    setLoading(false);
    getPodcasts();
  };

  const getPodcasts = async () => {
    const { data, error } = await supabase
      .from("podcasts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      return;
    }

    setPodcasts(data || []);
  };

  const addPodcast = async () => {
    if (!title || !audioUrl) {
      alert("Title and audio URL are required");
      return;
    }

    const { error } = await supabase.from("podcasts").insert({
      title,
      description,
      audio_url: audioUrl,
      language,
      topic,
    });

    if (error) {
      alert("Error adding podcast");
      console.log(error);
      return;
    }

    setTitle("");
    setDescription("");
    setAudioUrl("");
    setLanguage("en");
    setTopic("");

    getPodcasts();
  };

  const deletePodcast = async (id: string) => {
    const confirmDelete = confirm("Delete this podcast?");

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("podcasts")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Error deleting podcast");
      console.log(error);
      return;
    }

    getPodcasts();
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-slate-100 p-10">
          <p className="text-2xl text-slate-700">Loading...</p>
        </main>
      </>
    );
  }

  if (!allowed) return null;

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-100 p-10">
        <section className="mx-auto max-w-6xl rounded-3xl bg-white p-10 shadow-xl">
          <h1 className="mb-8 text-5xl font-bold text-slate-900">
            Admin Podcasts
          </h1>

          <div className="mb-10 grid gap-4">
            <input
              placeholder="Podcast title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-2xl border border-slate-300 p-4 text-slate-900"
            />

            <textarea
              placeholder="Podcast description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-32 rounded-2xl border border-slate-300 p-4 text-slate-900"
            />

            <input
              placeholder="Audio URL"
              value={audioUrl}
              onChange={(e) => setAudioUrl(e.target.value)}
              className="rounded-2xl border border-slate-300 p-4 text-slate-900"
            />

            <input
              placeholder="Topic, for example: Anxiety"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="rounded-2xl border border-slate-300 p-4 text-slate-900"
            />

            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-2xl border border-slate-300 p-4 text-slate-900"
            >
              <option value="en">English</option>
              <option value="ar">Arabic</option>
              <option value="fr">French</option>
            </select>

            <button
              onClick={addPodcast}
              className="rounded-2xl bg-black py-4 text-lg font-semibold text-white"
            >
              Add Podcast
            </button>
          </div>

          <h2 className="mb-6 text-3xl font-bold text-slate-900">
            Existing Podcasts
          </h2>

          <div className="grid gap-6">
            {podcasts.length === 0 ? (
              <p className="text-slate-600">No podcasts yet.</p>
            ) : (
              podcasts.map((podcast) => (
                <div
                  key={podcast.id}
                  className="rounded-2xl bg-slate-100 p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">
                        {podcast.title}
                      </h3>

                      <p className="mt-2 text-slate-600">
                        {podcast.description}
                      </p>

                      <p className="mt-2 text-sm text-slate-500">
                        {podcast.topic || "No topic"} ·{" "}
                        {podcast.language?.toUpperCase()}
                      </p>

                      <audio controls className="mt-4 w-full">
                        <source src={podcast.audio_url} type="audio/mpeg" />
                      </audio>
                    </div>

                    <button
                      onClick={() => deletePodcast(podcast.id)}
                      className="rounded-xl bg-red-600 px-4 py-2 text-white"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </>
    </ProtectedRoute>
  );
}
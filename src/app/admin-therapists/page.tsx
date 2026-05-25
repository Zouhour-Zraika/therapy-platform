"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "@/lib/supabase";

type Therapist = {
  id: string;
  full_name: string;
  specialty: string;
  bio: string;
  price: number;
};

export default function AdminTherapistsPage() {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTherapists();
  }, []);

  const getTherapists = async () => {
    const { data, error } = await supabase
      .from("therapists")
      .select("*")
      .order("full_name", { ascending: true });

    if (error) {
      console.log(error);
      setLoading(false);
      return;
    }

    setTherapists(data || []);
    setLoading(false);
  };

  const deleteTherapist = async (id: string) => {
    const confirmDelete = confirm("Delete this therapist?");

    if (!confirmDelete) return;

    const { error } = await supabase.from("therapists").delete().eq("id", id);

    if (error) {
      alert("Error deleting therapist");
      console.log(error);
      return;
    }

    getTherapists();
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-100 p-10">
        <section className="mx-auto max-w-7xl rounded-3xl bg-white p-10 shadow-xl">
          <h1 className="mb-4 text-5xl font-bold text-slate-900">
            Manage Therapists
          </h1>

          <p className="mb-10 text-xl text-slate-600">
            View and manage therapists on the platform.
          </p>

          {loading ? (
            <p className="text-slate-600">Loading therapists...</p>
          ) : therapists.length === 0 ? (
            <p className="text-slate-600">No therapists found.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {therapists.map((therapist) => (
                <div
                  key={therapist.id}
                  className="rounded-2xl bg-slate-100 p-6"
                >
                  <h2 className="text-3xl font-bold text-slate-900">
                    {therapist.full_name || "Unnamed therapist"}
                  </h2>

                  <p className="mt-2 text-slate-700">
                    {therapist.specialty || "No specialty"}
                  </p>

                  <p className="mt-4 text-slate-600">
                    {therapist.bio || "No bio yet."}
                  </p>

                  <p className="mt-4 text-xl font-bold text-slate-900">
                    ${therapist.price || 0}/session
                  </p>

                  <button
                    onClick={() => deleteTherapist(therapist.id)}
                    className="mt-6 rounded-xl bg-red-600 px-5 py-3 text-white"
                  >
                    Delete Therapist
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
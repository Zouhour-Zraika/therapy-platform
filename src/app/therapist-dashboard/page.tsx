"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "../components/Navbar";

type AvailabilitySlot = {
  id: string;
  day: string;
  time: string;
};

export default function TherapistDashboard() {
  const [fullName, setFullName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [bio, setBio] = useState("");
  const [price, setPrice] = useState("");

  const [day, setDay] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getProfile();
    getSlots();
  }, []);

  const getProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("therapists")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      setFullName(data.full_name || "");
      setSpecialty(data.specialty || "");
      setBio(data.bio || "");
      setPrice(data.price?.toString() || "");
    }
  };

  const saveProfile = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.from("therapists").upsert({
      id: user.id,
      full_name: fullName,
      specialty,
      bio,
      price: Number(price),
    });

    if (error) {
      alert("Error saving profile");
      console.log(error);
    } else {
      alert("Profile saved");
    }

    setLoading(false);
  };

  const getSlots = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("availability_slots")
      .select("*")
      .eq("therapist_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      return;
    }

    setSlots(data || []);
  };

  const addSlot = async () => {
    if (!day || !time) {
      alert("Please choose day and time");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.from("availability_slots").insert({
      therapist_id: user.id,
      day,
      time,
    });

    if (error) {
      alert("Error adding slot");
      console.log(error);
      return;
    }

    setDay("");
    setTime("");
    getSlots();
  };

  const deleteSlot = async (id: string) => {
    const { error } = await supabase
      .from("availability_slots")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Error deleting slot");
      console.log(error);
      return;
    }

    getSlots();
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-100 p-10">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          <section className="rounded-3xl bg-white p-10 shadow-xl">
            <h1 className="mb-8 text-5xl font-bold text-slate-900">
              Therapist Profile
            </h1>

            <div className="space-y-6">
              <input
                type="text"
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 p-4 text-slate-900"
              />

              <input
                type="text"
                placeholder="Specialty"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 p-4 text-slate-900"
              />

              <textarea
                placeholder="Bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="h-40 w-full rounded-2xl border border-slate-300 p-4 text-slate-900"
              />

              <input
                type="number"
                placeholder="Session price ($)"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 p-4 text-slate-900"
              />

              <button
                onClick={saveProfile}
                className="w-full rounded-2xl bg-black py-4 text-lg text-white"
              >
                {loading ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-10 shadow-xl">
            <h2 className="mb-8 text-4xl font-bold text-slate-900">
              Availability
            </h2>

            <div className="mb-8 space-y-4">
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 p-4 text-slate-900"
              >
                <option value="">Choose day</option>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
                <option value="Sunday">Sunday</option>
              </select>

              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 p-4 text-slate-900"
              />

              <button
                onClick={addSlot}
                className="w-full rounded-2xl bg-black py-4 text-lg text-white"
              >
                Add Availability
              </button>
            </div>

            <div className="space-y-4">
              {slots.length === 0 ? (
                <p className="text-slate-600">No availability yet.</p>
              ) : (
                slots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between rounded-2xl bg-slate-100 p-4"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{slot.day}</p>
                      <p className="text-slate-600">{slot.time}</p>
                    </div>

                    <button
                      onClick={() => deleteSlot(slot.id)}
                      className="rounded-xl bg-red-600 px-4 py-2 text-white"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
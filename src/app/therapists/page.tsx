"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "../components/Navbar";
import Link from "next/link";
import { Language } from "../lib/translations";

interface Therapist {
  id: string;
  full_name: string;
  specialty: string;
  bio: string;
  price: number;
}

interface Availability {
  id: number;
  therapist_id: string;
  day: string;
  time: string;
}

export default function TherapistsPage() {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language;

    if (savedLanguage) {
      setLanguage(savedLanguage);
    }

    fetchTherapists();
    fetchAvailabilities();
  }, []);

  const isArabic = language === "ar";

  const fetchTherapists = async () => {
    const { data } = await supabase.from("therapists").select("*");

    if (data) {
      setTherapists(data);
    }
  };

  const fetchAvailabilities = async () => {
    const { data } = await supabase.from("availability_slots").select("*");

    if (data) {
      setAvailabilities(data);
    }
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-100 p-10">
        <h1 className="mb-14 text-center text-6xl font-bold text-slate-900">
          {isArabic ? "المعالجون لدينا" : "Our Therapists"}
        </h1>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
          {therapists.map((therapist) => {
            const therapistAvailabilities = availabilities.filter(
              (a) => a.therapist_id === therapist.id
            );

            return (
              <div
                key={therapist.id}
                className="rounded-3xl bg-white p-8 shadow-lg"
              >
                <div className="mb-6 h-56 rounded-3xl bg-slate-200" />

                <h2 className="mb-2 text-4xl font-bold text-slate-900">
                  {therapist.full_name}
                </h2>

                <p className="mb-4 text-lg text-slate-600">
                  {therapist.specialty}
                </p>

                <p className="mb-6 text-slate-700">{therapist.bio}</p>

                <p className="mb-6 text-3xl font-bold text-slate-900">
                  ${therapist.price}/{isArabic ? "جلسة" : "session"}
                </p>

                <div className="mb-6">
                  <h3 className="mb-3 text-xl font-semibold">
                    {isArabic ? "المواعيد المتاحة" : "Availability"}
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {therapistAvailabilities.length > 0 ? (
                      therapistAvailabilities.map((slot) => (
                        <div
                          key={slot.id}
                          className="rounded-xl bg-slate-200 px-4 py-2 text-sm"
                        >
                          {slot.day} - {slot.time}
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500">
                        {isArabic
                          ? "لا توجد مواعيد متاحة بعد."
                          : "No availability yet."}
                      </p>
                    )}
                  </div>
                </div>

                <Link href={`/booking?therapistId=${therapist.id}`}>
                  <button className="w-full rounded-2xl bg-black py-4 text-lg text-white">
                    {isArabic ? "احجز جلسة" : "Book Session"}
                  </button>
                </Link>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
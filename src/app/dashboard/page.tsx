"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { supabase } from "@/lib/supabase";

type Booking = {
  id: string;
  therapist_name: string;
  slot_day: string;
  slot_time: string;
  price: number;
  status: string;
};

export default function DashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    getBookings();
  }, []);

  const getBookings = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("patient_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      return;
    }

    setBookings(data || []);
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-100 p-10">
        <section className="mx-auto max-w-5xl">
          <h1 className="mb-4 text-5xl font-bold text-slate-900">
            Patient Dashboard
          </h1>

          <p className="mb-10 text-slate-600">
            View your booked therapy sessions.
          </p>

          {bookings.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 shadow-lg">
              <p className="text-slate-600">No bookings yet.</p>

              <Link
                href="/therapists"
                className="mt-6 inline-block rounded-2xl bg-black px-6 py-3 text-white"
              >
                Find a therapist
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="rounded-3xl bg-white p-8 shadow-lg"
                >
                  <h2 className="text-3xl font-bold text-slate-900">
                    {booking.therapist_name}
                  </h2>

                  <p className="mt-3 text-slate-700">
                    Slot: {booking.slot_day} at {booking.slot_time}
                  </p>

                  <p className="mt-2 text-slate-700">
                    Price: ${booking.price}
                  </p>

                  <p className="mt-2 text-slate-700">
                    Status: {booking.status}
                  </p>

                  <Link
                    href="/session"
                    className="mt-6 inline-block rounded-2xl bg-black px-6 py-3 text-white"
                  >
                    Join Session
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
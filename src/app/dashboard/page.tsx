"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "@/lib/supabase";
import { translations, Language } from "../lib/translations";
import ProtectedRoute from "../components/ProtectedRoute";

type Booking = {
  id: string;
  therapist_name: string;
  slot_day: string;
  slot_time: string;
  price: number;
  status: string;
  created_at: string;
  zoom_join_url: string | null;
};

export default function PatientDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBookings();
  }, []);

  const getBookings = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("patient_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      setLoading(false);
      return;
    }

    setBookings(data || []);
    setLoading(false);
  };

  return (
    <ProtectedRoute allowedRoles={["patient"]}>
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-100 p-10">
        <section className="mx-auto mb-10 max-w-6xl rounded-3xl bg-white p-10 shadow-lg">
          <h1 className="mb-4 text-6xl font-bold text-slate-900">
            Patient Dashboard
          </h1>

          <p className="text-2xl text-slate-600">
            View and manage your therapy sessions.
          </p>
        </section>

        <section className="mx-auto max-w-6xl rounded-3xl bg-white p-10 shadow-lg">
          <h2 className="mb-8 text-4xl font-bold text-slate-900">
            My Appointments
          </h2>

          {loading ? (
            <p className="text-slate-600">Loading appointments...</p>
          ) : bookings.length === 0 ? (
            <div>
              <p className="mb-6 text-xl text-slate-600">
                You do not have any appointments yet.
              </p>

              <a
                href="/therapists"
                className="inline-block rounded-2xl bg-black px-8 py-4 text-white"
              >
                Find a Therapist
              </a>
            </div>
          ) : (
            <div className="grid gap-6">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="rounded-2xl bg-slate-100 p-6"
                >
                  <div className="flex flex-col justify-between gap-6 md:flex-row">
                    <div>
                      <h3 className="text-3xl font-bold text-slate-900">
                        {booking.therapist_name}
                      </h3>

                      <p className="mt-3 text-xl text-slate-700">
                        {booking.slot_day} at {booking.slot_time}
                      </p>

                      <p className="mt-2 text-slate-700">
                        Price: ${booking.price}
                      </p>

                      <p className="mt-2 font-bold text-slate-900">
                        Status:{" "}
                        <span
                          className={
                            booking.status === "paid"
                              ? "text-green-700"
                              : "text-orange-600"
                          }
                        >
                          {booking.status}
                        </span>
                      </p>

                      <p className="mt-2 text-sm text-slate-500">
                        Booked: {new Date(booking.created_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex min-w-56 flex-col gap-3">
                      {booking.status === "paid" && booking.zoom_join_url ? (
                        <a
                          href={booking.zoom_join_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-2xl bg-black px-6 py-4 text-center text-white"
                        >
                          Join Zoom Session
                        </a>
                      ) : booking.status === "paid" ? (
                        <button className="rounded-2xl bg-slate-400 px-6 py-4 text-white">
                          Zoom Not Ready
                        </button>
                      ) : (
                        <a
                          href={`/payment?bookingId=${booking.id}&therapist=${encodeURIComponent(
                            booking.therapist_name
                          )}&price=${booking.price}&slot=${encodeURIComponent(
                            `${booking.slot_day} ${booking.slot_time}`
                          )}`}
                          className="rounded-2xl bg-black px-6 py-4 text-center text-white"
                        >
                          Complete Payment
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
    </ProtectedRoute>
  );
}
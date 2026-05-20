"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Therapist = {
  id: string;
  full_name: string;
  specialty: string;
  price: number;
};

type Slot = {
  id: string;
  day: string;
  time: string;
  therapist_id: string;
  is_booked: boolean;
};

export default function BookingPage() {
  const searchParams = useSearchParams();
  const therapistId = searchParams.get("therapistId");

  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  useEffect(() => {
    if (therapistId) {
      getTherapist();
      getSlots();
    }
  }, [therapistId]);

  const getTherapist = async () => {
    const { data, error } = await supabase
      .from("therapists")
      .select("*")
      .eq("id", therapistId)
      .single();

    if (error) {
      console.log(error);
      return;
    }

    setTherapist(data);
  };

  const getSlots = async () => {
    const { data, error } = await supabase
      .from("availability_slots")
      .select("*")
      .eq("therapist_id", therapistId)
      .eq("is_booked", false)
      .order("created_at", { ascending: true });

    if (error) {
      console.log(error);
      return;
    }

    setSlots(data || []);
  };

  const confirmBooking = async () => {
    if (!selectedSlot || !therapist) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("You must be logged in");
      return;
    }

    const { error: bookingError } = await supabase.from("bookings").insert({
      patient_id: user.id,
      therapist_id: therapist.id,
      slot_id: selectedSlot.id,
      therapist_name: therapist.full_name,
      slot_day: selectedSlot.day,
      slot_time: selectedSlot.time,
      price: therapist.price,
      status: "pending",
    });

    if (bookingError) {
      alert("Error creating booking");
      console.log(bookingError);
      return;
    }

    const { error: slotError } = await supabase
      .from("availability_slots")
      .update({ is_booked: true })
      .eq("id", selectedSlot.id);

    if (slotError) {
      alert("Booking created, but slot update failed");
      console.log(slotError);
      return;
    }

    alert("Booking confirmed");

    window.location.href = `/payment?therapist=${therapist.full_name}&price=${therapist.price}&slot=${selectedSlot.day} ${selectedSlot.time}`;
  };

  return (
    <main className="min-h-screen bg-slate-100 p-10">
      <h1 className="mb-4 text-center text-5xl font-bold text-slate-900">
        Book a Session
      </h1>

      <p className="mb-10 text-center text-xl text-slate-600">
        Choose an available time slot for your therapy session.
      </p>

      <section className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-lg">
        {therapist && (
          <div className="mb-8 rounded-2xl bg-slate-100 p-6">
            <h2 className="text-3xl font-bold text-slate-900">
              {therapist.full_name}
            </h2>

            <p className="mt-2 text-slate-600">{therapist.specialty}</p>

            <p className="mt-4 text-2xl font-bold text-slate-900">
              ${therapist.price}/session
            </p>
          </div>
        )}

        <h2 className="mb-6 text-3xl font-bold text-slate-900">
          Available Slots
        </h2>

        {slots.length === 0 ? (
          <p className="text-slate-600">
            No available slots for this therapist.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {slots.map((slot) => (
              <button
                key={slot.id}
                onClick={() => setSelectedSlot(slot)}
                className={`rounded-2xl border px-6 py-4 text-lg font-semibold ${
                  selectedSlot?.id === slot.id
                    ? "border-black bg-black text-white"
                    : "border-slate-300 text-slate-900 hover:bg-black hover:text-white"
                }`}
              >
                {slot.day} - {slot.time}
              </button>
            ))}
          </div>
        )}

        {selectedSlot && (
          <p className="mt-6 text-center text-slate-700">
            Selected slot:{" "}
            <strong>
              {selectedSlot.day} - {selectedSlot.time}
            </strong>
          </p>
        )}

        <button
          onClick={confirmBooking}
          disabled={!selectedSlot}
          className={`mt-10 w-full rounded-2xl py-4 text-center text-lg font-semibold ${
            selectedSlot
              ? "bg-black text-white"
              : "pointer-events-none cursor-not-allowed bg-slate-300 text-slate-500"
          }`}
        >
          Confirm Booking
        </button>
      </section>
    </main>
  );
}
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "../components/Navbar";
import { Language } from "../lib/translations";

type Therapist = {
  id: string;
  full_name: string;
  full_name_ar: string | null;
  specialty: string;
  specialty_ar: string | null;
  price: number;
};

type Slot = {
  id: string;
  day: string;
  time: string;
  therapist_id: string;
  is_booked: boolean;
};

function BookingContent() {
  const searchParams = useSearchParams();
  const therapistId = searchParams.get("therapistId");

  const [language, setLanguage] = useState<Language>("en");
  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language;

    if (savedLanguage) {
      setLanguage(savedLanguage);
    }

    if (therapistId) {
      getTherapist();
      getSlots();
    }
  }, [therapistId]);

  const isArabic = language === "ar";

  const translateDay = (day: string) => {
    if (!isArabic) return day;

    const days: Record<string, string> = {
      Monday: "الاثنين",
      Tuesday: "الثلاثاء",
      Wednesday: "الأربعاء",
      Thursday: "الخميس",
      Friday: "الجمعة",
      Saturday: "السبت",
      Sunday: "الأحد",
    };

    return days[day] || day;
  };

  const getTherapistName = () => {
    if (!therapist) return "";
    if (isArabic && therapist.full_name_ar) return therapist.full_name_ar;
    return therapist.full_name;
  };

  const getTherapistSpecialty = () => {
    if (!therapist) return "";
    if (isArabic && therapist.specialty_ar) return therapist.specialty_ar;
    return therapist.specialty;
  };

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
      .eq("is_booked", false);

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
      alert(isArabic ? "يجب تسجيل الدخول" : "You must be logged in");
      return;
    }

    const { data: bookingData, error: bookingError } = await supabase
      .from("bookings")
      .insert({
          patient_id: user.id,
          patient_email: user.email,
          therapist_id: therapist.id,
          slot_id: selectedSlot.id,
          therapist_name: getTherapistName(),
          slot_day: selectedSlot.day,
          slot_time: selectedSlot.time,
          price: therapist.price,
          status: "pending",
      })
      .select()
      .single();

    if (bookingError) {
      alert(isArabic ? "خطأ في الحجز" : "Error creating booking");
      console.log(bookingError);
      return;
    }

    await supabase
      .from("availability_slots")
      .update({ is_booked: true })
      .eq("id", selectedSlot.id);

    window.location.href =
      `/payment?bookingId=${bookingData.id}` +
      `&therapist=${encodeURIComponent(getTherapistName())}` +
      `&price=${therapist.price}` +
      `&slot=${encodeURIComponent(
        `${translateDay(selectedSlot.day)} ${selectedSlot.time}`
      )}`;
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-100 p-10">
        <h1 className="mb-4 text-center text-5xl font-bold text-slate-900">
          {isArabic ? "احجز جلسة" : "Book a Session"}
        </h1>

        <p className="mb-10 text-center text-xl text-slate-600">
          {isArabic
            ? "اختر موعداً متاحاً لجلسة العلاج الخاصة بك."
            : "Choose an available time slot for your therapy session."}
        </p>

        <section className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-lg">
          {therapist && (
            <div className="mb-8 rounded-2xl bg-slate-100 p-6">
              <h2 className="text-4xl font-bold text-slate-900">
                {getTherapistName()}
              </h2>

              <p className="mt-3 text-slate-600">
                {getTherapistSpecialty()}
              </p>

              <p className="mt-4 text-3xl font-bold text-slate-900">
                {isArabic
                  ? `${therapist.price.toLocaleString("ar-EG")} دولار / جلسة`
                  : `$${therapist.price}/session`}
              </p>
            </div>
          )}

          <h2 className="mb-6 text-4xl font-bold text-slate-900">
            {isArabic ? "المواعيد المتاحة" : "Available Slots"}
          </h2>

          {slots.length === 0 ? (
            <p className="text-slate-600">
              {isArabic ? "لا توجد مواعيد متاحة." : "No available slots."}
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
                  {translateDay(slot.day)} - {slot.time}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={confirmBooking}
            disabled={!selectedSlot}
            className={`mt-10 w-full rounded-2xl py-4 text-lg font-semibold ${
              selectedSlot
                ? "bg-black text-white"
                : "cursor-not-allowed bg-slate-300 text-slate-500"
            }`}
          >
            {isArabic ? "تأكيد الحجز" : "Confirm Booking"}
          </button>
        </section>
      </main>
    </>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<p className="p-10">Loading booking...</p>}>
      <BookingContent />
    </Suspense>
  );
}
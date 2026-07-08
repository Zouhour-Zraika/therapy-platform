"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "../components/Navbar";
import { Language } from "../lib/translations";

type AvailabilitySlot = {
  id: string;
  slot_date: string | null;
  day: string | null;
  time: string;
};

type Booking = {
  id: string;
  slot_day: string;
  slot_time: string;
  price: number;
  status: string;
  created_at: string;
  patient_email: string | null;
  zoom_start_url: string | null;
};

export default function TherapistDashboard() {
  const [language, setLanguage] = useState<Language>("en");

  const [fullName, setFullName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [bio, setBio] = useState("");
  const [price, setPrice] = useState("");

  const [slotDate, setSlotDate] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language;
    if (savedLanguage) setLanguage(savedLanguage);

    getProfile();
    getSlots();
    getBookings();
  }, []);

  const isArabic = language === "ar";

  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user;
  };

  const formatDate = (date: string | null) => {
    if (!date) return isArabic ? "لا يوجد تاريخ" : "No date";

    return new Date(date).toLocaleDateString(isArabic ? "ar" : "en-US", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDayFromDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
    });
  };

  const getProfile = async () => {
    const user = await getCurrentUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("therapists")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.log("Profile error:", error);
      return;
    }

    if (data) {
      setFullName(data.full_name || "");
      setSpecialty(data.specialty || "");
      setBio(data.bio || "");
      setPrice(data.price?.toString() || "0");
    }
  };

  const saveProfile = async () => {
    if (!fullName.trim()) {
      alert(isArabic ? "يرجى إدخال الاسم الكامل." : "Please enter your full name.");
      return;
    }

    if (!specialty.trim()) {
      alert(isArabic ? "يرجى إدخال التخصص." : "Please enter your specialty.");
      return;
    }

    setLoading(true);

    const user = await getCurrentUser();

    if (!user) {
      alert(isArabic ? "يجب تسجيل الدخول." : "You must be logged in.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("therapists").upsert({
      id: user.id,
      full_name: fullName,
      specialty,
      bio,
    });

    if (error) {
      alert(isArabic ? "خطأ في حفظ الملف الشخصي" : "Error saving profile");
      console.log(error);
    } else {
      alert(isArabic ? "تم حفظ الملف الشخصي بنجاح" : "Profile saved successfully");
      getProfile();
    }

    setLoading(false);
  };

  const getSlots = async () => {
    const user = await getCurrentUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("availability_slots")
      .select("*")
      .eq("therapist_id", user.id)
      .order("slot_date", { ascending: true })
      .order("time", { ascending: true });

    if (error) {
      console.log("Slots error:", error);
      return;
    }

    setSlots(data || []);
  };

  const addSlot = async () => {
    if (!slotDate || !time) {
      alert(isArabic ? "يرجى اختيار التاريخ والوقت" : "Please choose date and time");
      return;
    }

    const user = await getCurrentUser();
    if (!user) return;

    const { error } = await supabase.from("availability_slots").insert({
      therapist_id: user.id,
      slot_date: slotDate,
      day: getDayFromDate(slotDate),
      time,
      is_booked: false,
    });

    if (error) {
      alert(isArabic ? "خطأ في إضافة الموعد" : "Error adding availability");
      console.log(error);
      return;
    }

    setSlotDate("");
    setTime("");
    getSlots();
  };

  const deleteSlot = async (id: string) => {
    const confirmDelete = confirm(
      isArabic ? "هل تريد حذف هذا الموعد؟" : "Delete this availability?"
    );

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("availability_slots")
      .delete()
      .eq("id", id);

    if (error) {
      alert(isArabic ? "خطأ في حذف الموعد" : "Error deleting slot");
      console.log(error);
      return;
    }

    getSlots();
  };

  const getBookings = async () => {
    const user = await getCurrentUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("therapist_id", user.id)
      .eq("status", "paid")
      .order("created_at", { ascending: false });

    if (error) {
      console.log("Bookings error:", error);
      return;
    }

    setBookings(data || []);
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-100 p-10">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          <section className="rounded-3xl bg-white p-10 shadow-xl">
            <h1 className="mb-8 text-5xl font-bold text-slate-900">
              {isArabic ? "الملف الشخصي للمعالج" : "Therapist Profile"}
            </h1>

            <div className="space-y-6">
              <input
                type="text"
                placeholder={isArabic ? "الاسم الكامل" : "Full name"}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 p-4 text-slate-900"
              />

              <input
                type="text"
                placeholder={isArabic ? "التخصص" : "Specialty"}
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 p-4 text-slate-900"
              />

              <textarea
                placeholder={isArabic ? "نبذة" : "Bio"}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="h-40 w-full rounded-2xl border border-slate-300 p-4 text-slate-900"
              />

              <div className="rounded-2xl border border-slate-300 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  {isArabic ? "سعر الجلسة" : "Session Price"}
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  ${price || 0}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  {isArabic
                    ? "يتم تحديد السعر بواسطة الإدارة."
                    : "Price managed by the administrator."}
                </p>
              </div>

              <button
                onClick={saveProfile}
                disabled={loading}
                className="w-full rounded-2xl bg-black py-4 text-lg text-white disabled:bg-slate-400"
              >
                {loading
                  ? isArabic
                    ? "جاري الحفظ..."
                    : "Saving..."
                  : isArabic
                  ? "حفظ الملف الشخصي"
                  : "Save Profile"}
              </button>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-10 shadow-xl">
            <h2 className="mb-8 text-4xl font-bold text-slate-900">
              {isArabic ? "المواعيد المتاحة" : "Availability"}
            </h2>

            <div className="mb-8 space-y-4">
              <input
                type="date"
                value={slotDate}
                onChange={(e) => setSlotDate(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 p-4 text-slate-900"
              />

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
                {isArabic ? "إضافة موعد" : "Add Availability"}
              </button>
            </div>

            <div className="space-y-4">
              {slots.length === 0 ? (
                <p className="text-slate-600">
                  {isArabic ? "لا توجد مواعيد متاحة." : "No availability yet."}
                </p>
              ) : (
                slots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between rounded-2xl bg-slate-100 p-4"
                  >
                    <div>
                      <p className="font-bold text-slate-900">
                        {formatDate(slot.slot_date)}
                      </p>
                      <p className="text-slate-600">{slot.time}</p>
                    </div>

                    <button
                      onClick={() => deleteSlot(slot.id)}
                      className="rounded-xl bg-red-600 px-4 py-2 text-white"
                    >
                      {isArabic ? "حذف" : "Delete"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-3xl bg-white p-10 shadow-xl lg:col-span-2">
            <h2 className="mb-8 text-4xl font-bold text-slate-900">
              {isArabic ? "الجلسات المحجوزة" : "Booked Sessions"}
            </h2>

            {bookings.length === 0 ? (
              <p className="text-slate-600">
                {isArabic ? "لا توجد حجوزات مدفوعة بعد." : "No paid bookings yet."}
              </p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="rounded-2xl bg-slate-100 p-6"
                  >
                    <p className="text-2xl font-bold text-slate-900">
                      {booking.slot_day} at {booking.slot_time}
                    </p>

                    <p className="mt-3 text-slate-700">
                      {isArabic ? "السعر" : "Price"}: ${booking.price}
                    </p>

                    <p className="mt-2 text-slate-700">
                      {isArabic ? "بريد المريض" : "Patient Email"}:{" "}
                      <span className="font-semibold">
                        {booking.patient_email || "Unknown"}
                      </span>
                    </p>

                    <p className="mt-2 font-bold text-green-700">
                      {isArabic ? "الحالة" : "Status"}: {booking.status}
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      {isArabic ? "تم الإنشاء" : "Created"}:{" "}
                      {new Date(booking.created_at).toLocaleString()}
                    </p>

                    {booking.zoom_start_url ? (
                      <a
                        href={booking.zoom_start_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-5 block w-full rounded-2xl bg-black py-3 text-center text-white"
                      >
                        {isArabic ? "بدء جلسة زووم" : "Start Zoom Session"}
                      </a>
                    ) : (
                      <button className="mt-5 w-full rounded-2xl bg-slate-400 py-3 text-white">
                        {isArabic ? "زووم غير جاهز" : "Zoom Not Ready"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
"use client";

import Image from "next/image";
import { ChangeEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "../components/Navbar";
import { Language } from "../lib/translations";
import ProtectedRoute from "../components/ProtectedRoute";

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

type TherapistProfile = {
  full_name: string | null;
  specialty: string | null;
  professional_title: string | null;
  experience_years: number | null;
  bio: string | null;
  education: string | null;
  certifications: string | null;
  therapeutic_approach: string | null;
  services: string | null;
  languages: string | null;
  price: number | null;
  photo_url: string | null;
};

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

export default function TherapistDashboard() {
  const [language, setLanguage] = useState<Language>("en");

  const [fullName, setFullName] = useState("");
  const [professionalTitle, setProfessionalTitle] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [bio, setBio] = useState("");
  const [education, setEducation] = useState("");
  const [certifications, setCertifications] = useState("");
  const [therapeuticApproach, setTherapeuticApproach] = useState("");
  const [services, setServices] = useState("");
  const [languages, setLanguages] = useState("");
  const [price, setPrice] = useState("");

  const [photoUrl, setPhotoUrl] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");

  const [slotDate, setSlotDate] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const isArabic = language === "ar";

  useEffect(() => {
    const savedLanguage = localStorage.getItem(
      "language"
    ) as Language | null;

    if (savedLanguage) {
      setLanguage(savedLanguage);
    }

    void getProfile();
    void getSlots();
    void getBookings();
  }, []);

  useEffect(() => {
    return () => {
      if (photoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user;
  };

  const formatDate = (date: string | null) => {
    if (!date) {
      return isArabic ? "لا يوجد تاريخ" : "No date";
    }

    return new Date(`${date}T12:00:00`).toLocaleDateString(
      isArabic ? "ar" : "en-US",
      {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  const getDayFromDate = (date: string) => {
    return new Date(`${date}T12:00:00`).toLocaleDateString(
      "en-US",
      {
        weekday: "long",
      }
    );
  };

  const getInitial = () => {
    return fullName.trim().charAt(0).toUpperCase() || "A";
  };

  const getProfile = async () => {
    const user = await getCurrentUser();

    if (!user) {
      return;
    }

    const { data, error } = await supabase
      .from("therapists")
      .select(
        `
          full_name,
          specialty,
          professional_title,
          experience_years,
          bio,
          education,
          certifications,
          therapeutic_approach,
          services,
          languages,
          price,
          photo_url
        `
      )
      .eq("id", user.id)
      .single<TherapistProfile>();

    if (error) {
      console.error("Profile error:", error);
      return;
    }

    if (!data) {
      return;
    }

    setFullName(data.full_name || "");
    setSpecialty(data.specialty || "");
    setProfessionalTitle(data.professional_title || "");
    setExperienceYears(data.experience_years?.toString() || "");
    setBio(data.bio || "");
    setEducation(data.education || "");
    setCertifications(data.certifications || "");
    setTherapeuticApproach(data.therapeutic_approach || "");
    setServices(data.services || "");
    setLanguages(data.languages || "");
    setPrice(data.price?.toString() || "0");
    setPhotoUrl(data.photo_url || "");
  };
    const handlePhotoChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      alert(
        isArabic
          ? "يرجى اختيار ملف صورة."
          : "Please select an image file."
      );

      event.target.value = "";
      return;
    }

    if (selectedFile.size > MAX_PHOTO_SIZE) {
      alert(
        isArabic
          ? "يجب ألا يتجاوز حجم الصورة 5 ميغابايت."
          : "The photo must be smaller than 5 MB."
      );

      event.target.value = "";
      return;
    }

    if (photoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotoFile(selectedFile);
    setPhotoPreview(URL.createObjectURL(selectedFile));
  };

  const uploadProfilePhoto = async (userId: string) => {
    if (!photoFile) {
      return photoUrl || null;
    }

    setUploadingPhoto(true);

    try {
      const extension =
        photoFile.name.split(".").pop()?.toLowerCase() || "jpg";

      const filePath = `${userId}/profile-${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("therapist-photos")
        .upload(filePath, photoFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: photoFile.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("therapist-photos")
        .getPublicUrl(filePath);

      return publicUrl;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const saveProfile = async () => {
    if (!fullName.trim()) {
      alert(
        isArabic
          ? "يرجى إدخال الاسم الكامل."
          : "Please enter your full name."
      );
      return;
    }

    if (!professionalTitle.trim()) {
      alert(
        isArabic
          ? "يرجى إدخال المسمى المهني."
          : "Please enter your professional title."
      );
      return;
    }

    if (!specialty.trim()) {
      alert(
        isArabic
          ? "يرجى إدخال التخصص."
          : "Please enter your specialty."
      );
      return;
    }

    const parsedExperience = experienceYears.trim()
      ? Number(experienceYears)
      : null;

    if (
      parsedExperience !== null &&
      (!Number.isInteger(parsedExperience) ||
        parsedExperience < 0 ||
        parsedExperience > 80)
    ) {
      alert(
        isArabic
          ? "يرجى إدخال عدد صحيح صالح لسنوات الخبرة."
          : "Please enter a valid whole number of experience years."
      );
      return;
    }

    setLoading(true);

    try {
      const user = await getCurrentUser();

      if (!user) {
        alert(
          isArabic
            ? "يجب تسجيل الدخول."
            : "You must be logged in."
        );
        return;
      }

      const uploadedPhotoUrl = await uploadProfilePhoto(user.id);

      const { error } = await supabase
        .from("therapists")
        .update({
          full_name: fullName.trim(),
          professional_title: professionalTitle.trim(),
          specialty: specialty.trim(),
          experience_years: parsedExperience,
          bio: bio.trim(),
          education: education.trim(),
          certifications: certifications.trim(),
          therapeutic_approach: therapeuticApproach.trim(),
          services: services.trim(),
          languages: languages.trim(),
          photo_url: uploadedPhotoUrl,
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      setPhotoUrl(uploadedPhotoUrl || "");
      setPhotoFile(null);

      if (photoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreview);
      }

      setPhotoPreview("");

      alert(
        isArabic
          ? "تم حفظ الملف الشخصي بنجاح."
          : "Profile saved successfully."
      );

      await getProfile();
    } catch (error) {
      console.error("Profile save error:", error);

      alert(
        isArabic
          ? "تعذر حفظ الملف الشخصي."
          : "Unable to save the profile."
      );
    } finally {
      setLoading(false);
      setUploadingPhoto(false);
    }
  };

  const getSlots = async () => {
    const user = await getCurrentUser();

    if (!user) {
      return;
    }

    const { data, error } = await supabase
      .from("availability_slots")
      .select("*")
      .eq("therapist_id", user.id)
      .order("slot_date", { ascending: true })
      .order("time", { ascending: true });

    if (error) {
      console.error("Slots error:", error);
      return;
    }

    setSlots((data as AvailabilitySlot[]) || []);
  };

  const addSlot = async () => {
    if (!slotDate || !time) {
      alert(
        isArabic
          ? "يرجى اختيار التاريخ والوقت."
          : "Please choose a date and time."
      );
      return;
    }

    const user = await getCurrentUser();

    if (!user) {
      return;
    }

    const { error } = await supabase
      .from("availability_slots")
      .insert({
        therapist_id: user.id,
        slot_date: slotDate,
        day: getDayFromDate(slotDate),
        time,
        is_booked: false,
      });

    if (error) {
      console.error("Availability creation error:", error);

      alert(
        isArabic
          ? "تعذرت إضافة الموعد."
          : "Unable to add availability."
      );
      return;
    }

    setSlotDate("");
    setTime("");

    await getSlots();
  };
    const deleteSlot = async (id: string) => {
    const confirmed = window.confirm(
      isArabic
        ? "هل تريد حذف هذا الموعد؟"
        : "Delete this availability?"
    );

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("availability_slots")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Slot deletion error:", error);

      alert(
        isArabic
          ? "تعذر حذف الموعد."
          : "Unable to delete the availability."
      );
      return;
    }

    await getSlots();
  };

  const getBookings = async () => {
    const user = await getCurrentUser();

    if (!user) {
      return;
    }

    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("therapist_id", user.id)
      .eq("status", "paid")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Bookings error:", error);
      return;
    }

    setBookings((data as Booking[]) || []);
  };

  const displayedPhoto = photoPreview || photoUrl;
  const isSaving = loading || uploadingPhoto;

  return (
    <ProtectedRoute allowedRoles={["therapist"]}>
      <>
        <Navbar />

        <main
          dir={isArabic ? "rtl" : "ltr"}
          className="min-h-screen bg-aan-background px-5 py-10 sm:px-8 lg:px-10"
        >
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
            <section className="aan-card p-7 sm:p-10 lg:col-span-2">
              <p className="text-sm font-bold uppercase tracking-[0.26em] text-aan-gold">
                AAN Psychotherapy
              </p>

              <h1 className="aan-heading mt-4 text-4xl sm:text-5xl">
                {isArabic
                  ? "الملف المهني للمعالج"
                  : "Professional Therapist Profile"}
              </h1>

              <p className="mt-5 max-w-3xl leading-8 text-aan-secondary">
                {isArabic
                  ? "أكمل معلوماتك المهنية. ستظهر هذه المعلومات للزوار في صفحة المعالجين."
                  : "Complete your professional information. These details will appear on the public therapists page."}
              </p>
            </section>

            <section className="aan-card p-7 sm:p-10">
              <h2 className="aan-heading text-3xl">
                {isArabic ? "الصورة والمعلومات الأساسية" : "Photo and Basic Information"}
              </h2>

              <div className="mt-8 flex flex-col items-center">
                <div className="relative h-40 w-40 overflow-hidden rounded-full border-2 border-aan-gold bg-[#f8f4ee] shadow-[var(--aan-shadow-md)]">
                  {displayedPhoto ? (
                    <Image
                      src={displayedPhoto}
                      alt={
                        fullName ||
                        (isArabic
                          ? "صورة المعالج"
                          : "Therapist photo")
                      }
                      fill
                      sizes="160px"
                      className="object-cover"
                      unoptimized={displayedPhoto.startsWith("blob:")}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#f8f4ee_0%,#edf3f9_100%)]">
                      <span className="text-5xl font-bold text-aan-button">
                        {getInitial()}
                      </span>
                    </div>
                  )}
                </div>

                <label className="mt-5 inline-flex cursor-pointer items-center justify-center rounded-xl border-2 border-aan-gold bg-white px-5 py-3 font-bold text-aan-navy transition hover:bg-aan-gold hover:text-white">
                  {isArabic
                    ? "اختيار صورة"
                    : "Choose Profile Photo"}

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>

                <p className="mt-3 text-center text-sm text-aan-secondary">
                  {isArabic
                    ? "JPG أو PNG أو WebP، بحد أقصى 5 ميغابايت."
                    : "JPG, PNG or WebP, maximum 5 MB."}
                </p>
              </div>

              <div className="mt-8 space-y-5">
                <label className="grid gap-2 font-bold text-aan-navy">
                  {isArabic ? "الاسم الكامل" : "Full name"}

                  <input
                    type="text"
                    value={fullName}
                    onChange={(event) =>
                      setFullName(event.target.value)
                    }
                    className="aan-field p-4 font-normal"
                  />
                </label>

                <label className="grid gap-2 font-bold text-aan-navy">
                  {isArabic
                    ? "المسمى المهني"
                    : "Professional title"}

                  <input
                    type="text"
                    value={professionalTitle}
                    onChange={(event) =>
                      setProfessionalTitle(event.target.value)
                    }
                    placeholder={
                      isArabic
                        ? "مثال: معالج نفسي سريري"
                        : "Example: Clinical Psychotherapist"
                    }
                    className="aan-field p-4 font-normal"
                  />
                </label>

                <label className="grid gap-2 font-bold text-aan-navy">
                  {isArabic ? "التخصص" : "Specialty"}

                  <input
                    type="text"
                    value={specialty}
                    onChange={(event) =>
                      setSpecialty(event.target.value)
                    }
                    placeholder={
                      isArabic
                        ? "مثال: العلاج النفسي التكاملي"
                        : "Example: Integrative psychotherapy"
                    }
                    className="aan-field p-4 font-normal"
                  />
                </label>

                <label className="grid gap-2 font-bold text-aan-navy">
                  {isArabic
                    ? "سنوات الخبرة"
                    : "Years of experience"}

                  <input
                    type="number"
                    min="0"
                    max="80"
                    step="1"
                    value={experienceYears}
                    onChange={(event) =>
                      setExperienceYears(event.target.value)
                    }
                    className="aan-field p-4 font-normal"
                  />
                </label>
              </div>
            </section>
                        <section className="aan-card p-7 sm:p-10">
              <h2 className="aan-heading text-3xl">
                {isArabic
                  ? "التعريف والخبرة المهنية"
                  : "Biography and Professional Experience"}
              </h2>

              <div className="mt-8 space-y-6">
                <label className="grid gap-2 font-bold text-aan-navy">
                  {isArabic ? "نبذة مهنية" : "Professional biography"}

                  <textarea
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                    placeholder={
                      isArabic
                        ? "اكتب نبذة مفصلة عن خبرتك، والفئات التي تعمل معها، والمشكلات التي تعالجها..."
                        : "Describe your experience, the people you work with and the challenges you treat..."
                    }
                    className="aan-field min-h-64 resize-y p-4 font-normal leading-7"
                  />
                </label>

                <label className="grid gap-2 font-bold text-aan-navy">
                  {isArabic
                    ? "التعليم والمؤهلات"
                    : "Education and qualifications"}

                  <textarea
                    value={education}
                    onChange={(event) =>
                      setEducation(event.target.value)
                    }
                    placeholder={
                      isArabic
                        ? "مثال: ماجستير في علم النفس السريري..."
                        : "Example: Master's degree in Clinical Psychology..."
                    }
                    className="aan-field min-h-32 resize-y p-4 font-normal leading-7"
                  />
                </label>

                <label className="grid gap-2 font-bold text-aan-navy">
                  {isArabic
                    ? "التدريبات والشهادات"
                    : "Training and certifications"}

                  <textarea
                    value={certifications}
                    onChange={(event) =>
                      setCertifications(event.target.value)
                    }
                    placeholder={
                      isArabic
                        ? "اكتب كل تدريب أو شهادة في سطر منفصل."
                        : "Enter each training or certification on a separate line."
                    }
                    className="aan-field min-h-40 resize-y p-4 font-normal leading-7"
                  />
                </label>

                <label className="grid gap-2 font-bold text-aan-navy">
                  {isArabic
                    ? "النهج العلاجي"
                    : "Therapeutic approach"}

                  <textarea
                    value={therapeuticApproach}
                    onChange={(event) =>
                      setTherapeuticApproach(event.target.value)
                    }
                    placeholder={
                      isArabic
                        ? "اشرح أسلوبك العلاجي وكيف تعمل مع العملاء."
                        : "Explain your therapeutic style and how you work with clients."
                    }
                    className="aan-field min-h-48 resize-y p-4 font-normal leading-7"
                  />
                </label>
              </div>
            </section>

            <section className="aan-card p-7 sm:p-10">
              <h2 className="aan-heading text-3xl">
                {isArabic
                  ? "الخدمات واللغات"
                  : "Services and Languages"}
              </h2>

              <div className="mt-8 space-y-6">
                <label className="grid gap-2 font-bold text-aan-navy">
                  {isArabic ? "الخدمات" : "Services"}

                  <textarea
                    value={services}
                    onChange={(event) =>
                      setServices(event.target.value)
                    }
                    placeholder={
                      isArabic
                        ? "اكتب كل خدمة في سطر منفصل، مثل:\nالعلاج الفردي\nعلاج الأزواج\nالعلاج الأسري"
                        : "Enter one service per line, for example:\nIndividual Therapy\nCouples Therapy\nFamily Therapy"
                    }
                    className="aan-field min-h-52 resize-y p-4 font-normal leading-8"
                  />
                </label>

                <label className="grid gap-2 font-bold text-aan-navy">
                  {isArabic ? "اللغات" : "Languages"}

                  <textarea
                    value={languages}
                    onChange={(event) =>
                      setLanguages(event.target.value)
                    }
                    placeholder={
                      isArabic
                        ? "اكتب كل لغة في سطر منفصل."
                        : "Enter one language per line."
                    }
                    className="aan-field min-h-32 resize-y p-4 font-normal leading-8"
                  />
                </label>

                <div className="rounded-2xl border border-aan-border bg-[#f8f4ee] p-5">
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-aan-gold">
                    {isArabic ? "سعر الجلسة" : "Session Price"}
                  </p>

                  <p className="mt-2 text-3xl font-bold text-aan-navy">
                    ${price || 0}
                  </p>

                  <p className="mt-2 text-sm text-aan-secondary">
                    {isArabic
                      ? "يتم تحديد السعر بواسطة الإدارة."
                      : "Price managed by the administrator."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={isSaving}
                  className="aan-button w-full py-4 text-lg disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving
                    ? isArabic
                      ? "جارٍ الحفظ..."
                      : "Saving..."
                    : isArabic
                      ? "حفظ الملف المهني"
                      : "Save Professional Profile"}
                </button>
              </div>
            </section>

            <section className="aan-card p-7 sm:p-10">
              <h2 className="aan-heading text-3xl sm:text-4xl">
                {isArabic ? "المواعيد المتاحة" : "Availability"}
              </h2>

              <div className="mt-8 space-y-4">
                <input
                  type="date"
                  value={slotDate}
                  onChange={(event) =>
                    setSlotDate(event.target.value)
                  }
                  className="aan-field p-4"
                />

                <input
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  className="aan-field p-4"
                />

                <button
                  type="button"
                  onClick={addSlot}
                  className="aan-button w-full py-4 text-lg"
                >
                  {isArabic
                    ? "إضافة موعد"
                    : "Add Availability"}
                </button>
              </div>

              <div className="mt-8 space-y-4">
                {slots.length === 0 ? (
                  <p className="text-aan-secondary">
                    {isArabic
                      ? "لا توجد مواعيد متاحة."
                      : "No availability yet."}
                  </p>
                ) : (
                  slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-aan-border bg-[#fbf8f3] p-4"
                    >
                      <div>
                        <p className="font-bold text-aan-navy">
                          {formatDate(slot.slot_date)}
                        </p>

                        <p className="mt-1 text-aan-secondary">
                          {slot.time}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteSlot(slot.id)}
                        className="rounded-xl border border-red-200 bg-white px-4 py-2 font-semibold text-red-700 transition hover:bg-red-50"
                      >
                        {isArabic ? "حذف" : "Delete"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
                        <section className="aan-card p-7 sm:p-10">
              <h2 className="aan-heading text-3xl sm:text-4xl">
                {isArabic ? "الجلسات المحجوزة" : "Booked Sessions"}
              </h2>

              {bookings.length === 0 ? (
                <p className="mt-8 text-aan-secondary">
                  {isArabic
                    ? "لا توجد حجوزات مدفوعة بعد."
                    : "No paid bookings yet."}
                </p>
              ) : (
                <div className="mt-8 grid gap-6">
                  {bookings.map((booking) => (
                    <article
                      key={booking.id}
                      className="rounded-2xl border border-aan-border bg-[#fbf8f3] p-6"
                    >
                      <h3 className="text-2xl font-bold text-aan-navy">
                        {booking.slot_day} at {booking.slot_time}
                      </h3>

                      <p className="mt-4 text-aan-secondary">
                        {isArabic ? "السعر" : "Price"}: $
                        {booking.price}
                      </p>

                      <p className="mt-2 break-words text-aan-secondary">
                        {isArabic
                          ? "بريد المريض"
                          : "Patient Email"}
                        :{" "}
                        <span className="font-semibold text-aan-navy">
                          {booking.patient_email ||
                            (isArabic ? "غير معروف" : "Unknown")}
                        </span>
                      </p>

                      <p className="mt-2 font-bold text-green-700">
                        {isArabic ? "الحالة" : "Status"}:{" "}
                        {booking.status}
                      </p>

                      <p className="mt-2 text-sm text-aan-secondary">
                        {isArabic ? "تم الإنشاء" : "Created"}:{" "}
                        {new Date(
                          booking.created_at
                        ).toLocaleString(
                          isArabic ? "ar" : "en-US"
                        )}
                      </p>

                      {booking.zoom_start_url ? (
                        <a
                          href={booking.zoom_start_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="aan-button mt-5 flex w-full py-3"
                        >
                          {isArabic
                            ? "بدء جلسة زووم"
                            : "Start Zoom Session"}
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="mt-5 w-full rounded-2xl bg-slate-300 py-3 font-semibold text-white"
                        >
                          {isArabic
                            ? "زووم غير جاهز"
                            : "Zoom Not Ready"}
                        </button>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </>
    </ProtectedRoute>
  );
}
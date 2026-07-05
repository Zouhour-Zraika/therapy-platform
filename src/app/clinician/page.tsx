"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { supabase } from "@/lib/supabase";
import { translations, Language } from "../lib/translations";

export default function ClinicianPage() {
  const router = useRouter();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [fullName, setFullName] = useState("");
  const [applicationEmail, setApplicationEmail] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [message, setMessage] = useState("");

  const handleClinicianLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      alert(error.message);
      return;
    }

    const user = data.user;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      alert("Profile not found.");
      return;
    }

    if (profile.role === "admin") {
      router.push("/admin");
      return;
    }

    if (profile.role === "therapist") {
      router.push("/therapist-dashboard");
      return;
    }

    alert("This portal is only for clinicians and administrators.");
    await supabase.auth.signOut();
  };

  const submitApplication = async () => {
    if (!fullName || !applicationEmail) {
      alert("Full name and email are required.");
      return;
    }

    const { error } = await supabase.from("therapist_applications").insert({
      full_name: fullName,
      email: applicationEmail,
      specialty,
      message,
      status: "pending",
    });

    if (error) {
      alert("Application could not be submitted.");
      console.log(error);
      return;
    }

    alert("Application submitted. The admin team will review it.");

    setFullName("");
    setApplicationEmail("");
    setSpecialty("");
    setMessage("");
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-100 p-10">
        <section className="mx-auto mb-10 max-w-6xl rounded-3xl bg-white p-10 text-center shadow-xl">
          <h1 className="text-6xl font-bold text-slate-900">
            Clinician Portal
          </h1>

          <p className="mx-auto mt-5 max-w-3xl text-xl text-slate-600">
            Secure access for approved therapists and platform administrators.
            New clinicians can submit an application for review.
          </p>
        </section>

        <section className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-8 shadow-xl">
            <h2 className="mb-6 text-4xl font-bold text-slate-900">
              Approved Clinician Login
            </h2>

            <input
              type="email"
              placeholder="Email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="mb-4 w-full rounded-2xl border border-slate-300 px-4 py-4 text-slate-900"
            />

            <input
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="mb-3 w-full rounded-2xl border border-slate-300 px-4 py-4 text-slate-900"
            />

            <div className="mb-6 text-right">
              <Link
                href="/forgot-password"
                className="text-sm font-semibold text-slate-600 hover:text-black"
              >
                Forgot password?
              </Link>
            </div>

            <button
              onClick={handleClinicianLogin}
              className="w-full rounded-2xl bg-black py-4 text-lg font-semibold text-white"
            >
              Sign In
            </button>

            <p className="mt-5 text-center text-sm text-slate-500">
              This area is for approved therapists and admins only.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-xl">
            <h2 className="mb-6 text-4xl font-bold text-slate-900">
              Apply as a Therapist
            </h2>

            <input
              type="text"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mb-4 w-full rounded-2xl border border-slate-300 px-4 py-4 text-slate-900"
            />

            <input
              type="email"
              placeholder="Professional email"
              value={applicationEmail}
              onChange={(e) => setApplicationEmail(e.target.value)}
              className="mb-4 w-full rounded-2xl border border-slate-300 px-4 py-4 text-slate-900"
            />

            <input
              type="text"
              placeholder="Specialty"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="mb-4 w-full rounded-2xl border border-slate-300 px-4 py-4 text-slate-900"
            />

            <textarea
              placeholder="Tell us briefly about your background"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mb-6 h-36 w-full rounded-2xl border border-slate-300 px-4 py-4 text-slate-900"
            />

            <button
              onClick={submitApplication}
              className="w-full rounded-2xl bg-black py-4 text-lg font-semibold text-white"
            >
              Submit Application
            </button>

            <p className="mt-5 text-center text-sm text-slate-500">
              Applications are reviewed by platform admins before access is
              granted.
            </p>
          </div>
        </section>

        <div className="mt-10 text-center">
          <Link href="/login" className="text-slate-600 underline">
            Patient access
          </Link>
        </div>
      </main>
    </>
  );
}
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"patient" | "therapist">("patient");

  async function handleSignup() {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    if (data.user) {
      await supabase.from("profiles").insert({
        id: data.user.id,
        email,
        role,
      });
    }

    alert("Account created. Check your email to confirm.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-4xl font-bold text-slate-900">
          Create Account
        </h1>

        <input
          className="mb-4 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900"
          placeholder="Email"
          type="email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="mb-4 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900"
          placeholder="Password"
          type="password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "patient" | "therapist")}
          className="mb-6 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900"
        >
          <option value="patient">Patient</option>
          <option value="therapist">Therapist</option>
        </select>

        <button
          onClick={handleSignup}
          className="w-full rounded-2xl bg-black py-3 text-white"
        >
          Sign Up
        </button>
      </section>
    </main>
  );
}
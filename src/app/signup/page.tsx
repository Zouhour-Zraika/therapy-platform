"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { translations, Language } from "../lib/translations";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: data.user.id,
          email,
          role: "patient",
        });

      if (profileError) {
        console.log(profileError);
        alert("Account created, but profile was not saved.");
        return;
      }
    }

    alert("Account created. Check your email to confirm.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-lg">
        <h1 className="mb-3 text-center text-4xl font-bold text-slate-900">
          Create Patient Account
        </h1>

        <p className="mb-6 text-center text-slate-600">
          Create an account to book and manage therapy sessions.
        </p>

        <input
          className="mb-4 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900"
          placeholder="Email"
          type="email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="mb-6 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900"
          placeholder="Password"
          type="password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleSignup}
          className="w-full rounded-2xl bg-black py-3 text-white"
        >
          Sign Up
        </button>

        <p className="mt-5 text-center text-sm text-slate-500">
          Therapists are added by platform admins only.
        </p>
      </section>
    </main>
  );
}
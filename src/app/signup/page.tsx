"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      alert("Please enter your full name.");
      return;
    }

    if (!cleanEmail) {
      alert("Please enter your email.");
      return;
    }

    if (!password) {
      alert("Please enter a password.");
      return;
    }

    if (password.length < 8) {
      alert("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            role: "patient",
          },
        },
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
            email: cleanEmail,
            full_name: cleanName,
            role: "patient",
          });

        if (profileError) {
          console.error(
            "Patient profile save error:",
            profileError,
          );

          alert(
            "Account created, but the patient profile could not be saved.",
          );

          return;
        }
      }

      alert(
        "Account created successfully. Please check your email to confirm your account.",
      );

      setFullName("");
      setEmail("");
      setPassword("");
    } catch (error) {
      console.error("Patient signup error:", error);

      alert(
        "Unable to create the account. Please try again.",
      );
    } finally {
      setLoading(false);
    }
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
          placeholder="Full name"
          type="text"
          autoComplete="name"
          value={fullName}
          onChange={(e) =>
            setFullName(e.target.value)
          }
        />

        <input
          className="mb-4 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900"
          placeholder="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <input
          className="mb-6 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900"
          placeholder="Password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />

        <button
          type="button"
          onClick={() => void handleSignup()}
          disabled={loading}
          className="w-full rounded-2xl bg-black py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Creating account..."
            : "Sign Up"}
        </button>

        <p className="mt-5 text-center text-sm text-slate-500">
          Therapists are added by platform admins only.
        </p>
      </section>
    </main>
  );
}
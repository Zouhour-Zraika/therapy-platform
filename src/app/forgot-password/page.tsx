"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");

  const handleReset = async () => {
    if (!email) {
      alert("Please enter your email.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://therapy-platform-beige.vercel.app/reset-password",
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Password reset link sent. Please check your email.");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <section className="w-full max-w-md rounded-3xl bg-white p-10 shadow-lg">
        <h1 className="mb-4 text-center text-4xl font-bold text-slate-900">
          Forgot Password
        </h1>

        <p className="mb-6 text-center text-slate-600">
          Enter your email and we will send you a password reset link.
        </p>

        <input
          type="email"
          placeholder="Email"
          className="mb-4 w-full rounded-2xl border border-slate-300 px-4 py-4 text-slate-900"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={handleReset}
          className="w-full rounded-2xl bg-black py-4 text-lg font-semibold text-white"
        >
          Send Reset Link
        </button>

        <p className="mt-5 text-center text-slate-600">
          Remember your password?{" "}
          <Link href="/login" className="font-semibold text-black underline">
            Back to login
          </Link>
        </p>
      </section>
    </main>
  );
}
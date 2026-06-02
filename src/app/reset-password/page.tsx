"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleUpdatePassword = async () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Password updated successfully.");

    router.push("/login");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <section className="w-full max-w-md rounded-3xl bg-white p-10 shadow-lg">
        <h1 className="mb-6 text-center text-4xl font-bold text-slate-900">
          Reset Password
        </h1>

        <input
          type="password"
          placeholder="New Password"
          className="mb-4 w-full rounded-2xl border border-slate-300 px-4 py-4 text-slate-900"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Confirm Password"
          className="mb-6 w-full rounded-2xl border border-slate-300 px-4 py-4 text-slate-900"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button
          onClick={handleUpdatePassword}
          className="w-full rounded-2xl bg-black py-4 text-lg font-semibold text-white"
        >
          Update Password
        </button>
      </section>
    </main>
  );
}
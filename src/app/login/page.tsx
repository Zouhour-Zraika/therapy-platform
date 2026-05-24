"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
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

    if (profileError) {
      console.log(profileError);
      alert("Profile not found.");
      return;
    }

    alert("Login successful!");

    if (profile?.role === "admin") {
      router.push("/admin-podcasts");
    } else if (profile?.role === "therapist") {
      router.push("/therapist-dashboard");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-full max-w-md rounded-3xl bg-white p-10 shadow-lg">
        <h1 className="mb-8 text-center text-5xl font-bold text-slate-900">
          Login
        </h1>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-2xl border border-slate-300 px-4 py-4 text-slate-900"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-2xl border border-slate-300 px-4 py-4 text-slate-900"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={handleLogin}
            className="w-full rounded-2xl bg-black py-4 text-lg font-semibold text-white"
          >
            Login
          </button>

          <p className="text-center text-slate-600">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-black underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
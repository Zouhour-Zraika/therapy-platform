"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();

    alert("Logged out");

    router.push("/login");
  };

  return (
    <nav className="flex items-center justify-between px-10 py-6">
      <Link
        href="/"
        className="text-3xl font-bold text-slate-900"
      >
        TheraCare
      </Link>

      <div className="flex gap-6 text-slate-900">
        <Link href="/">Home</Link>

        <Link href="/therapists">Therapists</Link>

        <Link href="/session">Session</Link>

        <button
          onClick={handleLogout}
          className="rounded-xl bg-black px-4 py-2 text-white"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
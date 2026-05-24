"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { supabase } from "@/lib/supabase";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      router.push("/");
      return;
    }

    setAllowed(true);
    setLoading(false);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-slate-100 p-10">
          <p className="text-2xl text-slate-700">Loading admin...</p>
        </main>
      </>
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
}
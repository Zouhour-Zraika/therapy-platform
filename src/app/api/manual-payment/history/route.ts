import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) throw new Error("Missing Supabase configuration");
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: { user }, error: authError } = await supabase.auth.getUser(authorization.slice(7).trim());
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profileError) throw profileError;
    if (profile?.role !== "patient") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { data, error } = await supabase.from("manual_payment_declarations")
      .select("id, booking_id, provider, status, amount, currency, transaction_reference, submitted_at, patient_note")
      .eq("patient_id", user.id)
      .in("provider", ["omt", "whish"])
      .order("submitted_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ declarations: data || [] }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Patient transfer history error:", error);
    return NextResponse.json({ error: "Unable to load transfer history" }, { status: 500 });
  }
}

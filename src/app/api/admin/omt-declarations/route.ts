import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ALLOWED_STATUSES = [
  "submitted",
  "under_review",
  "approved",
  "rejected",
  "expired",
] as const;

function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase server configuration is missing.");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export async function GET(request: Request) {
  try {
    const supabase = createSupabaseAdmin();
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const token = authorization.slice("Bearer ".length).trim();

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Invalid or expired session." },
        { status: 401 },
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle<{ role: string | null }>();

    if (profileError) {
      console.error("OMT admin role verification error:", profileError);
      return NextResponse.json(
        { error: "Unable to verify administrator access." },
        { status: 500 },
      );
    }

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 },
      );
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status")?.trim() || "";
    const pageText = url.searchParams.get("page") || "1";
    const page = Number(pageText);

    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      page > 10000
    ) {
      return NextResponse.json(
        { error: "Invalid page number." },
        { status: 400 },
      );
    }

    if (
      status &&
      !ALLOWED_STATUSES.some((allowed) => allowed === status)
    ) {
      return NextResponse.json(
        { error: "Invalid declaration status." },
        { status: 400 },
      );
    }

    const pageSize = 25;
    const start = (page - 1) * pageSize;

    let query = supabase
      .from("manual_payment_declarations")
      .select(
        `
          id,
          booking_id,
          patient_id,
          provider,
          status,
          amount,
          currency,
          transaction_reference,
          patient_note,
          submitted_at,
          reviewed_at,
          reviewed_by,
          admin_note,
          created_at,
          updated_at
        `,
        { count: "exact" },
      )
      .eq("provider", "omt");

    if (status) {
      query = query.eq("status", status);
    }

    const { data, count, error } = await query
      .order("submitted_at", { ascending: false })
      .order("id", { ascending: false })
      .range(start, start + pageSize - 1);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      declarations: data || [],
      page,
      pageSize,
      total: count ?? 0,
      hasMore: start + pageSize < (count ?? 0),
    });
  } catch (error) {
    console.error("OMT declarations admin GET error:", error);
    return NextResponse.json(
      { error: "Unable to load OMT declarations." },
      { status: 500 },
    );
  }
}

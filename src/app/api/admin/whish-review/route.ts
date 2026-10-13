import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ReviewBody = {
  declarationId?: unknown;
  decision?: unknown;
  adminNote?: unknown;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase server configuration is missing.");

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const token = authorization.slice(7).trim();
    if (!token) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const supabase = createSupabaseAdmin();
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: "Invalid or expired session." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle<{ role: string | null }>();

    if (profileError) {
      console.error("Whish admin profile lookup failed:", profileError);
      return NextResponse.json({ error: "Unable to verify administrator access." }, { status: 500 });
    }
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    let body: ReviewBody;
    try {
      body = (await request.json()) as ReviewBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const { declarationId, decision, adminNote } = body;
    if (typeof declarationId !== "string" || !UUID_PATTERN.test(declarationId)) {
      return NextResponse.json({ error: "Invalid declaration identifier." }, { status: 400 });
    }
    if (decision !== "approved" && decision !== "rejected") {
      return NextResponse.json({ error: "Decision must be approved or rejected." }, { status: 400 });
    }
    if (adminNote !== undefined && adminNote !== null && typeof adminNote !== "string") {
      return NextResponse.json({ error: "Invalid administrator note." }, { status: 400 });
    }

    const note = typeof adminNote === "string" ? adminNote.trim() : null;
    if (note && note.length > 2000) {
      return NextResponse.json({ error: "Administrator note is too long." }, { status: 400 });
    }

    // The database function must independently verify administrator rights and Whish provider.
    const { data, error } = await supabase.rpc("review_whish_payment_declaration", {
      p_declaration_id: declarationId,
      p_admin_id: user.id,
      p_decision: decision,
      p_admin_note: note,
    });

    if (error) {
      const knownConflicts = [
        "DECLARATION_ALREADY_REVIEWED", "BOOKING_NOT_ELIGIBLE",
        "REFERENCE_ALREADY_APPROVED", "AMOUNT_MISMATCH",
      ];
      const notFound = ["DECLARATION_NOT_FOUND", "BOOKING_NOT_FOUND"];
      const knownBadRequests = ["INVALID_IDENTIFIERS", "INVALID_DECISION", "ADMIN_NOTE_TOO_LONG"];
      const code = [...knownConflicts, ...notFound, ...knownBadRequests, "ADMIN_ACCESS_REQUIRED"]
        .find((value) => error.message.includes(value));

      if (!code) console.error("Whish admin review RPC failed:", error);
      const status = knownConflicts.includes(code || "") ? 409
        : notFound.includes(code || "") ? 404
        : knownBadRequests.includes(code || "") ? 400
        : code === "ADMIN_ACCESS_REQUIRED" ? 403 : 500;

      return NextResponse.json({ error: code || "Unable to review Whish declaration." }, { status });
    }

    const review = Array.isArray(data) ? data[0] : null;
    if (!review) return NextResponse.json({ error: "Review result was empty." }, { status: 500 });

    return NextResponse.json({
      success: true,
      review,
      bookingConfirmed: false,
      paymentVerified: decision === "approved",
      nextStep: "booking_fulfillment_pending",
    });
  } catch (error) {
    console.error("Whish admin review unexpected error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

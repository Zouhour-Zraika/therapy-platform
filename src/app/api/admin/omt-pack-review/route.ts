// TEST: Admin review for OMT Patient Packs only. Existing booking route is unchanged.
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Supabase server configuration missing");
    const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const token = authorization.slice(7).trim();
    if (!token) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const { data: { user }, error: authError } = await db.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    const { data: profile, error: profileError } = await db.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profileError) throw profileError;
    if (profile?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    const input = body as Record<string, unknown>;
    const declarationId = input.declarationId;
    const decision = input.decision;
    const adminNote = input.adminNote;
    if (typeof declarationId !== "string" || !UUID.test(declarationId)) return NextResponse.json({ error: "Invalid declaration identifier." }, { status: 400 });
    if (decision !== "approved" && decision !== "rejected") return NextResponse.json({ error: "Invalid decision." }, { status: 400 });
    if (adminNote != null && typeof adminNote !== "string") return NextResponse.json({ error: "Invalid administrator note." }, { status: 400 });
    const note = typeof adminNote === "string" ? adminNote.trim() : null;
    if (note && note.length > 2000) return NextResponse.json({ error: "Administrator note is too long." }, { status: 400 });
    const { data, error } = await db.rpc("review_omt_patient_pack_declaration", {
      p_declaration_id: declarationId,
      p_admin_id: user.id,
      p_decision: decision,
      p_admin_note: note || null,
    });
    if (error) {
      const conflicts = ["DECLARATION_ALREADY_REVIEWED", "PACK_NOT_ELIGIBLE", "REFERENCE_ALREADY_APPROVED", "AMOUNT_MISMATCH", "ASSIGNMENT_CONFLICT", "PACK_SETTINGS_INVALID", "INVALID_REFERENCE"];
      const missing = ["DECLARATION_NOT_FOUND", "PACK_NOT_FOUND"];
      const bad = ["INVALID_IDENTIFIERS", "INVALID_DECISION", "ADMIN_NOTE_TOO_LONG"];
      const code = [...conflicts, ...missing, ...bad, "ADMIN_ACCESS_REQUIRED"].find(v => error.message.includes(v));
      if (!code) console.error("Pack OMT review RPC error", error);
      return NextResponse.json({ error: code || "Unable to review Pack OMT declaration.", code: code || undefined }, {
        status: conflicts.includes(code || "") ? 409 : missing.includes(code || "") ? 404 : bad.includes(code || "") ? 400 : code === "ADMIN_ACCESS_REQUIRED" ? 403 : 500,
      });
    }
    const review = Array.isArray(data) ? data[0] : null;
    if (!review) return NextResponse.json({ error: "Review result was empty." }, { status: 500 });
    return NextResponse.json({ success: true, review, packActivated: decision === "approved", paymentVerified: decision === "approved" });
  } catch (error) {
    console.error("Pack OMT admin review error", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

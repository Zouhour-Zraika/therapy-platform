// TEST ONLY — Patient Pack OMT declaration. Does not change booking OMT or Stripe.
// Requires a dedicated, transactional Supabase RPC before this endpoint can succeed.
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function serverClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase server configuration is missing.");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization") || "";
    if (!authorization.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Patient authentication required." }, { status: 401 });
    }
    const token = authorization.slice(7).trim();
    if (!token) return NextResponse.json({ error: "Patient authentication required." }, { status: 401 });

    const db = serverClient();
    const { data: { user }, error: authError } = await db.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Patient authentication required." }, { status: 401 });
    }
    const { data: profile, error: profileError } = await db
      .from("profiles").select("role").eq("id", user.id).maybeSingle<{ role: string | null }>();
    if (profileError) throw profileError;
    if (profile?.role !== "patient") {
      return NextResponse.json({ error: "Patient account required." }, { status: 403 });
    }

    const raw: unknown = await request.json().catch(() => null);
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    const body = raw as Record<string, unknown>;
    const therapistId = typeof body.therapistId === "string" ? body.therapistId.trim() : "";
    const serviceId = typeof body.serviceId === "string" ? body.serviceId.trim() : "";
    const reference = typeof body.transactionReference === "string" ? body.transactionReference.trim() : "";
    const note = typeof body.patientNote === "string" ? body.patientNote.trim() : "";
    if (!UUID.test(therapistId) || !UUID.test(serviceId)) {
      return NextResponse.json({ error: "Invalid specialist or service identifier." }, { status: 400 });
    }
    if (!reference || reference.length > 200 || note.length > 2000) {
      return NextResponse.json({ error: "Transaction reference must be 1–200 characters; note maximum is 2000." }, { status: 400 });
    }

    // All sensitive checks and writes MUST happen atomically in this RPC:
    // active specialist, individual service, assignment, authoritative settings/price,
    // existing active/pending packs, duplicate reference, and declaration creation.
    // A missing RPC fails closed (HTTP 503); no client-supplied amount is trusted.
    const { data, error } = await db.rpc("submit_omt_patient_pack_declaration", {
      p_patient_id: user.id,
      p_therapist_id: therapistId,
      p_service_id: serviceId,
      p_transaction_reference: reference,
      p_patient_note: note || null,
    });
    if (error) {
      console.error("Patient Pack OMT declaration RPC failed:", error.code, error.message);
      if (error.code === "PGRST202" || error.code === "42883") {
        return NextResponse.json({ error: "Patient Pack OMT is not configured yet." }, { status: 503 });
      }
      return NextResponse.json({ error: "Unable to submit Patient Pack OMT declaration. Contact AAN if you already transferred money." }, { status: 409 });
    }
    const result = Array.isArray(data) ? data[0] : data;
    if (!result || typeof result !== "object" || !result.declaration_id || !result.pack_id) {
      return NextResponse.json({ error: "Unable to confirm declaration creation." }, { status: 500 });
    }
    return NextResponse.json({
      success: true,
      packId: result.pack_id,
      declarationId: result.declaration_id,
      provider: "omt",
      status: "under_review",
      paymentConfirmed: false,
    }, { status: 201 });
  } catch (error) {
    console.error("Patient Pack OMT declaration error:", error);
    return NextResponse.json({ error: "Unable to submit Patient Pack OMT declaration." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs";

type Language = "fr" | "en" | "ar";
type NotificationType = "patient_confirmation" | "therapist_confirmation" | "payment_receipt";
const TYPES: NotificationType[] = ["patient_confirmation", "therapist_confirmation", "payment_receipt"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function errorResponse(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function languageOf(value: unknown): Language {
  const code = String(value ?? "").toLowerCase();
  if (code.startsWith("ar")) return "ar";
  if (code.startsWith("fr")) return "fr";
  return "en";
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function appointment(value: string | null, language: Language): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(
    language === "fr" ? "fr-FR" : language === "ar" ? "ar-LB" : "en-GB",
    { timeZone: "Asia/Beirut", dateStyle: "full", timeStyle: "short" },
  ).format(date);
}

type Booking = {
  id: string;
  status: string;
  manual_payment_status: string | null;
  payment_provider: string | null;
  patient_pack_id: string | null;
  patient_id: string | null;
  patient_email: string | null;
  therapist_id: string | null;
  therapist_name: string | null;
  scheduled_start: string | null;
  meeting_provider: string | null;
  meeting_url: string | null;
  zoom_join_url: string | null;
  zoom_start_url: string | null;
  backup_join_url: string | null;
  backup_host_url: string | null;
};

type Receipt = {
  receipt_number: string;
  amount: number;
  payment_transaction_id: string | null;
  status: string;
  issued_at: string | null;
};

function emailContent(args: {
  type: NotificationType;
  language: Language;
  booking: Booking;
  receipt: Receipt;
  therapistName: string;
}) {
  const { type, language, booking, receipt, therapistName } = args;
  const isArabic = language === "ar";
  const date = appointment(booking.scheduled_start, language);
  const meeting = type === "therapist_confirmation"
    ? booking.meeting_provider === "zoom" ? booking.zoom_start_url : booking.meeting_url
    : booking.meeting_provider === "zoom" ? booking.zoom_join_url || booking.meeting_url : booking.meeting_url;
  const backup = type === "therapist_confirmation"
    ? booking.backup_host_url || booking.backup_join_url : booking.backup_join_url;

  const dictionary = {
    fr: {
      patient: "Votre réservation est confirmée", therapist: "Nouvelle réservation confirmée",
      receipt: "Votre reçu de paiement Whish", introPatient: "Votre paiement Whish a été vérifié et votre séance est confirmée.",
      introTherapist: "Une nouvelle séance est confirmée dans votre agenda.",
      introReceipt: "Nous confirmons la réception de votre paiement Whish.",
      specialist: "Spécialiste", session: "Séance", meeting: "Lien de séance", backup: "Lien de continuité",
      reference: "Référence de réservation", receiptNumber: "Numéro de reçu", amount: "Montant payé",
      transaction: "Référence Whish",
    },
    en: {
      patient: "Your booking is confirmed", therapist: "New confirmed booking",
      receipt: "Your Whish payment receipt", introPatient: "Your Whish payment has been verified and your session is confirmed.",
      introTherapist: "A new session has been confirmed in your schedule.",
      introReceipt: "We confirm receipt of your Whish payment.",
      specialist: "Specialist", session: "Session", meeting: "Session link", backup: "Continuation link",
      reference: "Booking reference", receiptNumber: "Receipt number", amount: "Amount paid",
      transaction: "Whish reference",
    },
    ar: {
      patient: "تم تأكيد حجزك", therapist: "حجز جديد مؤكّد", receipt: "إيصال دفع Whish",
      introPatient: "تم التحقق من دفعتك عبر Whish وتأكيد جلستك.",
      introTherapist: "تم تأكيد جلسة جديدة في جدولك.",
      introReceipt: "نؤكد استلام دفعتك عبر Whish.",
      specialist: "المختص", session: "الجلسة", meeting: "رابط الجلسة", backup: "رابط المتابعة",
      reference: "مرجع الحجز", receiptNumber: "رقم الإيصال", amount: "المبلغ المدفوع",
      transaction: "مرجع Whish",
    },
  }[language];

  const subject = type === "patient_confirmation" ? dictionary.patient
    : type === "therapist_confirmation" ? dictionary.therapist : dictionary.receipt;
  const intro = type === "patient_confirmation" ? dictionary.introPatient
    : type === "therapist_confirmation" ? dictionary.introTherapist : dictionary.introReceipt;
  const rows: Array<[string, unknown]> = [
    [dictionary.specialist, therapistName], [dictionary.session, date], [dictionary.reference, booking.id],
  ];
  if (type === "payment_receipt") {
    rows.push(
      [dictionary.receiptNumber, receipt.receipt_number],
      [dictionary.amount, `USD ${Number(receipt.amount).toFixed(2)}`],
      [dictionary.transaction, receipt.payment_transaction_id],
    );
  } else {
    rows.push([dictionary.meeting, meeting]);
    if (backup) rows.push([dictionary.backup, backup]);
  }
  const table = rows.map(([label, value]) => {
    const content = String(value ?? "—");
    const safe = escapeHtml(content);
    const displayed = /^https:\/\//i.test(content)
      ? `<a href="${safe}" rel="noopener noreferrer">${safe}</a>` : safe;
    return `<tr><td style="padding:10px;font-weight:bold;vertical-align:top">${escapeHtml(label)}</td>`
      + `<td style="padding:10px;overflow-wrap:anywhere">${displayed}</td></tr>`;
  }).join("\n");

  return {
    subject: `AAN Psychotherapy — ${subject}`,
    html: `<!doctype html><html lang="${language}" dir="${isArabic ? "rtl" : "ltr"}">
      <body style="background:#f3efe9;font-family:Arial,sans-serif;padding:20px">
      <main style="max-width:680px;margin:auto;background:white;padding:30px;border-radius:18px;color:#24364b">
      <p style="color:#b5965c;font-weight:bold">AAN PSYCHOTHERAPY</p>
      <h1>${escapeHtml(subject)}</h1><p>${escapeHtml(intro)}</p>
      <table style="width:100%;background:#f9f6f1;border-radius:12px">${table}</table>
      <p style="margin-top:25px">AAN Psychotherapy</p></main></body></html>`,
  };
}

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization") ?? "";
    if (!/^Bearer\s+/i.test(authorization)) return errorResponse("Authentication required", 401);
    const token = authorization.replace(/^Bearer\s+/i, "").trim();
    if (!token) return errorResponse("Authentication required", 401);

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    if (!url || !key || !resendKey || !from) return errorResponse("Server email configuration missing", 500);

    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: auth, error: authError } = await db.auth.getUser(token);
    if (authError || !auth.user) return errorResponse("Invalid session", 401);
    const { data: profile, error: profileError } = await db.from("profiles")
      .select("role").eq("id", auth.user.id).maybeSingle();
    if (profileError) return errorResponse("Administrator lookup failed", 500);
    if (profile?.role !== "admin") return errorResponse("Administrator required", 403);

    const body: unknown = await request.json().catch(() => null);
    const bookingId = body && typeof body === "object" && "bookingId" in body
      ? (body as { bookingId?: unknown }).bookingId : null;
    const type = body && typeof body === "object" && "notificationType" in body
      ? (body as { notificationType?: unknown }).notificationType : null;
    if (typeof bookingId !== "string" || !UUID.test(bookingId)) {
      return errorResponse("Valid bookingId required", 400);
    }
    if (typeof type !== "string" || !TYPES.includes(type as NotificationType)) {
      return errorResponse("Valid notificationType required", 400);
    }
    const notificationType = type as NotificationType;

    const { data: booking, error: bookingError } = await db.from("bookings")
      .select("id,status,manual_payment_status,payment_provider,patient_pack_id,patient_id,patient_email,therapist_id,therapist_name,scheduled_start,meeting_provider,meeting_url,zoom_join_url,zoom_start_url,backup_join_url,backup_host_url")
      .eq("id", bookingId).maybeSingle<Booking>();
    if (bookingError || !booking) return errorResponse("Booking not found", 404);
    if (booking.status !== "paid" || booking.manual_payment_status !== "approved"
      || booking.payment_provider !== "whish" || booking.patient_pack_id !== null
      || !booking.meeting_url) return errorResponse("Confirmed Whish booking required", 409);

    const { data: receipt, error: receiptError } = await db.from("payment_receipts")
      .select("receipt_number,amount,payment_transaction_id,status,issued_at")
      .eq("booking_id", bookingId).eq("payment_provider", "whish")
      .eq("receipt_type", "payment").eq("status", "paid").maybeSingle<Receipt>();
    if (receiptError || !receipt) return errorResponse("Whish receipt missing", 409);

    let recipient = "";
    let language: Language = "en";
    if (notificationType === "therapist_confirmation") {
      if (!booking.therapist_id) return errorResponse("Therapist missing", 409);
      const { data, error } = await db.auth.admin.getUserById(booking.therapist_id);
      if (error) return errorResponse("Therapist lookup failed", 500);
      recipient = data.user?.email?.trim() || "";
      language = languageOf(data.user?.user_metadata?.language || data.user?.user_metadata?.locale);
    } else {
      recipient = booking.patient_email?.trim() || "";
      if (booking.patient_id) {
        const { data, error } = await db.auth.admin.getUserById(booking.patient_id);
        if (error) return errorResponse("Patient lookup failed", 500);
        if (data.user?.email && data.user.email.toLowerCase() !== recipient.toLowerCase()) {
          return errorResponse("Patient email mismatch", 409);
        }
        language = languageOf(data.user?.user_metadata?.language || data.user?.user_metadata?.locale);
      }
    }
    if (!recipient) return errorResponse("Recipient email missing", 409);

    const claimToken = crypto.randomUUID();
    const { data: claimed, error: claimError } = await db.rpc("claim_whish_notification", {
      p_booking_id: bookingId, p_notification_type: notificationType, p_claim_token: claimToken,
    });
    if (claimError) {
      console.error("Whish notification claim failed", claimError);
      return errorResponse("Unable to claim notification", 500);
    }
    if (claimed !== true) {
      return NextResponse.json({ success: true, sent: false, skipped: true,
        reason: "Already sent, in progress, or requires manual review" });
    }

    try {
      const content = emailContent({ type: notificationType, language, booking, receipt,
        therapistName: booking.therapist_name || "AAN specialist" });
      const resend = new Resend(resendKey);
      const { data, error } = await resend.emails.send({
        from, to: recipient, subject: content.subject, html: content.html,
      });
      if (error || !data?.id) throw new Error(error?.message || "Resend did not return a message ID");
      const { data: completed, error: completionError } = await db.rpc("complete_whish_notification", {
        p_booking_id: bookingId, p_notification_type: notificationType, p_claim_token: claimToken,
        p_recipient_email: recipient, p_provider_message_id: data.id,
      });
      if (completionError || completed !== true) {
        console.error("Whish email accepted but tracking could not be completed", completionError);
        return errorResponse("Email accepted; delivery status requires manual review", 500);
      }
      return NextResponse.json({ success: true, sent: true, notificationType });
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : "Unknown send result";
      const { error: failureError } = await db.rpc("fail_whish_notification", {
        p_booking_id: bookingId, p_notification_type: notificationType,
        p_claim_token: claimToken, p_error: message,
      });
      if (failureError) console.error("Whish notification failure tracking failed", failureError);
      console.error("Whish notification needs manual review", message);
      return errorResponse("Notification failed or outcome uncertain; manual review required", 502);
    }
  } catch (unexpected) {
    console.error("Whish notification route error", unexpected);
    return errorResponse("Unexpected notification error", 500);
  }
}

// Admin-only manual Whish transfer review and sequential fulfillment.

"use client";

import { useCallback, useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import ProtectedRoute from "../components/ProtectedRoute";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/i18n/LanguageProvider";

type Declaration = {
  id: string;
  booking_id: string | null;
  patient_id: string;
  provider: string;
  status: string;
  amount: number;
  currency: string;
  transaction_reference: string;
  submitted_at: string;
  patient_note: string | null;
  admin_note: string | null;
};

type ApiPayload = {
  declarations?: Declaration[];
  data?: Declaration[] | { declarations?: Declaration[] };
  error?: string;
  success?: boolean;
};

export default function AdminWhishPage() {
  const { language, isArabic } = useLanguage();
  const [items, setItems] = useState<Declaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
  const labels = language === "fr" ? {
    title: "Paiements Whish Money",
    intro: "Déclarations de transfert à vérifier manuellement. Une déclaration ne constitue jamais une preuve de paiement.",
    refresh: "Actualiser",
    empty: "Aucune déclaration à afficher.",
    reference: "Référence de transfert",
    booking: "Réservation",
    submitted: "Déclaré le",
    note: "Note du patient",
    adminNote: "Note administrative (facultative)",
    approve: "Approuver après vérification Whish Money",
    reject: "Refuser",
    prepare: "Préparer paiement et reçu",
    meeting: "Préparer la réunion",
    finalize: "Finaliser la réservation et les notifications",
    confirmApprove: "As-tu personnellement vérifié la réception du transfert Whish Money ?",
    confirmReject: "Confirmer le refus de cette déclaration ?",
    confirmFinalize: "Finaliser cette réservation ? Cette action peut déclencher des e-mails réels.",
    failed: "Opération impossible. Consulte la réponse du serveur.",
  } : language === "ar" ? {
    title: "مدفوعات Whish Money",
    intro: "تحويلات بانتظار التحقق اليدوي. التصريح ليس إثباتاً للدفع.",
    refresh: "تحديث",
    empty: "لا توجد تصريحات.",
    reference: "مرجع التحويل",
    booking: "الحجز",
    submitted: "تاريخ التصريح",
    note: "ملاحظة المريض",
    adminNote: "ملاحظة الإدارة (اختياري)",
    approve: "الموافقة بعد التحقق من Whish Money",
    reject: "رفض",
    prepare: "تحضير الدفع والإيصال",
    meeting: "تحضير الاجتماع",
    finalize: "إكمال الحجز والإشعارات",
    confirmApprove: "هل تحققت بنفسك من استلام تحويل Whish Money؟",
    confirmReject: "هل تؤكد رفض التصريح؟",
    confirmFinalize: "إكمال الحجز؟ قد يتم إرسال رسائل بريد فعلية.",
    failed: "تعذرت العملية. تحقق من رد الخادم.",
  } : {
    title: "Whish Money Payments",
    intro: "Manually verify transfers. A declaration is not proof of payment.",
    refresh: "Refresh",
    empty: "No declarations to display.",
    reference: "Transfer reference",
    booking: "Booking",
    submitted: "Submitted",
    note: "Patient note",
    adminNote: "Admin note (optional)",
    approve: "Approve after verifying Whish Money",
    reject: "Reject",
    prepare: "Prepare payment and receipt",
    meeting: "Prepare meeting",
    finalize: "Finalize booking and notifications",
    confirmApprove: "Have you personally verified the Whish Money transfer was received?",
    confirmReject: "Reject this declaration?",
    confirmFinalize: "Finalize this booking? Real emails may be sent.",
    failed: "Operation failed. Check the server response.",
  };

  const token = useCallback(async () => {
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !data.session?.access_token) {
      throw new Error("Administrator session required");
    }
    return data.session.access_token;
  }, []);
  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const accessToken = await token();
      const response = await fetch("/api/admin/whish-declarations", {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      const payload = (await response.json()) as ApiPayload;
      if (!response.ok) {
        throw new Error(payload.error || `HTTP ${response.status}`);
      }
      const result = Array.isArray(payload.declarations)
        ? payload.declarations
        : Array.isArray(payload.data)
          ? payload.data
          : payload.data &&
              !Array.isArray(payload.data) &&
              Array.isArray(payload.data.declarations)
            ? payload.data.declarations
            : [];
      setItems(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : labels.failed);
    } finally {
      setLoading(false);
    }
  }, [token, labels.failed]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  async function action(
    item: Declaration,
    kind: "approve" | "reject" | "prepare" | "meeting" | "finalize",
  ) {
    if (kind === "approve" && !window.confirm(labels.confirmApprove)) {
      return;
    }
    if (kind === "reject" && !window.confirm(labels.confirmReject)) {
      return;
    }
    if (kind === "finalize" && !window.confirm(labels.confirmFinalize)) {
      return;
    }
    if (!item.booking_id && kind !== "approve" && kind !== "reject") {
      return;
    }
    setBusy(item.id);
    setMessages((current) => ({ ...current, [item.id]: "" }));
    try {
      const accessToken = await token();
      const endpoint = kind === "approve" || kind === "reject"
        ? "/api/admin/whish-review"
        : kind === "prepare"
          ? "/api/admin/whish-prepare"
          : kind === "meeting"
            ? "/api/admin/whish-meeting"
            : "/api/admin/whish-finalize";
      const body = kind === "approve" || kind === "reject"
        ? {
            declarationId: item.id,
            decision: kind === "approve" ? "approved" : "rejected",
            adminNote: notes[item.id] || null,
          }
        : { bookingId: item.booking_id };
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok || result.success === false) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }
      setMessages((current) => ({
        ...current,
        [item.id]: JSON.stringify(result, null, 2),
      }));
      await refresh();
    } catch (cause) {
      setMessages((current) => ({
        ...current,
        [item.id]: cause instanceof Error ? cause.message : labels.failed,
      }));
    } finally {
      setBusy(null);
    }
  }
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <>
        <Navbar />
        <main
          dir={isArabic ? "rtl" : "ltr"}
          className="min-h-screen bg-aan-background px-5 py-10 sm:px-8"
        >
          <div className="mx-auto max-w-5xl">
            <header className="aan-card p-7 sm:p-9">
              <h1 className="aan-heading text-4xl">{labels.title}</h1>
              <p className="mt-3 text-aan-secondary">{labels.intro}</p>
              <button
                type="button"
                onClick={() => void refresh()}
                className="mt-5 rounded-xl bg-aan-button px-5 py-3 font-semibold text-white hover:bg-aan-hover"
              >
                {labels.refresh}
              </button>
            </header>
            {error && (
              <p
                role="alert"
                className="mt-6 rounded-xl border border-red-300 bg-white p-4 text-red-700"
              >
                {error}
              </p>
            )}
            {loading && (
              <p className="mt-6 text-aan-secondary">…</p>
            )}
            {!loading && !error && items.length === 0 && (
              <p className="mt-6 text-aan-secondary">
                {labels.empty}
              </p>
            )}
            <div className="mt-6 space-y-5">
              {items.map((item) => (
                <article key={item.id} className="aan-card p-6 sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold text-aan-navy">
                      {item.amount} {item.currency} · Whish Money
                    </h2>
                    <span className="rounded-full border border-aan-border px-3 py-1 text-sm">
                      {item.status}
                    </span>
                  </div>
                  <dl className="mt-5 space-y-2 text-sm text-aan-secondary">
                    <div>
                      <dt className="inline font-semibold">{labels.reference}: </dt>
                      <dd className="inline break-all">{item.transaction_reference}</dd>
                    </div>
                    <div>
                      <dt className="inline font-semibold">{labels.booking}: </dt>
                      <dd className="inline break-all">{item.booking_id || "—"}</dd>
                    </div>
                    <div>
                      <dt className="inline font-semibold">{labels.submitted}: </dt>
                      <dd className="inline">
                        {item.submitted_at
                          ? new Date(item.submitted_at).toLocaleString()
                          : "—"}
                      </dd>
                    </div>
                    {item.patient_note && (
                      <div>
                        <dt className="inline font-semibold">{labels.note}: </dt>
                        <dd className="inline">{item.patient_note}</dd>
                      </div>
                    )}
                  </dl>
                  {item.status === "submitted" || item.status === "under_review" ? (
                    <div className="mt-5">
                      <label className="block text-sm font-semibold text-aan-navy">
                        {labels.adminNote}
                        <textarea
                          value={notes[item.id] || ""}
                          onChange={(event) =>
                            setNotes((current) => ({
                              ...current,
                              [item.id]: event.target.value,
                            }))
                          }
                          className="mt-2 w-full rounded-xl border border-aan-border p-3"
                          rows={2}
                        />
                      </label>
                      <div className="mt-3 flex flex-wrap gap-3">
                        <button
                          disabled={busy !== null}
                          onClick={() => void action(item, "approve")}
                          className="rounded-xl bg-aan-button px-4 py-3 text-white disabled:opacity-50"
                        >
                          {labels.approve}
                        </button>
                        <button
                          disabled={busy !== null}
                          onClick={() => void action(item, "reject")}
                          className="rounded-xl border border-aan-border px-4 py-3 disabled:opacity-50"
                        >
                          {labels.reject}
                        </button>
                      </div>
                    </div>
                  ) : null}
                  {item.status === "approved" && item.booking_id && (
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        disabled={busy !== null}
                        onClick={() => void action(item, "prepare")}
                        className="rounded-xl border border-aan-border px-4 py-3 disabled:opacity-50"
                      >
                        {labels.prepare}
                      </button>
                      <button
                        disabled={busy !== null}
                        onClick={() => void action(item, "meeting")}
                        className="rounded-xl border border-aan-border px-4 py-3 disabled:opacity-50"
                      >
                        {labels.meeting}
                      </button>
                      <button
                        disabled={busy !== null}
                        onClick={() => void action(item, "finalize")}
                        className="rounded-xl bg-aan-button px-4 py-3 text-white disabled:opacity-50"
                      >
                        {labels.finalize}
                      </button>
                    </div>
                  )}
                  {messages[item.id] && (
                    <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-xl bg-aan-background p-4 text-xs">
                      {messages[item.id]}
                    </pre>
                  )}
                </article>
              ))}
            </div>
          </div>
        </main>
      </>
    </ProtectedRoute>
  );
}

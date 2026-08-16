"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import ProtectedRoute from "../components/ProtectedRoute";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/i18n/LanguageProvider";

type PrivacyStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "rejected";

type PrivacyRequest = {
  id: string;
  full_name: string;
  email: string;
  request_type: string;
  message: string;
  status: PrivacyStatus;
  created_at: string;
  updated_at: string;
};

export default function AdminPrivacyPage() {
  const { isArabic } = useLanguage();

  const [requests, setRequests] = useState<PrivacyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const copy = isArabic
    ? {
        eyebrow: "إدارة الخصوصية",
        title: "طلبات البيانات الشخصية",
        description:
          "مراجعة طلبات الوصول والتصحيح والحذف والاعتراض وغيرها من طلبات الخصوصية.",

        loading: "جارٍ تحميل الطلبات...",
        noRequests: "لا توجد طلبات خصوصية حتى الآن.",

        name: "الاسم",
        email: "البريد الإلكتروني",
        type: "نوع الطلب",
        message: "تفاصيل الطلب",
        submitted: "تاريخ الإرسال",
        status: "الحالة",

        pending: "قيد الانتظار",
        inProgress: "قيد المعالجة",
        completed: "مكتمل",
        rejected: "مرفوض",

        access: "الوصول إلى البيانات",
        correction: "تصحيح البيانات",
        deletion: "حذف البيانات",
        restriction: "تقييد المعالجة",
        portability: "الحصول على نسخة من البيانات",
        objection: "الاعتراض على المعالجة",
        other: "طلب آخر",

        loadError: "تعذر تحميل طلبات الخصوصية.",
        updateError: "تعذر تحديث حالة الطلب.",
      }
    : {
        eyebrow: "Privacy administration",
        title: "Personal data requests",
        description:
          "Review access, correction, deletion, objection and other privacy requests submitted through AAN.",

        loading: "Loading privacy requests...",
        noRequests: "No privacy requests have been submitted yet.",

        name: "Name",
        email: "Email",
        type: "Request type",
        message: "Request details",
        submitted: "Submitted",
        status: "Status",

        pending: "Pending",
        inProgress: "In progress",
        completed: "Completed",
        rejected: "Rejected",

        access: "Access personal data",
        correction: "Correct personal data",
        deletion: "Delete personal data",
        restriction: "Restrict processing",
        portability: "Receive a copy of personal data",
        objection: "Object to processing",
        other: "Other privacy request",

        loadError: "Unable to load privacy requests.",
        updateError: "Unable to update the request status.",
      };

  const requestTypeLabels = useMemo(
    () => ({
      access: copy.access,
      correction: copy.correction,
      deletion: copy.deletion,
      restriction: copy.restriction,
      portability: copy.portability,
      objection: copy.objection,
      other: copy.other,
    }),
    [
      copy.access,
      copy.correction,
      copy.deletion,
      copy.restriction,
      copy.portability,
      copy.objection,
      copy.other,
    ],
  );

  const statusLabels = useMemo(
    () => ({
      pending: copy.pending,
      in_progress: copy.inProgress,
      completed: copy.completed,
      rejected: copy.rejected,
    }),
    [
      copy.pending,
      copy.inProgress,
      copy.completed,
      copy.rejected,
    ],
  );

  const loadRequests = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const { data, error } = await supabase
        .from("privacy_requests")
        .select(
          "id, full_name, email, request_type, message, status, created_at, updated_at",
        )
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setRequests((data ?? []) as PrivacyRequest[]);
    } catch (error) {
      console.error(
        "Privacy request load error:",
        error,
      );

      setErrorMessage(copy.loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, []);

  const updateStatus = async (
    id: string,
    status: PrivacyStatus,
  ) => {
    setUpdatingId(id);
    setErrorMessage("");

    try {
      const { error } = await supabase
        .from("privacy_requests")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        throw error;
      }

      setRequests((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status,
                updated_at: new Date().toISOString(),
              }
            : item,
        ),
      );
    } catch (error) {
      console.error(
        "Privacy request status update error:",
        error,
      );

      setErrorMessage(copy.updateError);
    } finally {
      setUpdatingId(null);
    }
  };

  const statusClasses = (
    status: PrivacyStatus,
  ) => {
    if (status === "completed") {
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }

    if (status === "in_progress") {
      return "border-blue-200 bg-blue-50 text-blue-700";
    }

    if (status === "rejected") {
      return "border-red-200 bg-red-50 text-red-700";
    }

    return "border-amber-200 bg-amber-50 text-amber-700";
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <>
        <Navbar />

        <main
          dir={isArabic ? "rtl" : "ltr"}
          className="min-h-screen bg-aan-background px-5 py-10 sm:px-8 lg:px-10"
        >
          <section className="mx-auto max-w-7xl">
            <div className="aan-card p-7 sm:p-10 lg:p-12">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-aan-gold">
                {copy.eyebrow}
              </p>

              <h1 className="aan-heading mt-4 text-4xl sm:text-5xl lg:text-6xl">
                {copy.title}
              </h1>

              <p className="mt-5 max-w-4xl text-lg leading-8 text-aan-secondary">
                {copy.description}
              </p>
            </div>

            {errorMessage && (
              <div className="mt-7 rounded-2xl border border-red-200 bg-red-50 p-5 font-semibold text-red-700">
                {errorMessage}
              </div>
            )}

            {loading ? (
              <div className="mt-8 aan-card p-8">
                <p className="text-aan-secondary">
                  {copy.loading}
                </p>
              </div>
            ) : requests.length === 0 ? (
              <div className="mt-8 rounded-[2rem] border border-dashed border-aan-border bg-white p-10 text-center text-aan-secondary">
                {copy.noRequests}
              </div>
            ) : (
              <div className="mt-8 grid gap-6">
                {requests.map((item) => (
                  <article
                    key={item.id}
                    className="aan-card p-6 sm:p-8"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-2xl font-semibold text-aan-navy">
                            {item.full_name}
                          </h2>

                          <span
                            className={`rounded-full border px-3 py-1.5 text-xs font-bold ${statusClasses(
                              item.status,
                            )}`}
                          >
                            {statusLabels[item.status]}
                          </span>
                        </div>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-aan-gold">
                              {copy.email}
                            </p>

                            <p className="mt-1 break-all text-aan-secondary">
                              {item.email}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-aan-gold">
                              {copy.type}
                            </p>

                            <p className="mt-1 text-aan-secondary">
                              {requestTypeLabels[
                                item.request_type as keyof typeof requestTypeLabels
                              ] || item.request_type}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-aan-gold">
                              {copy.submitted}
                            </p>

                            <p className="mt-1 text-aan-secondary">
                              {new Intl.DateTimeFormat(
                                isArabic ? "ar-LB" : "en-GB",
                                {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                },
                              ).format(
                                new Date(item.created_at),
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 rounded-2xl border border-aan-border bg-aan-background p-5">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-aan-gold">
                            {copy.message}
                          </p>

                          <p className="mt-3 whitespace-pre-line leading-8 text-aan-secondary">
                            {item.message}
                          </p>
                        </div>
                      </div>

                      <div className="w-full shrink-0 lg:w-64">
                        <label
                          htmlFor={`privacy-status-${item.id}`}
                          className="block font-bold text-aan-navy"
                        >
                          {copy.status}
                        </label>

                        <select
                          id={`privacy-status-${item.id}`}
                          value={item.status}
                          disabled={updatingId === item.id}
                          onChange={(event) =>
                            void updateStatus(
                              item.id,
                              event.target.value as PrivacyStatus,
                            )
                          }
                          className="aan-field mt-3 w-full p-3 font-semibold disabled:opacity-60"
                        >
                          <option value="pending">
                            {copy.pending}
                          </option>

                          <option value="in_progress">
                            {copy.inProgress}
                          </option>

                          <option value="completed">
                            {copy.completed}
                          </option>

                          <option value="rejected">
                            {copy.rejected}
                          </option>
                        </select>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>
      </>
    </ProtectedRoute>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import ProtectedRoute from "../components/ProtectedRoute";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/i18n/LanguageProvider";

type TherapistApplication = {
  id: string;

  full_name: string;
  full_name_ar: string | null;

  email: string;

  specialty: string | null;
  specialty_ar: string | null;

  message: string | null;
  message_ar: string | null;

  status: string;
  created_at: string;
};

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<
    TherapistApplication[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<
    string | null
  >(null);
  const [errorMessage, setErrorMessage] = useState("");

  const { isArabic } = useLanguage();

  const copy = isArabic
    ? {
        eyebrow: "إدارة طلبات المعالجين",
        title: "طلبات انضمام المعالجين",
        description:
          "راجع طلبات المعالجين الجدد ووافق عليها أو ارفضها.",

        all: "جميع الطلبات",
        pending: "قيد المراجعة",
        approved: "مقبول",
        rejected: "مرفوض",

        loading: "جارٍ تحميل الطلبات...",
        empty: "لا توجد طلبات حتى الآن.",
        loadError: "تعذر تحميل طلبات المعالجين.",

        specialty: "التخصص",
        notProvided: "غير متوفر",
        message: "رسالة المتقدم",
        noMessage: "لم تتم إضافة رسالة.",
        submitted: "تاريخ التقديم",
        status: "الحالة",

        approve: "قبول الطلب",
        reject: "رفض الطلب",
        processing: "جارٍ المعالجة...",

        approvedInfo: "تمت الموافقة على هذا الطلب.",
        rejectedInfo: "تم رفض هذا الطلب.",

        approvedSuccess:
          "تم قبول المعالج وإرسال رسالة الدعوة بنجاح.",
        approveError: "تعذر قبول الطلب.",
        rejectError: "تعذر رفض الطلب.",
      }
    : {
        eyebrow: "Therapist application management",
        title: "Therapist Applications",
        description:
          "Review new therapist requests and approve or reject each application.",

        all: "All applications",
        pending: "Pending",
        approved: "Approved",
        rejected: "Rejected",

        loading: "Loading applications...",
        empty: "No applications have been submitted yet.",
        loadError: "Unable to load therapist applications.",

        specialty: "Specialty",
        notProvided: "Not provided",
        message: "Applicant message",
        noMessage: "No message provided.",
        submitted: "Submitted",
        status: "Status",

        approve: "Approve application",
        reject: "Reject application",
        processing: "Processing...",

        approvedInfo: "This application has been approved.",
        rejectedInfo: "This application has been rejected.",

        approvedSuccess:
          "The therapist was approved and the invitation email was sent.",
        approveError: "Unable to approve the application.",
        rejectError: "Unable to reject the application.",
      };

  useEffect(() => {
    void getApplications();
  }, []);

  const getApplications = async () => {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("therapist_applications")
      .select(
        `
          id,
          full_name,
          full_name_ar,
          email,
          specialty,
          specialty_ar,
          message,
          message_ar,
          status,
          created_at
        `,
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Unable to load therapist applications:",
        error,
      );

      setApplications([]);
      setErrorMessage(copy.loadError);
      setLoading(false);
      return;
    }

    setApplications(
      (data as TherapistApplication[] | null) || [],
    );

    setLoading(false);
  };

  const approveApplication = async (
    application: TherapistApplication,
  ) => {
    if (application.status === "approved") {
      return;
    }

    setProcessingId(application.id);

    try {
      const response = await fetch(
        "/api/approve-therapist",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            applicationId: application.id,
            email: application.email,
            fullName: application.full_name,
            specialty: application.specialty,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || copy.approveError,
        );
      }

      alert(copy.approvedSuccess);
      await getApplications();
    } catch (error) {
      console.error(
        "Approve application error:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : copy.approveError,
      );
    } finally {
      setProcessingId(null);
    }
  };

  const rejectApplication = async (id: string) => {
    setProcessingId(id);

    try {
      const { error } = await supabase
        .from("therapist_applications")
        .update({
          status: "rejected",
        })
        .eq("id", id);

      if (error) {
        throw error;
      }

      await getApplications();
    } catch (error) {
      console.error(
        "Reject application error:",
        error,
      );

      alert(copy.rejectError);
    } finally {
      setProcessingId(null);
    }
  };

  const counts = useMemo(() => {
    return {
      all: applications.length,

      pending: applications.filter(
        (application) =>
          application.status === "pending",
      ).length,

      approved: applications.filter(
        (application) =>
          application.status === "approved",
      ).length,

      rejected: applications.filter(
        (application) =>
          application.status === "rejected",
      ).length,
    };
  }, [applications]);

  const getApplicationName = (
    application: TherapistApplication,
  ) => {
    if (
      isArabic &&
      application.full_name_ar?.trim()
    ) {
      return application.full_name_ar;
    }

    return application.full_name;
  };

  const getApplicationSpecialty = (
    application: TherapistApplication,
  ) => {
    if (
      isArabic &&
      application.specialty_ar?.trim()
    ) {
      return application.specialty_ar;
    }

    return (
      application.specialty?.trim() ||
      copy.notProvided
    );
  };

  const getApplicationMessage = (
    application: TherapistApplication,
  ) => {
    if (
      isArabic &&
      application.message_ar?.trim()
    ) {
      return application.message_ar;
    }

    return (
      application.message?.trim() ||
      copy.noMessage
    );
  };

  const getStatusLabel = (status: string) => {
    if (status === "approved") {
      return copy.approved;
    }

    if (status === "rejected") {
      return copy.rejected;
    }

    return copy.pending;
  };

  const getStatusClasses = (status: string) => {
    if (status === "approved") {
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }

    if (status === "rejected") {
      return "border-red-200 bg-red-50 text-red-700";
    }

    return "border-amber-200 bg-amber-50 text-amber-700";
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat(
      isArabic ? "ar-LB" : "en-GB",
      {
        dateStyle: "medium",
        timeStyle: "short",
      },
    ).format(new Date(date));
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
            <header className="relative mb-10 overflow-hidden rounded-[2.25rem] border border-aan-border bg-white p-8 shadow-[var(--aan-shadow-md)] sm:p-10 lg:p-12">
              <div
                aria-hidden="true"
                className={`absolute -top-24 h-72 w-72 rounded-full bg-aan-gold/10 blur-3xl ${
                  isArabic
                    ? "-left-20"
                    : "-right-20"
                }`}
              />

              <div className="relative max-w-4xl">
                <p className="text-sm font-bold uppercase tracking-[0.28em] text-aan-gold">
                  {copy.eyebrow}
                </p>

                <h1 className="aan-heading mt-4 text-4xl sm:text-5xl lg:text-6xl">
                  {copy.title}
                </h1>

                <div className="mt-6 flex items-center gap-3">
                  <div className="h-px w-28 bg-aan-gold" />
                  <span className="h-2 w-2 rounded-full bg-aan-gold" />
                  <span className="h-1.5 w-1.5 rounded-full bg-aan-gold/60" />
                </div>

                <p className="mt-6 text-lg leading-8 text-aan-secondary">
                  {copy.description}
                </p>
              </div>
            </header>

            <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label={copy.all}
                value={counts.all}
              />

              <StatCard
                label={copy.pending}
                value={counts.pending}
              />

              <StatCard
                label={copy.approved}
                value={counts.approved}
              />

              <StatCard
                label={copy.rejected}
                value={counts.rejected}
              />
            </div>

            {loading ? (
              <div className="rounded-[2rem] border border-aan-border bg-white p-12 text-center shadow-[var(--aan-shadow-sm)]">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-aan-border border-t-aan-button" />

                <p className="mt-5 font-semibold text-aan-secondary">
                  {copy.loading}
                </p>
              </div>
            ) : errorMessage ? (
              <div className="rounded-[2rem] border border-red-200 bg-red-50 p-8 text-center font-semibold text-red-700">
                {errorMessage}
              </div>
            ) : applications.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-aan-border bg-white p-12 text-center shadow-[var(--aan-shadow-sm)]">
                <p className="text-lg font-semibold text-aan-secondary">
                  {copy.empty}
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {applications.map(
                  (application) => {
                    const isProcessing =
                      processingId ===
                      application.id;

                    const isPending =
                      application.status ===
                      "pending";

                    const isApproved =
                      application.status ===
                      "approved";

                    const isRejected =
                      application.status ===
                      "rejected";

                    return (
                      <article
                        key={application.id}
                        className="overflow-hidden rounded-[2rem] border border-aan-border bg-white shadow-[var(--aan-shadow-sm)]"
                      >
                        <div className="grid lg:grid-cols-[1fr_290px]">
                          <div className="p-6 sm:p-8">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <h2 className="aan-heading text-3xl">
                                  {getApplicationName(
                                    application,
                                  )}
                                </h2>

                                <p
                                  dir="ltr"
                                  className={`mt-2 text-aan-secondary ${
                                    isArabic
                                      ? "text-right"
                                      : "text-left"
                                  }`}
                                >
                                  {
                                    application.email
                                  }
                                </p>
                              </div>

                              <span
                                className={`inline-flex w-fit rounded-full border px-4 py-2 text-sm font-bold ${getStatusClasses(
                                  application.status,
                                )}`}
                              >
                                {getStatusLabel(
                                  application.status,
                                )}
                              </span>
                            </div>

                            <div className="mt-7 grid gap-4 sm:grid-cols-2">
                              <div className="rounded-2xl bg-[#fbf8f3] p-5">
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-aan-gold">
                                  {copy.specialty}
                                </p>

                                <p className="mt-2 font-semibold leading-7 text-aan-navy">
                                  {getApplicationSpecialty(
                                    application,
                                  )}
                                </p>
                              </div>

                              <div className="rounded-2xl bg-[#fbf8f3] p-5">
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-aan-gold">
                                  {copy.submitted}
                                </p>

                                <p className="mt-2 font-semibold text-aan-navy">
                                  {formatDate(
                                    application.created_at,
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="mt-5 rounded-2xl border border-aan-border bg-white p-5">
                              <p className="text-xs font-bold uppercase tracking-[0.2em] text-aan-gold">
                                {copy.message}
                              </p>

                              <p className="mt-3 whitespace-pre-line leading-8 text-aan-secondary">
                                {getApplicationMessage(
                                  application,
                                )}
                              </p>
                            </div>
                          </div>

                          <aside className="flex flex-col justify-center border-t border-aan-border bg-[linear-gradient(145deg,#fbf8f3_0%,#eef4fa_100%)] p-6 lg:border-s lg:border-t-0 sm:p-8">
                            {isPending && (
                              <div className="grid gap-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    approveApplication(
                                      application,
                                    )
                                  }
                                  disabled={
                                    isProcessing
                                  }
                                  className="aan-cta rounded-2xl px-6 py-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {isProcessing
                                    ? copy.processing
                                    : copy.approve}
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    rejectApplication(
                                      application.id,
                                    )
                                  }
                                  disabled={
                                    isProcessing
                                  }
                                  className="rounded-2xl border border-red-200 bg-white px-6 py-4 font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {isProcessing
                                    ? copy.processing
                                    : copy.reject}
                                </button>
                              </div>
                            )}

                            {isApproved && (
                              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center font-semibold leading-7 text-emerald-700">
                                ✓ {copy.approvedInfo}
                              </div>
                            )}

                            {isRejected && (
                              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center font-semibold leading-7 text-red-700">
                                × {copy.rejectedInfo}
                              </div>
                            )}
                          </aside>
                        </div>
                      </article>
                    );
                  },
                )}
              </div>
            )}
          </section>
        </main>
      </>
    </ProtectedRoute>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[1.5rem] border border-aan-border bg-white p-5 shadow-[var(--aan-shadow-sm)]">
      <p className="text-sm font-semibold text-aan-secondary">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold text-aan-navy">
        {value}
      </p>
    </div>
  );
}
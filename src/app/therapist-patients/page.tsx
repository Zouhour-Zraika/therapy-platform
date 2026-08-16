"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import ProtectedRoute from "../components/ProtectedRoute";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/i18n/LanguageProvider";

type PatientProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type PatientRecord = {
  id: string;
  patient_id: string;
  created_at: string;
  updated_at: string;
  patient: PatientProfile | null;
};

type PatientAccessRow = {
  id: string;
  patient_record_id: string;
  therapist_id: string;
  active: boolean;
  created_at: string;
};

export default function TherapistPatientsPage() {
  const { isArabic } = useLanguage();

  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const copy = isArabic
    ? {
        eyebrow: "مساحة المعالج",
        title: "مرضاي",
        description:
          "الوصول إلى ملفات المرضى المصرح لك بمتابعتهم ومراجعة تاريخ الجلسات والملاحظات السريرية.",

        loading: "جارٍ تحميل المرضى...",
        noPatientsTitle: "لا يوجد مرضى معينون",
        noPatientsDescription:
          "لم يتم تعيين أي ملف مريض لك حتى الآن.",

        patient: "المريض",
        email: "البريد الإلكتروني",
        recordCreated: "تم إنشاء الملف",
        openRecord: "فتح ملف المريض",

        loadError:
          "تعذر تحميل ملفات المرضى. يرجى المحاولة مرة أخرى.",

        unknownPatient: "مريض",
        noEmail: "لا يوجد بريد إلكتروني",
      }
    : {
        eyebrow: "Therapist workspace",
        title: "My Patients",
        description:
          "Access the records of patients assigned to you and review their session history and confidential clinical notes.",

        loading: "Loading patients...",
        noPatientsTitle: "No assigned patients",
        noPatientsDescription:
          "No patient records have been assigned to you yet.",

        patient: "Patient",
        email: "Email",
        recordCreated: "Record created",
        openRecord: "Open patient record",

        loadError:
          "Unable to load patient records. Please try again.",

        unknownPatient: "Patient",
        noEmail: "No email available",
      };

  const loadPatients = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      /*
       * 1. Get the currently authenticated therapist.
       */
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("No authenticated user.");
      }

      /*
       * 2. Get only active patient assignments belonging
       *    to this therapist.
       *
       * RLS also protects this table, so another therapist
       * cannot retrieve somebody else's assignments.
       */
      const {
        data: accessRows,
        error: accessError,
      } = await supabase
        .from("patient_therapist_access")
        .select(
          "id, patient_record_id, therapist_id, active, created_at",
        )
        .eq("therapist_id", user.id)
        .eq("active", true);

      if (accessError) {
        throw accessError;
      }

      const assignments =
        (accessRows ?? []) as PatientAccessRow[];

      if (assignments.length === 0) {
        setPatients([]);
        return;
      }

      const patientRecordIds = assignments.map(
        (assignment) => assignment.patient_record_id,
      );

      /*
       * 3. Load the patient records to which this therapist
       *    has access.
       */
      const {
        data: recordRows,
        error: recordsError,
      } = await supabase
        .from("patient_records")
        .select(
          "id, patient_id, created_at, updated_at",
        )
        .in("id", patientRecordIds)
        .order("created_at", {
          ascending: false,
        });

      if (recordsError) {
        throw recordsError;
      }

      const records = recordRows ?? [];

      if (records.length === 0) {
        setPatients([]);
        return;
      }

      /*
       * 4. Retrieve the basic profile information for
       *    the patients.
       */
      const patientIds = records.map(
        (record) => record.patient_id,
      );

      const {
        data: profileRows,
        error: profilesError,
      } = await supabase
        .from("profiles")
        .select(
          "id, full_name, email",
        )
        .in("id", patientIds);

      if (profilesError) {
        throw profilesError;
      }

      const profiles =
        (profileRows ?? []) as PatientProfile[];

      /*
       * 5. Attach each profile to its patient record.
       */
      const recordsWithPatients: PatientRecord[] =
        records.map((record) => {
          const patient =
            profiles.find(
              (profile) =>
                profile.id === record.patient_id,
            ) ?? null;

          return {
            id: record.id,
            patient_id: record.patient_id,
            created_at: record.created_at,
            updated_at: record.updated_at,
            patient,
          };
        });

      setPatients(recordsWithPatients);
    } catch (error) {
      console.error(
        "Therapist patients load error:",
        error,
      );

      setPatients([]);
      setErrorMessage(copy.loadError);
    } finally {
      setLoading(false);
    }
  }, [copy.loadError]);

  useEffect(() => {
    void loadPatients();
  }, [loadPatients]);

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat(
      isArabic ? "ar-LB" : "en-GB",
      {
        dateStyle: "medium",
      },
    ).format(new Date(date));
  };
    return (
    <ProtectedRoute allowedRoles={["therapist"]}>
      <>
        <Navbar />

        <main
          dir={isArabic ? "rtl" : "ltr"}
          className="min-h-screen bg-aan-background px-5 py-10 sm:px-8 lg:px-10"
        >
          <section className="mx-auto max-w-7xl">
            {/* Header */}

            <div className="aan-card relative overflow-hidden p-8 sm:p-10 lg:p-12">
              <div
                aria-hidden="true"
                className={`absolute top-0 h-full w-56 opacity-40 ${
                  isArabic ? "left-0" : "right-0"
                }`}
              >
                <svg
                  viewBox="0 0 240 220"
                  className="h-full w-full text-[#d8b675]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M190 35c-24 23-45 56-54 93" />

                  <path d="M183 40c16 3 30 11 40 23-18 5-34 1-48-10" />

                  <path d="M157 76c16 2 31 10 41 22-18 5-35 1-49-9" />

                  <path d="M140 113c15 2 29 10 39 21-17 5-33 1-47-9" />
                </svg>
              </div>

              <div className="relative max-w-4xl">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-aan-gold">
                  {copy.eyebrow}
                </p>

                <h1 className="aan-heading mt-4 text-4xl sm:text-5xl lg:text-6xl">
                  {copy.title}
                </h1>

                <p className="mt-5 max-w-3xl text-lg leading-8 text-aan-secondary sm:text-xl">
                  {copy.description}
                </p>
              </div>
            </div>

            {/* Loading */}

            {loading && (
              <div className="mt-8 aan-card p-8">
                <div className="flex items-center gap-4">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-aan-border border-t-aan-button" />

                  <p className="text-aan-secondary">
                    {copy.loading}
                  </p>
                </div>
              </div>
            )}

            {/* Error */}

            {!loading && errorMessage && (
              <div
                role="alert"
                className="mt-8 rounded-[2rem] border border-red-200 bg-red-50 p-6 text-red-700"
              >
                <p className="font-semibold">
                  {errorMessage}
                </p>

                <button
                  type="button"
                  onClick={() => void loadPatients()}
                  className="mt-4 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-bold transition hover:bg-red-100"
                >
                  {isArabic
                    ? "إعادة المحاولة"
                    : "Try again"}
                </button>
              </div>
            )}

            {/* No patients */}

            {!loading &&
              !errorMessage &&
              patients.length === 0 && (
                <div className="mt-8 aan-card p-8 text-center sm:p-12">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#edf3f9] text-aan-button">
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className="h-8 w-8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <circle
                        cx="12"
                        cy="8"
                        r="3.25"
                      />

                      <path d="M5.5 19c.7-3.6 3.05-5.5 6.5-5.5s5.8 1.9 6.5 5.5" />
                    </svg>
                  </div>

                  <h2 className="mt-5 text-2xl font-semibold text-aan-navy sm:text-3xl">
                    {copy.noPatientsTitle}
                  </h2>

                  <p className="mx-auto mt-3 max-w-xl leading-7 text-aan-secondary">
                    {copy.noPatientsDescription}
                  </p>
                </div>
              )}

            {/* Patient list */}

            {!loading &&
              !errorMessage &&
              patients.length > 0 && (
                <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {patients.map((record) => {
                    const patientName =
                      record.patient?.full_name?.trim() ||
                      copy.unknownPatient;

                    const patientEmail =
                      record.patient?.email?.trim() ||
                      copy.noEmail;

                    const firstLetter =
                      patientName
                        .charAt(0)
                        .toUpperCase() || "P";

                    return (
                      <article
                        key={record.id}
                        className="aan-card flex h-full flex-col p-6 transition duration-200 hover:-translate-y-1 hover:shadow-[var(--aan-shadow-lg)] sm:p-7"
                      >
                        <div className="flex items-start gap-4">
                          {/* Patient avatar */}

                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-aan-button text-xl font-bold text-white">
                            {firstLetter}
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-aan-gold">
                              {copy.patient}
                            </p>

                            <h2 className="mt-1 break-words text-xl font-semibold text-aan-navy">
                              {patientName}
                            </h2>
                          </div>
                        </div>

                        <div className="mt-6 border-t border-aan-border pt-5">
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-aan-gold">
                            {copy.email}
                          </p>

                          <p className="mt-2 break-all text-sm leading-6 text-aan-secondary">
                            {patientEmail}
                          </p>
                        </div>

                        <div className="mt-5">
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-aan-gold">
                            {copy.recordCreated}
                          </p>

                          <p className="mt-2 text-sm text-aan-secondary">
                            {formatDate(
                              record.created_at,
                            )}
                          </p>
                        </div>
                                                <div className="mt-auto pt-7">
                          <Link
                            href={`/therapist-patients/${record.id}`}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-aan-button px-5 py-3.5 font-bold text-white shadow-[var(--aan-shadow-sm)] transition hover:bg-aan-hover"
                          >
                            <span>
                              {copy.openRecord}
                            </span>

                            <span
                              aria-hidden="true"
                              className="text-xl"
                            >
                              {isArabic ? "←" : "→"}
                            </span>
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
          </section>
        </main>
      </>
    </ProtectedRoute>
  );
}
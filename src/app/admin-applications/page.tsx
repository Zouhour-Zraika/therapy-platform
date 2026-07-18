"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "@/lib/supabase";
import ProtectedRoute from "../components/ProtectedRoute";

type TherapistApplication = {
  id: string;
  full_name: string;
  email: string;
  specialty: string | null;
  message: string | null;
  status: string;
  created_at: string;
};

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<TherapistApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    getApplications();
  }, []);

  const getApplications = async () => {
    const { data, error } = await supabase
      .from("therapist_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      setLoading(false);
      return;
    }

    setApplications(data || []);
    setLoading(false);
  };

  const approveApplication = async (application: TherapistApplication) => {
    setProcessingId(application.id);

    try {
      const response = await fetch("/api/approve-therapist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: application.email,
          fullName: application.full_name,
          specialty: application.specialty,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Error approving application");
        setProcessingId(null);
        return;
      }

      alert(
        "Therapist approved successfully. An invitation email has been sent."
      );

      getApplications();
    } catch (error) {
      console.log(error);
      alert("Error approving application");
    }

    setProcessingId(null);
  };

  const rejectApplication = async (id: string) => {
    setProcessingId(id);

    const { error } = await supabase
      .from("therapist_applications")
      .update({ status: "rejected" })
      .eq("id", id);

    if (error) {
      alert("Error rejecting application");
      console.log(error);
      setProcessingId(null);
      return;
    }

    getApplications();
    setProcessingId(null);
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-100 p-10">
        <section className="mx-auto max-w-7xl rounded-3xl bg-white p-10 shadow-xl">
          <h1 className="mb-4 text-5xl font-bold text-slate-900">
            Therapist Applications
          </h1>

          <p className="mb-10 text-xl text-slate-600">
            Review new therapist requests submitted through the clinician
            portal.
          </p>

          {loading ? (
            <p className="text-slate-600">Loading applications...</p>
          ) : applications.length === 0 ? (
            <p className="text-slate-600">No applications yet.</p>
          ) : (
            <div className="grid gap-6">
              {applications.map((application) => (
                <div
                  key={application.id}
                  className="rounded-2xl bg-slate-100 p-6"
                >
                  <div className="flex flex-col justify-between gap-6 md:flex-row">
                    <div>
                      <h2 className="text-3xl font-bold text-slate-900">
                        {application.full_name}
                      </h2>

                      <p className="mt-2 text-slate-700">
                        {application.email}
                      </p>

                      <p className="mt-2 text-slate-700">
                        Specialty:{" "}
                        <span className="font-semibold">
                          {application.specialty || "Not provided"}
                        </span>
                      </p>

                      <p className="mt-4 text-slate-600">
                        {application.message || "No message provided."}
                      </p>

                      <p className="mt-4 text-sm text-slate-500">
                        Submitted:{" "}
                        {new Date(application.created_at).toLocaleString()}
                      </p>

                      <p className="mt-2 text-sm font-bold text-slate-700">
                        Status: {application.status}
                      </p>
                    </div>

                    <div className="flex min-w-48 flex-col gap-3">
                      <button
                        onClick={() => approveApplication(application)}
                        disabled={
                          application.status === "approved" ||
                          processingId === application.id
                        }
                        className="rounded-xl bg-green-700 px-5 py-3 text-white disabled:bg-slate-400"
                      >
                        {processingId === application.id
                          ? "Processing..."
                          : "Approve"}
                      </button>

                      <button
                        onClick={() => rejectApplication(application.id)}
                        disabled={
                          application.status === "rejected" ||
                          processingId === application.id
                        }
                        className="rounded-xl bg-red-600 px-5 py-3 text-white disabled:bg-slate-400"
                      >
                        {processingId === application.id
                          ? "Processing..."
                          : "Reject"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
    </ProtectedRoute>
  );
}
"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "@/lib/supabase";

type Therapist = {
  id: string;
  full_name: string;
  specialty: string;
  bio: string;
  price: number;
  email: string | null;
  role: string;
};

export default function AdminTherapistsPage() {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    getTherapists();
  }, []);

  const getAccessToken = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token || null;
  };

  const getTherapists = async () => {
    setLoading(true);

    try {
      const accessToken = await getAccessToken();

      if (!accessToken) {
        alert("Your session has expired. Please log in again.");
        window.location.href = "/login";
        return;
      }

      const response = await fetch("/api/admin/therapists", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || "Unable to load therapists.");

        if (response.status === 401 || response.status === 403) {
          window.location.href = "/login";
        }

        return;
      }

      const loadedTherapists: Therapist[] = result.therapists || [];

      const initialPrices: Record<string, string> = {};

      loadedTherapists.forEach((therapist) => {
        initialPrices[therapist.id] = String(therapist.price || 0);
      });

      setTherapists(loadedTherapists);
      setPrices(initialPrices);
    } catch (error) {
      console.error("Load therapists error:", error);
      alert("Unexpected error while loading therapists.");
    } finally {
      setLoading(false);
    }
  };

  const updatePrice = async (therapistId: string) => {
    const newPrice = Number(prices[therapistId]);

    if (!Number.isFinite(newPrice) || newPrice <= 0) {
      alert("Please enter a valid price greater than 0.");
      return;
    }

    setProcessingId(therapistId);

    try {
      const accessToken = await getAccessToken();

      if (!accessToken) {
        alert("Your session has expired. Please log in again.");
        window.location.href = "/login";
        return;
      }

      const response = await fetch(
        "/api/admin/update-therapist-price",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            therapistId,
            price: newPrice,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || "Error updating price.");
        return;
      }

      const savedPrice = Number(result.therapist.price);

      setTherapists((currentTherapists) =>
        currentTherapists.map((therapist) =>
          therapist.id === therapistId
            ? {
                ...therapist,
                price: savedPrice,
              }
            : therapist
        )
      );

      setPrices((currentPrices) => ({
        ...currentPrices,
        [therapistId]: String(savedPrice),
      }));

      alert(`Price updated successfully to $${savedPrice}.`);
    } catch (error) {
      console.error("Update price error:", error);
      alert("Unexpected error while updating the price.");
    } finally {
      setProcessingId(null);
    }
  };

  const deleteTherapist = async (therapistId: string) => {
    const confirmDelete = confirm(
      "Delete this therapist profile? This action cannot be undone."
    );

    if (!confirmDelete) return;

    setProcessingId(therapistId);

    try {
      const accessToken = await getAccessToken();

      if (!accessToken) {
        alert("Your session has expired. Please log in again.");
        window.location.href = "/login";
        return;
      }

      const response = await fetch("/api/admin/therapists", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          therapistId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || "Error deleting therapist.");
        return;
      }

      setTherapists((currentTherapists) =>
        currentTherapists.filter(
          (therapist) => therapist.id !== therapistId
        )
      );

      setPrices((currentPrices) => {
        const updatedPrices = { ...currentPrices };
        delete updatedPrices[therapistId];
        return updatedPrices;
      });

      alert("Therapist profile deleted.");
    } catch (error) {
      console.error("Delete therapist error:", error);
      alert("Unexpected error while deleting the therapist.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-100 p-10">
        <section className="mx-auto max-w-7xl rounded-3xl bg-white p-10 shadow-xl">
          <h1 className="mb-4 text-5xl font-bold text-slate-900">
            Manage Therapists
          </h1>

          <p className="mb-10 text-xl text-slate-600">
            Manage therapist profiles and session prices. Administrator
            accounts are not displayed on this page.
          </p>

          {loading ? (
            <p className="text-slate-600">Loading therapists...</p>
          ) : therapists.length === 0 ? (
            <p className="text-slate-600">
              No therapist accounts found.
            </p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {therapists.map((therapist) => {
                const isProcessing = processingId === therapist.id;

                return (
                  <article
                    key={therapist.id}
                    className="rounded-2xl bg-slate-100 p-6"
                  >
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                      <h2 className="text-3xl font-bold text-slate-900">
                        {therapist.full_name || "Unnamed therapist"}
                      </h2>

                      <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
                        Therapist
                      </span>
                    </div>

                    <p className="text-slate-700">
                      {therapist.email || "Email unavailable"}
                    </p>

                    <p className="mt-2 text-slate-700">
                      {therapist.specialty || "No specialty"}
                    </p>

                    <p className="mt-4 text-slate-600">
                      {therapist.bio || "No bio yet."}
                    </p>

                    <p className="mt-5 text-xl font-bold text-slate-900">
                      Current price: ${therapist.price}/session
                    </p>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={prices[therapist.id] ?? ""}
                        onChange={(event) =>
                          setPrices((currentPrices) => ({
                            ...currentPrices,
                            [therapist.id]: event.target.value,
                          }))
                        }
                        disabled={isProcessing}
                        className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-slate-900 disabled:bg-slate-200"
                        placeholder="Session price"
                      />

                      <button
                        type="button"
                        onClick={() => updatePrice(therapist.id)}
                        disabled={isProcessing}
                        className="rounded-xl bg-black px-5 py-3 text-white disabled:bg-slate-400"
                      >
                        {isProcessing ? "Updating..." : "Update Price"}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteTherapist(therapist.id)}
                      disabled={isProcessing}
                      className="mt-6 rounded-xl bg-red-600 px-5 py-3 text-white disabled:bg-slate-400"
                    >
                      {isProcessing
                        ? "Processing..."
                        : "Delete Therapist"}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
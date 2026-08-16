"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

type BookingStatus = {
  id: string;
  status: string;
  therapist_name: string | null;
  slot_day: string | null;
  slot_time: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  meeting_url: string | null;
  meeting_provider: string | null;
  calendar_event_id: string | null;
};

function SuccessContent() {
  const searchParams =
    useSearchParams();

  const router =
    useRouter();

  const bookingId =
    searchParams.get("bookingId");

  const sessionId =
    searchParams.get("session_id");

  const [booking, setBooking] =
    useState<BookingStatus | null>(
      null,
    );

  const [message, setMessage] =
    useState(
      "Confirming your payment...",
    );

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let cancelled = false;

    const verifyPayment =
      async () => {
        if (
          !sessionId ||
          !bookingId
        ) {
          if (!cancelled) {
            setMessage(
              "Payment reference is incomplete.",
            );

            setLoading(false);
          }

          return;
        }

        /*
         * Retry quelques fois car le webhook Stripe
         * peut terminer juste après le retour
         * vers la page success.
         */
        for (
          let attempt = 0;
          attempt < 8;
          attempt += 1
        ) {
          try {
            const params =
              new URLSearchParams({
                session_id:
                  sessionId,
                bookingId,
              });

            const response =
              await fetch(
                `/api/payment-status?${params.toString()}`,
                {
                  cache: "no-store",
                },
              );

            const data =
              await response.json();

            if (!response.ok) {
              throw new Error(
                data.error ||
                  "Unable to verify payment.",
              );
            }

            if (
              data.paymentStatus !==
              "paid"
            ) {
              if (!cancelled) {
                setMessage(
                  "Your payment is still being confirmed...",
                );
              }
            } else if (
              data.booking?.status ===
              "paid"
            ) {
              if (cancelled) {
                return;
              }

              setBooking(
                data.booking,
              );

              setMessage(
                "Payment successful! Your booking is confirmed.",
              );

              setLoading(false);

              return;
            } else {
              if (!cancelled) {
                setMessage(
                  "Payment received. Finalising your booking...",
                );
              }
            }
          } catch (error) {
            console.error(
              "Payment confirmation error:",
              error,
            );
          }

          await new Promise(
            (resolve) =>
              window.setTimeout(
                resolve,
                1500,
              ),
          );
        }

        if (!cancelled) {
          setMessage(
            "Your payment was received, but the booking is still being finalised. Please check your dashboard shortly.",
          );

          setLoading(false);
        }
      };

    void verifyPayment();

    return () => {
      cancelled = true;
    };
  }, [
    bookingId,
    sessionId,
  ]);

  const formatDateTime = (
    value: string | null,
  ) => {
    if (!value) {
      return null;
    }

    return new Intl.DateTimeFormat(
      "en-GB",
      {
        dateStyle: "full",
        timeStyle: "short",
        timeZone:
          "Asia/Beirut",
      },
    ).format(
      new Date(value),
    );
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <section className="w-full max-w-2xl rounded-3xl bg-white p-8 text-center shadow-lg sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-700">
          ✓
        </div>

        <h1 className="mt-6 text-4xl font-bold text-slate-900 sm:text-5xl">
          Payment Successful
        </h1>

        <p className="mt-5 text-lg leading-8 text-slate-600">
          {message}
        </p>

        {booking && (
          <div className="mt-8 rounded-2xl bg-slate-50 p-6 text-left">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Booking details
            </p>

            <p className="mt-4 text-lg text-slate-800">
              <strong>
                Therapist:
              </strong>{" "}
              {booking.therapist_name ||
                "Therapist"}
            </p>

            {booking.scheduled_start && (
              <p className="mt-3 text-lg text-slate-800">
                <strong>
                  Session:
                </strong>{" "}
                {formatDateTime(
                  booking.scheduled_start,
                )}
              </p>
            )}

            {booking.meeting_url && (
              <a
                href={
                  booking.meeting_url
                }
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white"
              >
                Join Google Meet
              </a>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() =>
            router.push(
              "/dashboard",
            )
          }
          disabled={loading}
          className="mt-8 rounded-2xl bg-[#415a72] px-7 py-3 font-semibold text-white disabled:opacity-50"
        >
          Go to dashboard
        </button>
      </section>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
          <p>
            Confirming payment...
          </p>
        </main>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
"use client";

import { FormEvent, useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import ProtectedRoute from "../components/ProtectedRoute";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/i18n/LanguageProvider";

type AdminUser = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
};

export default function AdminUsersPage() {
  const { isArabic } = useLanguage();

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const copy = isArabic
    ? {
        title: "إدارة المسؤولين",

        description:
          "دعوة مسؤول جديد وإدارة حسابات المسؤولين.",

        email: "البريد الإلكتروني",

        placeholder: "example@email.com",

        invite: "إرسال الدعوة",

        sending: "جارٍ الإرسال...",

        currentAdmins: "المسؤولون الحاليون",

        noAdmins: "لا يوجد مسؤولون.",

        success:
          "تم إرسال الدعوة بنجاح.",

        error:
          "تعذر إرسال الدعوة.",
      }
    : {
        title: "Manage Administrators",

        description:
          "Invite a new administrator and manage administrator accounts.",

        email: "Email address",

        placeholder: "example@email.com",

        invite: "Send invitation",

        sending: "Sending...",

        currentAdmins:
          "Current administrators",

        noAdmins:
          "No administrators found.",

        success:
          "Invitation sent successfully.",

        error:
          "Unable to send invitation.",
      };

  async function loadAdmins() {
    setLoading(true);

    const { data } = await supabase
      .from("profiles")
      .select(
        "id,email,full_name,created_at",
      )
      .eq("role", "admin")
      .order("created_at", {
        ascending: true,
      });

    setAdmins((data ?? []) as AdminUser[]);
    setLoading(false);
  }

  useEffect(() => {
    void loadAdmins();
  }, []);
    async function inviteAdmin(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSuccess("");
    setError("");

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    if (!normalizedEmail) {
      setError(copy.error);
      return;
    }

    setSending(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch(
        "/api/invite-admin",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session?.access_token
              ? {
                  Authorization: `Bearer ${session.access_token}`,
                }
              : {}),
          },
          body: JSON.stringify({
            email: normalizedEmail,
            language: isArabic
              ? "ar"
              : "en",
          }),
        },
      );

      const result = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || copy.error,
        );
      }

      setSuccess(copy.success);
      setEmail("");

      await loadAdmins();
    } catch (inviteError) {
      console.error(
        "Invite admin error:",
        inviteError,
      );

      setError(
        inviteError instanceof Error
          ? inviteError.message
          : copy.error,
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <>
        <Navbar />

        <main
          dir={isArabic ? "rtl" : "ltr"}
          className="min-h-screen bg-aan-background px-5 py-10 sm:px-8 lg:px-10"
        >
          <section className="mx-auto max-w-6xl">
            <div className="aan-card p-7 sm:p-9 lg:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-aan-gold">
                AAN Administration
              </p>

              <h1 className="aan-heading mt-4 text-4xl sm:text-5xl">
                {copy.title}
              </h1>

              <p className="mt-4 max-w-3xl text-lg leading-8 text-aan-secondary">
                {copy.description}
              </p>
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
              <section className="aan-card p-7 sm:p-8">
                <h2 className="text-2xl font-semibold text-aan-navy">
                  {copy.invite}
                </h2>

                <form
                  onSubmit={inviteAdmin}
                  className="mt-6"
                >
                  <label className="grid gap-2 font-semibold text-aan-navy">
                    {copy.email}

                    <input
                      type="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(
                          event.target.value,
                        )
                      }
                      placeholder={copy.placeholder}
                      autoComplete="email"
                      required
                      className="aan-field p-4 font-normal"
                    />
                  </label>

                  {success && (
                    <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                      {success}
                    </p>
                  )}

                  {error && (
                    <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={sending}
                    className="aan-cta mt-6 w-full rounded-2xl px-5 py-4 font-bold text-white disabled:opacity-60"
                  >
                    {sending
                      ? copy.sending
                      : copy.invite}
                  </button>
                </form>
              </section>
                            <section className="aan-card p-7 sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-aan-gold">
                      AAN
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold text-aan-navy">
                      {copy.currentAdmins}
                    </h2>
                  </div>

                  <span className="rounded-full border border-aan-border bg-aan-background px-4 py-2 text-sm font-bold text-aan-navy">
                    {admins.length}
                  </span>
                </div>

                {loading ? (
                  <div className="mt-6 rounded-2xl border border-aan-border bg-aan-background p-6">
                    <p className="text-aan-secondary">
                      {isArabic
                        ? "جارٍ تحميل المسؤولين..."
                        : "Loading administrators..."}
                    </p>
                  </div>
                ) : admins.length === 0 ? (
                  <div className="mt-6 rounded-2xl border border-dashed border-aan-border bg-aan-background p-6 text-center">
                    <p className="text-aan-secondary">
                      {copy.noAdmins}
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 grid gap-4">
                    {admins.map((admin) => (
                      <article
                        key={admin.id}
                        className="rounded-2xl border border-aan-border bg-aan-background p-5"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-aan-button text-lg font-bold text-white">
                            {(admin.full_name ||
                              admin.email ||
                              "A")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-lg font-semibold text-aan-navy">
                              {admin.full_name ||
                                (isArabic
                                  ? "مسؤول"
                                  : "Administrator")}
                            </h3>

                            <p className="mt-1 break-all text-sm text-aan-secondary">
                              {admin.email}
                            </p>

                            <p className="mt-2 text-xs text-aan-secondary">
                              {isArabic
                                ? "تاريخ الإنشاء:"
                                : "Created:"}{" "}
                              {new Intl.DateTimeFormat(
                                isArabic
                                  ? "ar-LB"
                                  : "en-GB",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                },
                              ).format(
                                new Date(
                                  admin.created_at,
                                ),
                              )}
                            </p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
                        <section className="mt-8 rounded-[2rem] border border-aan-border bg-white p-7 shadow-[var(--aan-shadow-sm)] sm:p-8">
              <h2 className="text-2xl font-semibold text-aan-navy">
                {isArabic
                  ? "كيف يعمل النظام؟"
                  : "How does it work?"}
              </h2>

              <div className="mt-6 grid gap-5 md:grid-cols-3">
                <div className="rounded-2xl border border-aan-border bg-aan-background p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-aan-button text-xl font-bold text-white">
                    1
                  </div>

                  <h3 className="text-lg font-semibold text-aan-navy">
                    {isArabic
                      ? "إرسال الدعوة"
                      : "Send invitation"}
                  </h3>

                  <p className="mt-3 leading-7 text-aan-secondary">
                    {isArabic
                      ? "أدخل البريد الإلكتروني للمسؤول الجديد وسيتم إرسال رسالة دعوة إليه."
                      : "Enter the email address of the future administrator. An invitation email will be sent automatically."}
                  </p>
                </div>

                <div className="rounded-2xl border border-aan-border bg-aan-background p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-aan-button text-xl font-bold text-white">
                    2
                  </div>

                  <h3 className="text-lg font-semibold text-aan-navy">
                    {isArabic
                      ? "إنشاء الحساب"
                      : "Create account"}
                  </h3>

                  <p className="mt-3 leading-7 text-aan-secondary">
                    {isArabic
                      ? "يفتح المسؤول الجديد رابط الدعوة ويختار كلمة المرور الخاصة به."
                      : "The invited administrator opens the invitation link and chooses a password."}
                  </p>
                </div>

                <div className="rounded-2xl border border-aan-border bg-aan-background p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-aan-button text-xl font-bold text-white">
                    3
                  </div>

                  <h3 className="text-lg font-semibold text-aan-navy">
                    {isArabic
                      ? "الوصول الكامل"
                      : "Administrator access"}
                  </h3>

                  <p className="mt-3 leading-7 text-aan-secondary">
                    {isArabic
                      ? "بعد تفعيل الحساب يصبح للمسؤول جميع صلاحيات الإدارة."
                      : "Once the account is activated, the user immediately receives administrator permissions."}
                  </p>
                </div>
              </div>
            </section>
          </section>
        </main>
      </>
    </ProtectedRoute>
  );
}

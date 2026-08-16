"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useParams } from "next/navigation";

import Navbar from "../../components/Navbar";
import ProtectedRoute from "../../components/ProtectedRoute";
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
};

type SessionNote = {
  id: string;
  patient_record_id: string;
  therapist_id: string;
  session_date: string;
  note: string;
  created_at: string;
  updated_at: string;
};

export default function TherapistPatientRecordPage() {
  const params = useParams();
  const { isArabic } = useLanguage();

  const recordId =
    typeof params.recordId === "string"
      ? params.recordId
      : "";

  const [record, setRecord] =
    useState<PatientRecord | null>(null);

  const [patient, setPatient] =
    useState<PatientProfile | null>(null);

  const [notes, setNotes] =
    useState<SessionNote[]>([]);

  // New note
  const [newNote, setNewNote] =
    useState("");

  const [sessionDate, setSessionDate] =
    useState("");

  // Edit note
  const [editingNoteId, setEditingNoteId] =
    useState<string | null>(null);

  const [editingNoteText, setEditingNoteText] =
    useState("");

  const [editingSessionDate, setEditingSessionDate] =
    useState("");

  // Loading states
  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [updatingNoteId, setUpdatingNoteId] =
    useState<string | null>(null);

  const [deletingNoteId, setDeletingNoteId] =
    useState<string | null>(null);

  // Messages
  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const copy = isArabic
    ? {
        eyebrow: "ملف المريض",
        title: "متابعة المريض",
        description:
          "مراجعة الجلسات السابقة وإضافة ملاحظات سريرية سرية بعد كل جلسة.",

        patient: "المريض",
        email: "البريد الإلكتروني",
        recordCreated: "تاريخ إنشاء الملف",

        sessionHistory: "سجل الجلسات",
        noNotes:
          "لا توجد ملاحظات جلسات حتى الآن.",

        newNoteTitle: "إضافة ملاحظة جلسة",
        sessionDate: "تاريخ الجلسة",
        noteLabel: "ملاحظات سريرية",
        notePlaceholder:
          "اكتب ملاحظات الجلسة هنا...",

        saveNote: "حفظ الملاحظة",
        saving: "جارٍ الحفظ...",

        edit: "تعديل",
        delete: "حذف",
        cancel: "إلغاء",
        saveChanges: "حفظ التعديلات",
        updating: "جارٍ التحديث...",
        deleting: "جارٍ الحذف...",

        saved: "تم الحفظ:",
        updated: "آخر تعديل:",

        loadError:
          "تعذر تحميل ملف المريض.",

        saveError:
          "تعذر حفظ ملاحظة الجلسة.",

        saveSuccess:
          "تم حفظ ملاحظة الجلسة بنجاح.",

        updateError:
          "تعذر تعديل الملاحظة.",

        updateSuccess:
          "تم تعديل الملاحظة بنجاح.",

        deleteError:
          "تعذر حذف الملاحظة.",

        deleteSuccess:
          "تم حذف الملاحظة بنجاح.",

        deleteConfirm:
          "هل أنت متأكد من حذف هذه الملاحظة؟ لا يمكن التراجع عن هذا الإجراء.",

        unknownPatient: "مريض",
        noEmail: "لا يوجد بريد إلكتروني",
      }
    : {
        eyebrow: "Patient record",
        title: "Patient follow-up",
        description:
          "Review previous sessions and add confidential clinical notes after each session.",

        patient: "Patient",
        email: "Email",
        recordCreated: "Record created",

        sessionHistory: "Session history",
        noNotes:
          "No session notes yet.",

        newNoteTitle: "Add session note",
        sessionDate: "Session date",
        noteLabel: "Clinical notes",
        notePlaceholder:
          "Write the session notes here...",

        saveNote: "Save note",
        saving: "Saving...",

        edit: "Edit",
        delete: "Delete",
        cancel: "Cancel",
        saveChanges: "Save changes",
        updating: "Updating...",
        deleting: "Deleting...",

        saved: "Saved:",
        updated: "Last updated:",

        loadError:
          "Unable to load the patient record.",

        saveError:
          "Unable to save the session note.",

        saveSuccess:
          "Session note saved successfully.",

        updateError:
          "Unable to update the session note.",

        updateSuccess:
          "Session note updated successfully.",

        deleteError:
          "Unable to delete the session note.",

        deleteSuccess:
          "Session note deleted successfully.",

        deleteConfirm:
          "Are you sure you want to delete this clinical note? This action cannot be undone.",

        unknownPatient: "Patient",
        noEmail: "No email available",
      };

  const clearMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  const loadRecord = useCallback(async () => {
    if (!recordId) {
      setErrorMessage(copy.loadError);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const {
        data: recordData,
        error: recordError,
      } = await supabase
        .from("patient_records")
        .select(
          "id, patient_id, created_at, updated_at",
        )
        .eq("id", recordId)
        .single();

      if (recordError) {
        throw recordError;
      }

      const patientRecord =
        recordData as PatientRecord;

      setRecord(patientRecord);

      const {
        data: patientData,
        error: patientError,
      } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("id", patientRecord.patient_id)
        .single();

      if (patientError) {
        throw patientError;
      }

      setPatient(
        patientData as PatientProfile,
      );

      const {
        data: noteRows,
        error: notesError,
      } = await supabase
        .from("session_notes")
        .select(
          "id, patient_record_id, therapist_id, session_date, note, created_at, updated_at",
        )
        .eq(
          "patient_record_id",
          recordId,
        )
        .order("session_date", {
          ascending: false,
        });

      if (notesError) {
        throw notesError;
      }

      setNotes(
        (noteRows ?? []) as SessionNote[],
      );
    } catch (error) {
      console.error(
        "Patient record load error:",
        error,
      );

      setErrorMessage(copy.loadError);
    } finally {
      setLoading(false);
    }
  }, [recordId, copy.loadError]);

  useEffect(() => {
    void loadRecord();
  }, [loadRecord]);
    const saveNote = async () => {
    const cleanNote = newNote.trim();

    if (!recordId || !cleanNote || !sessionDate) {
      setErrorMessage(
        isArabic
          ? "يرجى إدخال تاريخ الجلسة والملاحظات."
          : "Please enter the session date and clinical notes.",
      );
      return;
    }

    setSaving(true);
    clearMessages();

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("No authenticated therapist.");
      }

      const sessionDateIso =
        new Date(sessionDate).toISOString();

      const {
        data: insertedNote,
        error: insertError,
      } = await supabase
        .from("session_notes")
        .insert({
          patient_record_id: recordId,
          therapist_id: user.id,
          session_date: sessionDateIso,
          note: cleanNote,
        })
        .select(
          "id, patient_record_id, therapist_id, session_date, note, created_at, updated_at",
        )
        .single();

      if (insertError) {
        throw insertError;
      }

      setNotes((current) => [
        insertedNote as SessionNote,
        ...current,
      ]);

      setNewNote("");
      setSessionDate("");
      setSuccessMessage(copy.saveSuccess);
    } catch (error) {
      console.error(
        "Session note save error:",
        error,
      );

      setErrorMessage(copy.saveError);
    } finally {
      setSaving(false);
    }
  };

  const toDateTimeLocalValue = (
    date: string,
  ) => {
    const value = new Date(date);

    const offset =
      value.getTimezoneOffset();

    const localDate = new Date(
      value.getTime() -
        offset * 60 * 1000,
    );

    return localDate
      .toISOString()
      .slice(0, 16);
  };

  const startEditingNote = (
    item: SessionNote,
  ) => {
    clearMessages();

    setEditingNoteId(item.id);
    setEditingNoteText(item.note);

    setEditingSessionDate(
      toDateTimeLocalValue(
        item.session_date,
      ),
    );
  };

  const cancelEditingNote = () => {
    setEditingNoteId(null);
    setEditingNoteText("");
    setEditingSessionDate("");
  };

  const updateNote = async (
    noteId: string,
  ) => {
    const cleanNote =
      editingNoteText.trim();

    if (
      !cleanNote ||
      !editingSessionDate
    ) {
      setErrorMessage(
        isArabic
          ? "يرجى إدخال تاريخ الجلسة والملاحظات."
          : "Please enter the session date and clinical notes.",
      );

      return;
    }

    setUpdatingNoteId(noteId);
    clearMessages();

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error(
          "No authenticated therapist.",
        );
      }

      const sessionDateIso =
        new Date(
          editingSessionDate,
        ).toISOString();

      const updatedAt =
        new Date().toISOString();

      const {
        data: updatedNote,
        error: updateError,
      } = await supabase
        .from("session_notes")
        .update({
          note: cleanNote,
          session_date: sessionDateIso,
          updated_at: updatedAt,
        })
        .eq("id", noteId)
        .eq(
          "therapist_id",
          user.id,
        )
        .select(
          "id, patient_record_id, therapist_id, session_date, note, created_at, updated_at",
        )
        .single();

      if (updateError) {
        throw updateError;
      }

      setNotes((current) =>
        current
          .map((item) =>
            item.id === noteId
              ? (updatedNote as SessionNote)
              : item,
          )
          .sort(
            (a, b) =>
              new Date(
                b.session_date,
              ).getTime() -
              new Date(
                a.session_date,
              ).getTime(),
          ),
      );

      cancelEditingNote();

      setSuccessMessage(
        copy.updateSuccess,
      );
    } catch (error) {
      console.error(
        "Session note update error:",
        error,
      );

      setErrorMessage(
        copy.updateError,
      );
    } finally {
      setUpdatingNoteId(null);
    }
  };

  const deleteNote = async (
    noteId: string,
  ) => {
    const confirmed =
      window.confirm(
        copy.deleteConfirm,
      );

    if (!confirmed) {
      return;
    }

    setDeletingNoteId(noteId);
    clearMessages();

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error(
          "No authenticated therapist.",
        );
      }

      const {
        error: deleteError,
      } = await supabase
        .from("session_notes")
        .delete()
        .eq("id", noteId)
        .eq(
          "therapist_id",
          user.id,
        );

      if (deleteError) {
        throw deleteError;
      }

      setNotes((current) =>
        current.filter(
          (item) =>
            item.id !== noteId,
        ),
      );

      if (
        editingNoteId === noteId
      ) {
        cancelEditingNote();
      }

      setSuccessMessage(
        copy.deleteSuccess,
      );
    } catch (error) {
      console.error(
        "Session note delete error:",
        error,
      );

      setErrorMessage(
        copy.deleteError,
      );
    } finally {
      setDeletingNoteId(null);
    }
  };

  const formatDateTime = (
    date: string,
  ) => {
    return new Intl.DateTimeFormat(
      isArabic ? "ar-LB" : "en-GB",
      {
        dateStyle: "medium",
        timeStyle: "short",
      },
    ).format(new Date(date));
  };

  const formatDate = (
    date: string,
  ) => {
    return new Intl.DateTimeFormat(
      isArabic ? "ar-LB" : "en-GB",
      {
        dateStyle: "medium",
      },
    ).format(new Date(date));
  };

  const patientName =
    patient?.full_name?.trim() ||
    copy.unknownPatient;

  const patientEmail =
    patient?.email?.trim() ||
    copy.noEmail;

  const firstLetter =
    patientName
      .charAt(0)
      .toUpperCase() || "P";
        return (
    <ProtectedRoute allowedRoles={["therapist"]}>
      <>
        <Navbar />

        <main
          dir={isArabic ? "rtl" : "ltr"}
          className="min-h-screen bg-aan-background px-5 py-10 sm:px-8 lg:px-10"
        >
          <section className="mx-auto max-w-6xl">
            {loading ? (
              <div className="aan-card p-8">
                <div className="flex items-center gap-4">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-aan-border border-t-aan-button" />

                  <p className="text-aan-secondary">
                    {isArabic
                      ? "جارٍ تحميل ملف المريض..."
                      : "Loading patient record..."}
                  </p>
                </div>
              </div>
            ) : errorMessage && !record ? (
              <div className="rounded-[2rem] border border-red-200 bg-red-50 p-8">
                <p className="font-semibold text-red-700">
                  {errorMessage}
                </p>
              </div>
            ) : (
              <>
                {/* Patient header */}

                <div className="aan-card p-7 sm:p-10 lg:p-12">
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-aan-gold">
                    {copy.eyebrow}
                  </p>

                  <h1 className="aan-heading mt-4 text-4xl sm:text-5xl lg:text-6xl">
                    {copy.title}
                  </h1>

                  <p className="mt-5 max-w-3xl text-lg leading-8 text-aan-secondary">
                    {copy.description}
                  </p>

                  <div className="mt-8 flex flex-col gap-5 rounded-[2rem] border border-aan-border bg-aan-background p-6 sm:flex-row sm:items-center">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-aan-button text-2xl font-bold text-white">
                      {firstLetter}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-aan-gold">
                        {copy.patient}
                      </p>

                      <h2 className="mt-1 text-2xl font-semibold text-aan-navy">
                        {patientName}
                      </h2>

                      <p className="mt-2 break-all text-aan-secondary">
                        {patientEmail}
                      </p>
                    </div>

                    {record && (
                      <div className="sm:ms-auto">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-aan-gold">
                          {copy.recordCreated}
                        </p>

                        <p className="mt-2 text-aan-secondary">
                          {formatDate(
                            record.created_at,
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages */}

                {errorMessage && (
                  <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 font-semibold text-red-700">
                    {errorMessage}
                  </div>
                )}

                {successMessage && (
                  <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 font-semibold text-emerald-700">
                    {successMessage}
                  </div>
                )}

                {/* Add new note */}

                <section className="mt-8 aan-card p-7 sm:p-8">
                  <h2 className="text-2xl font-semibold text-aan-navy sm:text-3xl">
                    {copy.newNoteTitle}
                  </h2>

                  <div className="mt-6 grid gap-6">
                    <div>
                      <label
                        htmlFor="session-date"
                        className="block font-bold text-aan-navy"
                      >
                        {copy.sessionDate}
                      </label>

                      <input
                        id="session-date"
                        type="datetime-local"
                        value={sessionDate}
                        onChange={(event) =>
                          setSessionDate(
                            event.target.value,
                          )
                        }
                        className="mt-3 w-full rounded-2xl border border-aan-border bg-white px-4 py-3.5 text-aan-navy outline-none transition focus:border-aan-button focus:ring-2 focus:ring-aan-button/15"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="session-note"
                        className="block font-bold text-aan-navy"
                      >
                        {copy.noteLabel}
                      </label>

                      <textarea
                        id="session-note"
                        rows={8}
                        maxLength={10000}
                        value={newNote}
                        onChange={(event) =>
                          setNewNote(
                            event.target.value,
                          )
                        }
                        placeholder={
                          copy.notePlaceholder
                        }
                        className="mt-3 w-full resize-y rounded-2xl border border-aan-border bg-white px-4 py-3.5 leading-7 text-aan-navy outline-none transition focus:border-aan-button focus:ring-2 focus:ring-aan-button/15"
                      />

                      <p className="mt-2 text-sm text-aan-secondary">
                        {newNote.length} / 10000
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          void saveNote()
                        }
                        disabled={saving}
                        className="aan-cta rounded-2xl px-7 py-3.5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving
                          ? copy.saving
                          : copy.saveNote}
                      </button>
                    </div>
                  </div>
                </section>

                {/* Session history */}

                <section className="mt-8 aan-card p-7 sm:p-8">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-aan-gold">
                        {isArabic
                          ? "المتابعة السريرية"
                          : "Clinical follow-up"}
                      </p>

                      <h2 className="mt-2 text-2xl font-semibold text-aan-navy sm:text-3xl">
                        {copy.sessionHistory}
                      </h2>
                    </div>

                    <p className="text-sm font-semibold text-aan-secondary">
                      {isArabic
                        ? `${notes.length} ملاحظة`
                        : `${notes.length} ${
                            notes.length === 1
                              ? "note"
                              : "notes"
                          }`}
                    </p>
                  </div>

                  {notes.length === 0 ? (
                    <div className="mt-6 rounded-2xl border border-dashed border-aan-border bg-aan-background p-8 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-aan-button shadow-[var(--aan-shadow-sm)]">
                        <svg
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                          className="h-7 w-7"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <path d="M6 4.5h12v15H6z" />
                          <path d="M9 8h6M9 11.5h6M9 15h4" />
                        </svg>
                      </div>

                      <p className="mt-4 text-aan-secondary">
                        {copy.noNotes}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-6 grid gap-5">
                                          {notes.map((item, index) => {
                        const isEditing =
                          editingNoteId === item.id;

                        const isUpdating =
                          updatingNoteId === item.id;

                        const isDeleting =
                          deletingNoteId === item.id;

                        const wasUpdated =
                          item.updated_at !== item.created_at;

                        return (
                          <article
                            key={item.id}
                            className="rounded-[2rem] border border-aan-border bg-aan-background p-6 sm:p-7"
                          >
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-aan-gold">
                                  {isArabic
                                    ? `الجلسة ${notes.length - index}`
                                    : `Session ${notes.length - index}`}
                                </p>

                                <h3 className="mt-2 text-xl font-semibold text-aan-navy">
                                  {formatDateTime(
                                    item.session_date,
                                  )}
                                </h3>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {!isEditing && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        startEditingNote(
                                          item,
                                        )
                                      }
                                      disabled={
                                        isDeleting ||
                                        isUpdating
                                      }
                                      className="rounded-xl border border-aan-border bg-white px-4 py-2 text-sm font-bold text-aan-navy transition hover:bg-aan-background disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {copy.edit}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        void deleteNote(
                                          item.id,
                                        )
                                      }
                                      disabled={
                                        isDeleting ||
                                        isUpdating
                                      }
                                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {isDeleting
                                        ? copy.deleting
                                        : copy.delete}
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {isEditing ? (
                              <div className="mt-5 grid gap-5 rounded-2xl border border-aan-border bg-white p-5">
                                <div>
                                  <label
                                    htmlFor={`edit-session-date-${item.id}`}
                                    className="block text-sm font-bold text-aan-navy"
                                  >
                                    {copy.sessionDate}
                                  </label>

                                  <input
                                    id={`edit-session-date-${item.id}`}
                                    type="datetime-local"
                                    value={
                                      editingSessionDate
                                    }
                                    onChange={(event) =>
                                      setEditingSessionDate(
                                        event.target.value,
                                      )
                                    }
                                    className="mt-3 w-full rounded-2xl border border-aan-border bg-white px-4 py-3 text-aan-navy outline-none transition focus:border-aan-button focus:ring-2 focus:ring-aan-button/15"
                                  />
                                </div>

                                <div>
                                  <label
                                    htmlFor={`edit-session-note-${item.id}`}
                                    className="block text-sm font-bold text-aan-navy"
                                  >
                                    {copy.noteLabel}
                                  </label>

                                  <textarea
                                    id={`edit-session-note-${item.id}`}
                                    rows={7}
                                    maxLength={10000}
                                    value={
                                      editingNoteText
                                    }
                                    onChange={(event) =>
                                      setEditingNoteText(
                                        event.target.value,
                                      )
                                    }
                                    className="mt-3 w-full resize-y rounded-2xl border border-aan-border bg-white px-4 py-3.5 leading-7 text-aan-navy outline-none transition focus:border-aan-button focus:ring-2 focus:ring-aan-button/15"
                                  />

                                  <p className="mt-2 text-sm text-aan-secondary">
                                    {
                                      editingNoteText.length
                                    }{" "}
                                    / 10000
                                  </p>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                                  <button
                                    type="button"
                                    onClick={
                                      cancelEditingNote
                                    }
                                    disabled={
                                      isUpdating
                                    }
                                    className="rounded-2xl border border-aan-border bg-white px-5 py-3 font-bold text-aan-navy transition hover:bg-aan-background disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {copy.cancel}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      void updateNote(
                                        item.id,
                                      )
                                    }
                                    disabled={
                                      isUpdating
                                    }
                                    className="aan-cta rounded-2xl px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {isUpdating
                                      ? copy.updating
                                      : copy.saveChanges}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-5 rounded-2xl border border-aan-border bg-white p-5">
                                <p className="whitespace-pre-wrap break-words leading-8 text-aan-secondary">
                                  {item.note}
                                </p>
                              </div>
                            )}

                            <div className="mt-4 flex flex-col gap-2 text-sm text-aan-secondary sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <span>
                                  {copy.saved}
                                </span>{" "}
                                <span className="font-semibold">
                                  {formatDateTime(
                                    item.created_at,
                                  )}
                                </span>
                              </div>

                              {wasUpdated && (
                                <div>
                                  <span>
                                    {copy.updated}
                                  </span>{" "}
                                  <span className="font-semibold">
                                    {formatDateTime(
                                      item.updated_at,
                                    )}
                                  </span>
                                </div>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              </>
            )}
          </section>
        </main>
      </>
    </ProtectedRoute>
  );
}
                    
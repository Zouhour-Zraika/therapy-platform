"use client";

import {
  MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/i18n/LanguageProvider";

type UserRole = "admin" | "patient" | "therapist" | null;
type FeedbackStatus = "open" | "in_progress" | "done";

type SiteFeedback = {
  id: string;
  page_path: string;
  page_url: string;
  note: string;
  element_text: string | null;
  element_tag: string | null;
  x_position: number | null;
  y_position: number | null;
  page_width: number | null;
  page_height: number | null;
  status: FeedbackStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
};

type SelectedElement = {
  text: string;
  tag: string;
  x: number;
  y: number;
  pageWidth: number;
  pageHeight: number;
};

export default function FeedbackMode() {
  const pathname = usePathname();
  const { isArabic } = useLanguage();

  const [role, setRole] = useState<UserRole>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);

  const [reviewMode, setReviewMode] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [feedback, setFeedback] = useState<SiteFeedback[]>([]);
  const [selectedElement, setSelectedElement] =
    useState<SelectedElement | null>(null);

  const [note, setNote] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const copy = isArabic
    ? {
        reviewMode: "وضع الملاحظات",
        reviewActive: "وضع الملاحظات مفعّل",
        reviewInactive: "وضع الملاحظات غير مفعّل",
        instruction:
          "اضغط على أي نص أو زر أو صورة في الصفحة لإضافة ملاحظة.",
        selectedElement: "العنصر المحدد",
        noteLabel: "الملاحظة",
        notePlaceholder: "اكتب التعديل المطلوب...",
        save: "حفظ الملاحظة",
        saving: "جارٍ الحفظ...",
        cancel: "إلغاء",
        notes: "الملاحظات",
        noNotes: "لا توجد ملاحظات على هذه الصفحة.",
        open: "مفتوحة",
        inProgress: "قيد التنفيذ",
        done: "منتهية",
        delete: "حذف",
        close: "إغلاق",
        required: "يرجى كتابة الملاحظة.",
        saveError: "تعذر حفظ الملاحظة.",
        loadError: "تعذر تحميل الملاحظات.",
        deleteError: "تعذر حذف الملاحظة.",
        updateError: "تعذر تحديث حالة الملاحظة.",
        saved: "تم حفظ الملاحظة.",
        pageNotes: "ملاحظات الصفحة",
      }
    : {
        reviewMode: "Review Mode",
        reviewActive: "Review mode is active",
        reviewInactive: "Review mode is inactive",
        instruction:
          "Click any text, button or image on the page to add a note.",
        selectedElement: "Selected element",
        noteLabel: "Note",
        notePlaceholder: "Describe the requested change...",
        save: "Save note",
        saving: "Saving...",
        cancel: "Cancel",
        notes: "Notes",
        noNotes: "There are no notes on this page.",
        open: "Open",
        inProgress: "In progress",
        done: "Done",
        delete: "Delete",
        close: "Close",
        required: "Please enter a note.",
        saveError: "Unable to save the note.",
        loadError: "Unable to load feedback.",
        deleteError: "Unable to delete the note.",
        updateError: "Unable to update the note status.",
        saved: "Note saved.",
        pageNotes: "Page notes",
      };

  const loadCurrentUser = useCallback(async () => {
    setLoadingRole(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setRole(null);
      setUserId(null);
      setLoadingRole(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Feedback profile error:", profileError);
      setRole(null);
      setUserId(null);
      setLoadingRole(false);
      return;
    }

    setRole((profile?.role as UserRole) || null);
    setUserId(user.id);
    setLoadingRole(false);
  }, []);

  const loadFeedback = useCallback(async () => {
    if (role !== "admin") {
      return;
    }

    const { data, error } = await supabase
      .from("site_feedback")
      .select("*")
      .eq("page_path", pathname)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Feedback load error:", error);
      setErrorMessage(copy.loadError);
      return;
    }

    setFeedback((data as SiteFeedback[] | null) || []);
  }, [copy.loadError, pathname, role]);

  useEffect(() => {
    void loadCurrentUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadCurrentUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadCurrentUser]);

  useEffect(() => {
    if (role === "admin") {
      void loadFeedback();
    }
  }, [loadFeedback, role]);

  useEffect(() => {
    setReviewMode(false);
    setPanelOpen(false);
    setSelectedElement(null);
    setNote("");
    setSuccessMessage("");
    setErrorMessage("");
  }, [pathname]);

  useEffect(() => {
    if (!reviewMode) {
      document.body.style.cursor = "";
      return;
    }

    document.body.style.cursor = "crosshair";

    return () => {
      document.body.style.cursor = "";
    };
  }, [reviewMode]);

  const isFeedbackUiElement = (target: HTMLElement) => {
    return Boolean(target.closest("[data-feedback-ui='true']"));
  };

  const getUsefulText = (element: HTMLElement) => {
    if (element instanceof HTMLImageElement) {
      return element.alt || element.src || "Image";
    }

    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement
    ) {
      return (
        element.value ||
        element.placeholder ||
        element.getAttribute("aria-label") ||
        element.tagName
      );
    }

    const text =
      element.innerText?.trim() ||
      element.getAttribute("aria-label") ||
      element.getAttribute("title") ||
      element.tagName;

    return text.slice(0, 500);
  };

  const handlePageClick = (
    event: ReactMouseEvent<HTMLDivElement>,
  ) => {
    if (!reviewMode) {
      return;
    }

    const target = event.target as HTMLElement;

    if (isFeedbackUiElement(target)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const rect = target.getBoundingClientRect();

    const absoluteX =
      rect.left + window.scrollX + rect.width / 2;

    const absoluteY =
      rect.top + window.scrollY + rect.height / 2;

    setSelectedElement({
      text: getUsefulText(target),
      tag: target.tagName.toLowerCase(),
      x: absoluteX,
      y: absoluteY,
      pageWidth: document.documentElement.scrollWidth,
      pageHeight: document.documentElement.scrollHeight,
    });

    setNote("");
    setErrorMessage("");
    setSuccessMessage("");
    setPanelOpen(true);
  };

  const saveFeedback = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!note.trim()) {
      setErrorMessage(copy.required);
      return;
    }

    if (!selectedElement || !userId) {
      setErrorMessage(copy.saveError);
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("site_feedback")
      .insert({
        page_path: pathname,
        page_url: window.location.href,
        note: note.trim(),
        element_text: selectedElement.text,
        element_tag: selectedElement.tag,
        x_position: selectedElement.x,
        y_position: selectedElement.y,
        page_width: selectedElement.pageWidth,
        page_height: selectedElement.pageHeight,
        status: "open",
        created_by: userId,
      });

    if (error) {
      console.error("Feedback save error:", error);
      setErrorMessage(copy.saveError);
      setSaving(false);
      return;
    }

    setSuccessMessage(copy.saved);
    setNote("");
    setSelectedElement(null);
    setSaving(false);

    await loadFeedback();

    window.setTimeout(() => {
      setSuccessMessage("");
      setPanelOpen(false);
    }, 900);
  };

  const updateStatus = async (
    id: string,
    status: FeedbackStatus,
  ) => {
    const { error } = await supabase
      .from("site_feedback")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("Feedback update error:", error);
      alert(copy.updateError);
      return;
    }

    await loadFeedback();
  };

  const deleteFeedback = async (id: string) => {
    const confirmed = window.confirm(
      isArabic
        ? "هل تريد حذف هذه الملاحظة؟"
        : "Delete this note?",
    );

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("site_feedback")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Feedback delete error:", error);
      alert(copy.deleteError);
      return;
    }

    await loadFeedback();
  };

  const getMarkerPosition = (item: SiteFeedback) => {
    const currentWidth =
      document.documentElement.scrollWidth || 1;

    const currentHeight =
      document.documentElement.scrollHeight || 1;

    const originalWidth = item.page_width || currentWidth;
    const originalHeight = item.page_height || currentHeight;

    return {
      left:
        ((item.x_position || 0) / originalWidth) *
        currentWidth,
      top:
        ((item.y_position || 0) / originalHeight) *
        currentHeight,
    };
  };

  const statusLabel = (status: FeedbackStatus) => {
    if (status === "done") {
      return copy.done;
    }

    if (status === "in_progress") {
      return copy.inProgress;
    }

    return copy.open;
  };

  const statusClasses = (status: FeedbackStatus) => {
    if (status === "done") {
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }

    if (status === "in_progress") {
      return "border-blue-200 bg-blue-50 text-blue-700";
    }

    return "border-amber-200 bg-amber-50 text-amber-700";
  };

  if (loadingRole || role !== "admin") {
    return null;
  }

  return (
    <>
      <div
        onClickCapture={handlePageClick}
        className={`pointer-events-none fixed inset-0 z-[80] ${
          reviewMode ? "pointer-events-auto" : ""
        }`}
        aria-hidden="true"
      />

      {reviewMode &&
        feedback.map((item, index) => {
          const position = getMarkerPosition(item);

          return (
            <button
              key={item.id}
              type="button"
              data-feedback-ui="true"
              onClick={() => {
                setPanelOpen(true);
                setSelectedElement(null);
              }}
              style={{
                left: `${position.left}px`,
                top: `${position.top}px`,
              }}
              className="absolute z-[90] flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-red-600 text-sm font-bold text-white shadow-lg"
              title={item.note}
            >
              {index + 1}
            </button>
          );
        })}

      <div
        data-feedback-ui="true"
        dir={isArabic ? "rtl" : "ltr"}
        className={`fixed bottom-6 z-[100] ${
          isArabic ? "left-6" : "right-6"
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setReviewMode((current) => !current);
              setPanelOpen(false);
              setSelectedElement(null);
              setErrorMessage("");
            }}
            className={`rounded-2xl px-5 py-4 font-bold text-white shadow-xl transition ${
              reviewMode
                ? "bg-red-600 hover:bg-red-700"
                : "bg-aan-button hover:bg-aan-hover"
            }`}
          >
            {reviewMode
              ? `✓ ${copy.reviewMode}`
              : `✎ ${copy.reviewMode}`}
          </button>

          <button
            type="button"
            onClick={() => {
              setPanelOpen(true);
              setSelectedElement(null);
            }}
            className="rounded-2xl border border-aan-border bg-white px-5 py-4 font-bold text-aan-navy shadow-xl"
          >
            {copy.notes} ({feedback.length})
          </button>
        </div>
      </div>

      {reviewMode && (
        <div
          data-feedback-ui="true"
          dir={isArabic ? "rtl" : "ltr"}
          className="fixed left-1/2 top-24 z-[100] -translate-x-1/2 rounded-full border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-700 shadow-lg"
        >
          {copy.instruction}
        </div>
      )}

      {panelOpen && (
        <div
          data-feedback-ui="true"
          dir={isArabic ? "rtl" : "ltr"}
          className="fixed inset-0 z-[110] flex justify-end bg-black/25"
          onClick={() => setPanelOpen(false)}
        >
          <aside
            onClick={(event) => event.stopPropagation()}
            className="h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-aan-gold">
                  AAN Review
                </p>

                <h2 className="aan-heading mt-2 text-3xl">
                  {selectedElement
                    ? copy.noteLabel
                    : copy.pageNotes}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-aan-border text-2xl text-aan-navy"
              >
                ×
              </button>
            </div>

            {selectedElement ? (
              <div className="mt-8">
                <div className="rounded-2xl bg-[#fbf8f3] p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-aan-gold">
                    {copy.selectedElement}
                  </p>

                  <p className="mt-3 max-h-40 overflow-y-auto whitespace-pre-line text-sm leading-7 text-aan-secondary">
                    {selectedElement.text}
                  </p>

                  <p className="mt-3 text-xs font-bold text-aan-navy">
                    &lt;{selectedElement.tag}&gt;
                  </p>
                </div>

                <label className="mt-6 grid gap-2 font-bold text-aan-navy">
                  {copy.noteLabel}

                  <textarea
                    value={note}
                    onChange={(event) =>
                      setNote(event.target.value)
                    }
                    placeholder={copy.notePlaceholder}
                    className="aan-field min-h-40 resize-y p-4 font-normal"
                  />
                </label>

                {errorMessage && (
                  <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                    {errorMessage}
                  </p>
                )}

                {successMessage && (
                  <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                    {successMessage}
                  </p>
                )}

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedElement(null);
                      setNote("");
                      setPanelOpen(false);
                    }}
                    className="rounded-2xl border border-aan-border bg-white px-5 py-4 font-bold text-aan-navy"
                  >
                    {copy.cancel}
                  </button>

                  <button
                    type="button"
                    onClick={saveFeedback}
                    disabled={saving}
                    className="aan-cta rounded-2xl px-5 py-4 font-bold text-white disabled:opacity-60"
                  >
                    {saving ? copy.saving : copy.save}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-8">
                {feedback.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-aan-border bg-[#fbf8f3] p-8 text-center text-aan-secondary">
                    {copy.noNotes}
                  </div>
                ) : (
                  <div className="grid gap-5">
                    {feedback.map((item, index) => (
                      <article
                        key={item.id}
                        className="rounded-2xl border border-aan-border bg-[#fbf8f3] p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white">
                            {index + 1}
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1.5 text-xs font-bold ${statusClasses(
                              item.status,
                            )}`}
                          >
                            {statusLabel(item.status)}
                          </span>
                        </div>

                        <p className="mt-4 whitespace-pre-line font-semibold leading-7 text-aan-navy">
                          {item.note}
                        </p>

                        {item.element_text && (
                          <p className="mt-3 line-clamp-3 text-sm leading-6 text-aan-secondary">
                            {item.element_text}
                          </p>
                        )}

                        <select
                          value={item.status}
                          onChange={(event) =>
                            void updateStatus(
                              item.id,
                              event.target
                                .value as FeedbackStatus,
                            )
                          }
                          className="aan-field mt-5 w-full p-3 text-sm font-semibold"
                        >
                          <option value="open">
                            {copy.open}
                          </option>

                          <option value="in_progress">
                            {copy.inProgress}
                          </option>

                          <option value="done">
                            {copy.done}
                          </option>
                        </select>

                        <button
                          type="button"
                          onClick={() =>
                            void deleteFeedback(item.id)
                          }
                          className="mt-3 w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-50"
                        >
                          {copy.delete}
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
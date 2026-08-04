"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/i18n/LanguageProvider";

type FeedbackStatus =
  | "open"
  | "in_progress"
  | "done";

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
  created_by: string | null;
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

type ReviewAccessResponse = {
  allowed?: boolean;
  error?: string;
};

type FeedbackApiResponse = {
  feedback?: SiteFeedback[] | SiteFeedback;
  error?: string;
};

export default function FeedbackMode() {
  const pathname = usePathname();
  const { isArabic } = useLanguage();

  const [loadingAccess, setLoadingAccess] =
    useState(true);

  const [hasAccess, setHasAccess] =
    useState(false);

  const [isAdmin, setIsAdmin] =
    useState(false);

  const [accessModalOpen, setAccessModalOpen] =
    useState(false);

  const [accessCode, setAccessCode] =
    useState("");

  const [checkingCode, setCheckingCode] =
    useState(false);

  const [accessError, setAccessError] =
    useState("");

  const [reviewMode, setReviewMode] =
    useState(false);

  const [panelOpen, setPanelOpen] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [feedback, setFeedback] =
    useState<SiteFeedback[]>([]);

  const [
    selectedElement,
    setSelectedElement,
  ] = useState<SelectedElement | null>(null);

  const [note, setNote] = useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const copy = isArabic
    ? {
        reviewAccess: "الدخول إلى وضع الملاحظات",
        accessDescription:
          "أدخل رمز المراجعة لإضافة الملاحظات من دون تسجيل الدخول.",
        accessCode: "رمز المراجعة",
        accessPlaceholder: "أدخل الرمز...",
        unlock: "دخول",
        checking: "جارٍ التحقق...",
        invalidCode: "رمز المراجعة غير صحيح.",
        reviewMode: "وضع الملاحظات",
        openReview: "فتح وضع الملاحظات",
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
        required: "يرجى كتابة الملاحظة.",
        saveError: "تعذر حفظ الملاحظة.",
        loadError: "تعذر تحميل الملاحظات.",
        deleteError: "تعذر حذف الملاحظة.",
        updateError: "تعذر تحديث حالة الملاحظة.",
        saved: "تم حفظ الملاحظة.",
        pageNotes: "ملاحظات الصفحة",
        deleteQuestion: "هل تريد حذف هذه الملاحظة؟",
        close: "إغلاق",
        lockReview: "إغلاق وصول المراجعة",
      }
    : {
        reviewAccess: "Review access",
        accessDescription:
          "Enter the review code to leave notes without signing in.",
        accessCode: "Review code",
        accessPlaceholder: "Enter the code...",
        unlock: "Continue",
        checking: "Checking...",
        invalidCode: "The review code is incorrect.",
        reviewMode: "Review Mode",
        openReview: "Open Review Mode",
        instruction:
          "Click any text, button or image on the page to add a note.",
        selectedElement: "Selected element",
        noteLabel: "Note",
        notePlaceholder:
          "Describe the requested change...",
        save: "Save note",
        saving: "Saving...",
        cancel: "Cancel",
        notes: "Notes",
        noNotes: "There are no notes on this page.",
        open: "Open",
        inProgress: "In progress",
        done: "Done",
        delete: "Delete",
        required: "Please enter a note.",
        saveError: "Unable to save the note.",
        loadError: "Unable to load feedback.",
        deleteError: "Unable to delete the note.",
        updateError: "Unable to update the note status.",
        saved: "Note saved.",
        pageNotes: "Page notes",
        deleteQuestion: "Delete this note?",
        close: "Close",
        lockReview: "Close review access",
      };

  const getAccessToken =
    useCallback(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      return session?.access_token || null;
    }, []);

  const getApiHeaders =
    useCallback(async () => {
      const token = await getAccessToken();

      return {
        "Content-Type": "application/json",
        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
      };
    }, [getAccessToken]);

  const checkReviewAccess =
    useCallback(async () => {
      setLoadingAccess(true);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        let adminAccess = false;

        if (user) {
          const { data: profile } =
            await supabase
              .from("profiles")
              .select("role")
              .eq("id", user.id)
              .maybeSingle();

          adminAccess =
            profile?.role === "admin";
        }

        setIsAdmin(adminAccess);

        if (adminAccess) {
          setHasAccess(true);
          setLoadingAccess(false);
          return;
        }

        const response = await fetch(
          "/api/review-access",
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const result =
          (await response.json()) as ReviewAccessResponse;

        setHasAccess(
          response.ok && result.allowed === true,
        );
      } catch (error) {
        console.error(
          "Review access check error:",
          error,
        );

        setHasAccess(false);
      } finally {
        setLoadingAccess(false);
      }
    }, []);

  useEffect(() => {
    void checkReviewAccess();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void checkReviewAccess();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkReviewAccess]);

  const submitAccessCode = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setAccessError("");

    if (!accessCode.trim()) {
      setAccessError(copy.invalidCode);
      return;
    }

    setCheckingCode(true);

    try {
      const response = await fetch(
        "/api/review-access",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: accessCode.trim(),
          }),
        },
      );

      const result =
        (await response.json()) as ReviewAccessResponse;

      if (
        !response.ok ||
        result.allowed !== true
      ) {
        setAccessError(
          result.error || copy.invalidCode,
        );
        return;
      }

      setHasAccess(true);
      setAccessModalOpen(false);
      setAccessCode("");
      setReviewMode(true);
    } catch (error) {
      console.error(
        "Review code error:",
        error,
      );

      setAccessError(copy.invalidCode);
    } finally {
      setCheckingCode(false);
    }
  };

  const closeReviewAccess = async () => {
    if (!isAdmin) {
      await fetch("/api/review-access", {
        method: "DELETE",
      });
    }

    setHasAccess(isAdmin);
    setReviewMode(false);
    setPanelOpen(false);
    setSelectedElement(null);
    setFeedback([]);
  };
    const loadFeedback = useCallback(async () => {
    if (!hasAccess) {
      return;
    }

    setErrorMessage("");

    try {
      const headers = await getApiHeaders();

      const response = await fetch(
        `/api/site-feedback?pagePath=${encodeURIComponent(
          pathname,
        )}`,
        {
          method: "GET",
          headers,
          cache: "no-store",
        },
      );

      const result =
        (await response.json()) as FeedbackApiResponse;

      if (!response.ok) {
        throw new Error(
          result.error || copy.loadError,
        );
      }

      setFeedback(
        Array.isArray(result.feedback)
          ? result.feedback
          : [],
      );
    } catch (error) {
      console.error(
        "Feedback load error:",
        error,
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : copy.loadError,
      );
    }
  }, [
    copy.loadError,
    getApiHeaders,
    hasAccess,
    pathname,
  ]);

  useEffect(() => {
    if (hasAccess) {
      void loadFeedback();
    }
  }, [hasAccess, loadFeedback]);

  useEffect(() => {
    setReviewMode(false);
    setPanelOpen(false);
    setSelectedElement(null);
    setNote("");
    setErrorMessage("");
    setSuccessMessage("");

    if (hasAccess) {
      void loadFeedback();
    }
  }, [hasAccess, loadFeedback, pathname]);

  useEffect(() => {
    document.body.style.cursor =
      reviewMode ? "crosshair" : "";

    return () => {
      document.body.style.cursor = "";
    };
  }, [reviewMode]);

  const isFeedbackUiElement = (
    target: HTMLElement,
  ) => {
    return Boolean(
      target.closest(
        "[data-feedback-ui='true']",
      ),
    );
  };

  const getUsefulText = (
    element: HTMLElement,
  ) => {
    if (
      element instanceof HTMLImageElement
    ) {
      return (
        element.alt ||
        element.getAttribute(
          "aria-label",
        ) ||
        element.src ||
        "Image"
      );
    }

    if (
      element instanceof HTMLInputElement ||
      element instanceof
        HTMLTextAreaElement
    ) {
      return (
        element.value ||
        element.placeholder ||
        element.getAttribute(
          "aria-label",
        ) ||
        element.tagName
      );
    }

    const text =
      element.innerText?.trim() ||
      element.textContent?.trim() ||
      element.getAttribute(
        "aria-label",
      ) ||
      element.getAttribute("title") ||
      element.tagName;

    return text.slice(0, 500);
  };

  useEffect(() => {
    if (!reviewMode || !hasAccess) {
      return;
    }

    const handleDocumentClick = (
      event: MouseEvent,
    ) => {
      const target =
        event.target as HTMLElement | null;

      if (
        !target ||
        isFeedbackUiElement(target)
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const rect =
        target.getBoundingClientRect();

      setSelectedElement({
        text: getUsefulText(target),
        tag: target.tagName.toLowerCase(),
        x:
          rect.left +
          window.scrollX +
          rect.width / 2,
        y:
          rect.top +
          window.scrollY +
          rect.height / 2,
        pageWidth:
          document.documentElement
            .scrollWidth,
        pageHeight:
          document.documentElement
            .scrollHeight,
      });

      setNote("");
      setErrorMessage("");
      setSuccessMessage("");
      setPanelOpen(true);
    };

    document.addEventListener(
      "click",
      handleDocumentClick,
      true,
    );

    return () => {
      document.removeEventListener(
        "click",
        handleDocumentClick,
        true,
      );
    };
  }, [hasAccess, reviewMode]);

  const saveFeedback = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!note.trim()) {
      setErrorMessage(copy.required);
      return;
    }

    if (!selectedElement) {
      setErrorMessage(copy.saveError);
      return;
    }

    setSaving(true);

    try {
      const headers = await getApiHeaders();

      const response = await fetch(
        "/api/site-feedback",
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            pagePath: pathname,
            pageUrl: window.location.href,
            note: note.trim(),
            elementText:
              selectedElement.text,
            elementTag:
              selectedElement.tag,
            xPosition:
              selectedElement.x,
            yPosition:
              selectedElement.y,
            pageWidth:
              selectedElement.pageWidth,
            pageHeight:
              selectedElement.pageHeight,
          }),
        },
      );

      const result =
        (await response.json()) as FeedbackApiResponse;

      if (!response.ok) {
        throw new Error(
          result.error || copy.saveError,
        );
      }

      setSuccessMessage(copy.saved);
      setNote("");
      setSelectedElement(null);

      await loadFeedback();

      window.setTimeout(() => {
        setSuccessMessage("");
        setPanelOpen(false);
      }, 900);
    } catch (error) {
      console.error(
        "Feedback save error:",
        error,
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : copy.saveError,
      );
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (
    id: string,
    status: FeedbackStatus,
  ) => {
    try {
      const headers = await getApiHeaders();

      const response = await fetch(
        "/api/site-feedback",
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            id,
            status,
          }),
        },
      );

      const result =
        (await response.json()) as FeedbackApiResponse;

      if (!response.ok) {
        throw new Error(
          result.error || copy.updateError,
        );
      }

      await loadFeedback();
    } catch (error) {
      console.error(
        "Feedback update error:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : copy.updateError,
      );
    }
  };

  const deleteFeedback = async (
    id: string,
  ) => {
    const confirmed = window.confirm(
      copy.deleteQuestion,
    );

    if (!confirmed) {
      return;
    }

    try {
      const headers = await getApiHeaders();

      const response = await fetch(
        "/api/site-feedback",
        {
          method: "DELETE",
          headers,
          body: JSON.stringify({
            id,
          }),
        },
      );

      const result =
        (await response.json()) as FeedbackApiResponse;

      if (!response.ok) {
        throw new Error(
          result.error || copy.deleteError,
        );
      }

      await loadFeedback();
    } catch (error) {
      console.error(
        "Feedback delete error:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : copy.deleteError,
      );
    }
  };

  const getMarkerPosition = (
    item: SiteFeedback,
  ) => {
    const currentWidth =
      document.documentElement
        .scrollWidth || 1;

    const currentHeight =
      document.documentElement
        .scrollHeight || 1;

    const originalWidth =
      item.page_width || currentWidth;

    const originalHeight =
      item.page_height || currentHeight;

    return {
      left:
        ((item.x_position || 0) /
          originalWidth) *
        currentWidth,

      top:
        ((item.y_position || 0) /
          originalHeight) *
        currentHeight,
    };
  };

  const statusLabel = (
    status: FeedbackStatus,
  ) => {
    if (status === "done") {
      return copy.done;
    }

    if (status === "in_progress") {
      return copy.inProgress;
    }

    return copy.open;
  };

  const statusClasses = (
    status: FeedbackStatus,
  ) => {
    if (status === "done") {
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }

    if (status === "in_progress") {
      return "border-blue-200 bg-blue-50 text-blue-700";
    }

    return "border-amber-200 bg-amber-50 text-amber-700";
  };

  if (loadingAccess) {
    return null;
  }
    if (!hasAccess) {
    return (
      <>
        <div
          data-feedback-ui="true"
          dir={isArabic ? "rtl" : "ltr"}
          className={`fixed bottom-6 z-[100] ${
            isArabic ? "left-6" : "right-6"
          }`}
        >
          <button
            type="button"
            onClick={() => {
              setAccessModalOpen(true);
              setAccessError("");
            }}
            className="rounded-2xl bg-aan-button px-5 py-4 font-bold text-white shadow-xl transition hover:bg-aan-hover"
          >
            ✎ {copy.openReview}
          </button>
        </div>

        {accessModalOpen && (
          <div
            data-feedback-ui="true"
            dir={isArabic ? "rtl" : "ltr"}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 px-5"
            onClick={() =>
              setAccessModalOpen(false)
            }
          >
            <form
              onSubmit={submitAccessCode}
              onClick={(event) =>
                event.stopPropagation()
              }
              className="w-full max-w-md rounded-[2rem] border border-aan-border bg-white p-7 shadow-2xl sm:p-9"
            >
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-aan-gold">
                    AAN Review
                  </p>

                  <h2 className="aan-heading mt-2 text-3xl">
                    {copy.reviewAccess}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setAccessModalOpen(false)
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-aan-border text-2xl text-aan-navy"
                >
                  ×
                </button>
              </div>

              <p className="mt-5 leading-7 text-aan-secondary">
                {copy.accessDescription}
              </p>

              <label className="mt-6 grid gap-2 font-bold text-aan-navy">
                {copy.accessCode}

                <input
                  type="password"
                  value={accessCode}
                  onChange={(event) =>
                    setAccessCode(
                      event.target.value,
                    )
                  }
                  placeholder={
                    copy.accessPlaceholder
                  }
                  autoComplete="off"
                  className="aan-field p-4 font-normal"
                />
              </label>

              {accessError && (
                <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                  {accessError}
                </p>
              )}

              <button
                type="submit"
                disabled={checkingCode}
                className="aan-cta mt-6 w-full rounded-2xl px-5 py-4 font-bold text-white disabled:opacity-60"
              >
                {checkingCode
                  ? copy.checking
                  : copy.unlock}
              </button>
            </form>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {reviewMode &&
        feedback.map(
          (item, index) => {
            const position =
              getMarkerPosition(item);

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
          },
        )}

      <div
        data-feedback-ui="true"
        dir={isArabic ? "rtl" : "ltr"}
        className={`fixed bottom-6 z-[100] ${
          isArabic
            ? "left-6"
            : "right-6"
        }`}
      >
        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setReviewMode(
                (current) => !current,
              );

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

          {!isAdmin && (
            <button
              type="button"
              onClick={() => {
                void closeReviewAccess();
              }}
              className="rounded-2xl border border-aan-border bg-white px-4 py-4 text-sm font-bold text-aan-secondary shadow-xl"
            >
              {copy.lockReview}
            </button>
          )}
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
          onClick={() =>
            setPanelOpen(false)
          }
        >
          <aside
            onClick={(event) =>
              event.stopPropagation()
            }
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
                onClick={() =>
                  setPanelOpen(false)
                }
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
                    &lt;
                    {selectedElement.tag}
                    &gt;
                  </p>
                </div>

                <label className="mt-6 grid gap-2 font-bold text-aan-navy">
                  {copy.noteLabel}

                  <textarea
                    value={note}
                    onChange={(event) =>
                      setNote(
                        event.target.value,
                      )
                    }
                    placeholder={
                      copy.notePlaceholder
                    }
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
                    {saving
                      ? copy.saving
                      : copy.save}
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
                    {feedback.map(
                      (item, index) => (
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
                              void deleteFeedback(
                                item.id,
                              )
                            }
                            className="mt-3 w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-50"
                          >
                            {copy.delete}
                          </button>
                        </article>
                      ),
                    )}
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
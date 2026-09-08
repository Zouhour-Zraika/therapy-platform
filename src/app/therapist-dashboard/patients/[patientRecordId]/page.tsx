"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams } from "next/navigation";

import Navbar from "../../../components/Navbar";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { useLanguage } from "@/i18n/LanguageProvider";
import { supabase } from "@/lib/supabase";

type PatientRecord = {
  id: string;
  patient_id: string;
  therapist_id: string;
  created_at: string;
  updated_at: string;
};

type PatientProfile = {
  id: string;
  email: string | null;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

type ClinicalNote = {
  id: string;
  patient_record_id: string;
  title: string | null;
  content: string;
  note_date: string | null;
  created_at: string;
  updated_at: string;
};

type TreatmentGoal = {
  id: string;
  patient_record_id: string;
  goal: string;
  status: string | null;
  created_at: string;
  updated_at: string;
};

type TherapyHistoryItem = {
  id: string;
  patient_record_id: string;
  session_date: string | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
};

type ClinicalReport = {
  id: string;
  patient_record_id: string;
  title: string;
  content: string | null;
  created_at: string;
  updated_at: string;
};

type PatientDocument = {
  id: string;
  patient_record_id: string;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  section:
    | "note"
    | "history"
    | "goal"
    | "report"
    | null;
  related_item_id: string | null;
  created_at: string;
};

export default function PatientRecordPage() {
  const params = useParams<{
    patientRecordId: string;
  }>();

  const patientRecordId =
    Array.isArray(
      params.patientRecordId,
    )
      ? params.patientRecordId[0]
      : params.patientRecordId;

  const {
    language,
    isArabic,
  } = useLanguage();

  const [record, setRecord] =
    useState<PatientRecord | null>(
      null,
    );

  const [patient, setPatient] =
    useState<PatientProfile | null>(
      null,
    );

  const [notes, setNotes] =
    useState<ClinicalNote[]>([]);

  const [goals, setGoals] =
    useState<TreatmentGoal[]>([]);

  const [
    history,
    setHistory,
  ] = useState<
    TherapyHistoryItem[]
  >([]);

  const [
    reports,
    setReports,
  ] = useState<ClinicalReport[]>(
    [],
  );

  const [
    documents,
    setDocuments,
  ] = useState<PatientDocument[]>(
    [],
  );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    uploadingDocument,
    setUploadingDocument,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [noteTitle, setNoteTitle] =
    useState("");

  const [
    noteContent,
    setNoteContent,
  ] = useState("");

  const [goalText, setGoalText] =
    useState("");

  const [
    historyDate,
    setHistoryDate,
  ] = useState("");

  const [
    historySummary,
    setHistorySummary,
  ] = useState("");

  const [
    reportTitle,
    setReportTitle,
  ] = useState("");

  const [
    reportContent,
    setReportContent,
  ] = useState("");

  const [notePdf, setNotePdf] =
    useState<File | null>(null);

  const [historyPdf, setHistoryPdf] =
    useState<File | null>(null);

  const [goalPdf, setGoalPdf] =
    useState<File | null>(null);

  const [reportPdf, setReportPdf] =
    useState<File | null>(null);

  const ITEMS_PREVIEW_LIMIT = 3;

  const [showAllNotes, setShowAllNotes] =
    useState(false);

  const [showAllHistory, setShowAllHistory] =
    useState(false);

  const [showAllGoals, setShowAllGoals] =
    useState(false);

  const [showAllReports, setShowAllReports] =
    useState(false);

  const [editingNoteId, setEditingNoteId] =
    useState<string | null>(null);
  const [editingNoteTitle, setEditingNoteTitle] =
    useState("");
  const [editingNoteContent, setEditingNoteContent] =
    useState("");
  const [editingNotePdf, setEditingNotePdf] =
    useState<File | null>(null);

  const [editingHistoryId, setEditingHistoryId] =
    useState<string | null>(null);
  const [editingHistoryDate, setEditingHistoryDate] =
    useState("");
  const [editingHistorySummary, setEditingHistorySummary] =
    useState("");
  const [editingHistoryPdf, setEditingHistoryPdf] =
    useState<File | null>(null);

  const [editingGoalId, setEditingGoalId] =
    useState<string | null>(null);
  const [editingGoalText, setEditingGoalText] =
    useState("");
  const [editingGoalPdf, setEditingGoalPdf] =
    useState<File | null>(null);

  const [editingReportId, setEditingReportId] =
    useState<string | null>(null);
  const [editingReportTitle, setEditingReportTitle] =
    useState("");
  const [editingReportContent, setEditingReportContent] =
    useState("");
  const [editingReportPdf, setEditingReportPdf] =
    useState<File | null>(null);

  const text = useMemo(
    () =>
      language === "ar"
        ? {
            back: "العودة إلى مرضاي",
            title: "ملف المريض",
            confidential:
              "معلومات سريرية سرية — لا يمكن الوصول إليها إلا من قبل المعالج المسؤول عن هذا المريض.",
            patient: "المريض",
            recordCreated:
              "تم إنشاء الملف",
            lastUpdated:
              "آخر تحديث",
            notes:
              "الملاحظات السريرية",
            noteTitle:
              "عنوان الملاحظة",
            noteContent:
              "محتوى الملاحظة",
            addNote:
              "إضافة ملاحظة",
            attachPdf:
              "إرفاق PDF",
            pdfSelected:
              "تم اختيار PDF",
            noNotes:
              "لا توجد ملاحظات سريرية بعد.",
            history:
              "التاريخ العلاجي",
            sessionDate:
              "تاريخ الجلسة",
            summary:
              "ملخص الجلسة",
            addHistory:
              "إضافة إلى التاريخ",
            noHistory:
              "لا يوجد تاريخ علاجي بعد.",
            goals:
              "الأهداف العلاجية",
            goal:
              "الهدف",
            addGoal:
              "إضافة هدف",
            noGoals:
              "لا توجد أهداف بعد.",
            reports:
              "التقارير",
            reportTitle:
              "عنوان التقرير",
            reportContent:
              "محتوى التقرير",
            addReport:
              "إضافة تقرير",
            noReports:
              "لا توجد تقارير بعد.",
            documents:
              "الوثائق",
            uploadDocument:
              "رفع وثيقة",
            uploadPdf:
              "إضافة ملف PDF",
            pdfHint:
              "يمكنك إضافة ملفات PDF سريرية أو إدارية مرتبطة بمتابعة هذا المريض.",
            noDocuments:
              "لا توجد وثائق بعد.",
            openDocument:
              "فتح",
            edit: "تعديل",
            delete: "حذف",
            accessDenied:
              "لا يمكن فتح هذا الملف. إما أنه غير موجود أو أنه لا يخصك.",
            loadError:
              "تعذر تحميل ملف المريض.",
            saveError:
              "تعذر حفظ المعلومات.",
            deleteConfirm:
              "هل تريد حذف هذا العنصر نهائياً؟",
            documentError:
              "تعذر رفع الوثيقة.",
          }
        : language === "fr"
          ? {
              back: "Retour à Mes patients",
              title: "Dossier patient",
              confidential:
                "Informations cliniques confidentielles — accessibles uniquement au thérapeute responsable de ce patient.",
              patient: "Patient",
              recordCreated:
                "Dossier créé le",
              lastUpdated:
                "Dernière mise à jour",
              notes:
                "Notes cliniques",
              noteTitle:
                "Titre de la note",
              noteContent:
                "Contenu de la note",
              addNote:
                "Ajouter une note",
              attachPdf:
                "Joindre un PDF",
              pdfSelected:
                "PDF sélectionné",
              noNotes:
                "Aucune note clinique pour le moment.",
              history:
                "Historique thérapeutique",
              sessionDate:
                "Date de la séance",
              summary:
                "Résumé de la séance",
              addHistory:
                "Ajouter à l’historique",
              noHistory:
                "Aucun historique thérapeutique pour le moment.",
              goals:
                "Objectifs thérapeutiques",
              goal: "Objectif",
              addGoal:
                "Ajouter un objectif",
              noGoals:
                "Aucun objectif pour le moment.",
              reports:
                "Comptes rendus",
              reportTitle:
                "Titre du compte rendu",
              reportContent:
                "Contenu du compte rendu",
              addReport:
                "Ajouter un compte rendu",
              noReports:
                "Aucun compte rendu pour le moment.",
              documents:
                "Documents",
              uploadDocument:
                "Ajouter un document",
              uploadPdf:
                "Ajouter un PDF",
              pdfHint:
                "Vous pouvez ajouter des PDF cliniques ou administratifs liés au suivi de ce patient.",
              noDocuments:
                "Aucun document pour le moment.",
              openDocument:
                "Ouvrir",
              edit: "Modifier",
              delete: "Supprimer",
              accessDenied:
                "Impossible d’ouvrir ce dossier. Il n’existe pas ou ne vous appartient pas.",
              loadError:
                "Impossible de charger le dossier patient.",
              saveError:
                "Impossible d’enregistrer les informations.",
              deleteConfirm:
                "Supprimer définitivement cet élément ?",
              documentError:
                "Impossible d’envoyer le document.",
            }
          : {
              back: "Back to My patients",
              title: "Patient record",
              confidential:
                "Confidential clinical information — accessible only to the therapist responsible for this patient.",
              patient: "Patient",
              recordCreated:
                "Record created",
              lastUpdated:
                "Last updated",
              notes: "Clinical notes",
              noteTitle:
                "Note title",
              noteContent:
                "Note content",
              addNote: "Add note",
              attachPdf:
                "Attach PDF",
              pdfSelected:
                "PDF selected",
              noNotes:
                "No clinical notes yet.",
              history:
                "Therapeutic history",
              sessionDate:
                "Session date",
              summary:
                "Session summary",
              addHistory:
                "Add to history",
              noHistory:
                "No therapeutic history yet.",
              goals:
                "Treatment goals",
              goal: "Goal",
              addGoal: "Add goal",
              noGoals:
                "No treatment goals yet.",
              reports:
                "Clinical reports",
              reportTitle:
                "Report title",
              reportContent:
                "Report content",
              addReport:
                "Add report",
              noReports:
                "No reports yet.",
              documents: "Documents",
              uploadDocument:
                "Upload document",
              uploadPdf:
                "Add PDF",
              pdfHint:
                "You can add clinical or administrative PDF files related to this patient's care.",
              noDocuments:
                "No documents yet.",
              openDocument: "Open",
              edit: "Edit",
              delete: "Delete",
              accessDenied:
                "This record cannot be opened. It does not exist or does not belong to you.",
              loadError:
                "Unable to load the patient record.",
              saveError:
                "Unable to save the information.",
              deleteConfirm:
                "Permanently delete this item?",
              documentError:
                "Unable to upload the document.",
            },
    [language],
  );

  const formatDate = (
    value: string | null,
  ) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return value;
    }

    return new Intl.DateTimeFormat(
      language === "ar"
        ? "ar-LB"
        : language === "fr"
          ? "fr-FR"
          : "en-GB",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      },
    ).format(date);
  };

  const loadClinicalData =
    async () => {
      if (!patientRecordId) {
        return;
      }

      const [
        notesResult,
        goalsResult,
        historyResult,
        reportsResult,
        documentsResult,
      ] = await Promise.all([
        supabase
          .from("clinical_notes")
          .select("*")
          .eq(
            "patient_record_id",
            patientRecordId,
          )
          .order(
            "note_date",
            {
              ascending: false,
            },
          )
          .order(
            "created_at",
            {
              ascending: false,
            },
          ),

        supabase
          .from("treatment_goals")
          .select("*")
          .eq(
            "patient_record_id",
            patientRecordId,
          )
          .order(
            "created_at",
            {
              ascending: false,
            },
          ),

        supabase
          .from("therapy_history")
          .select("*")
          .eq(
            "patient_record_id",
            patientRecordId,
          )
          .order(
            "session_date",
            {
              ascending: false,
            },
          )
          .order(
            "created_at",
            {
              ascending: false,
            },
          ),

        supabase
          .from("clinical_reports")
          .select("*")
          .eq(
            "patient_record_id",
            patientRecordId,
          )
          .order(
            "created_at",
            {
              ascending: false,
            },
          ),

        supabase
          .from("patient_documents")
          .select("*")
          .eq(
            "patient_record_id",
            patientRecordId,
          )
          .order(
            "created_at",
            {
              ascending: false,
            },
          ),
      ]);

      const firstError =
        notesResult.error ||
        goalsResult.error ||
        historyResult.error ||
        reportsResult.error ||
        documentsResult.error;

      if (firstError) {
        throw firstError;
      }

      setNotes(
        (notesResult.data ||
          []) as ClinicalNote[],
      );

      setGoals(
        (goalsResult.data ||
          []) as TreatmentGoal[],
      );

      setHistory(
        (historyResult.data ||
          []) as TherapyHistoryItem[],
      );

      setReports(
        (reportsResult.data ||
          []) as ClinicalReport[],
      );

      setDocuments(
        (documentsResult.data ||
          []) as PatientDocument[],
      );
    };

  useEffect(() => {
    let cancelled = false;

    const load =
      async () => {
        if (!patientRecordId) {
          return;
        }

        setLoading(true);
        setError("");

        try {
          const {
            data: {
              user,
            },
          } =
            await supabase.auth.getUser();

          if (!user) {
            setError(
              text.accessDenied,
            );
            return;
          }

          /*
           * Important:
           * aucune service_role ici.
           * Cette requête utilise la session
           * du thérapeute et respecte RLS.
           */
          const {
            data: recordData,
            error: recordError,
          } = await supabase
            .from("patient_records")
            .select(
              "id, patient_id, therapist_id, created_at, updated_at",
            )
            .eq(
              "id",
              patientRecordId,
            )
            .eq(
              "therapist_id",
              user.id,
            )
            .maybeSingle();

          if (
            recordError ||
            !recordData
          ) {
            setError(
              text.accessDenied,
            );
            return;
          }

          if (cancelled) {
            return;
          }

          setRecord(
            recordData as PatientRecord,
          );

          let profileData: PatientProfile | null = null;

          const {
            data: profileWithName,
            error: profileWithNameError,
          } = await supabase
            .from("profiles")
            .select(
              "id, email, full_name, first_name, last_name",
            )
            .eq(
              "id",
              recordData.patient_id,
            )
            .maybeSingle();

          if (!profileWithNameError) {
            profileData =
              profileWithName as PatientProfile | null;
          } else {
            const {
              data: basicProfile,
            } = await supabase
              .from("profiles")
              .select("id, email")
              .eq(
                "id",
                recordData.patient_id,
              )
              .maybeSingle();

            profileData =
              basicProfile as PatientProfile | null;
          }

          if (!cancelled) {
            setPatient(
              profileData || {
                id:
                  recordData.patient_id,
                email: null,
              },
            );
          }

          await loadClinicalData();
        } catch (loadError) {
          console.error(
            "Patient record load error:",
            loadError,
          );

          if (!cancelled) {
            setError(
              text.loadError,
            );
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };

    void load();

    return () => {
      cancelled = true;
    };
  }, [
    patientRecordId,
    language,
  ]);

  const runInsert = async (
    table:
      | "clinical_notes"
      | "treatment_goals"
      | "therapy_history"
      | "clinical_reports",
    payload: Record<
      string,
      unknown
    >,
  ) => {
    if (!patientRecordId) {
      return null;
    }

    setSaving(true);

    try {
      const {
        data: insertedRow,
        error: insertError,
      } = await supabase
        .from(table)
        .insert({
          patient_record_id:
            patientRecordId,
          ...payload,
        })
        .select("id")
        .single();

      if (insertError) {
        throw insertError;
      }

      return insertedRow?.id as string | null;
    } catch (saveError) {
      console.error(
        `${table} insert error:`,
        saveError,
      );
      window.alert(
        text.saveError,
      );
      return null;
    } finally {
      setSaving(false);
    }
  };

  const deleteItem =
    async (
      table:
        | "clinical_notes"
        | "treatment_goals"
        | "therapy_history"
        | "clinical_reports"
        | "patient_documents",
      id: string,
      storagePath?: string,
    ) => {
      if (
        !window.confirm(
          text.deleteConfirm,
        )
      ) {
        return;
      }

      setSaving(true);

      try {
        if (
          table !==
            "patient_documents"
        ) {
          const relatedDocs =
            documents.filter(
              (document) =>
                document.related_item_id ===
                  id,
            );

          if (
            relatedDocs.length > 0
          ) {
            const paths =
              relatedDocs.map(
                (document) =>
                  document.storage_path,
              );

            const {
              error: storageBatchError,
            } =
              await supabase.storage
                .from(
                  "patient-documents",
                )
                .remove(paths);

            if (
              storageBatchError
            ) {
              throw storageBatchError;
            }

            const {
              error: docsDeleteError,
            } = await supabase
              .from(
                "patient_documents",
              )
              .delete()
              .in(
                "id",
                relatedDocs.map(
                  (document) =>
                    document.id,
                ),
              );

            if (
              docsDeleteError
            ) {
              throw docsDeleteError;
            }
          }
        }

        if (storagePath) {
          const {
            error: storageError,
          } =
            await supabase.storage
              .from(
                "patient-documents",
              )
              .remove([
                storagePath,
              ]);

          if (storageError) {
            throw storageError;
          }
        }

        const {
          error: deleteError,
        } = await supabase
          .from(table)
          .delete()
          .eq("id", id);

        if (deleteError) {
          throw deleteError;
        }

        await loadClinicalData();
      } catch (deleteError) {
        console.error(
          `${table} delete error:`,
          deleteError,
        );
        window.alert(
          text.saveError,
        );
      } finally {
        setSaving(false);
      }
    };

  const updateItem = async (
    table:
      | "clinical_notes"
      | "treatment_goals"
      | "therapy_history"
      | "clinical_reports",
    id: string,
    payload: Record<string, unknown>,
  ) => {
    setSaving(true);

    try {
      const { error: updateError } = await supabase
        .from(table)
        .update(payload)
        .eq("id", id);

      if (updateError) {
        throw updateError;
      }

      await loadClinicalData();
    } catch (updateError) {
      console.error(`${table} update error:`, updateError);
      window.alert(text.saveError);
    } finally {
      setSaving(false);
    }
  };

  const editNote = (note: ClinicalNote) => {
    setEditingNoteId(note.id);
    setEditingNoteTitle(note.title || "");
    setEditingNoteContent(note.content || "");
    setEditingNotePdf(null);
  };

  const saveNoteEdit = async (noteId: string) => {
    if (!editingNoteContent.trim() && !editingNotePdf) {
      return;
    }

    await updateItem("clinical_notes", noteId, {
      title:
        editingNoteTitle.trim() ||
        editingNotePdf?.name ||
        null,
      content:
        editingNoteContent.trim() ||
        (editingNotePdf
          ? `PDF : ${editingNotePdf.name}`
          : ""),
    });

    if (editingNotePdf) {
      await uploadPdfForItem(
        editingNotePdf,
        "note",
        noteId,
      );
    }

    setEditingNotePdf(null);
    setEditingNoteId(null);
    await loadClinicalData();
  };

  const editHistory = (item: TherapyHistoryItem) => {
    setEditingHistoryId(item.id);
    setEditingHistoryDate(item.session_date || "");
    setEditingHistorySummary(item.summary || "");
    setEditingHistoryPdf(null);
  };

  const saveHistoryEdit = async (itemId: string) => {
    if (!editingHistorySummary.trim() && !editingHistoryPdf) {
      return;
    }

    await updateItem("therapy_history", itemId, {
      summary:
        editingHistorySummary.trim() ||
        (editingHistoryPdf
          ? `PDF : ${editingHistoryPdf.name}`
          : null),
      session_date: editingHistoryDate.trim() || null,
    });

    if (editingHistoryPdf) {
      await uploadPdfForItem(
        editingHistoryPdf,
        "history",
        itemId,
      );
    }

    setEditingHistoryPdf(null);
    setEditingHistoryId(null);
    await loadClinicalData();
  };

  const editGoal = (goal: TreatmentGoal) => {
    setEditingGoalId(goal.id);
    setEditingGoalText(goal.goal || "");
    setEditingGoalPdf(null);
  };

  const saveGoalEdit = async (goalId: string) => {
    if (!editingGoalText.trim() && !editingGoalPdf) {
      return;
    }

    await updateItem("treatment_goals", goalId, {
      goal:
        editingGoalText.trim() ||
        editingGoalPdf?.name ||
        "Document PDF",
    });

    if (editingGoalPdf) {
      await uploadPdfForItem(
        editingGoalPdf,
        "goal",
        goalId,
      );
    }

    setEditingGoalPdf(null);
    setEditingGoalId(null);
    await loadClinicalData();
  };

  const editReport = (report: ClinicalReport) => {
    setEditingReportId(report.id);
    setEditingReportTitle(report.title || "");
    setEditingReportContent(report.content || "");
    setEditingReportPdf(null);
  };

  const saveReportEdit = async (reportId: string) => {
    if (!editingReportTitle.trim() && !editingReportPdf) {
      return;
    }

    await updateItem("clinical_reports", reportId, {
      title:
        editingReportTitle.trim() ||
        editingReportPdf?.name ||
        "Compte rendu PDF",
      content: editingReportContent.trim() || null,
    });

    if (editingReportPdf) {
      await uploadPdfForItem(
        editingReportPdf,
        "report",
        reportId,
      );
    }

    setEditingReportPdf(null);
    setEditingReportId(null);
    await loadClinicalData();
  };

  const addNote = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    if (
      !noteContent.trim() &&
      !notePdf
    ) {
      return;
    }

    const insertedId =
      await runInsert(
        "clinical_notes",
        {
          title:
            noteTitle.trim() ||
            notePdf?.name ||
            null,
          content:
            noteContent.trim() ||
            (notePdf
              ? `PDF : ${notePdf.name}`
              : ""),
          note_date:
            new Date()
              .toISOString()
              .slice(0, 10),
        },
      );

    if (insertedId) {
      if (notePdf) {
        await uploadPdfForItem(
          notePdf,
          "note",
          insertedId,
        );
      }

      setNoteTitle("");
      setNoteContent("");
      setNotePdf(null);
      await loadClinicalData();
    }
  };

  const addGoal = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    if (
      !goalText.trim() &&
      !goalPdf
    ) {
      return;
    }

    const insertedId =
      await runInsert(
        "treatment_goals",
        {
          goal:
            goalText.trim() ||
            goalPdf?.name ||
            "Document PDF",
          status: "active",
        },
      );

    if (insertedId) {
      if (goalPdf) {
        await uploadPdfForItem(
          goalPdf,
          "goal",
          insertedId,
        );
      }

      setGoalText("");
      setGoalPdf(null);
      await loadClinicalData();
    }
  };

  const addHistory = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    if (
      !historySummary.trim() &&
      !historyPdf
    ) {
      return;
    }

    const insertedId =
      await runInsert(
        "therapy_history",
        {
          session_date:
            historyDate || null,
          summary:
            historySummary.trim() ||
            (historyPdf
              ? `PDF : ${historyPdf.name}`
              : null),
        },
      );

    if (insertedId) {
      if (historyPdf) {
        await uploadPdfForItem(
          historyPdf,
          "history",
          insertedId,
        );
      }

      setHistoryDate("");
      setHistorySummary("");
      setHistoryPdf(null);
      await loadClinicalData();
    }
  };

  const addReport = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    if (
      !reportTitle.trim() &&
      !reportPdf
    ) {
      return;
    }

    const insertedId =
      await runInsert(
        "clinical_reports",
        {
          title:
            reportTitle.trim() ||
            reportPdf?.name ||
            "Compte rendu PDF",
          content:
            reportContent.trim() ||
            null,
        },
      );

    if (insertedId) {
      if (reportPdf) {
        await uploadPdfForItem(
          reportPdf,
          "report",
          insertedId,
        );
      }

      setReportTitle("");
      setReportContent("");
      setReportPdf(null);
      await loadClinicalData();
    }
  };

  const uploadPdfForItem =
    async (
      file: File,
      section:
        | "note"
        | "history"
        | "goal"
        | "report",
      relatedItemId: string,
    ) => {
      if (
        !record ||
        !patientRecordId
      ) {
        return false;
      }

      const isPdf =
        file.type ===
          "application/pdf" ||
        file.name
          .toLowerCase()
          .endsWith(".pdf");

      if (!isPdf) {
        window.alert(
          language === "ar"
            ? "يرجى اختيار ملف PDF فقط."
            : language === "fr"
              ? "Veuillez sélectionner uniquement un fichier PDF."
              : "Please select a PDF file only.",
        );
        return false;
      }

      const maxPdfSize =
        15 * 1024 * 1024;

      if (
        file.size > maxPdfSize
      ) {
        window.alert(
          language === "ar"
            ? "حجم ملف PDF يجب ألا يتجاوز 15 ميغابايت."
            : language === "fr"
              ? "Le PDF ne doit pas dépasser 15 Mo."
              : "The PDF must not exceed 15 MB.",
        );
        return false;
      }

      setUploadingDocument(true);

      try {
        const {
          data: {
            user,
          },
        } =
          await supabase.auth.getUser();

        if (!user) {
          throw new Error(
            "Not authenticated",
          );
        }

        const safeName =
          file.name.replace(
            /[^a-zA-Z0-9._-]/g,
            "_",
          );

        const storagePath =
          `${user.id}/${patientRecordId}/${section}/${relatedItemId}/${Date.now()}-${safeName}`;

        const {
          error: uploadError,
        } =
          await supabase.storage
            .from(
              "patient-documents",
            )
            .upload(
              storagePath,
              file,
              {
                upsert: false,
                contentType:
                  "application/pdf",
              },
            );

        if (uploadError) {
          throw uploadError;
        }

        const {
          error: rowError,
        } = await supabase
          .from(
            "patient_documents",
          )
          .insert({
            patient_record_id:
              patientRecordId,
            file_name:
              file.name,
            storage_path:
              storagePath,
            mime_type:
              "application/pdf",
            section,
            related_item_id:
              relatedItemId,
          });

        if (rowError) {
          await supabase.storage
            .from(
              "patient-documents",
            )
            .remove([
              storagePath,
            ]);

          throw rowError;
        }

        return true;
      } catch (uploadError) {
        console.error(
          "Patient PDF upload error:",
          uploadError,
        );
        window.alert(
          text.documentError,
        );
        return false;
      } finally {
        setUploadingDocument(
          false,
        );
      }
    };


  const openDocument =
    async (
      storagePath: string,
    ) => {
      const {
        data,
        error: signedUrlError,
      } =
        await supabase.storage
          .from(
            "patient-documents",
          )
          .createSignedUrl(
            storagePath,
            60,
          );

      if (
        signedUrlError ||
        !data?.signedUrl
      ) {
        window.alert(
          text.documentError,
        );
        return;
      }

      window.open(
        data.signedUrl,
        "_blank",
        "noopener,noreferrer",
      );
    };

  const getItemDocuments = (
    section:
      | "note"
      | "history"
      | "goal"
      | "report",
    relatedItemId: string,
  ) =>
    documents.filter(
      (document) =>
        document.section ===
          section &&
        document.related_item_id ===
          relatedItemId,
    );

  const visibleNotes = showAllNotes
    ? notes
    : notes.slice(0, ITEMS_PREVIEW_LIMIT);

  const visibleHistory = showAllHistory
    ? history
    : history.slice(0, ITEMS_PREVIEW_LIMIT);

  const visibleGoals = showAllGoals
    ? goals
    : goals.slice(0, ITEMS_PREVIEW_LIMIT);

  const visibleReports = showAllReports
    ? reports
    : reports.slice(0, ITEMS_PREVIEW_LIMIT);

  const showMoreLabel =
    language === "ar"
      ? "عرض المزيد"
      : language === "fr"
        ? "Voir plus"
        : "Show more";

  const showLessLabel =
    language === "ar"
      ? "عرض أقل"
      : language === "fr"
        ? "Réduire"
        : "Show less";

  const saveLabel =
    language === "ar"
      ? "حفظ"
      : language === "fr"
        ? "Enregistrer"
        : "Save";

  const cancelLabel =
    language === "ar"
      ? "إلغاء"
      : language === "fr"
        ? "Annuler"
        : "Cancel";

  const patientDisplayName =
    patient?.full_name?.trim() ||
    [
      patient?.first_name?.trim(),
      patient?.last_name?.trim(),
    ]
      .filter(Boolean)
      .join(" ") ||
    patient?.email ||
    patient?.id ||
    record?.patient_id ||
    "Patient";

  const patientSecondaryText =
    patient?.email &&
    patientDisplayName !==
      patient.email
      ? patient.email
      : null;

  const SectionTitle = ({
    children,
  }: {
    children:
      React.ReactNode;
  }) => (
    <h2 className="text-xl font-bold text-aan-navy">
      {children}
    </h2>
  );

  return (
    <ProtectedRoute
      requireSpecialist
    >
      <>
        <Navbar />

        <main
          dir={
            isArabic
              ? "rtl"
              : "ltr"
          }
          className="min-h-screen bg-aan-background px-5 py-8 sm:px-8"
        >
          <div className="mx-auto max-w-6xl">
            <a
              href="/therapist-dashboard"
              className="inline-flex items-center gap-2 text-sm font-bold text-aan-secondary transition hover:text-aan-navy"
            >
              ← {text.back}
            </a>

            <header className="aan-card mt-5 p-6 sm:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.22em] text-aan-gold">
                    AAN Psychotherapy
                  </p>

                  <h1 className="aan-heading mt-2 text-4xl sm:text-5xl">
                    {text.title}
                  </h1>

                  <p className="mt-3 max-w-3xl text-sm leading-6 text-aan-secondary">
                    {text.confidential}
                  </p>
                </div>

                {record ? (
                  <span className="rounded-full border border-aan-border bg-[#fbf8f3] px-4 py-2 text-xs font-bold text-aan-secondary">
                    🔒 Confidential
                  </span>
                ) : null}
              </div>
            </header>

            {loading ? (
              <div className="aan-card mt-6 p-8 text-center text-aan-secondary">
                Loading...
              </div>
            ) : error ? (
              <div className="aan-card mt-6 border border-red-200 p-8 text-red-700">
                {error}
              </div>
            ) : record ? (
              <>
                <section className="aan-card mt-6 p-6 sm:p-7">
                  <div className="grid gap-5 sm:grid-cols-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-aan-gold">
                        {text.patient}
                      </p>
                      <p className="mt-2 font-bold text-aan-navy">
                        {patientDisplayName}
                      </p>

                      {patientSecondaryText ? (
                        <p className="mt-1 break-all text-sm text-aan-secondary">
                          {patientSecondaryText}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-aan-gold">
                        {text.recordCreated}
                      </p>
                      <p className="mt-2 text-aan-secondary">
                        {formatDate(
                          record.created_at,
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-aan-gold">
                        {text.lastUpdated}
                      </p>
                      <p className="mt-2 text-aan-secondary">
                        {formatDate(
                          record.updated_at,
                        )}
                      </p>
                    </div>
                  </div>
                </section>

                <div className="mt-6 grid gap-6 xl:grid-cols-2">
                  <section className="aan-card p-6 sm:p-7">
                    <SectionTitle>
                      {text.notes}
                    </SectionTitle>

                    <form
                      onSubmit={addNote}
                      className="mt-5 rounded-2xl border border-aan-border bg-[#fbf8f3] p-4"
                    >
                      <input
                        type="text"
                        value={noteTitle}
                        onChange={(
                          event,
                        ) =>
                          setNoteTitle(
                            event.target.value,
                          )
                        }
                        placeholder={
                          text.noteTitle
                        }
                        className="aan-field w-full p-3"
                      />

                      <textarea
                        value={noteContent}
                        onChange={(
                          event,
                        ) =>
                          setNoteContent(
                            event.target.value,
                          )
                        }
                        placeholder={
                          text.noteContent
                        }
                        className="aan-field mt-3 min-h-28 w-full resize-y p-3"
                      />

                      <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-aan-border bg-white px-4 py-3 text-sm font-semibold text-aan-secondary transition hover:text-aan-navy">
                        <span>
                          + {text.attachPdf}
                        </span>

                        <span className="max-w-[55%] truncate text-xs font-normal">
                          {notePdf
                            ? notePdf.name
                            : ""}
                        </span>

                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          className="hidden"
                          onChange={(
                            event,
                          ) =>
                            setNotePdf(
                              event.target
                                .files?.[0] ||
                                null,
                            )
                          }
                        />
                      </label>

                      <button
                        type="submit"
                        disabled={
                          saving ||
                          (!noteContent.trim() &&
                            !notePdf)
                        }
                        className="aan-button mt-3 px-5 py-2.5 disabled:opacity-60"
                      >
                        + {text.addNote}
                      </button>
                    </form>

                    <div className="mt-5 grid gap-3">
                      {notes.length ===
                      0 ? (
                        <p className="rounded-2xl border border-aan-border bg-white p-4 text-aan-secondary">
                          {text.noNotes}
                        </p>
                      ) : (
                        visibleNotes.map(
                          (note) => (
                            <article
                              key={
                                note.id
                              }
                              className="rounded-2xl border border-aan-border bg-white p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-bold text-aan-navy">
                                    {note.title ||
                                      text.notes}
                                  </p>
                                  <p className="mt-1 text-xs text-aan-secondary">
                                    {formatDate(
                                      note.note_date ||
                                        note.created_at,
                                    )}
                                  </p>
                                </div>

                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void editNote(note)
                                    }
                                    className="text-xs font-bold text-aan-navy"
                                  >
                                    {text.edit}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      void deleteItem(
                                        "clinical_notes",
                                        note.id,
                                      )
                                    }
                                    className="text-xs font-bold text-red-700"
                                  >
                                    {text.delete}
                                  </button>
                                </div>
                              </div>

                              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-aan-secondary">
                                {note.content}
                              </p>

                              {editingNoteId === note.id ? (
                                <div className="mt-4 rounded-xl border border-aan-border bg-[#fbf8f3] p-4">
                                  <input
                                    type="text"
                                    value={editingNoteTitle}
                                    onChange={(event) =>
                                      setEditingNoteTitle(event.target.value)
                                    }
                                    placeholder={text.noteTitle}
                                    className="aan-field w-full p-3"
                                  />

                                  <textarea
                                    value={editingNoteContent}
                                    onChange={(event) =>
                                      setEditingNoteContent(event.target.value)
                                    }
                                    placeholder={text.noteContent}
                                    className="aan-field mt-3 min-h-40 w-full resize-y p-3"
                                  />

                                  <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-aan-border bg-white px-4 py-3 text-sm font-semibold text-aan-secondary transition hover:text-aan-navy">
                                    <span>
                                      + {text.attachPdf}
                                    </span>

                                    <span className="max-w-[55%] truncate text-xs font-normal">
                                      {editingNotePdf
                                        ? editingNotePdf.name
                                        : ""}
                                    </span>

                                    <input
                                      type="file"
                                      accept="application/pdf,.pdf"
                                      className="hidden"
                                      onChange={(event) =>
                                        setEditingNotePdf(
                                          event.target.files?.[0] || null,
                                        )
                                      }
                                    />
                                  </label>

                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      disabled={saving || uploadingDocument || (!editingNoteContent.trim() && !editingNotePdf)}
                                      onClick={() => void saveNoteEdit(note.id)}
                                      className="aan-button px-4 py-2 disabled:opacity-60"
                                    >
                                      {saveLabel}
                                    </button>
                                    <button
                                      type="button"
                                      disabled={saving}
                                      onClick={() => { setEditingNotePdf(null); setEditingNoteId(null); }}
                                      className="rounded-xl border border-aan-border bg-white px-4 py-2 text-sm font-bold text-aan-secondary"
                                    >
                                      {cancelLabel}
                                    </button>
                                  </div>
                                </div>
                              ) : null}

                              {getItemDocuments(
                                "note",
                                note.id,
                              ).map(
                                (document) => (
                                  <div
                                    key={
                                      document.id
                                    }
                                    className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-aan-border bg-[#fbf8f3] px-3 py-2"
                                  >
                                    <span className="min-w-0 truncate text-sm font-semibold text-aan-navy">
                                      📄 {document.file_name}
                                    </span>

                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          void openDocument(
                                            document.storage_path,
                                          )
                                        }
                                        className="text-xs font-bold text-aan-navy"
                                      >
                                        {text.openDocument}
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          void deleteItem(
                                            "patient_documents",
                                            document.id,
                                            document.storage_path,
                                          )
                                        }
                                        className="text-xs font-bold text-red-700"
                                      >
                                        {text.delete}
                                      </button>
                                    </div>
                                  </div>
                                ),
                              )}
                            </article>
                          ),
                        )
                      )}
                    </div>
                    {notes.length > ITEMS_PREVIEW_LIMIT ? (
                      <button
                        type="button"
                        onClick={() =>
                          setShowAllNotes(
                            (current) => !current,
                          )
                        }
                        className="mt-4 w-full rounded-xl border border-aan-border bg-white px-4 py-3 text-sm font-bold text-aan-secondary transition hover:text-aan-navy"
                      >
                        {showAllNotes
                          ? showLessLabel
                          : `${showMoreLabel} (${notes.length - ITEMS_PREVIEW_LIMIT})`}
                      </button>
                    ) : null}
                  </section>

                  <section className="aan-card p-6 sm:p-7">
                    <SectionTitle>
                      {text.history}
                    </SectionTitle>

                    <form
                      onSubmit={addHistory}
                      className="mt-5 rounded-2xl border border-aan-border bg-[#fbf8f3] p-4"
                    >
                      <input
                        type="date"
                        value={historyDate}
                        onChange={(
                          event,
                        ) =>
                          setHistoryDate(
                            event.target.value,
                          )
                        }
                        className="aan-field w-full p-3"
                      />

                      <textarea
                        value={
                          historySummary
                        }
                        onChange={(
                          event,
                        ) =>
                          setHistorySummary(
                            event.target.value,
                          )
                        }
                        placeholder={
                          text.summary
                        }
                        className="aan-field mt-3 min-h-28 w-full resize-y p-3"
                      />

                      <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-aan-border bg-white px-4 py-3 text-sm font-semibold text-aan-secondary transition hover:text-aan-navy">
                        <span>
                          + {text.attachPdf}
                        </span>

                        <span className="max-w-[55%] truncate text-xs font-normal">
                          {historyPdf
                            ? historyPdf.name
                            : ""}
                        </span>

                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          className="hidden"
                          onChange={(
                            event,
                          ) =>
                            setHistoryPdf(
                              event.target
                                .files?.[0] ||
                                null,
                            )
                          }
                        />
                      </label>

                      <button
                        type="submit"
                        disabled={
                          saving ||
                          (!historySummary.trim() &&
                            !historyPdf)
                        }
                        className="aan-button mt-3 px-5 py-2.5 disabled:opacity-60"
                      >
                        + {text.addHistory}
                      </button>
                    </form>

                    <div className="mt-5 grid gap-3">
                      {history.length ===
                      0 ? (
                        <p className="rounded-2xl border border-aan-border bg-white p-4 text-aan-secondary">
                          {text.noHistory}
                        </p>
                      ) : (
                        visibleHistory.map(
                          (item) => (
                            <article
                              key={
                                item.id
                              }
                              className="rounded-2xl border border-aan-border bg-white p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <p className="font-bold text-aan-navy">
                                  {formatDate(
                                    item.session_date ||
                                      item.created_at,
                                  )}
                                </p>

                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void editHistory(item)
                                    }
                                    className="text-xs font-bold text-aan-navy"
                                  >
                                    {text.edit}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      void deleteItem(
                                        "therapy_history",
                                        item.id,
                                      )
                                    }
                                    className="text-xs font-bold text-red-700"
                                  >
                                    {text.delete}
                                  </button>
                                </div>
                              </div>

                              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-aan-secondary">
                                {item.summary ||
                                  "—"}
                              </p>

                              {editingHistoryId === item.id ? (
                                <div className="mt-4 rounded-xl border border-aan-border bg-[#fbf8f3] p-4">
                                  <input
                                    type="date"
                                    value={editingHistoryDate}
                                    onChange={(event) =>
                                      setEditingHistoryDate(event.target.value)
                                    }
                                    className="aan-field w-full p-3"
                                  />

                                  <textarea
                                    value={editingHistorySummary}
                                    onChange={(event) =>
                                      setEditingHistorySummary(event.target.value)
                                    }
                                    placeholder={text.summary}
                                    className="aan-field mt-3 min-h-40 w-full resize-y p-3"
                                  />

                                  <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-aan-border bg-white px-4 py-3 text-sm font-semibold text-aan-secondary transition hover:text-aan-navy">
                                    <span>
                                      + {text.attachPdf}
                                    </span>

                                    <span className="max-w-[55%] truncate text-xs font-normal">
                                      {editingHistoryPdf
                                        ? editingHistoryPdf.name
                                        : ""}
                                    </span>

                                    <input
                                      type="file"
                                      accept="application/pdf,.pdf"
                                      className="hidden"
                                      onChange={(event) =>
                                        setEditingHistoryPdf(
                                          event.target.files?.[0] || null,
                                        )
                                      }
                                    />
                                  </label>

                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      disabled={saving || uploadingDocument || (!editingHistorySummary.trim() && !editingHistoryPdf)}
                                      onClick={() => void saveHistoryEdit(item.id)}
                                      className="aan-button px-4 py-2 disabled:opacity-60"
                                    >
                                      {saveLabel}
                                    </button>
                                    <button
                                      type="button"
                                      disabled={saving}
                                      onClick={() => { setEditingHistoryPdf(null); setEditingHistoryId(null); }}
                                      className="rounded-xl border border-aan-border bg-white px-4 py-2 text-sm font-bold text-aan-secondary"
                                    >
                                      {cancelLabel}
                                    </button>
                                  </div>
                                </div>
                              ) : null}

                              {getItemDocuments(
                                "history",
                                item.id,
                              ).map(
                                (document) => (
                                  <div
                                    key={
                                      document.id
                                    }
                                    className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-aan-border bg-[#fbf8f3] px-3 py-2"
                                  >
                                    <span className="min-w-0 truncate text-sm font-semibold text-aan-navy">
                                      📄 {document.file_name}
                                    </span>

                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          void openDocument(
                                            document.storage_path,
                                          )
                                        }
                                        className="text-xs font-bold text-aan-navy"
                                      >
                                        {text.openDocument}
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          void deleteItem(
                                            "patient_documents",
                                            document.id,
                                            document.storage_path,
                                          )
                                        }
                                        className="text-xs font-bold text-red-700"
                                      >
                                        {text.delete}
                                      </button>
                                    </div>
                                  </div>
                                ),
                              )}
                            </article>
                          ),
                        )
                      )}
                    </div>
                    {history.length > ITEMS_PREVIEW_LIMIT ? (
                      <button
                        type="button"
                        onClick={() =>
                          setShowAllHistory(
                            (current) => !current,
                          )
                        }
                        className="mt-4 w-full rounded-xl border border-aan-border bg-white px-4 py-3 text-sm font-bold text-aan-secondary transition hover:text-aan-navy"
                      >
                        {showAllHistory
                          ? showLessLabel
                          : `${showMoreLabel} (${history.length - ITEMS_PREVIEW_LIMIT})`}
                      </button>
                    ) : null}
                  </section>

                  <section className="aan-card p-6 sm:p-7">
                    <SectionTitle>
                      {text.goals}
                    </SectionTitle>

                    <form
                      onSubmit={addGoal}
                      className="mt-5 flex flex-col gap-3 rounded-2xl border border-aan-border bg-[#fbf8f3] p-4"
                    >
                      <input
                        type="text"
                        value={goalText}
                        onChange={(
                          event,
                        ) =>
                          setGoalText(
                            event.target.value,
                          )
                        }
                        placeholder={
                          text.goal
                        }
                        className="aan-field min-w-0 flex-1 p-3"
                      />

                      <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-aan-border bg-white px-4 py-3 text-sm font-semibold text-aan-secondary transition hover:text-aan-navy">
                        <span>
                          + {text.attachPdf}
                        </span>

                        <span className="max-w-[55%] truncate text-xs font-normal">
                          {goalPdf
                            ? goalPdf.name
                            : ""}
                        </span>

                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          className="hidden"
                          onChange={(
                            event,
                          ) =>
                            setGoalPdf(
                              event.target
                                .files?.[0] ||
                                null,
                            )
                          }
                        />
                      </label>

                      <button
                        type="submit"
                        disabled={
                          saving ||
                          (!goalText.trim() &&
                            !goalPdf)
                        }
                        className="aan-button px-5 py-2.5 disabled:opacity-60"
                      >
                        + {text.addGoal}
                      </button>
                    </form>

                    <div className="mt-5 grid gap-3">
                      {goals.length ===
                      0 ? (
                        <p className="rounded-2xl border border-aan-border bg-white p-4 text-aan-secondary">
                          {text.noGoals}
                        </p>
                      ) : (
                        visibleGoals.map(
                          (goal) => (
                            <article
                              key={
                                goal.id
                              }
                              className="flex items-start justify-between gap-4 rounded-2xl border border-aan-border bg-white p-4"
                            >
                              <div>
                                <p className="font-semibold text-aan-navy">
                                  {goal.goal}
                                </p>

                                <span className="mt-2 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                                  {goal.status ||
                                    "active"}
                                </span>


                                {editingGoalId === goal.id ? (
                                  <div className="mt-4 rounded-xl border border-aan-border bg-[#fbf8f3] p-4">
                                    <textarea
                                      value={editingGoalText}
                                      onChange={(event) =>
                                        setEditingGoalText(event.target.value)
                                      }
                                      placeholder={text.goal}
                                      className="aan-field min-h-28 w-full resize-y p-3"
                                    />

                                  <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-aan-border bg-white px-4 py-3 text-sm font-semibold text-aan-secondary transition hover:text-aan-navy">
                                    <span>
                                      + {text.attachPdf}
                                    </span>

                                    <span className="max-w-[55%] truncate text-xs font-normal">
                                      {editingGoalPdf
                                        ? editingGoalPdf.name
                                        : ""}
                                    </span>

                                    <input
                                      type="file"
                                      accept="application/pdf,.pdf"
                                      className="hidden"
                                      onChange={(event) =>
                                        setEditingGoalPdf(
                                          event.target.files?.[0] || null,
                                        )
                                      }
                                    />
                                  </label>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        disabled={saving || uploadingDocument || (!editingGoalText.trim() && !editingGoalPdf)}
                                        onClick={() => void saveGoalEdit(goal.id)}
                                        className="aan-button px-4 py-2 disabled:opacity-60"
                                      >
                                        {saveLabel}
                                      </button>
                                      <button
                                        type="button"
                                        disabled={saving}
                                        onClick={() => { setEditingGoalPdf(null); setEditingGoalId(null); }}
                                        className="rounded-xl border border-aan-border bg-white px-4 py-2 text-sm font-bold text-aan-secondary"
                                      >
                                        {cancelLabel}
                                      </button>
                                    </div>
                                  </div>
                                ) : null}

                              {getItemDocuments(
                                "goal",
                                goal.id,
                              ).map(
                                (document) => (
                                  <div
                                    key={
                                      document.id
                                    }
                                    className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-aan-border bg-[#fbf8f3] px-3 py-2"
                                  >
                                    <span className="min-w-0 truncate text-sm font-semibold text-aan-navy">
                                      📄 {document.file_name}
                                    </span>

                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          void openDocument(
                                            document.storage_path,
                                          )
                                        }
                                        className="text-xs font-bold text-aan-navy"
                                      >
                                        {text.openDocument}
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          void deleteItem(
                                            "patient_documents",
                                            document.id,
                                            document.storage_path,
                                          )
                                        }
                                        className="text-xs font-bold text-red-700"
                                      >
                                        {text.delete}
                                      </button>
                                    </div>
                                  </div>
                                ),
                              )}
                              </div>

                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    void editGoal(goal)
                                  }
                                  className="text-xs font-bold text-aan-navy"
                                >
                                  {text.edit}
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    void deleteItem(
                                      "treatment_goals",
                                      goal.id,
                                    )
                                  }
                                  className="text-xs font-bold text-red-700"
                                >
                                  {text.delete}
                                </button>
                              </div>
                            </article>
                          ),
                        )
                      )}
                    </div>
                    {goals.length > ITEMS_PREVIEW_LIMIT ? (
                      <button
                        type="button"
                        onClick={() =>
                          setShowAllGoals(
                            (current) => !current,
                          )
                        }
                        className="mt-4 w-full rounded-xl border border-aan-border bg-white px-4 py-3 text-sm font-bold text-aan-secondary transition hover:text-aan-navy"
                      >
                        {showAllGoals
                          ? showLessLabel
                          : `${showMoreLabel} (${goals.length - ITEMS_PREVIEW_LIMIT})`}
                      </button>
                    ) : null}
                  </section>

                  <section className="aan-card p-6 sm:p-7">
                    <SectionTitle>
                      {text.reports}
                    </SectionTitle>

                    <form
                      onSubmit={addReport}
                      className="mt-5 rounded-2xl border border-aan-border bg-[#fbf8f3] p-4"
                    >
                      <input
                        type="text"
                        value={reportTitle}
                        onChange={(
                          event,
                        ) =>
                          setReportTitle(
                            event.target.value,
                          )
                        }
                        placeholder={
                          text.reportTitle
                        }
                        className="aan-field w-full p-3"
                      />

                      <textarea
                        value={
                          reportContent
                        }
                        onChange={(
                          event,
                        ) =>
                          setReportContent(
                            event.target.value,
                          )
                        }
                        placeholder={
                          text.reportContent
                        }
                        className="aan-field mt-3 min-h-28 w-full resize-y p-3"
                      />

                      <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-aan-border bg-white px-4 py-3 text-sm font-semibold text-aan-secondary transition hover:text-aan-navy">
                        <span>
                          + {text.attachPdf}
                        </span>

                        <span className="max-w-[55%] truncate text-xs font-normal">
                          {reportPdf
                            ? reportPdf.name
                            : ""}
                        </span>

                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          className="hidden"
                          onChange={(
                            event,
                          ) =>
                            setReportPdf(
                              event.target
                                .files?.[0] ||
                                null,
                            )
                          }
                        />
                      </label>

                      <button
                        type="submit"
                        disabled={
                          saving ||
                          (!reportTitle.trim() &&
                            !reportPdf)
                        }
                        className="aan-button mt-3 px-5 py-2.5 disabled:opacity-60"
                      >
                        + {text.addReport}
                      </button>
                    </form>

                    <div className="mt-5 grid gap-3">
                      {reports.length ===
                      0 ? (
                        <p className="rounded-2xl border border-aan-border bg-white p-4 text-aan-secondary">
                          {text.noReports}
                        </p>
                      ) : (
                        visibleReports.map(
                          (report) => (
                            <article
                              key={
                                report.id
                              }
                              className="rounded-2xl border border-aan-border bg-white p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-bold text-aan-navy">
                                    {report.title}
                                  </p>

                                  <p className="mt-1 text-xs text-aan-secondary">
                                    {formatDate(
                                      report.created_at,
                                    )}
                                  </p>
                                </div>

                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void editReport(report)
                                    }
                                    className="text-xs font-bold text-aan-navy"
                                  >
                                    {text.edit}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      void deleteItem(
                                        "clinical_reports",
                                        report.id,
                                      )
                                    }
                                    className="text-xs font-bold text-red-700"
                                  >
                                    {text.delete}
                                  </button>
                                </div>
                              </div>

                              {report.content ? (
                                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-aan-secondary">
                                  {report.content}
                                </p>
                              ) : null}


                              {editingReportId === report.id ? (
                                <div className="mt-4 rounded-xl border border-aan-border bg-[#fbf8f3] p-4">
                                  <input
                                    type="text"
                                    value={editingReportTitle}
                                    onChange={(event) =>
                                      setEditingReportTitle(event.target.value)
                                    }
                                    placeholder={text.reportTitle}
                                    className="aan-field w-full p-3"
                                  />

                                  <textarea
                                    value={editingReportContent}
                                    onChange={(event) =>
                                      setEditingReportContent(event.target.value)
                                    }
                                    placeholder={text.reportContent}
                                    className="aan-field mt-3 min-h-40 w-full resize-y p-3"
                                  />

                                  <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-aan-border bg-white px-4 py-3 text-sm font-semibold text-aan-secondary transition hover:text-aan-navy">
                                    <span>
                                      + {text.attachPdf}
                                    </span>

                                    <span className="max-w-[55%] truncate text-xs font-normal">
                                      {editingReportPdf
                                        ? editingReportPdf.name
                                        : ""}
                                    </span>

                                    <input
                                      type="file"
                                      accept="application/pdf,.pdf"
                                      className="hidden"
                                      onChange={(event) =>
                                        setEditingReportPdf(
                                          event.target.files?.[0] || null,
                                        )
                                      }
                                    />
                                  </label>

                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      disabled={saving || uploadingDocument || (!editingReportTitle.trim() && !editingReportPdf)}
                                      onClick={() => void saveReportEdit(report.id)}
                                      className="aan-button px-4 py-2 disabled:opacity-60"
                                    >
                                      {saveLabel}
                                    </button>
                                    <button
                                      type="button"
                                      disabled={saving}
                                      onClick={() => { setEditingReportPdf(null); setEditingReportId(null); }}
                                      className="rounded-xl border border-aan-border bg-white px-4 py-2 text-sm font-bold text-aan-secondary"
                                    >
                                      {cancelLabel}
                                    </button>
                                  </div>
                                </div>
                              ) : null}

                              {getItemDocuments(
                                "report",
                                report.id,
                              ).map(
                                (document) => (
                                  <div
                                    key={
                                      document.id
                                    }
                                    className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-aan-border bg-[#fbf8f3] px-3 py-2"
                                  >
                                    <span className="min-w-0 truncate text-sm font-semibold text-aan-navy">
                                      📄 {document.file_name}
                                    </span>

                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          void openDocument(
                                            document.storage_path,
                                          )
                                        }
                                        className="text-xs font-bold text-aan-navy"
                                      >
                                        {text.openDocument}
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          void deleteItem(
                                            "patient_documents",
                                            document.id,
                                            document.storage_path,
                                          )
                                        }
                                        className="text-xs font-bold text-red-700"
                                      >
                                        {text.delete}
                                      </button>
                                    </div>
                                  </div>
                                ),
                              )}
                            </article>
                          ),
                        )
                      )}
                    </div>
                    {reports.length > ITEMS_PREVIEW_LIMIT ? (
                      <button
                        type="button"
                        onClick={() =>
                          setShowAllReports(
                            (current) => !current,
                          )
                        }
                        className="mt-4 w-full rounded-xl border border-aan-border bg-white px-4 py-3 text-sm font-bold text-aan-secondary transition hover:text-aan-navy"
                      >
                        {showAllReports
                          ? showLessLabel
                          : `${showMoreLabel} (${reports.length - ITEMS_PREVIEW_LIMIT})`}
                      </button>
                    ) : null}
                  </section>
                </div>


              </>
            ) : null}
          </div>
        </main>
      </>
    </ProtectedRoute>
  );
}

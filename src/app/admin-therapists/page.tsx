"use client";

import {
  useEffect,
  useState,
} from "react";

import Navbar from "../components/Navbar";
import ProtectedRoute from "../components/ProtectedRoute";

import {
  supabase,
} from "@/lib/supabase";

import {
  useLanguage,
} from "@/i18n/LanguageProvider";

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
  const {
    language,
    isArabic,
  } = useLanguage();

  const [
    therapists,
    setTherapists,
  ] = useState<Therapist[]>(
    [],
  );

  const [
    prices,
    setPrices,
  ] = useState<
    Record<string, string>
  >({});

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    processingId,
    setProcessingId,
  ] = useState<
    string | null
  >(null);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const text =
    language === "ar"
      ? {
          eyebrow:
            "إدارة المختصين",

          title:
            "إدارة المختصين والأسعار",

          description:
            "يمكن للإدارة تحديد سعر الجلسة لكل مختص. يظهر السعر للمختص وللمريض، ولا يمكن للمختص تعديله.",

          loading:
            "جارٍ تحميل المختصين...",

          empty:
            "لا توجد حسابات مختصين حالياً.",

          therapist:
            "مختص",

          unnamed:
            "مختص بدون اسم",

          emailUnavailable:
            "البريد الإلكتروني غير متوفر",

          noSpecialty:
            "لم تتم إضافة تخصص",

          noBio:
            "لم تتم إضافة نبذة بعد.",

          currentPrice:
            "السعر الحالي",

          perSession:
            "للجلسة",

          newPrice:
            "السعر الجديد للجلسة",

          updatePrice:
            "تحديث السعر",

          updating:
            "جارٍ التحديث...",

          processing:
            "جارٍ المعالجة...",

          delete:
            "حذف المختص",

          invalidPrice:
            "يرجى إدخال سعر صالح أكبر من صفر.",

          sessionExpired:
            "انتهت جلستك. يرجى تسجيل الدخول من جديد.",

          loadError:
            "تعذر تحميل المختصين.",

          unexpectedLoad:
            "حدث خطأ غير متوقع أثناء تحميل المختصين.",

          updateError:
            "تعذر تحديث السعر.",

          unexpectedUpdate:
            "حدث خطأ غير متوقع أثناء تحديث السعر.",

          updateSuccess:
            "تم تحديث سعر الجلسة بنجاح.",

          deleteConfirm:
            "هل تريد حذف ملف هذا المختص؟ لا يمكن التراجع عن هذا الإجراء.",

          deleteError:
            "تعذر حذف المختص.",

          unexpectedDelete:
            "حدث خطأ غير متوقع أثناء حذف المختص.",

          deleteSuccess:
            "تم حذف ملف المختص.",

          managedByClinic:
            "السعر مُدار حصرياً من قبل الإدارة.",
        }
      : language === "fr"
        ? {
            eyebrow:
              "Gestion des spécialistes",

            title:
              "Spécialistes et tarifs",

            description:
              "L’administration définit le prix d’une séance pour chaque spécialiste. Ce tarif est visible par le spécialiste et les patients, mais le spécialiste ne peut pas le modifier.",

            loading:
              "Chargement des spécialistes...",

            empty:
              "Aucun compte spécialiste pour le moment.",

            therapist:
              "Spécialiste",

            unnamed:
              "Spécialiste sans nom",

            emailUnavailable:
              "E-mail indisponible",

            noSpecialty:
              "Aucune spécialité renseignée",

            noBio:
              "Aucune biographie pour le moment.",

            currentPrice:
              "Tarif actuel",

            perSession:
              "par séance",

            newPrice:
              "Nouveau tarif de la séance",

            updatePrice:
              "Mettre à jour le tarif",

            updating:
              "Mise à jour...",

            processing:
              "Traitement...",

            delete:
              "Supprimer le spécialiste",

            invalidPrice:
              "Veuillez saisir un tarif valide supérieur à 0.",

            sessionExpired:
              "Votre session a expiré. Veuillez vous reconnecter.",

            loadError:
              "Impossible de charger les spécialistes.",

            unexpectedLoad:
              "Une erreur inattendue est survenue pendant le chargement.",

            updateError:
              "Impossible de mettre à jour le tarif.",

            unexpectedUpdate:
              "Une erreur inattendue est survenue pendant la mise à jour du tarif.",

            updateSuccess:
              "Le tarif de la séance a été mis à jour avec succès.",

            deleteConfirm:
              "Supprimer le profil de ce spécialiste ? Cette action est irréversible.",

            deleteError:
              "Impossible de supprimer le spécialiste.",

            unexpectedDelete:
              "Une erreur inattendue est survenue pendant la suppression.",

            deleteSuccess:
              "Le profil du spécialiste a été supprimé.",

            managedByClinic:
              "Tarif géré exclusivement par l’administration.",
          }
        : {
            eyebrow:
              "Therapist management",

            title:
              "Therapists and Session Prices",

            description:
              "Administrators define the session price for each specialist. The price is visible to the specialist and patients, but specialists cannot modify it.",

            loading:
              "Loading specialists...",

            empty:
              "No specialist accounts found.",

            therapist:
              "Specialist",

            unnamed:
              "Unnamed specialist",

            emailUnavailable:
              "Email unavailable",

            noSpecialty:
              "No specialty provided",

            noBio:
              "No biography yet.",

            currentPrice:
              "Current price",

            perSession:
              "per session",

            newPrice:
              "New session price",

            updatePrice:
              "Update Price",

            updating:
              "Updating...",

            processing:
              "Processing...",

            delete:
              "Delete Specialist",

            invalidPrice:
              "Please enter a valid price greater than 0.",

            sessionExpired:
              "Your session has expired. Please sign in again.",

            loadError:
              "Unable to load specialists.",

            unexpectedLoad:
              "An unexpected error occurred while loading specialists.",

            updateError:
              "Unable to update the price.",

            unexpectedUpdate:
              "An unexpected error occurred while updating the price.",

            updateSuccess:
              "Session price updated successfully.",

            deleteConfirm:
              "Delete this specialist profile? This action cannot be undone.",

            deleteError:
              "Unable to delete the specialist.",

            unexpectedDelete:
              "An unexpected error occurred while deleting the specialist.",

            deleteSuccess:
              "Specialist profile deleted.",

            managedByClinic:
              "Price managed exclusively by the administration.",
          };

  useEffect(() => {
    void getTherapists();
  }, []);

  const getAccessToken =
    async () => {
      const {
        data: {
          session,
        },
      } =
        await supabase.auth.getSession();

      return (
        session?.access_token ||
        null
      );
    };

  const formatPrice = (
    price: number,
  ) => {
    const locale =
      language === "fr"
        ? "fr-FR"
        : language === "ar"
          ? "ar-LB"
          : "en-US";

    return new Intl.NumberFormat(
      locale,
      {
        style: "currency",
        currency: "USD",
        minimumFractionDigits:
          0,
        maximumFractionDigits:
          2,
      },
    ).format(price);
  };

  const getTherapists =
    async () => {
      setLoading(true);

      setErrorMessage("");

      try {
        const accessToken =
          await getAccessToken();

        if (!accessToken) {
          alert(
            text.sessionExpired,
          );

          window.location.href =
            "/login";

          return;
        }

        const response =
          await fetch(
            "/api/admin/therapists",
            {
              method: "GET",

              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },

              cache:
                "no-store",
            },
          );

        const result =
          await response.json();

        if (!response.ok) {
          setErrorMessage(
            result.error ||
              text.loadError,
          );

          if (
            response.status ===
              401 ||
            response.status ===
              403
          ) {
            window.location.href =
              "/login";
          }

          return;
        }

        const loadedTherapists:
          Therapist[] =
          result.therapists ||
          [];

        const initialPrices:
          Record<
            string,
            string
          > = {};

        loadedTherapists.forEach(
          (therapist) => {
            initialPrices[
              therapist.id
            ] =
              String(
                therapist.price ??
                  0,
              );
          },
        );

        setTherapists(
          loadedTherapists,
        );

        setPrices(
          initialPrices,
        );
      } catch (error) {
        console.error(
          "Load therapists error:",
          error,
        );

        setErrorMessage(
          text.unexpectedLoad,
        );
      } finally {
        setLoading(false);
      }
    };

  const updatePrice =
    async (
      therapistId: string,
    ) => {
      const newPrice =
        Number(
          prices[
            therapistId
          ],
        );

      if (
        !Number.isFinite(
          newPrice,
        ) ||
        newPrice <= 0
      ) {
        setErrorMessage(
          text.invalidPrice,
        );

        return;
      }

      setProcessingId(
        therapistId,
      );

      setSuccessMessage("");
      setErrorMessage("");

      try {
        const accessToken =
          await getAccessToken();

        if (!accessToken) {
          alert(
            text.sessionExpired,
          );

          window.location.href =
            "/login";

          return;
        }

        const response =
          await fetch(
            "/api/admin/update-therapist-price",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${accessToken}`,
              },

              body:
                JSON.stringify({
                  therapistId,
                  price:
                    newPrice,
                }),
            },
          );

        const result =
          await response.json();

        if (!response.ok) {
          setErrorMessage(
            result.error ||
              text.updateError,
          );

          return;
        }

        const savedPrice =
          Number(
            result
              .therapist
              .price,
          );

        setTherapists(
          (
            currentTherapists,
          ) =>
            currentTherapists.map(
              (
                therapist,
              ) =>
                therapist.id ===
                therapistId
                  ? {
                      ...therapist,
                      price:
                        savedPrice,
                    }
                  : therapist,
            ),
        );

        setPrices(
          (
            currentPrices,
          ) => ({
            ...currentPrices,

            [therapistId]:
              String(
                savedPrice,
              ),
          }),
        );

        setSuccessMessage(
          `${text.updateSuccess} ${formatPrice(
            savedPrice,
          )}`,
        );
      } catch (error) {
        console.error(
          "Update price error:",
          error,
        );

        setErrorMessage(
          text.unexpectedUpdate,
        );
      } finally {
        setProcessingId(
          null,
        );
      }
    };

  const deleteTherapist =
    async (
      therapistId: string,
    ) => {
      const confirmed =
        window.confirm(
          text.deleteConfirm,
        );

      if (!confirmed) {
        return;
      }

      setProcessingId(
        therapistId,
      );

      setSuccessMessage("");
      setErrorMessage("");

      try {
        const accessToken =
          await getAccessToken();

        if (!accessToken) {
          alert(
            text.sessionExpired,
          );

          window.location.href =
            "/login";

          return;
        }

        const response =
          await fetch(
            "/api/admin/therapists",
            {
              method:
                "DELETE",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${accessToken}`,
              },

              body:
                JSON.stringify({
                  therapistId,
                }),
            },
          );

        const result =
          await response.json();

        if (!response.ok) {
          setErrorMessage(
            result.error ||
              text.deleteError,
          );

          return;
        }

        setTherapists(
          (
            currentTherapists,
          ) =>
            currentTherapists.filter(
              (
                therapist,
              ) =>
                therapist.id !==
                therapistId,
            ),
        );

        setPrices(
          (
            currentPrices,
          ) => {
            const updatedPrices =
              {
                ...currentPrices,
              };

            delete updatedPrices[
              therapistId
            ];

            return updatedPrices;
          },
        );

        setSuccessMessage(
          text.deleteSuccess,
        );
      } catch (error) {
        console.error(
          "Delete therapist error:",
          error,
        );

        setErrorMessage(
          text.unexpectedDelete,
        );
      } finally {
        setProcessingId(
          null,
        );
      }
    };

  return (
    <ProtectedRoute
      allowedRoles={[
        "admin",
      ]}
    >
      <>
        <Navbar />

        <main
          dir={
            isArabic
              ? "rtl"
              : "ltr"
          }
          className="min-h-screen bg-aan-background px-5 py-10 sm:px-8 lg:px-10"
        >
          <section className="mx-auto max-w-7xl">
            <div className="aan-card relative mb-10 overflow-hidden p-8 sm:p-10 lg:p-12">
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-aan-gold">
                {
                  text.eyebrow
                }
              </p>

              <h1 className="aan-heading mt-4 text-4xl sm:text-5xl lg:text-6xl">
                {text.title}
              </h1>

              <p className="mt-5 max-w-4xl text-lg leading-8 text-aan-secondary">
                {
                  text.description
                }
              </p>
            </div>

            {successMessage && (
              <div className="mb-7 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 font-semibold text-emerald-700">
                {
                  successMessage
                }
              </div>
            )}

            {errorMessage && (
              <div className="mb-7 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-semibold text-red-700">
                {
                  errorMessage
                }
              </div>
            )}

            {loading ? (
              <div className="aan-card p-10 text-center">
                <p className="text-aan-secondary">
                  {
                    text.loading
                  }
                </p>
              </div>
            ) : therapists.length ===
              0 ? (
              <div className="aan-card p-10 text-center">
                <p className="text-aan-secondary">
                  {
                    text.empty
                  }
                </p>
              </div>
            ) : (
              <div className="grid gap-7 md:grid-cols-2">
                {therapists.map(
                  (
                    therapist,
                  ) => {
                    const isProcessing =
                      processingId ===
                      therapist.id;

                    return (
                      <article
                        key={
                          therapist.id
                        }
                        className="aan-card flex h-full flex-col p-7 sm:p-8"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <h2 className="aan-heading text-3xl">
                              {therapist.full_name ||
                                text.unnamed}
                            </h2>

                            <p className="mt-2 text-sm text-aan-secondary">
                              {therapist.email ||
                                text.emailUnavailable}
                            </p>
                          </div>

                          <span className="rounded-full border border-aan-border bg-[#fbf8f3] px-3 py-1.5 text-xs font-bold text-aan-navy">
                            ✓{" "}
                            {
                              text.therapist
                            }
                          </span>
                        </div>

                        <div className="mt-6 flex-1">
                          <p className="font-semibold text-aan-button">
                            {therapist.specialty ||
                              text.noSpecialty}
                          </p>

                          <p className="mt-4 line-clamp-4 leading-7 text-aan-secondary">
                            {therapist.bio ||
                              text.noBio}
                          </p>
                        </div>

                        <div className="mt-7 rounded-2xl bg-[linear-gradient(135deg,#f8f1e7_0%,#fbf8f3_100%)] p-5">
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-aan-gold">
                            {
                              text.currentPrice
                            }
                          </p>

                          <p className="mt-2 text-3xl font-bold text-aan-navy">
                            {formatPrice(
                              therapist.price ||
                                0,
                            )}
                            <span className="ml-2 text-base font-semibold text-aan-secondary">
                              /
                              {
                                text.perSession
                              }
                            </span>
                          </p>

                          <p className="mt-2 text-sm text-aan-secondary">
                            {
                              text.managedByClinic
                            }
                          </p>
                        </div>

                        <div className="mt-6">
                          <label className="mb-2 block text-sm font-bold text-aan-navy">
                            {
                              text.newPrice
                            }
                          </label>

                          <div className="flex flex-col gap-3 sm:flex-row">
                            <div className="relative flex-1">
                              <span
                                className={`absolute top-1/2 -translate-y-1/2 font-bold text-aan-secondary ${
                                  isArabic
                                    ? "right-4"
                                    : "left-4"
                                }`}
                              >
                                $
                              </span>

                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={
                                  prices[
                                    therapist
                                      .id
                                  ] ??
                                  ""
                                }
                                onChange={(
                                  event,
                                ) =>
                                  setPrices(
                                    (
                                      currentPrices,
                                    ) => ({
                                      ...currentPrices,

                                      [therapist.id]:
                                        event
                                          .target
                                          .value,
                                    }),
                                  )
                                }
                                disabled={
                                  isProcessing
                                }
                                className={`aan-field w-full py-4 ${
                                  isArabic
                                    ? "pr-9 pl-4"
                                    : "pl-9 pr-4"
                                }`}
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                void updatePrice(
                                  therapist.id,
                                )
                              }
                              disabled={
                                isProcessing
                              }
                              className="aan-button whitespace-nowrap px-6 py-4 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isProcessing
                                ? text.updating
                                : text.updatePrice}
                            </button>
                          </div>
                        </div>

                        <div className="mt-7 border-t border-aan-border pt-6">
                          <button
                            type="button"
                            onClick={() =>
                              void deleteTherapist(
                                therapist.id,
                              )
                            }
                            disabled={
                              isProcessing
                            }
                            className="rounded-xl border border-red-200 bg-white px-5 py-3 font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isProcessing
                              ? text.processing
                              : text.delete}
                          </button>
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
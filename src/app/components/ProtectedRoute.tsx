"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  supabase,
} from "@/lib/supabase";

/*
 * Rôle général enregistré dans public.profiles.
 *
 * "therapist" est une valeur historique conservée
 * pour compatibilité avec les comptes existants.
 *
 * IMPORTANT :
 * ce rôle ne détermine plus l'accès spécialiste.
 * L'accès clinique dépend de public.therapists.
 */
type ProfileRole =
  | "admin"
  | "therapist"
  | "patient";

type WorkStatus =
  | "active"
  | "leaving"
  | "inactive";

type Props = {
  children:
    React.ReactNode;

  /*
   * Protection par rôle général.
   *
   * À utiliser uniquement pour les espaces
   * réellement liés à un rôle de compte.
   *
   * Exemples :
   *
   * <ProtectedRoute allowedRoles={["admin"]}>
   *
   * <ProtectedRoute allowedRoles={["patient"]}>
   *
   * Pour l'espace clinique spécialiste,
   * utiliser requireSpecialist à la place.
   */
  allowedRoles?:
    ProfileRole[];

  /*
   * Protection générique de l'espace spécialiste.
   *
   * Si requireSpecialist = true,
   * l'utilisateur doit posséder une ligne
   * dans public.therapists.
   *
   * Son rôle général peut être différent :
   * par exemple "admin" pour un utilisateur
   * qui cumule administration et activité clinique.
   *
   * La source de vérité de l'accès spécialiste
   * est donc public.therapists, pas profiles.role.
   */
  requireSpecialist?:
    boolean;
};

export default function ProtectedRoute({
  children,
  allowedRoles,
  requireSpecialist = false,
}: Props) {
  const router =
    useRouter();

  const [
    loading,
    setLoading,
  ] = useState(true);

  useEffect(() => {
    void checkAccess();
  }, []);

  async function checkAccess() {
    try {
      /*
       * 1. Vérifier qu'un utilisateur
       * est bien connecté.
       */
      const {
        data: {
          user,
        },
        error:
          userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        router.replace(
          "/login",
        );

        return;
      }

      /*
       * 2. Charger le rôle général
       * enregistré dans public.profiles.
       */
      const {
        data: profile,
        error:
          profileError,
      } = await supabase
        .from("profiles")
        .select("role")
        .eq(
          "id",
          user.id,
        )
        .maybeSingle<{
          role:
            ProfileRole | null;
        }>();

      if (
        profileError ||
        !profile ||
        !profile.role
      ) {
        await supabase.auth.signOut();

        router.replace(
          "/login",
        );

        return;
      }

      /*
       * 3. Protection par rôle général.
       *
       * Cette vérification concerne uniquement
       * les pages qui utilisent explicitement
       * allowedRoles.
       *
       * Elle ne sert pas à déterminer
       * si l'utilisateur est spécialiste.
       */
      if (
        allowedRoles &&
        allowedRoles.length > 0 &&
        !allowedRoles.includes(
          profile.role,
        )
      ) {
        router.replace(
          "/",
        );

        return;
      }

      /*
       * 4. Protection de l'espace spécialiste.
       *
       * Toutes les pages cliniques doivent utiliser :
       *
       * <ProtectedRoute requireSpecialist>
       *
       * On ne déduit plus automatiquement
       * l'accès spécialiste depuis
       * profiles.role = "therapist".
       *
       * Cela rend la règle explicite
       * et évite de mélanger rôle général
       * et fonction professionnelle.
       */
      if (requireSpecialist) {
        const {
          data:
            specialist,
          error:
            specialistError,
        } = await supabase
          .from(
            "therapists",
          )
          .select(
            "id, work_status",
          )
          .eq(
            "id",
            user.id,
          )
          .maybeSingle<{
            id: string;
            work_status:
              WorkStatus | null;
          }>();

        if (
          specialistError ||
          !specialist
        ) {
          /*
           * L'utilisateur est connecté,
           * mais ne possède pas de profil
           * spécialiste dans public.therapists.
           *
           * On refuse uniquement l'espace clinique
           * sans déconnecter inutilement
           * un éventuel compte administratif.
           */
          router.replace(
            "/",
          );

          return;
        }

        /*
         * 5. Vérifier le statut professionnel.
         *
         * active
         * → accès normal
         *
         * leaving
         * → accès encore autorisé
         *   pendant la période de transition
         *
         * inactive
         * → accès clinique refusé
         */
        if (
          specialist.work_status ===
          "inactive"
        ) {
          /*
           * Un administrateur qui est aussi spécialiste
           * conserve sa session administrative :
           * seule la partie clinique est refusée.
           */
          if (
            profile.role ===
            "admin"
          ) {
            router.replace(
              "/",
            );

            return;
          }

          /*
           * Pour un spécialiste non administrateur
           * devenu inactif, on coupe la session
           * et on affiche le motif sur la page login.
           */
          await supabase.auth.signOut();

          router.replace(
            "/login?reason=inactive-specialist",
          );

          return;
        }
      }

      /*
       * Toutes les vérifications
       * nécessaires sont passées.
       */
      setLoading(
        false,
      );
    } catch (
      error
    ) {
      console.error(
        "Protected route error:",
        error,
      );

      await supabase.auth.signOut();

      router.replace(
        "/login",
      );
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-aan-background">
        <div className="aan-card px-8 py-6 text-center">
          <p className="font-semibold text-aan-secondary">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
    </>
  );
}

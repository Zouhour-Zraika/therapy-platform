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

type Role =
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

  allowedRoles:
    Role[];
};

export default function ProtectedRoute({
  children,
  allowedRoles,
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
            Role | null;
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

      if (
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
       * Vérification supplémentaire
       * pour les spécialistes.
       *
       * Le rôle reste "therapist",
       * mais work_status décide
       * s'ils peuvent encore accéder
       * à leur espace.
       */
      if (
        profile.role ===
        "therapist"
      ) {
        const {
          data:
            therapist,
          error:
            therapistError,
        } = await supabase
          .from(
            "therapists",
          )
          .select(
            "work_status",
          )
          .eq(
            "id",
            user.id,
          )
          .maybeSingle<{
            work_status:
              WorkStatus | null;
          }>();

        if (
          therapistError ||
          !therapist
        ) {
          await supabase.auth.signOut();

          router.replace(
            "/login",
          );

          return;
        }

        /*
         * active
         * → accès normal
         *
         * leaving
         * → accès temporaire autorisé
         *
         * inactive
         * → accès totalement refusé
         */
        if (
          therapist.work_status ===
          "inactive"
        ) {
          await supabase.auth.signOut();

          router.replace(
            "/login?reason=inactive-specialist",
          );

          return;
        }
      }

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
      {
        children
      }
    </>
  );
}
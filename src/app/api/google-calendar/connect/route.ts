import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs";

const GOOGLE_AUTH_URL =
  "https://accounts.google.com/o/oauth2/v2/auth";

type SpecialistRow = {
  id: string;
  work_status:
    | "active"
    | "leaving"
    | "inactive"
    | null;
};

export async function GET(
  request: NextRequest,
) {
  try {
    const authHeader =
      request.headers.get(
        "authorization",
      );

    if (
      !authHeader?.startsWith(
        "Bearer ",
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Non autorisé.",
        },
        { status: 401 },
      );
    }

    const token =
      authHeader.substring(7);

    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL;

    const supabaseAnonKey =
      process.env
        .NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const supabaseServiceRoleKey =
      process.env
        .SUPABASE_SERVICE_ROLE_KEY;

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      !supabaseServiceRoleKey
    ) {
      return NextResponse.json(
        {
          error:
            "Configuration Supabase incomplète.",
        },
        { status: 500 },
      );
    }

    /*
     * Vérifie le JWT Supabase envoyé
     * par le dashboard.
     */
    const supabaseAuth =
      createClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          auth: {
            persistSession:
              false,
            autoRefreshToken:
              false,
          },
        },
      );

    const {
      data: { user },
      error: userError,
    } =
      await supabaseAuth.auth.getUser(
        token,
      );

    if (
      userError ||
      !user
    ) {
      return NextResponse.json(
        {
          error:
            "Session invalide.",
        },
        { status: 401 },
      );
    }

    /*
     * Lecture serveur du profil spécialiste.
     *
     * La Service Role ne quitte jamais
     * cette route serveur.
     *
     * IMPORTANT :
     * on ne dépend plus de
     * profiles.role === "therapist"
     * ni de profiles.role === "admin".
     *
     * Pour cette fonction clinique,
     * la source de vérité est la présence
     * de l'utilisateur dans public.therapists.
     *
     * Cela permet notamment à un compte
     * admin + spécialiste d'utiliser
     * Google Calendar, tandis qu'un admin
     * purement administratif sans ligne
     * dans therapists reste bloqué.
     */
    const supabaseAdmin =
      createClient(
        supabaseUrl,
        supabaseServiceRoleKey,
        {
          auth: {
            persistSession:
              false,
            autoRefreshToken:
              false,
          },
        },
      );

    const {
      data: specialist,
      error: specialistError,
    } =
      await supabaseAdmin
        .from("therapists")
        .select(
          "id, work_status",
        )
        .eq(
          "id",
          user.id,
        )
        .maybeSingle<SpecialistRow>();

    if (specialistError) {
      console.error(
        "Google connect specialist error:",
        specialistError,
      );

      return NextResponse.json(
        {
          error:
            "Impossible de vérifier le profil spécialiste.",
        },
        { status: 500 },
      );
    }

    if (!specialist) {
      return NextResponse.json(
        {
          error:
            "Accès réservé aux spécialistes.",
        },
        { status: 403 },
      );
    }

    /*
     * active
     * → accès normal
     *
     * leaving
     * → accès encore autorisé
     *
     * inactive
     * → accès clinique refusé
     */
    if (
      specialist.work_status ===
      "inactive"
    ) {
      return NextResponse.json(
        {
          error:
            "Votre accès spécialiste est désactivé.",
        },
        { status: 403 },
      );
    }

    const clientId =
      process.env
        .GOOGLE_CLIENT_ID;

    const redirectUri =
      process.env
        .GOOGLE_REDIRECT_URI;

    if (
      !clientId ||
      !redirectUri
    ) {
      return NextResponse.json(
        {
          error:
            "Configuration Google incomplète.",
        },
        { status: 500 },
      );
    }

    /*
     * State aléatoire pour protéger
     * le retour OAuth.
     */
    const state =
      crypto
        .randomBytes(32)
        .toString("hex");

    /*
     * openid + email + profile permettent
     * au callback de récupérer l'adresse
     * Google connectée.
     *
     * calendar.events permet à AAN de créer
     * les événements Calendar et les liens Meet.
     */
    const scope = [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/calendar.events",
    ].join(" ");

    const authorizationUrl =
      `${GOOGLE_AUTH_URL}?${new URLSearchParams(
        {
          client_id:
            clientId,
          redirect_uri:
            redirectUri,
          response_type:
            "code",
          scope,
          access_type:
            "offline",
          prompt:
            "consent",
          include_granted_scopes:
            "true",
          state,
        },
      ).toString()}`;

    const response =
      NextResponse.json({
        authorizationUrl,
      });

    response.cookies.set(
      "google_oauth_state",
      state,
      {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 600,
        path: "/",
      },
    );

    response.cookies.set(
      "google_oauth_user",
      user.id,
      {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 600,
        path: "/",
      },
    );

    return response;
  } catch (error) {
    console.error(
      "Google connect error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Erreur lors de la connexion Google.",
      },
      { status: 500 },
    );
  }
}

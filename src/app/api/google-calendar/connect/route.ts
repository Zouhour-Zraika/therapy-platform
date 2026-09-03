import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Non autorisé." },
        { status: 401 },
      );
    }

    const token = authHeader.substring(7);

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const supabaseServiceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

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
     * Client public uniquement pour vérifier
     * le JWT Supabase envoyé par le dashboard.
     */
    const supabaseAuth = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Session invalide." },
        { status: 401 },
      );
    }

    /*
     * IMPORTANT :
     * auth.getUser(token) valide le JWT mais
     * n'installe pas ce JWT comme session pour
     * les requêtes .from(...).
     *
     * On utilise donc le client serveur
     * Service Role pour lire le rôle du profil.
     * La Service Role reste uniquement côté serveur.
     */
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

    const {
      data: profile,
      error: profileError,
    } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error(
        "Google connect profile error:",
        profileError,
      );

      return NextResponse.json(
        {
          error:
            "Impossible de vérifier le profil.",
        },
        { status: 500 },
      );
    }

    if (
      !profile ||
      !["therapist", "admin"].includes(
        profile.role,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Accès réservé aux spécialistes.",
        },
        { status: 403 },
      );
    }

    const clientId =
      process.env.GOOGLE_CLIENT_ID;

    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return NextResponse.json(
        {
          error:
            "Configuration Google incomplète.",
        },
        { status: 500 },
      );
    }

    const state =
      crypto.randomBytes(32).toString("hex");

    const authorizationUrl =
      `${GOOGLE_AUTH_URL}?${new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope:
          "https://www.googleapis.com/auth/calendar.events",
        access_type: "offline",
        prompt: "consent",
        include_granted_scopes: "true",
        state,
      }).toString()}`;

    const response = NextResponse.json({
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

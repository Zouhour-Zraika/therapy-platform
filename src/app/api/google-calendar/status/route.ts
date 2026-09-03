import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

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
      data: {
        user,
      },
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
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "therapist_google_connections",
        )
        .select(
          "google_email",
        )
        .eq(
          "therapist_id",
          user.id,
        )
        .maybeSingle();

    if (error) {
      console.error(
        "Google status error:",
        error,
      );

      return NextResponse.json(
        {
          error:
            "Impossible de vérifier la connexion Google.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      connected:
        Boolean(data),
      googleEmail:
        data?.google_email ||
        null,
    });
  } catch (error) {
    console.error(
      "Google status route error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Erreur lors de la vérification Google.",
      },
      { status: 500 },
    );
  }
}

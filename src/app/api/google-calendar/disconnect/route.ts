import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(
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
      data: connection,
      error: connectionError,
    } =
      await supabaseAdmin
        .from(
          "therapist_google_connections",
        )
        .select(
          "access_token, refresh_token",
        )
        .eq(
          "therapist_id",
          user.id,
        )
        .maybeSingle();

    if (connectionError) {
      throw connectionError;
    }

    const tokenToRevoke =
      connection?.refresh_token ||
      connection?.access_token ||
      null;

    if (tokenToRevoke) {
      try {
        await fetch(
          "https://oauth2.googleapis.com/revoke",
          {
            method:
              "POST",
            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded",
            },
            body:
              new URLSearchParams({
                token:
                  tokenToRevoke,
              }),
          },
        );
      } catch (error) {
        console.error(
          "Google revoke request error:",
          error,
        );
      }
    }

    const {
      error: deleteError,
    } =
      await supabaseAdmin
        .from(
          "therapist_google_connections",
        )
        .delete()
        .eq(
          "therapist_id",
          user.id,
        );

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Google disconnect route error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Impossible de déconnecter le compte Google.",
      },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type GoogleService = "calendar" | "meet";

export async function POST(request: NextRequest) {
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

    let body: {
      service?: GoogleService;
    } = {};

    try {
      body = await request.json();
    } catch {
      // Compatibilité avec l'ancien dashboard :
      // sans service explicite, on déconnecte tout Google.
    }

    const service = body.service;

    if (
      service !== undefined &&
      service !== "calendar" &&
      service !== "meet"
    ) {
      return NextResponse.json(
        {
          error:
            "Service Google invalide.",
        },
        { status: 400 },
      );
    }

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
      data: connection,
      error: connectionError,
    } = await supabaseAdmin
      .from("therapist_google_connections")
      .select(
        `
          access_token,
          refresh_token,
          calendar_enabled,
          meet_enabled
        `,
      )
      .eq("therapist_id", user.id)
      .maybeSingle();

    if (connectionError) {
      throw connectionError;
    }

    if (!connection) {
      return NextResponse.json({
        success: true,
        googleConnected: false,
        calendarConnected: false,
        meetConnected: false,
      });
    }

    /*
     * Nouveau fonctionnement :
     *
     * service = "calendar"
     *   -> désactive uniquement Calendar.
     *
     * service = "meet"
     *   -> désactive uniquement Meet.
     *
     * Aucun service
     *   -> ancien comportement :
     *      déconnexion Google complète.
     */

    if (service === "calendar") {
      const { error: updateError } =
        await supabaseAdmin
          .from(
            "therapist_google_connections",
          )
          .update({
            calendar_enabled: false,
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "therapist_id",
            user.id,
          );

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({
        success: true,
        googleConnected: true,
        calendarConnected: false,
        meetConnected:
          connection.meet_enabled === true,
      });
    }

    if (service === "meet") {
      const { error: updateError } =
        await supabaseAdmin
          .from(
            "therapist_google_connections",
          )
          .update({
            meet_enabled: false,
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "therapist_id",
            user.id,
          );

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({
        success: true,
        googleConnected: true,
        calendarConnected:
          connection.calendar_enabled ===
          true,
        meetConnected: false,
      });
    }

    /*
     * Compatibilité temporaire avec
     * l'ancien bouton "Déconnecter Google".
     *
     * Ici seulement, on révoque réellement
     * l'autorisation Google et on supprime
     * la connexion.
     */
    const tokenToRevoke =
      connection.refresh_token ||
      connection.access_token ||
      null;

    if (tokenToRevoke) {
      try {
        const revokeResponse =
          await fetch(
            "https://oauth2.googleapis.com/revoke",
            {
              method: "POST",
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

        if (!revokeResponse.ok) {
          console.error(
            "Google revoke failed:",
            revokeResponse.status,
            await revokeResponse.text(),
          );
        }
      } catch (error) {
        console.error(
          "Google revoke request error:",
          error,
        );
      }
    }

    const { error: deleteError } =
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
      googleConnected: false,
      calendarConnected: false,
      meetConnected: false,
    });
  } catch (error) {
    console.error(
      "Google disconnect route error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Impossible de modifier la connexion Google.",
      },
      { status: 500 },
    );
  }
}
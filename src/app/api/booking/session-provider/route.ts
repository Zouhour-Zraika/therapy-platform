import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type Provider = "google" | "zoom";

type SpecialistRow = {
  id: string;
  work_status:
    | "active"
    | "leaving"
    | "inactive"
    | null;
};

type BookingRow = {
  id: string;
  therapist_id: string;
  status: string;
  therapist_name: string | null;
  scheduled_start: string | null;
  duration_minutes: number | null;
  meeting_url: string | null;
  meeting_provider: string | null;
  zoom_join_url: string | null;
  zoom_start_url: string | null;
};

type ZoomConnectionRow = {
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
};

type ZoomRefreshResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  reason?: string;
};

type ZoomMeetingResponse = {
  id?: number;
  join_url?: string;
  start_url?: string;
};

async function refreshZoomAccessToken(
  refreshToken: string,
) {
  const clientId =
    process.env.ZOOM_OAUTH_CLIENT_ID;

  const clientSecret =
    process.env.ZOOM_OAUTH_CLIENT_SECRET;

  if (
    !clientId ||
    !clientSecret
  ) {
    throw new Error(
      "Zoom OAuth configuration missing.",
    );
  }

  const basicAuth =
    Buffer.from(
      `${clientId}:${clientSecret}`,
    ).toString("base64");

  const response =
    await fetch(
      "https://zoom.us/oauth/token",
      {
        method: "POST",
        headers: {
          Authorization:
            `Basic ${basicAuth}`,
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body:
          new URLSearchParams({
            grant_type:
              "refresh_token",
            refresh_token:
              refreshToken,
          }),
      },
    );

  const data =
    (await response.json()) as
      ZoomRefreshResponse;

  if (
    !response.ok ||
    !data.access_token
  ) {
    console.error(
      "Zoom refresh failed:",
      {
        status:
          response.status,
        error:
          data.error,
        reason:
          data.reason,
      },
    );

    throw new Error(
      "Impossible de renouveler la connexion Zoom. Déconnectez puis reconnectez Zoom.",
    );
  }

  return data;
}

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
        {
          status: 401,
        },
      );
    }

    const token =
      authHeader.substring(7);

    const body =
      (await request.json()) as {
        bookingId?: string;
        provider?: Provider;
      };

    const bookingId =
      body.bookingId;

    const provider =
      body.provider;

    if (
      !bookingId ||
      (
        provider !== "google" &&
        provider !== "zoom"
      )
    ) {
      return NextResponse.json(
        {
          error:
            "bookingId et provider sont requis.",
        },
        {
          status: 400,
        },
      );
    }

    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL;

    const supabaseAnonKey =
      process.env
        .NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const supabaseServiceRoleKey =
      process.env
        .SUPABASE_SERVICE_ROLE_KEY ||
      process.env
        .SUPABASE_SECRET_KEY;

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
        {
          status: 500,
        },
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
      error:
        userError,
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
        {
          status: 401,
        },
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
      data: specialist,
      error:
        specialistError,
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

    if (
      specialistError
    ) {
      throw specialistError;
    }

    if (!specialist) {
      return NextResponse.json(
        {
          error:
            "Accès réservé aux spécialistes.",
        },
        {
          status: 403,
        },
      );
    }

    if (
      specialist.work_status ===
      "inactive"
    ) {
      return NextResponse.json(
        {
          error:
            "Votre accès spécialiste est désactivé.",
        },
        {
          status: 403,
        },
      );
    }

    const {
      data: booking,
      error:
        bookingError,
    } =
      await supabaseAdmin
        .from("bookings")
        .select(
          [
            "id",
            "therapist_id",
            "status",
            "therapist_name",
            "scheduled_start",
            "duration_minutes",
            "meeting_url",
            "meeting_provider",
            "zoom_join_url",
            "zoom_start_url",
          ].join(","),
        )
        .eq(
          "id",
          bookingId,
        )
        .maybeSingle<BookingRow>();

    if (
      bookingError
    ) {
      throw bookingError;
    }

    if (!booking) {
      return NextResponse.json(
        {
          error:
            "Réservation introuvable.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      booking.therapist_id !==
      user.id
    ) {
      return NextResponse.json(
        {
          error:
            "Vous ne pouvez pas démarrer cette séance.",
        },
        {
          status: 403,
        },
      );
    }

    if (
      booking.status !==
      "paid"
    ) {
      return NextResponse.json(
        {
          error:
            "Cette séance n'est pas confirmée.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * Google Meet :
     * meeting_url reste le lien Google historique.
     * On ne l'écrase jamais avec Zoom afin de pouvoir
     * conserver les deux fournisseurs pour une séance.
     */
    if (
      provider === "google"
    ) {
      if (
        !booking.meeting_url
      ) {
        return NextResponse.json(
          {
            error:
              "Le lien Google Meet n'est pas disponible pour cette séance.",
          },
          {
            status: 409,
          },
        );
      }

      const {
        error:
          providerUpdateError,
      } =
        await supabaseAdmin
          .from("bookings")
          .update({
            meeting_provider:
              "google",
          })
          .eq(
            "id",
            booking.id,
          );

      if (
        providerUpdateError
      ) {
        throw providerUpdateError;
      }

      return NextResponse.json({
        startUrl:
          booking.meeting_url,
        meetingProvider:
          "google",
        zoomJoinUrl:
          booking.zoom_join_url,
        zoomStartUrl:
          booking.zoom_start_url,
      });
    }

    /*
     * Si la réunion Zoom existe déjà,
     * on la réutilise au lieu de créer
     * une nouvelle réunion à chaque clic.
     */
    if (
      booking.zoom_start_url &&
      booking.zoom_join_url
    ) {
      const {
        error:
          providerUpdateError,
      } =
        await supabaseAdmin
          .from("bookings")
          .update({
            meeting_provider:
              "zoom",
          })
          .eq(
            "id",
            booking.id,
          );

      if (
        providerUpdateError
      ) {
        throw providerUpdateError;
      }

      return NextResponse.json({
        startUrl:
          booking.zoom_start_url,
        meetingProvider:
          "zoom",
        zoomJoinUrl:
          booking.zoom_join_url,
        zoomStartUrl:
          booking.zoom_start_url,
      });
    }

    const {
      data:
        connection,
      error:
        connectionError,
    } =
      await supabaseAdmin
        .from(
          "therapist_zoom_connections",
        )
        .select(
          "access_token, refresh_token, token_expires_at",
        )
        .eq(
          "therapist_id",
          user.id,
        )
        .maybeSingle<ZoomConnectionRow>();

    if (
      connectionError
    ) {
      throw connectionError;
    }

    if (
      !connection ||
      !connection.access_token
    ) {
      return NextResponse.json(
        {
          error:
            "Connectez d'abord votre compte Zoom.",
        },
        {
          status: 409,
        },
      );
    }

    let accessToken =
      connection.access_token;

    const expiresAt =
      connection.token_expires_at
        ? new Date(
            connection.token_expires_at,
          ).getTime()
        : 0;

    const shouldRefresh =
      !expiresAt ||
      expiresAt <=
        Date.now() + 60_000;

    if (shouldRefresh) {
      if (
        !connection.refresh_token
      ) {
        return NextResponse.json(
          {
            error:
              "La connexion Zoom doit être renouvelée. Déconnectez puis reconnectez Zoom.",
          },
          {
            status: 409,
          },
        );
      }

      const refreshed =
        await refreshZoomAccessToken(
          connection.refresh_token,
        );

      accessToken =
        refreshed.access_token!;

      const refreshedExpiresAt =
        typeof refreshed.expires_in ===
        "number"
          ? new Date(
              Date.now() +
                refreshed.expires_in *
                  1000,
            ).toISOString()
          : null;

      const {
        error:
          refreshUpdateError,
      } =
        await supabaseAdmin
          .from(
            "therapist_zoom_connections",
          )
          .update({
            access_token:
              accessToken,
            refresh_token:
              refreshed.refresh_token ||
              connection.refresh_token,
            token_expires_at:
              refreshedExpiresAt,
            scope:
              refreshed.scope ??
              undefined,
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "therapist_id",
            user.id,
          );

      if (
        refreshUpdateError
      ) {
        throw refreshUpdateError;
      }
    }

    if (
      !booking.scheduled_start
    ) {
      return NextResponse.json(
        {
          error:
            "L'heure de la séance est manquante.",
        },
        {
          status: 409,
        },
      );
    }

    const startDate =
      new Date(
        booking.scheduled_start,
      );

    if (
      Number.isNaN(
        startDate.getTime(),
      )
    ) {
      return NextResponse.json(
        {
          error:
            "L'heure de la séance est invalide.",
        },
        {
          status: 409,
        },
      );
    }

    const zoomResponse =
      await fetch(
        "https://api.zoom.us/v2/users/me/meetings",
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
            "Content-Type":
              "application/json",
          },
          body:
            JSON.stringify({
              topic:
                `AAN Psychotherapy — ${
                  booking.therapist_name ||
                  "Session"
                }`,
              type: 2,
              start_time:
                startDate.toISOString(),
              duration:
                booking.duration_minutes ||
                60,
              timezone:
                "Asia/Beirut",
              agenda:
                "AAN psychotherapy session",
              settings: {
                join_before_host:
                  false,
                waiting_room:
                  true,
                mute_upon_entry:
                  true,
              },
            }),
        },
      );

    const zoomMeeting =
      (await zoomResponse.json()) as
        ZoomMeetingResponse & {
          message?: string;
          code?: number;
        };

    if (
      !zoomResponse.ok ||
      !zoomMeeting.join_url ||
      !zoomMeeting.start_url
    ) {
      console.error(
        "Zoom meeting creation failed:",
        {
          status:
            zoomResponse.status,
          code:
            zoomMeeting.code,
          message:
            zoomMeeting.message,
        },
      );

      return NextResponse.json(
        {
          error:
            zoomMeeting.message ||
            "Impossible de créer la réunion Zoom.",
        },
        {
          status: 502,
        },
      );
    }

    const {
      error:
        bookingUpdateError,
    } =
      await supabaseAdmin
        .from("bookings")
        .update({
          zoom_join_url:
            zoomMeeting.join_url,
          zoom_start_url:
            zoomMeeting.start_url,
          meeting_provider:
            "zoom",
        })
        .eq(
          "id",
          booking.id,
        );

    if (
      bookingUpdateError
    ) {
      throw bookingUpdateError;
    }

    return NextResponse.json({
      startUrl:
        zoomMeeting.start_url,
      meetingProvider:
        "zoom",
      zoomJoinUrl:
        zoomMeeting.join_url,
      zoomStartUrl:
        zoomMeeting.start_url,
    });
  } catch (error) {
    console.error(
      "Session provider route error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Impossible de préparer la séance.",
      },
      {
        status: 500,
      },
    );
  }
}

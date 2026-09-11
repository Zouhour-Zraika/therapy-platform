import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  createGoogleCalendarEventForBooking,
  createGoogleMeetContinuationForBooking,
  createGoogleMeetForBooking,
  deleteGoogleCalendarEventForBooking,
} from "@/lib/googleCalendar";

export const runtime = "nodejs";

type Provider = "google" | "zoom";

type MeetingProvider =
  | "google_meet"
  | "zoom";

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
  patient_email: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  service_type: string | null;
  duration_minutes: number | null;
  meeting_url: string | null;
  meeting_provider: string | null;
  calendar_event_id: string | null;
  zoom_join_url: string | null;
  zoom_start_url: string | null;
  backup_meeting_provider: string | null;
  backup_join_url: string | null;
  backup_host_url: string | null;
  backup_calendar_event_id: string | null;
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
  message?: string;
  code?: number;
};

class RouteError extends Error {
  status: number;

  constructor(
    message: string,
    status = 500,
  ) {
    super(message);
    this.name = "RouteError";
    this.status = status;
  }
}

const TIME_ZONE =
  "Asia/Beirut";

function googleMeetNeedsContinuation(
  serviceType: string | null,
) {
  const normalized =
    serviceType
      ?.trim()
      .toLowerCase() ||
    "";

  return (
    normalized.includes("couple") ||
    normalized.includes("family") ||
    normalized.includes("famille") ||
    normalized.includes("group") ||
    normalized.includes("groupe")
  );
}

async function refreshZoomAccessToken(
  refreshToken: string,
) {
  const clientId =
    process.env.ZOOM_OAUTH_CLIENT_ID;

  const clientSecret =
    process.env.ZOOM_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new RouteError(
      "Configuration OAuth Zoom manquante.",
      500,
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

    throw new RouteError(
      "Impossible de renouveler la connexion Zoom. Déconnectez puis reconnectez Zoom.",
      409,
    );
  }

  return data;
}

async function getZoomAccessToken({
  supabaseAdmin,
  therapistId,
}: {
  supabaseAdmin: any;
  therapistId: string;
}) {
  const {
    data: connection,
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
        therapistId,
      )
      .maybeSingle();

  const typedConnection =
    connection as ZoomConnectionRow | null;

  if (connectionError) {
    throw connectionError;
  }

  if (
    !typedConnection ||
    !typedConnection.access_token
  ) {
    throw new RouteError(
      "Connectez d'abord votre compte Zoom.",
      409,
    );
  }

  let accessToken =
    typedConnection.access_token;

  const expiresAt =
    typedConnection.token_expires_at
      ? new Date(
          typedConnection.token_expires_at,
        ).getTime()
      : 0;

  const shouldRefresh =
    !expiresAt ||
    expiresAt <=
      Date.now() + 60_000;

  if (!shouldRefresh) {
    return accessToken;
  }

  if (!typedConnection.refresh_token) {
    throw new RouteError(
      "La connexion Zoom doit être renouvelée. Déconnectez puis reconnectez Zoom.",
      409,
    );
  }

  const refreshed =
    await refreshZoomAccessToken(
      typedConnection.refresh_token,
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
          typedConnection.refresh_token,
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
        therapistId,
      );

  if (refreshUpdateError) {
    throw refreshUpdateError;
  }

  return accessToken;
}

async function createZoomMeeting({
  accessToken,
  therapistName,
  startDate,
  endDate,
  continuation = false,
}: {
  accessToken: string;
  therapistName: string;
  startDate: Date;
  endDate: Date;
  continuation?: boolean;
}) {
  const durationMinutes =
    Math.max(
      1,
      Math.round(
        (
          endDate.getTime() -
          startDate.getTime()
        ) /
          60_000,
      ),
    );

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
              continuation
                ? `AAN Psychotherapy — ${therapistName} — Continuation`
                : `AAN Psychotherapy — ${therapistName}`,
            type: 2,
            start_time:
              startDate.toISOString(),
            duration:
              durationMinutes,
            timezone:
              TIME_ZONE,
            agenda:
              continuation
                ? "AAN psychotherapy session — continuation room"
                : "AAN psychotherapy session",
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
      ZoomMeetingResponse;

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
        continuation,
      },
    );

    throw new RouteError(
      zoomMeeting.message ||
        "Impossible de créer la réunion Zoom.",
      502,
    );
  }

  return {
    joinUrl:
      zoomMeeting.join_url,
    startUrl:
      zoomMeeting.start_url,
  };
}

async function notifyPatientOfPlatformChange({
  request,
  booking,
  meetingProvider,
  meetingUrl,
  backupMeetingProvider,
  backupJoinUrl,
}: {
  request: NextRequest;
  booking: BookingRow;
  meetingProvider:
    MeetingProvider;
  meetingUrl: string;
  backupMeetingProvider:
    MeetingProvider | null;
  backupJoinUrl:
    string | null;
}) {
  if (!booking.patient_email) {
    return;
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(
      /\/$/,
      "",
    ) ||
    request.nextUrl.origin;

  try {
    const response =
      await fetch(
        `${siteUrl}/api/send-platform-change-email`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body:
            JSON.stringify({
              email:
                booking.patient_email,
              therapist:
                booking.therapist_name ||
                "Specialist",
              meetingProvider,
              meetingUrl,
              scheduledStart:
                booking.scheduled_start,
              backupMeetingProvider,
              backupJoinUrl,
            }),
        },
      );

    if (!response.ok) {
      console.error(
        "Platform change patient email failed:",
        response.status,
        await response.text(),
      );
    }
  } catch (error) {
    // Une erreur d'email ne doit jamais bloquer
    // une bascule d'urgence de plateforme.
    console.error(
      "Platform change patient email request failed:",
      error,
    );
  }
}

async function removeCalendarEvent({
  therapistId,
  calendarEventId,
  label,
}: {
  therapistId: string;
  calendarEventId:
    string | null;
  label: string;
}) {
  if (!calendarEventId) {
    return;
  }

  try {
    await deleteGoogleCalendarEventForBooking({
      therapistId,
      calendarEventId,
    });
  } catch (error) {
    // La bascule vidéo doit continuer même si Calendar
    // est temporairement indisponible.
    console.error(
      `${label} could not be removed:`,
      {
        therapistId,
        calendarEventId,
        error,
      },
    );
  }
}

async function removeOldMeetingCalendarEvents({
  therapistId,
  booking,
}: {
  therapistId: string;
  booking: BookingRow;
}) {
  await removeCalendarEvent({
    therapistId,
    calendarEventId:
      booking.calendar_event_id,
    label:
      "Previous primary Google Calendar event",
  });

  /*
   * Un backup Google Meet possède son propre événement Calendar.
   * Il faut le supprimer avant de changer de plateforme ou de
   * régénérer une nouvelle salle de continuité.
   */
  await removeCalendarEvent({
    therapistId,
    calendarEventId:
      booking.backup_calendar_event_id,
    label:
      "Previous continuation Google Calendar event",
  });
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

    if (specialistError) {
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
            "patient_email",
            "scheduled_start",
            "scheduled_end",
            "service_type",
            "duration_minutes",
            "meeting_url",
            "meeting_provider",
            "calendar_event_id",
            "zoom_join_url",
            "zoom_start_url",
            "backup_meeting_provider",
            "backup_join_url",
            "backup_host_url",
            "backup_calendar_event_id",
          ].join(","),
        )
        .eq(
          "id",
          bookingId,
        )
        .maybeSingle<BookingRow>();

    if (bookingError) {
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

    const endDate =
      booking.scheduled_end
        ? new Date(
            booking.scheduled_end,
          )
        : new Date(
            startDate.getTime() +
              (
                booking.duration_minutes &&
                booking.duration_minutes > 0
                  ? booking.duration_minutes
                  : 60
              ) *
                60 *
                1000,
          );

    if (
      Number.isNaN(
        endDate.getTime(),
      )
    ) {
      return NextResponse.json(
        {
          error:
            "L'heure de fin de la séance est invalide.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * =======================================================
     * GOOGLE MEET
     * =======================================================
     */
    if (
      provider === "google"
    ) {
      const providerChanged =
        booking.meeting_provider !==
        "google_meet";

      const needsContinuation =
        googleMeetNeedsContinuation(
          booking.service_type,
        );

      /*
       * Google Meet est déjà actif.
       *
       * On réutilise la réunion principale, mais on vérifie aussi
       * que la salle de continuité correspond aux règles AAN :
       * - individuelle : aucun backup Meet
       * - couple/famille/groupe : backup Meet automatique
       */
      if (
        !providerChanged &&
        booking.meeting_url
      ) {
        let backupMeetingProvider:
          MeetingProvider | null =
          booking.backup_meeting_provider ===
          "google_meet"
            ? "google_meet"
            : null;

        let backupJoinUrl:
          string | null =
          backupMeetingProvider
            ? booking.backup_join_url
            : null;

        let backupHostUrl:
          string | null =
          backupMeetingProvider
            ? booking.backup_host_url
            : null;

        let backupCalendarEventId:
          string | null =
          backupMeetingProvider
            ? booking.backup_calendar_event_id
            : null;

        /*
         * Les anciennes URLs Zoom ne doivent jamais rester actives
         * lorsque Google Meet est la plateforme courante.
         */
        if (
          booking.zoom_join_url ||
          booking.zoom_start_url
        ) {
          const {
            error:
              clearStaleZoomError,
          } =
            await supabaseAdmin
              .from("bookings")
              .update({
                zoom_join_url:
                  null,
                zoom_start_url:
                  null,
              })
              .eq(
                "id",
                booking.id,
              );

          if (clearStaleZoomError) {
            throw clearStaleZoomError;
          }
        }

        if (needsContinuation) {
          /*
           * Si le booking existait avant la fonctionnalité de
           * continuité, on crée le backup ici une seule fois.
           */
          if (
            !backupJoinUrl ||
            backupMeetingProvider !==
              "google_meet"
          ) {
            await removeCalendarEvent({
              therapistId:
                user.id,
              calendarEventId:
                booking.backup_calendar_event_id,
              label:
                "Stale continuation Calendar event",
            });

            try {
              const continuation =
                await createGoogleMeetContinuationForBooking({
                  therapistId:
                    user.id,
                  summary:
                    `AAN Psychotherapy — ${
                      booking.therapist_name ||
                      "Session"
                    }`,
                  description:
                    "AAN psychotherapy session continuation room",
                  start:
                    startDate.toISOString(),
                  end:
                    endDate.toISOString(),
                  timeZone:
                    TIME_ZONE,
                });

              backupMeetingProvider =
                "google_meet";
              backupJoinUrl =
                continuation.meetingUrl;
              backupHostUrl =
                continuation.meetingUrl;
              backupCalendarEventId =
                continuation.calendarEventId;

              const {
                error:
                  backupUpdateError,
              } =
                await supabaseAdmin
                  .from("bookings")
                  .update({
                    backup_meeting_provider:
                      backupMeetingProvider,
                    backup_join_url:
                      backupJoinUrl,
                    backup_host_url:
                      backupHostUrl,
                    backup_calendar_event_id:
                      backupCalendarEventId,
                  })
                  .eq(
                    "id",
                    booking.id,
                  );

              if (backupUpdateError) {
                throw backupUpdateError;
              }
            } catch (
              continuationError
            ) {
              /*
               * Une erreur du backup ne doit pas empêcher l'accès
               * à la réunion principale déjà valide.
               */
              console.error(
                "Google Meet continuation creation failed:",
                {
                  bookingId:
                    booking.id,
                  error:
                    continuationError,
                },
              );

              backupMeetingProvider =
                null;
              backupJoinUrl =
                null;
              backupHostUrl =
                null;
              backupCalendarEventId =
                null;
            }
          }
        } else {
          /*
           * Séance individuelle : un éventuel ancien backup doit
           * être retiré.
           */
          if (
            booking.backup_join_url ||
            booking.backup_host_url ||
            booking.backup_meeting_provider ||
            booking.backup_calendar_event_id
          ) {
            await removeCalendarEvent({
              therapistId:
                user.id,
              calendarEventId:
                booking.backup_calendar_event_id,
              label:
                "Unneeded Google Meet continuation Calendar event",
            });

            const {
              error:
                clearBackupError,
            } =
              await supabaseAdmin
                .from("bookings")
                .update({
                  backup_meeting_provider:
                    null,
                  backup_join_url:
                    null,
                  backup_host_url:
                    null,
                  backup_calendar_event_id:
                    null,
                })
                .eq(
                  "id",
                  booking.id,
                );

            if (clearBackupError) {
              throw clearBackupError;
            }

            backupMeetingProvider =
              null;
            backupJoinUrl =
              null;
            backupHostUrl =
              null;
            backupCalendarEventId =
              null;
          }
        }

        return NextResponse.json({
          startUrl:
            booking.meeting_url,
          meetingUrl:
            booking.meeting_url,
          meetingProvider:
            "google_meet",
          calendarEventId:
            booking.calendar_event_id,
          zoomJoinUrl:
            null,
          zoomStartUrl:
            null,
          backupMeetingProvider,
          backupJoinUrl,
          backupHostUrl,
          backupCalendarEventId,
          providerChanged:
            false,
        });
      }

      /*
       * Bascule vers Google Meet :
       * on retire l'ancien événement principal ET un éventuel
       * événement Calendar de continuité avant de recréer l'état.
       */
      if (providerChanged) {
        await removeOldMeetingCalendarEvents({
          therapistId:
            user.id,
          booking,
        });
      }

      const googleMeeting =
        await createGoogleMeetForBooking({
          therapistId:
            user.id,
          summary:
            `AAN Psychotherapy — ${
              booking.therapist_name ||
              "Session"
            }`,
          description:
            "AAN psychotherapy session",
          start:
            startDate.toISOString(),
          end:
            endDate.toISOString(),
          timeZone:
            TIME_ZONE,
          attendeeEmail:
            booking.patient_email,
        });

      let backupMeetingProvider:
        MeetingProvider | null =
        null;

      let backupJoinUrl:
        string | null =
        null;

      let backupHostUrl:
        string | null =
        null;

      let backupCalendarEventId:
        string | null =
        null;

      if (needsContinuation) {
        try {
          const continuation =
            await createGoogleMeetContinuationForBooking({
              therapistId:
                user.id,
              summary:
                `AAN Psychotherapy — ${
                  booking.therapist_name ||
                  "Session"
                }`,
              description:
                "AAN psychotherapy session continuation room",
              start:
                startDate.toISOString(),
              end:
                endDate.toISOString(),
              timeZone:
                TIME_ZONE,
            });

          backupMeetingProvider =
            "google_meet";
          backupJoinUrl =
            continuation.meetingUrl;
          backupHostUrl =
            continuation.meetingUrl;
          backupCalendarEventId =
            continuation.calendarEventId;
        } catch (
          continuationError
        ) {
          /*
           * La réunion principale reste valable même si la
           * continuité n'a pas pu être préparée.
           */
          console.error(
            "Google Meet continuation creation failed during platform switch:",
            {
              bookingId:
                booking.id,
              error:
                continuationError,
            },
          );
        }
      }

      const {
        error:
          googleUpdateError,
      } =
        await supabaseAdmin
          .from("bookings")
          .update({
            meeting_url:
              googleMeeting.meetingUrl,
            meeting_provider:
              "google_meet",
            calendar_event_id:
              googleMeeting.calendarEventId,
            zoom_join_url:
              null,
            zoom_start_url:
              null,
            backup_meeting_provider:
              backupMeetingProvider,
            backup_join_url:
              backupJoinUrl,
            backup_host_url:
              backupHostUrl,
            backup_calendar_event_id:
              backupCalendarEventId,
          })
          .eq(
            "id",
            booking.id,
          );

      if (googleUpdateError) {
        throw googleUpdateError;
      }

      const {
        data:
          persistedGoogleBooking,
        error:
          persistedGoogleBookingError,
      } =
        await supabaseAdmin
          .from("bookings")
          .select(
            [
              "meeting_provider",
              "meeting_url",
              "zoom_join_url",
              "zoom_start_url",
              "calendar_event_id",
              "backup_meeting_provider",
              "backup_join_url",
              "backup_host_url",
              "backup_calendar_event_id",
            ].join(","),
          )
          .eq(
            "id",
            booking.id,
          )
          .single<{
            meeting_provider:
              string | null;
            meeting_url:
              string | null;
            zoom_join_url:
              string | null;
            zoom_start_url:
              string | null;
            calendar_event_id:
              string | null;
            backup_meeting_provider:
              string | null;
            backup_join_url:
              string | null;
            backup_host_url:
              string | null;
            backup_calendar_event_id:
              string | null;
          }>();

      if (
        persistedGoogleBookingError
      ) {
        throw persistedGoogleBookingError;
      }

      if (
        persistedGoogleBooking.meeting_provider !==
          "google_meet" ||
        !persistedGoogleBooking.meeting_url
      ) {
        throw new Error(
          "La bascule vers Google Meet n'a pas été enregistrée correctement.",
        );
      }

      if (providerChanged) {
        await notifyPatientOfPlatformChange({
          request,
          booking,
          meetingProvider:
            "google_meet",
          meetingUrl:
            persistedGoogleBooking.meeting_url,
          backupMeetingProvider:
            persistedGoogleBooking.backup_meeting_provider ===
            "google_meet"
              ? "google_meet"
              : null,
          backupJoinUrl:
            persistedGoogleBooking.backup_join_url,
        });
      }

      return NextResponse.json({
        startUrl:
          persistedGoogleBooking.meeting_url,
        meetingUrl:
          persistedGoogleBooking.meeting_url,
        meetingProvider:
          "google_meet",
        calendarEventId:
          persistedGoogleBooking.calendar_event_id,
        zoomJoinUrl:
          null,
        zoomStartUrl:
          null,
        backupMeetingProvider:
          persistedGoogleBooking.backup_meeting_provider,
        backupJoinUrl:
          persistedGoogleBooking.backup_join_url,
        backupHostUrl:
          persistedGoogleBooking.backup_host_url,
        backupCalendarEventId:
          persistedGoogleBooking.backup_calendar_event_id,
        providerChanged,
      });
    }

    /*
     * =======================================================
     * ZOOM
     * =======================================================
     *
     * Toutes les séances AAN dépassent la limite que nous voulons
     * sécuriser sur Zoom. Une seconde réunion Zoom de continuité
     * est donc toujours préparée.
     */
    const zoomProviderChanged =
      booking.meeting_provider !==
      "zoom";

    const accessToken =
      await getZoomAccessToken({
        supabaseAdmin,
        therapistId:
          user.id,
      });

    /*
     * Zoom est déjà actif : on réutilise la réunion principale,
     * mais on crée le backup s'il manque (anciens bookings).
     */
    if (
      !zoomProviderChanged &&
      booking.zoom_start_url &&
      booking.zoom_join_url
    ) {
      if (booking.meeting_url) {
        const {
          error:
            clearStaleMeetError,
        } =
          await supabaseAdmin
            .from("bookings")
            .update({
              meeting_url:
                null,
            })
            .eq(
              "id",
              booking.id,
            );

        if (clearStaleMeetError) {
          throw clearStaleMeetError;
        }
      }

      let backupMeetingProvider:
        MeetingProvider | null =
        booking.backup_meeting_provider ===
        "zoom"
          ? "zoom"
          : null;

      let backupJoinUrl:
        string | null =
        backupMeetingProvider
          ? booking.backup_join_url
          : null;

      let backupHostUrl:
        string | null =
        backupMeetingProvider
          ? booking.backup_host_url
          : null;

      /*
       * Un ancien backup Google peut encore avoir un événement
       * Calendar. On le supprime avant de passer au backup Zoom.
       */
      if (
        backupMeetingProvider !==
          "zoom" ||
        !backupJoinUrl ||
        !backupHostUrl
      ) {
        await removeCalendarEvent({
          therapistId:
            user.id,
          calendarEventId:
            booking.backup_calendar_event_id,
          label:
            "Stale continuation Calendar event",
        });

        try {
          const continuation =
            await createZoomMeeting({
              accessToken,
              therapistName:
                booking.therapist_name ||
                "Session",
              startDate,
              endDate,
              continuation:
                true,
            });

          backupMeetingProvider =
            "zoom";
          backupJoinUrl =
            continuation.joinUrl;
          backupHostUrl =
            continuation.startUrl;

          const {
            error:
              backupUpdateError,
          } =
            await supabaseAdmin
              .from("bookings")
              .update({
                backup_meeting_provider:
                  "zoom",
                backup_join_url:
                  backupJoinUrl,
                backup_host_url:
                  backupHostUrl,
                backup_calendar_event_id:
                  null,
              })
              .eq(
                "id",
                booking.id,
              );

          if (backupUpdateError) {
            throw backupUpdateError;
          }
        } catch (
          continuationError
        ) {
          /*
           * Ne jamais empêcher le spécialiste d'ouvrir la réunion
           * Zoom principale déjà disponible.
           */
          console.error(
            "Zoom continuation creation failed for active Zoom booking:",
            {
              bookingId:
                booking.id,
              error:
                continuationError,
            },
          );

          backupMeetingProvider =
            null;
          backupJoinUrl =
            null;
          backupHostUrl =
            null;
        }
      }

      return NextResponse.json({
        startUrl:
          booking.zoom_start_url,
        meetingUrl:
          null,
        meetingProvider:
          "zoom",
        calendarEventId:
          booking.calendar_event_id,
        zoomJoinUrl:
          booking.zoom_join_url,
        zoomStartUrl:
          booking.zoom_start_url,
        backupMeetingProvider,
        backupJoinUrl,
        backupHostUrl,
        backupCalendarEventId:
          null,
        providerChanged:
          false,
      });
    }

    /*
     * Bascule vers Zoom ou réparation d'un booking Zoom incomplet :
     * on crée une NOUVELLE réunion principale et un NOUVEAU backup.
     * On ne réutilise pas un ancien lien Zoom après une bascule Meet.
     */
    if (zoomProviderChanged) {
      await removeOldMeetingCalendarEvents({
        therapistId:
          user.id,
        booking,
      });
    } else {
      await removeCalendarEvent({
        therapistId:
          user.id,
        calendarEventId:
          booking.backup_calendar_event_id,
        label:
          "Previous continuation Calendar event",
      });
    }

    const zoomMeeting =
      await createZoomMeeting({
        accessToken,
        therapistName:
          booking.therapist_name ||
          "Session",
        startDate,
        endDate,
      });

    let zoomContinuation:
      {
        joinUrl: string;
        startUrl: string;
      } | null =
      null;

    try {
      zoomContinuation =
        await createZoomMeeting({
          accessToken,
          therapistName:
            booking.therapist_name ||
            "Session",
          startDate,
          endDate,
          continuation:
            true,
        });
    } catch (
      continuationError
    ) {
      /*
       * Le changement vers Zoom reste utilisable même si la salle
       * secondaire n'a pas pu être créée.
       */
      console.error(
        "Zoom continuation creation failed during platform switch:",
        {
          bookingId:
            booking.id,
          error:
            continuationError,
        },
      );
    }

    let newCalendarEventId:
      string | null =
      null;

    try {
      const calendarEvent =
        await createGoogleCalendarEventForBooking({
          therapistId:
            user.id,
          summary:
            `AAN Psychotherapy — ${
              booking.therapist_name ||
              "Session"
            }`,
          description:
            [
              `AAN booking ${booking.id}`,
              "",
              "Platform: Zoom",
              `Join Zoom: ${zoomMeeting.joinUrl}`,
              zoomContinuation
                ? `Continuation Zoom: ${zoomContinuation.joinUrl}`
                : null,
            ]
              .filter(Boolean)
              .join("\n"),
          location:
            zoomMeeting.joinUrl,
          start:
            startDate.toISOString(),
          end:
            endDate.toISOString(),
          timeZone:
            TIME_ZONE,
          attendeeEmail:
            booking.patient_email,
        });

      newCalendarEventId =
        calendarEvent.calendarEventId;
    } catch (calendarError) {
      console.error(
        "Google Calendar event creation failed for Zoom session:",
        calendarError,
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
            zoomMeeting.joinUrl,
          zoom_start_url:
            zoomMeeting.startUrl,
          meeting_provider:
            "zoom",
          meeting_url:
            null,
          calendar_event_id:
            newCalendarEventId,
          backup_meeting_provider:
            zoomContinuation
              ? "zoom"
              : null,
          backup_join_url:
            zoomContinuation?.joinUrl ||
            null,
          backup_host_url:
            zoomContinuation?.startUrl ||
            null,
          backup_calendar_event_id:
            null,
        })
        .eq(
          "id",
          booking.id,
        );

    if (bookingUpdateError) {
      throw bookingUpdateError;
    }

    if (zoomProviderChanged) {
      await notifyPatientOfPlatformChange({
        request,
        booking,
        meetingProvider:
          "zoom",
        meetingUrl:
          zoomMeeting.joinUrl,
        backupMeetingProvider:
          zoomContinuation
            ? "zoom"
            : null,
        backupJoinUrl:
          zoomContinuation?.joinUrl ||
          null,
      });
    }

    return NextResponse.json({
      startUrl:
        zoomMeeting.startUrl,
      meetingUrl:
        null,
      meetingProvider:
        "zoom",
      calendarEventId:
        newCalendarEventId,
      zoomJoinUrl:
        zoomMeeting.joinUrl,
      zoomStartUrl:
        zoomMeeting.startUrl,
      backupMeetingProvider:
        zoomContinuation
          ? "zoom"
          : null,
      backupJoinUrl:
        zoomContinuation?.joinUrl ||
        null,
      backupHostUrl:
        zoomContinuation?.startUrl ||
        null,
      backupCalendarEventId:
        null,
      providerChanged:
        zoomProviderChanged,
    });
  } catch (error) {
    console.error(
      "Session provider route error:",
      error,
    );

    const status =
      error instanceof RouteError
        ? error.status
        : 500;

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Impossible de préparer la séance.",
      },
      {
        status,
      },
    );
  }
}

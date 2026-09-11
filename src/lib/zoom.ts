type ZoomConnection = {
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
};

type ZoomTokenResponse = {
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

async function refreshZoomAccessToken({
  therapistId,
  refreshToken,
  supabaseAdmin,
}: {
  therapistId: string;
  refreshToken: string;
  supabaseAdmin: any;
}) {
  const clientId = process.env.ZOOM_OAUTH_CLIENT_ID;
  const clientSecret = process.env.ZOOM_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Zoom OAuth configuration is missing.");
  }

  const basicAuth = Buffer.from(
    `${clientId}:${clientSecret}`,
  ).toString("base64");

  const response = await fetch(
    "https://zoom.us/oauth/token",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    },
  );

  const data =
    (await response.json()) as ZoomTokenResponse;

  if (!response.ok || !data.access_token) {
    console.error(
      "Zoom access token refresh failed:",
      {
        status: response.status,
        error: data.error,
        reason: data.reason,
      },
    );

    throw new Error(
      "Unable to refresh Zoom access token.",
    );
  }

  const expiresAt =
    typeof data.expires_in === "number"
      ? new Date(
          Date.now() +
            data.expires_in * 1000,
        ).toISOString()
      : null;

  const { error: connectionUpdateError } =
    await supabaseAdmin
      .from("therapist_zoom_connections")
      .update({
        access_token: data.access_token,
        refresh_token:
          data.refresh_token || refreshToken,
        token_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("therapist_id", therapistId);

  if (connectionUpdateError) {
    throw connectionUpdateError;
  }

  return data.access_token;
}

async function getZoomAccessToken({
  therapistId,
  supabaseAdmin,
}: {
  therapistId: string;
  supabaseAdmin: any;
}) {
  const {
    data: connection,
    error: connectionError,
  } = await supabaseAdmin
    .from("therapist_zoom_connections")
    .select(
      "access_token, refresh_token, token_expires_at",
    )
    .eq("therapist_id", therapistId)
    .maybeSingle();

  if (connectionError) {
    throw connectionError;
  }

  const zoomConnection =
    connection as ZoomConnection | null;

  if (!zoomConnection) {
    throw new Error(
      "The specialist has not connected a Zoom account.",
    );
  }

  const expiresAt =
    zoomConnection.token_expires_at
      ? new Date(
          zoomConnection.token_expires_at,
        ).getTime()
      : 0;

  if (
    zoomConnection.access_token &&
    expiresAt > Date.now() + 60_000
  ) {
    return zoomConnection.access_token;
  }

  if (!zoomConnection.refresh_token) {
    throw new Error(
      "The specialist Zoom connection must be renewed.",
    );
  }

  return refreshZoomAccessToken({
    therapistId,
    refreshToken:
      zoomConnection.refresh_token,
    supabaseAdmin,
  });
}

export async function createZoomMeetingForBooking({
  therapistId,
  therapistName,
  start,
  end,
  supabaseAdmin,
  continuation = false,
}: {
  therapistId: string;
  therapistName: string;
  start: string;
  end: string;
  supabaseAdmin: any;
  continuation?: boolean;
}) {
  const accessToken =
    await getZoomAccessToken({
      therapistId,
      supabaseAdmin,
    });

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime())
  ) {
    throw new Error(
      "Invalid session schedule for Zoom.",
    );
  }

  const durationMinutes =
    Math.max(
      1,
      Math.round(
        (endDate.getTime() -
          startDate.getTime()) /
          60_000,
      ),
    );

  const response = await fetch(
    "https://api.zoom.us/v2/users/me/meetings",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic: continuation
          ? `AAN Psychotherapy — ${therapistName} — Continuation`
          : `AAN Psychotherapy — ${therapistName}`,
        type: 2,
        start_time:
          startDate.toISOString(),
        duration: durationMinutes,
        timezone: "Asia/Beirut",
        agenda: continuation
          ? "AAN psychotherapy session — continuation room"
          : "AAN psychotherapy session",
        settings: {
          join_before_host: false,
          waiting_room: true,
          mute_upon_entry: true,
        },
      }),
    },
  );

  const meeting =
    (await response.json()) as ZoomMeetingResponse;

  if (
    !response.ok ||
    !meeting.join_url ||
    !meeting.start_url
  ) {
    console.error(
      "Zoom meeting creation failed:",
      {
        status: response.status,
        code: meeting.code,
        message: meeting.message,
      },
    );

    throw new Error(
      meeting.message ||
        "Unable to create the Zoom meeting.",
    );
  }

  return {
    provider: "zoom" as const,
    joinUrl: meeting.join_url,
    startUrl: meeting.start_url,
  };
}

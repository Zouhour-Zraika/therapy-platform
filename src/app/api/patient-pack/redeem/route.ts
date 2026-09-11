import {
  createClient,
} from "@supabase/supabase-js";

import {
  NextResponse,
} from "next/server";

import {
  createGoogleCalendarEventForBooking,
  createGoogleMeetForBooking,
} from "@/lib/googleCalendar";

export const runtime =
  "nodejs";

type Language =
  | "en"
  | "fr"
  | "ar";

type MeetingProvider =
  | "google_meet"
  | "zoom";

type PatientPackRow = {
  id: string;
  patient_id: string;
  therapist_id: string;
  therapist_service_id: string;
  sessions_total: number;
  sessions_remaining: number;
  session_price: number;
  total_price: number;
  status: string;
  valid_until: string | null;
  payment_transaction_id: string | null;
};

type TherapistRow = {
  id: string;
  full_name: string | null;
  care_domain: string | null;
  work_status:
    | "active"
    | "leaving"
    | "inactive"
    | null;
  preferred_meeting_provider:
    | MeetingProvider
    | null;
};

type TherapistServiceRow = {
  id: string;
  therapist_id: string;
  service_type: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
};

type SlotRow = {
  id: string;
  therapist_id: string | null;
  day: string | null;
  time: string | null;
  slot_date: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_booked: boolean | null;
};

type BookingRow = {
  id: string;
  patient_id: string | null;
  patient_email: string | null;
  therapist_id: string | null;
  therapist_name: string | null;
  slot_id: string | null;
  slot_day: string | null;
  slot_time: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  therapist_service_id: string | null;
  service_type: string | null;
  duration_minutes: number | null;
  price: number;
  status: string;
  payment_provider: string | null;
  payment_method: string | null;
  payment_transaction_id: string | null;
  patient_pack_id: string | null;
  payment_source: string | null;
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

type ActiveAssignment = {
  id: string;
  therapist_id: string;
  care_domain: string;
  status: string;
};

type ZoomConnection = {
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
};

type ZoomTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
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

const TIME_ZONE =
  "Asia/Beirut";

function createSupabaseAdmin() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Supabase server configuration is missing.",
    );
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    },
  );
}

async function getAuthenticatedPatient(
  request: Request,
  supabaseAdmin:
    ReturnType<typeof createSupabaseAdmin>,
) {
  const authorization =
    request.headers.get("authorization");

  if (
    !authorization?.startsWith("Bearer ")
  ) {
    return null;
  }

  const accessToken =
    authorization
      .slice("Bearer ".length)
      .trim();

  if (!accessToken) {
    return null;
  }

  const {
    data: { user },
    error: userError,
  } =
    await supabaseAdmin.auth.getUser(
      accessToken,
    );

  if (userError || !user) {
    return null;
  }

  const {
    data: profile,
    error: profileError,
  } =
    await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle<{
        role: string | null;
      }>();

  if (
    profileError ||
    !profile ||
    profile.role !== "patient"
  ) {
    return null;
  }

  return user;
}

function parseSlotTime(time: string) {
  const normalized =
    time.trim().toUpperCase();

  const match =
    normalized.match(
      /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/,
    );

  if (!match) {
    return null;
  }

  let hour =
    Number(match[1]);

  const minute =
    Number(match[2] || "0");

  const period =
    match[3];

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  if (period) {
    if (hour < 1 || hour > 12) {
      return null;
    }

    if (
      period === "PM" &&
      hour < 12
    ) {
      hour += 12;
    }

    if (
      period === "AM" &&
      hour === 12
    ) {
      hour = 0;
    }
  } else if (
    hour < 0 ||
    hour > 23
  ) {
    return null;
  }

  return {
    hour,
    minute,
  };
}

function getTimeZoneOffsetMs(
  date: Date,
  timeZone: string,
) {
  const formatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      },
    );

  const parts =
    formatter.formatToParts(date);

  const values =
    Object.fromEntries(
      parts
        .filter(
          (part) =>
            part.type !== "literal",
        )
        .map(
          (part) => [
            part.type,
            part.value,
          ],
        ),
    );

  const asUtc =
    Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
      Number(values.second),
    );

  return asUtc - date.getTime();
}

function buildScheduledStart(
  slot: SlotRow,
) {
  if (slot.starts_at) {
    const existing =
      new Date(slot.starts_at);

    if (
      !Number.isNaN(
        existing.getTime(),
      )
    ) {
      return existing;
    }
  }

  if (!slot.slot_date || !slot.time) {
    return null;
  }

  const parsedTime =
    parseSlotTime(slot.time);

  if (!parsedTime) {
    return null;
  }

  const [
    year,
    month,
    day,
  ] =
    slot.slot_date
      .split("-")
      .map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const utcGuess =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        parsedTime.hour,
        parsedTime.minute,
        0,
      ),
    );

  let offset =
    getTimeZoneOffsetMs(
      utcGuess,
      TIME_ZONE,
    );

  let result =
    new Date(
      utcGuess.getTime() -
        offset,
    );

  const correctedOffset =
    getTimeZoneOffsetMs(
      result,
      TIME_ZONE,
    );

  if (correctedOffset !== offset) {
    offset = correctedOffset;

    result =
      new Date(
        utcGuess.getTime() -
          offset,
      );
  }

  return result;
}

async function refreshZoomAccessToken({
  therapistId,
  refreshToken,
  supabaseAdmin,
}: {
  therapistId: string;
  refreshToken: string;
  supabaseAdmin: any;
}) {
  const clientId =
    process.env.ZOOM_OAUTH_CLIENT_ID;

  const clientSecret =
    process.env.ZOOM_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Zoom OAuth configuration is missing.",
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
      ZoomTokenResponse;

  if (
    !response.ok ||
    !data.access_token
  ) {
    throw new Error(
      data.reason ||
      data.error ||
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

  const {
    error:
      connectionUpdateError,
  } =
    await supabaseAdmin
      .from(
        "therapist_zoom_connections",
      )
      .update({
        access_token:
          data.access_token,
        refresh_token:
          data.refresh_token ||
          refreshToken,
        token_expires_at:
          expiresAt,
        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "therapist_id",
        therapistId,
      );

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

  if (connectionError) {
    throw connectionError;
  }

  if (!connection) {
    throw new Error(
      "The specialist has not connected a Zoom account.",
    );
  }

  const expiresAt =
    connection.token_expires_at
      ? new Date(
          connection.token_expires_at,
        ).getTime()
      : 0;

  if (
    connection.access_token &&
    expiresAt >
      Date.now() + 60_000
  ) {
    return connection.access_token;
  }

  if (!connection.refresh_token) {
    throw new Error(
      "The specialist Zoom connection must be renewed.",
    );
  }

  return refreshZoomAccessToken({
    therapistId,
    refreshToken:
      connection.refresh_token,
    supabaseAdmin,
  });
}

async function createZoomMeetingForBooking({
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

  const startDate =
    new Date(start);

  const endDate =
    new Date(end);

  if (
    Number.isNaN(
      startDate.getTime(),
    ) ||
    Number.isNaN(
      endDate.getTime(),
    )
  ) {
    throw new Error(
      "Invalid session schedule for Zoom.",
    );
  }

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

  const response =
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
              join_before_host: false,
              waiting_room: true,
              mute_upon_entry: true,
            },
          }),
      },
    );

  const meeting =
    (await response.json()) as
      ZoomMeetingResponse;

  if (
    !response.ok ||
    !meeting.join_url ||
    !meeting.start_url
  ) {
    throw new Error(
      meeting.message ||
      "Unable to create the Zoom meeting.",
    );
  }

  return {
    provider:
      "zoom" as const,
    joinUrl:
      meeting.join_url,
    startUrl:
      meeting.start_url,
  };
}

async function ensureAssignment({
  patientId,
  therapist,
  supabaseAdmin,
}: {
  patientId: string;
  therapist: TherapistRow;
  supabaseAdmin: any;
}) {
  const careDomain =
    therapist.care_domain
      ?.trim() ||
    null;

  if (!careDomain) {
    return;
  }

  const {
    data:
      activeAssignment,
    error:
      assignmentReadError,
  } =
    await supabaseAdmin
      .from(
        "patient_therapist_assignments",
      )
      .select(
        "id, therapist_id, care_domain, status",
      )
      .eq(
        "patient_id",
        patientId,
      )
      .eq(
        "care_domain",
        careDomain,
      )
      .eq(
        "status",
        "active",
      )
      .limit(1)
      .maybeSingle();

  if (assignmentReadError) {
    throw assignmentReadError;
  }

  if (
    activeAssignment &&
    activeAssignment.therapist_id !==
      therapist.id
  ) {
    throw new Error(
      "ACTIVE_SPECIALIST_CONFLICT",
    );
  }

  if (!activeAssignment) {
    const {
      error:
        assignmentInsertError,
    } =
      await supabaseAdmin
        .from(
          "patient_therapist_assignments",
        )
        .insert({
          patient_id:
            patientId,
          therapist_id:
            therapist.id,
          care_domain:
            careDomain,
          status:
            "active",
        });

    if (assignmentInsertError) {
      const {
        data:
          assignmentAfterInsert,
        error:
          assignmentAfterInsertError,
      } =
        await supabaseAdmin
          .from(
            "patient_therapist_assignments",
          )
          .select(
            "id, therapist_id, care_domain, status",
          )
          .eq(
            "patient_id",
            patientId,
          )
          .eq(
            "care_domain",
            careDomain,
          )
          .eq(
            "status",
            "active",
          )
          .limit(1)
          .maybeSingle();

      if (
        assignmentAfterInsertError ||
        !assignmentAfterInsert
      ) {
        throw assignmentInsertError;
      }

      if (
        assignmentAfterInsert.therapist_id !==
        therapist.id
      ) {
        throw new Error(
          "ACTIVE_SPECIALIST_CONFLICT",
        );
      }
    }
  }
}

export async function POST(
  request: Request,
) {
  const supabaseAdmin =
    createSupabaseAdmin();

  let claimedSlotId:
    | string
    | null = null;

  let decrementedPackId:
    | string
    | null = null;

  let previousRemaining:
    | number
    | null = null;

  try {
    const user =
      await getAuthenticatedPatient(
        request,
        supabaseAdmin,
      );

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Patient authentication required.",
        },
        {
          status: 401,
        },
      );
    }

    const body =
      await request.json();

    const packId =
      String(
        body.packId ||
        "",
      ).trim();

    const slotId =
      String(
        body.slotId ||
        "",
      ).trim();

    const language:
      Language =
      body.language === "ar"
        ? "ar"
        : body.language === "fr"
          ? "fr"
          : "en";

    if (!packId || !slotId) {
      return NextResponse.json(
        {
          error:
            "Patient Pack and slot are required.",
        },
        {
          status: 400,
        },
      );
    }

    const {
      data: pack,
      error:
        packError,
    } =
      await supabaseAdmin
        .from(
          "patient_packs",
        )
        .select(
          `
            id,
            patient_id,
            therapist_id,
            therapist_service_id,
            sessions_total,
            sessions_remaining,
            session_price,
            total_price,
            status,
            valid_until,
            payment_transaction_id
          `,
        )
        .eq(
          "id",
          packId,
        )
        .eq(
          "patient_id",
          user.id,
        )
        .maybeSingle<PatientPackRow>();

    if (packError) {
      throw packError;
    }

    if (!pack) {
      return NextResponse.json(
        {
          error:
            "Patient Pack not found.",
          code:
            "PACK_NOT_FOUND",
        },
        {
          status: 404,
        },
      );
    }

    if (pack.status !== "active") {
      return NextResponse.json(
        {
          error:
            pack.status === "used"
              ? "This Patient Pack has already been fully used."
              : "This Patient Pack is not active.",
          code:
            "PACK_NOT_ACTIVE",
        },
        {
          status: 409,
        },
      );
    }

    const validUntilMs =
      pack.valid_until
        ? new Date(
            pack.valid_until,
          ).getTime()
        : NaN;

    if (
      !Number.isFinite(
        validUntilMs,
      ) ||
      validUntilMs <= Date.now()
    ) {
      await supabaseAdmin
        .from(
          "patient_packs",
        )
        .update({
          status: "expired",
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", pack.id)
        .eq("status", "active");

      return NextResponse.json(
        {
          error:
            "This Patient Pack has expired.",
          code:
            "PACK_EXPIRED",
        },
        {
          status: 409,
        },
      );
    }

    const sessionsRemaining =
      Number(
        pack.sessions_remaining,
      );

    if (
      !Number.isInteger(
        sessionsRemaining,
      ) ||
      sessionsRemaining <= 0
    ) {
      await supabaseAdmin
        .from(
          "patient_packs",
        )
        .update({
          status: "used",
          sessions_remaining: 0,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", pack.id);

      return NextResponse.json(
        {
          error:
            "This Patient Pack has no sessions remaining.",
          code:
            "PACK_EMPTY",
        },
        {
          status: 409,
        },
      );
    }

    const {
      data:
        therapist,
      error:
        therapistError,
    } =
      await supabaseAdmin
        .from("therapists")
        .select(
          `
            id,
            full_name,
            care_domain,
            work_status,
            preferred_meeting_provider
          `,
        )
        .eq(
          "id",
          pack.therapist_id,
        )
        .maybeSingle<TherapistRow>();

    if (therapistError) {
      throw therapistError;
    }

    if (!therapist) {
      return NextResponse.json(
        {
          error:
            "Specialist not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      therapist.work_status !== "active"
    ) {
      return NextResponse.json(
        {
          error:
            "This specialist is no longer accepting bookings.",
          code:
            "SPECIALIST_UNAVAILABLE",
        },
        {
          status: 409,
        },
      );
    }

    const {
      data: service,
      error:
        serviceError,
    } =
      await supabaseAdmin
        .from(
          "therapist_services",
        )
        .select(
          `
            id,
            therapist_id,
            service_type,
            price,
            duration_minutes,
            is_active
          `,
        )
        .eq(
          "id",
          pack.therapist_service_id,
        )
        .eq(
          "therapist_id",
          therapist.id,
        )
        .maybeSingle<TherapistServiceRow>();

    if (serviceError) {
      throw serviceError;
    }

    if (
      !service ||
      service.is_active !== true ||
      service.service_type !==
        "individual"
    ) {
      return NextResponse.json(
        {
          error:
            "The individual service linked to this Patient Pack is not available.",
          code:
            "SERVICE_UNAVAILABLE",
        },
        {
          status: 409,
        },
      );
    }

    const durationMinutes =
      Number(
        service.duration_minutes,
      );

    if (
      !Number.isInteger(
        durationMinutes,
      ) ||
      durationMinutes <= 0
    ) {
      throw new Error(
        "Invalid service duration.",
      );
    }

    try {
      await ensureAssignment({
        patientId:
          user.id,
        therapist,
        supabaseAdmin,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message ===
          "ACTIVE_SPECIALIST_CONFLICT"
      ) {
        return NextResponse.json(
          {
            error:
              "Vous êtes déjà suivi(e) par un autre spécialiste dans ce domaine. Veuillez contacter la clinique AAN.",
            code:
              "ACTIVE_SPECIALIST_CONFLICT",
          },
          {
            status: 409,
          },
        );
      }

      throw error;
    }

    const {
      data: slot,
      error:
        slotError,
    } =
      await supabaseAdmin
        .from(
          "availability_slots",
        )
        .select(
          `
            id,
            therapist_id,
            day,
            time,
            slot_date,
            starts_at,
            ends_at,
            is_booked
          `,
        )
        .eq("id", slotId)
        .eq(
          "therapist_id",
          therapist.id,
        )
        .maybeSingle<SlotRow>();

    if (slotError) {
      throw slotError;
    }

    if (!slot) {
      return NextResponse.json(
        {
          error:
            "This slot was not found.",
          code:
            "SLOT_NOT_FOUND",
        },
        {
          status: 404,
        },
      );
    }

    if (slot.is_booked === true) {
      return NextResponse.json(
        {
          error:
            "This slot is no longer available.",
          code:
            "SLOT_NOT_AVAILABLE",
        },
        {
          status: 409,
        },
      );
    }

    const scheduledStart =
      buildScheduledStart(slot);

    if (!scheduledStart) {
      return NextResponse.json(
        {
          error:
            "The selected slot does not have a valid date and time.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      scheduledStart.getTime() <=
      Date.now()
    ) {
      return NextResponse.json(
        {
          error:
            "This slot has already passed.",
          code:
            "SLOT_NOT_AVAILABLE",
        },
        {
          status: 409,
        },
      );
    }

    const scheduledEnd =
      new Date(
        scheduledStart.getTime() +
          durationMinutes *
            60 *
            1000,
      );

    const {
      data:
        claimedSlots,
      error:
        claimError,
    } =
      await supabaseAdmin
        .from(
          "availability_slots",
        )
        .update({
          is_booked: true,
        })
        .eq("id", slot.id)
        .eq(
          "therapist_id",
          therapist.id,
        )
        .or(
          "is_booked.eq.false,is_booked.is.null",
        )
        .select("id");

    if (claimError) {
      throw claimError;
    }

    const claimedSlot =
      claimedSlots?.[0] || null;

    if (!claimedSlot) {
      return NextResponse.json(
        {
          error:
            "This slot has just been reserved by another patient.",
          code:
            "SLOT_NOT_AVAILABLE",
        },
        {
          status: 409,
        },
      );
    }

    claimedSlotId =
      claimedSlot.id;

    const nextRemaining =
      sessionsRemaining - 1;

    const nextPackStatus =
      nextRemaining === 0
        ? "used"
        : "active";

    const {
      data:
        decrementedPack,
      error:
        decrementError,
    } =
      await supabaseAdmin
        .from(
          "patient_packs",
        )
        .update({
          sessions_remaining:
            nextRemaining,
          status:
            nextPackStatus,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", pack.id)
        .eq(
          "patient_id",
          user.id,
        )
        .eq("status", "active")
        .eq(
          "sessions_remaining",
          sessionsRemaining,
        )
        .select(
          "id, sessions_remaining, status",
        )
        .maybeSingle<{
          id: string;
          sessions_remaining: number;
          status: string;
        }>();

    if (decrementError) {
      throw decrementError;
    }

    if (!decrementedPack) {
      await supabaseAdmin
        .from(
          "availability_slots",
        )
        .update({
          is_booked: false,
        })
        .eq(
          "id",
          claimedSlotId,
        );

      claimedSlotId = null;

      return NextResponse.json(
        {
          error:
            "The Patient Pack was used by another request. Please try again.",
          code:
            "PACK_CONCURRENT_UPDATE",
        },
        {
          status: 409,
        },
      );
    }

    decrementedPackId =
      pack.id;

    previousRemaining =
      sessionsRemaining;

    const bookingPrice =
      Number(
        pack.session_price,
      );

    const {
      data:
        booking,
      error:
        bookingError,
    } =
      await supabaseAdmin
        .from("bookings")
        .insert({
          patient_id:
            user.id,
          patient_email:
            user.email || null,
          therapist_id:
            therapist.id,
          therapist_name:
            therapist.full_name,
          slot_id:
            slot.id,
          slot_day:
            slot.day,
          slot_time:
            slot.time,
          scheduled_start:
            scheduledStart.toISOString(),
          scheduled_end:
            scheduledEnd.toISOString(),
          therapist_service_id:
            service.id,
          service_type:
            service.service_type,
          duration_minutes:
            durationMinutes,
          price:
            Number.isFinite(
              bookingPrice,
            )
              ? bookingPrice
              : Number(
                  service.price,
                ),
          status:
            "paid",
          hold_expires_at:
            null,
          payment_provider:
            "patient_pack",
          payment_method:
            "pack_credit",
          payment_transaction_id:
            null,
          patient_pack_id:
            pack.id,
          payment_source:
            "patient_pack",
        })
        .select(
          `
            id,
            patient_id,
            patient_email,
            therapist_id,
            therapist_name,
            slot_id,
            slot_day,
            slot_time,
            scheduled_start,
            scheduled_end,
            therapist_service_id,
            service_type,
            duration_minutes,
            price,
            status,
            payment_provider,
            payment_method,
            payment_transaction_id,
            patient_pack_id,
            payment_source,
            meeting_url,
            meeting_provider,
            calendar_event_id,
            zoom_join_url,
            zoom_start_url,
            backup_meeting_provider,
            backup_join_url,
            backup_host_url,
            backup_calendar_event_id
          `,
        )
        .single<BookingRow>();

    if (
      bookingError ||
      !booking
    ) {
      await supabaseAdmin
        .from(
          "patient_packs",
        )
        .update({
          sessions_remaining:
            sessionsRemaining,
          status: "active",
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", pack.id)
        .eq(
          "sessions_remaining",
          nextRemaining,
        );

      decrementedPackId = null;
      previousRemaining = null;

      await supabaseAdmin
        .from(
          "availability_slots",
        )
        .update({
          is_booked: false,
        })
        .eq("id", slot.id);

      claimedSlotId = null;

      if (bookingError) {
        throw bookingError;
      }

      throw new Error(
        "Unable to create the Patient Pack booking.",
      );
    }

    claimedSlotId = null;
    decrementedPackId = null;
    previousRemaining = null;

    const preferredMeetingProvider:
      MeetingProvider =
      therapist
        .preferred_meeting_provider ===
      "zoom"
        ? "zoom"
        : "google_meet";

    if (
      booking.therapist_id &&
      booking.scheduled_start &&
      booking.scheduled_end
    ) {
      if (
        preferredMeetingProvider ===
        "zoom"
      ) {
        /*
         * =====================================================
         * ZOOM PRINCIPAL
         * =====================================================
         */
        try {
          const zoomMeeting =
            await createZoomMeetingForBooking({
              therapistId:
                booking.therapist_id,
              therapistName:
                booking.therapist_name ||
                "Specialist",
              start:
                booking.scheduled_start,
              end:
                booking.scheduled_end,
              supabaseAdmin,
            });

          let calendarEventId:
            string | null =
            null;

          try {
            const calendarEvent =
              await createGoogleCalendarEventForBooking({
                therapistId:
                  booking.therapist_id,
                summary:
                  `AAN Psychotherapy — ${booking.therapist_name || "Specialist"}`,
                description:
                  [
                    `AAN booking ${booking.id}`,
                    "",
                    "Payment: Patient Pack",
                    "Platform: Zoom",
                    `Join Zoom: ${zoomMeeting.joinUrl}`,
                  ].join("\n"),
                location:
                  zoomMeeting.joinUrl,
                start:
                  booking.scheduled_start,
                end:
                  booking.scheduled_end,
                timeZone:
                  TIME_ZONE,
                attendeeEmail:
                  booking.patient_email,
              });

            calendarEventId =
              calendarEvent.calendarEventId;
          } catch (
            calendarError
          ) {
            console.error(
              "Google Calendar event creation failed for Patient Pack Zoom booking:",
              {
                bookingId:
                  booking.id,
                error:
                  calendarError,
              },
            );
          }

          const {
            data:
              bookingWithMeeting,
            error:
              meetingUpdateError,
          } =
            await supabaseAdmin
              .from("bookings")
              .update({
                meeting_provider:
                  zoomMeeting.provider,
                meeting_url:
                  null,
                zoom_join_url:
                  zoomMeeting.joinUrl,
                zoom_start_url:
                  zoomMeeting.startUrl,
                calendar_event_id:
                  calendarEventId,
              })
              .eq(
                "id",
                booking.id,
              )
              .select(
                `
                  meeting_provider,
                  meeting_url,
                  zoom_join_url,
                  zoom_start_url,
                  calendar_event_id
                `,
              )
              .maybeSingle<{
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
              }>();

          if (meetingUpdateError) {
            throw meetingUpdateError;
          }

          if (bookingWithMeeting) {
            booking.meeting_provider =
              bookingWithMeeting
                .meeting_provider;
            booking.meeting_url =
              bookingWithMeeting
                .meeting_url;
            booking.zoom_join_url =
              bookingWithMeeting
                .zoom_join_url;
            booking.zoom_start_url =
              bookingWithMeeting
                .zoom_start_url;
            booking.calendar_event_id =
              bookingWithMeeting
                .calendar_event_id;
          }
        } catch (
          zoomMeetingError
        ) {
          console.error(
            "Zoom meeting creation failed for Patient Pack booking:",
            {
              bookingId:
                booking.id,
              error:
                zoomMeetingError,
            },
          );
        }

        /*
         * =====================================================
         * ZOOM CONTINUATION
         * =====================================================
         *
         * Une séance Patient Pack est une séance individuelle de
         * 50 minutes. Comme un compte Zoom Basic peut interrompre
         * la réunion avant la fin, on prépare automatiquement une
         * seconde réunion Zoom. Elle reste liée au même booking :
         * aucun nouveau paiement et aucun crédit Pack en plus.
         */
        if (!booking.backup_join_url) {
          try {
            const zoomContinuation =
              await createZoomMeetingForBooking({
                therapistId:
                  booking.therapist_id,
                therapistName:
                  booking.therapist_name ||
                  "Specialist",
                start:
                  booking.scheduled_start,
                end:
                  booking.scheduled_end,
                supabaseAdmin,
                continuation: true,
              });

            const {
              data:
                bookingWithBackup,
              error:
                backupUpdateError,
            } =
              await supabaseAdmin
                .from("bookings")
                .update({
                  backup_meeting_provider:
                    "zoom",
                  backup_join_url:
                    zoomContinuation.joinUrl,
                  backup_host_url:
                    zoomContinuation.startUrl,
                  backup_calendar_event_id:
                    null,
                })
                .eq(
                  "id",
                  booking.id,
                )
                .is(
                  "backup_join_url",
                  null,
                )
                .select(
                  `
                    backup_meeting_provider,
                    backup_join_url,
                    backup_host_url,
                    backup_calendar_event_id
                  `,
                )
                .maybeSingle<{
                  backup_meeting_provider:
                    string | null;
                  backup_join_url:
                    string | null;
                  backup_host_url:
                    string | null;
                  backup_calendar_event_id:
                    string | null;
                }>();

            if (backupUpdateError) {
              throw backupUpdateError;
            }

            if (bookingWithBackup) {
              booking.backup_meeting_provider =
                bookingWithBackup
                  .backup_meeting_provider;
              booking.backup_join_url =
                bookingWithBackup
                  .backup_join_url;
              booking.backup_host_url =
                bookingWithBackup
                  .backup_host_url;
              booking.backup_calendar_event_id =
                bookingWithBackup
                  .backup_calendar_event_id;
            }

            console.log(
              "PATIENT PACK ZOOM CONTINUATION CREATED:",
              {
                bookingId:
                  booking.id,
                therapistId:
                  booking.therapist_id,
              },
            );
          } catch (
            zoomContinuationError
          ) {
            /*
             * La réservation et la réunion principale restent
             * valides si la salle de continuité échoue.
             */
            console.error(
              "Zoom continuation creation failed for Patient Pack booking:",
              {
                bookingId:
                  booking.id,
                error:
                  zoomContinuationError,
              },
            );
          }
        }
      } else {
        /*
         * Patient Pack = individuelle uniquement.
         * Google Meet individuel ne nécessite donc pas de salle
         * de continuité dans la règle AAN actuelle.
         */
        try {
          const googleMeeting =
            await createGoogleMeetForBooking({
              therapistId:
                booking.therapist_id,
              summary:
                `AAN Psychotherapy — ${booking.therapist_name || "Specialist"}`,
              description:
                [
                  `AAN booking ${booking.id}`,
                  "",
                  "Payment: Patient Pack",
                ].join("\n"),
              start:
                booking.scheduled_start,
              end:
                booking.scheduled_end,
              timeZone:
                TIME_ZONE,
              attendeeEmail:
                booking.patient_email,
            });

          const {
            data:
              bookingWithMeeting,
            error:
              meetingUpdateError,
          } =
            await supabaseAdmin
              .from("bookings")
              .update({
                meeting_url:
                  googleMeeting
                    .meetingUrl,
                meeting_provider:
                  googleMeeting
                    .provider,
                calendar_event_id:
                  googleMeeting
                    .calendarEventId,
                zoom_join_url:
                  null,
                zoom_start_url:
                  null,
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
              )
              .select(
                `
                  meeting_url,
                  meeting_provider,
                  calendar_event_id,
                  zoom_join_url,
                  zoom_start_url,
                  backup_meeting_provider,
                  backup_join_url,
                  backup_host_url,
                  backup_calendar_event_id
                `,
              )
              .maybeSingle<{
                meeting_url:
                  string | null;
                meeting_provider:
                  string | null;
                calendar_event_id:
                  string | null;
                zoom_join_url:
                  string | null;
                zoom_start_url:
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

          if (meetingUpdateError) {
            throw meetingUpdateError;
          }

          if (bookingWithMeeting) {
            booking.meeting_url =
              bookingWithMeeting
                .meeting_url;
            booking.meeting_provider =
              bookingWithMeeting
                .meeting_provider;
            booking.calendar_event_id =
              bookingWithMeeting
                .calendar_event_id;
            booking.zoom_join_url =
              bookingWithMeeting
                .zoom_join_url;
            booking.zoom_start_url =
              bookingWithMeeting
                .zoom_start_url;
            booking.backup_meeting_provider =
              bookingWithMeeting
                .backup_meeting_provider;
            booking.backup_join_url =
              bookingWithMeeting
                .backup_join_url;
            booking.backup_host_url =
              bookingWithMeeting
                .backup_host_url;
            booking.backup_calendar_event_id =
              bookingWithMeeting
                .backup_calendar_event_id;
          }
        } catch (
          googleMeetingError
        ) {
          console.error(
            "Google Meet creation failed for Patient Pack booking:",
            {
              bookingId:
                booking.id,
              error:
                googleMeetingError,
            },
          );
        }
      }
    }

    if (booking.patient_email) {
      const siteUrl =
        process.env
          .NEXT_PUBLIC_SITE_URL
          ?.replace(
            /\/$/,
            "",
          ) ||
        new URL(
          request.url,
        ).origin;

      const slotDescription =
        [
          booking.slot_day,
          booking.slot_time,
        ]
          .filter(Boolean)
          .join(" ")
          .trim();

      try {
        const emailResponse =
          await fetch(
            `${siteUrl}/api/send-booking-email`,
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
                  slot:
                    slotDescription,
                  price:
                    0,
                  language,
                  bookingId:
                    booking.id,
                  paymentProvider:
                    "patient_pack",
                  transactionId:
                    pack.payment_transaction_id ||
                    `pack:${pack.id}`,
                  meetingProvider:
                    booking.meeting_provider,
                  meetingUrl:
                    booking.meeting_provider ===
                    "zoom"
                      ? booking.zoom_join_url
                      : booking.meeting_url,
                  backupMeetingProvider:
                    booking.backup_meeting_provider,
                  backupJoinUrl:
                    booking.backup_join_url,
                }),
            },
          );

        if (!emailResponse.ok) {
          console.error(
            "Patient Pack booking confirmation email failed:",
            emailResponse.status,
            await emailResponse.text(),
          );
        }
      } catch (
        emailError
      ) {
        console.error(
          "Patient Pack booking confirmation email request failed:",
          emailError,
        );
      }
    }

    return NextResponse.json({
      success: true,
      paymentRequired: false,
      paymentSource:
        "patient_pack",
      bookingId:
        booking.id,
      patientPackId:
        pack.id,
      sessionsRemaining:
        nextRemaining,
      packStatus:
        nextPackStatus,
      meetingProvider:
        booking.meeting_provider,
      meetingUrl:
        booking.meeting_provider ===
        "zoom"
          ? booking.zoom_join_url
          : booking.meeting_url,
      backupMeetingProvider:
        booking.backup_meeting_provider,
      backupJoinUrl:
        booking.backup_join_url,
      booking,
    });
  } catch (error) {
    if (
      decrementedPackId &&
      previousRemaining !== null
    ) {
      const currentRemaining =
        previousRemaining - 1;

      const {
        error:
          packRollbackError,
      } =
        await supabaseAdmin
          .from(
            "patient_packs",
          )
          .update({
            sessions_remaining:
              previousRemaining,
            status: "active",
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            decrementedPackId,
          )
          .eq(
            "sessions_remaining",
            currentRemaining,
          );

      if (packRollbackError) {
        console.error(
          "Patient Pack credit rollback error:",
          packRollbackError,
        );
      }
    }

    if (claimedSlotId) {
      const {
        error:
          slotRollbackError,
      } =
        await supabaseAdmin
          .from(
            "availability_slots",
          )
          .update({
            is_booked: false,
          })
          .eq(
            "id",
            claimedSlotId,
          );

      if (slotRollbackError) {
        console.error(
          "Patient Pack slot rollback error:",
          slotRollbackError,
        );
      }
    }

    console.error(
      "Patient Pack redeem error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to redeem the Patient Pack.",
      },
      {
        status: 500,
      },
    );
  }
}

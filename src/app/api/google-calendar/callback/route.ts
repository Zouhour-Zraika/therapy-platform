import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

export const runtime =
  "nodejs";

type SpecialistRow = {
  id: string;
  work_status:
    | "active"
    | "leaving"
    | "inactive"
    | null;
};

type ExistingGoogleConnection = {
  refresh_token:
    | string
    | null;
};

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  id?: string;
  email?: string;
  verified_email?: boolean;
  name?: string;
};

function redirectWithGoogleStatus(
  request: NextRequest,
  status:
    | "denied"
    | "invalid_state"
    | "inactive"
    | "not_specialist"
    | "connected"
    | "error",
) {
  const response =
    NextResponse.redirect(
      new URL(
        `/therapist-dashboard?google=${status}`,
        request.url,
      ),
    );

  response.cookies.delete(
    "google_oauth_state",
  );

  response.cookies.delete(
    "google_oauth_user",
  );

  return response;
}

export async function GET(
  request: NextRequest,
) {
  try {
    const code =
      request.nextUrl.searchParams.get(
        "code",
      );

    const state =
      request.nextUrl.searchParams.get(
        "state",
      );

    const oauthError =
      request.nextUrl.searchParams.get(
        "error",
      );

    if (oauthError) {
      return redirectWithGoogleStatus(
        request,
        "denied",
      );
    }

    const savedState =
      request.cookies.get(
        "google_oauth_state",
      )?.value;

    const specialistId =
      request.cookies.get(
        "google_oauth_user",
      )?.value;

    if (
      !code ||
      !state ||
      !savedState ||
      state !== savedState ||
      !specialistId
    ) {
      return redirectWithGoogleStatus(
        request,
        "invalid_state",
      );
    }

    const clientId =
      process.env
        .GOOGLE_CLIENT_ID;

    const clientSecret =
      process.env
        .GOOGLE_CLIENT_SECRET;

    const redirectUri =
      process.env
        .GOOGLE_REDIRECT_URI;

    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL;

    const supabaseServiceRoleKey =
      process.env
        .SUPABASE_SERVICE_ROLE_KEY ||
      process.env
        .SUPABASE_SECRET_KEY;

    if (
      !clientId ||
      !clientSecret ||
      !redirectUri
    ) {
      throw new Error(
        "Google OAuth configuration missing.",
      );
    }

    if (
      !supabaseUrl ||
      !supabaseServiceRoleKey
    ) {
      throw new Error(
        "Supabase server configuration missing.",
      );
    }

    const tokenResponse =
      await fetch(
        "https://oauth2.googleapis.com/token",
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },

          body:
            new URLSearchParams({
              code,
              client_id:
                clientId,
              client_secret:
                clientSecret,
              redirect_uri:
                redirectUri,
              grant_type:
                "authorization_code",
            }),
        },
      );

    const tokenData =
      (await tokenResponse.json()) as
        GoogleTokenResponse;

    if (
      !tokenResponse.ok ||
      !tokenData.access_token
    ) {
      console.error(
        "Google token exchange failed:",
        {
          status:
            tokenResponse.status,
          error:
            tokenData.error,
          description:
            tokenData.error_description,
        },
      );

      throw new Error(
        "Google token exchange failed.",
      );
    }

    const userInfoResponse =
      await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: {
            Authorization:
              `Bearer ${tokenData.access_token}`,
          },
        },
      );

    if (!userInfoResponse.ok) {
      throw new Error(
        "Unable to load Google account information.",
      );
    }

    const userInfo =
      (await userInfoResponse.json()) as
        GoogleUserInfo;

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
    } = await supabaseAdmin
      .from("therapists")
      .select(
        "id, work_status",
      )
      .eq(
        "id",
        specialistId,
      )
      .maybeSingle<SpecialistRow>();

    if (specialistError) {
      throw specialistError;
    }

    if (!specialist) {
      return redirectWithGoogleStatus(
        request,
        "not_specialist",
      );
    }

    if (
      specialist.work_status ===
      "inactive"
    ) {
      return redirectWithGoogleStatus(
        request,
        "inactive",
      );
    }

    const expiresAt =
      tokenData.expires_in
        ? new Date(
            Date.now() +
              tokenData.expires_in *
                1000,
          ).toISOString()
        : null;

    const {
      data:
        existingConnection,
      error:
        existingConnectionError,
    } = await supabaseAdmin
      .from(
        "therapist_google_connections",
      )
      .select(
        "refresh_token",
      )
      .eq(
        "therapist_id",
        specialistId,
      )
      .maybeSingle<ExistingGoogleConnection>();

    if (
      existingConnectionError
    ) {
      throw existingConnectionError;
    }

    const refreshToken =
      tokenData.refresh_token ||
      existingConnection
        ?.refresh_token ||
      null;

    const {
      error:
        upsertError,
    } = await supabaseAdmin
      .from(
        "therapist_google_connections",
      )
      .upsert(
        {
          therapist_id:
            specialistId,

          google_email:
            userInfo.email ??
            null,

          access_token:
            tokenData.access_token,

          refresh_token:
            refreshToken,

          token_expires_at:
            expiresAt,

          scope:
            tokenData.scope ??
            null,

          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict:
            "therapist_id",
        },
      );

    if (upsertError) {
      throw upsertError;
    }

    return redirectWithGoogleStatus(
      request,
      "connected",
    );
  } catch (error) {
    console.error(
      "Google callback error:",
      error,
    );

    return redirectWithGoogleStatus(
      request,
      "error",
    );
  }
}

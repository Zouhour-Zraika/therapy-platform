import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type SpecialistRow = {
  id: string;
  work_status: "active" | "leaving" | "inactive" | null;
};

type ZoomTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  reason?: string;
};

type ZoomUserResponse = {
  id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
};

function redirectWithZoomStatus(
  request: NextRequest,
  status:
    | "denied"
    | "invalid_state"
    | "inactive"
    | "not_specialist"
    | "connected"
    | "error",
) {
  const response = NextResponse.redirect(
    new URL(`/therapist-dashboard?zoom=${status}`, request.url),
  );

  response.cookies.delete("zoom_oauth_state");
  response.cookies.delete("zoom_oauth_user");

  return response;
}

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const oauthError = request.nextUrl.searchParams.get("error");

    if (oauthError) {
      return redirectWithZoomStatus(request, "denied");
    }

    const savedState = request.cookies.get("zoom_oauth_state")?.value;
    const specialistId = request.cookies.get("zoom_oauth_user")?.value;

    if (!code || !state || !savedState || state !== savedState || !specialistId) {
      return redirectWithZoomStatus(request, "invalid_state");
    }

    const clientId = process.env.ZOOM_OAUTH_CLIENT_ID;
    const clientSecret = process.env.ZOOM_OAUTH_CLIENT_SECRET;
    const redirectUri = process.env.ZOOM_OAUTH_REDIRECT_URI;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SECRET_KEY;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error("Zoom OAuth configuration missing.");
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Supabase server configuration missing.");
    }

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const tokenResponse = await fetch("https://zoom.us/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = (await tokenResponse.json()) as ZoomTokenResponse;

    if (!tokenResponse.ok || !tokenData.access_token || !tokenData.refresh_token) {
      console.error("Zoom token exchange failed:", tokenData);
      throw new Error("Zoom token exchange failed.");
    }

    const userResponse = await fetch("https://api.zoom.us/v2/users/me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error("Unable to load Zoom account information.");
    }

    const zoomUser = (await userResponse.json()) as ZoomUserResponse;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: specialist, error: specialistError } = await supabaseAdmin
      .from("therapists")
      .select("id, work_status")
      .eq("id", specialistId)
      .maybeSingle<SpecialistRow>();

    if (specialistError) {
      throw specialistError;
    }

    if (!specialist) {
      return redirectWithZoomStatus(request, "not_specialist");
    }

    if (specialist.work_status === "inactive") {
      return redirectWithZoomStatus(request, "inactive");
    }

    const expiresAt =
      typeof tokenData.expires_in === "number"
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null;

    const { error: upsertError } = await supabaseAdmin
      .from("therapist_zoom_connections")
      .upsert(
        {
          therapist_id: specialistId,
          zoom_user_id: zoomUser.id ?? null,
          zoom_email: zoomUser.email ?? null,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: expiresAt,
          scope: tokenData.scope ?? null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "therapist_id",
        },
      );

    if (upsertError) {
      throw upsertError;
    }

    return redirectWithZoomStatus(request, "connected");
  } catch (error) {
    console.error("Zoom callback error:", error);
    return redirectWithZoomStatus(request, "error");
  }
}

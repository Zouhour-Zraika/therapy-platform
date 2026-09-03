import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const error = request.nextUrl.searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        new URL("/therapist-dashboard?google=denied", request.url)
      );
    }

    const savedState = request.cookies.get("google_oauth_state")?.value;
    const therapistId = request.cookies.get("google_oauth_user")?.value;

    if (!code || !state || !savedState || state !== savedState || !therapistId) {
      return NextResponse.redirect(
        new URL("/therapist-dashboard?google=invalid_state", request.url)
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error("Google OAuth configuration missing.");
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Google token exchange failed:", tokenData);
      throw new Error("Google token exchange failed.");
    }

    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    const userInfo = await userInfoResponse.json();

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null;

    const { data: existingConnection } = await supabaseAdmin
      .from("therapist_google_connections")
      .select("refresh_token")
      .eq("therapist_id", therapistId)
      .maybeSingle();

    const refreshToken =
      tokenData.refresh_token || existingConnection?.refresh_token || null;

    const { error: upsertError } = await supabaseAdmin
      .from("therapist_google_connections")
      .upsert(
        {
          therapist_id: therapistId,
          google_email: userInfo.email ?? null,
          access_token: tokenData.access_token,
          refresh_token: refreshToken,
          token_expires_at: expiresAt,
          scope: tokenData.scope ?? null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "therapist_id",
        }
      );

    if (upsertError) {
      throw upsertError;
    }

    const response = NextResponse.redirect(
      new URL("/therapist-dashboard?google=connected", request.url)
    );

    response.cookies.delete("google_oauth_state");
    response.cookies.delete("google_oauth_user");

    return response;
  } catch (error) {
    console.error("Google callback error:", error);

    return NextResponse.redirect(
      new URL("/therapist-dashboard?google=error", request.url)
    );
  }
}
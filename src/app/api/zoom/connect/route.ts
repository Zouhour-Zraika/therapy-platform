import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs";

type SpecialistRow = {
  id: string;
  work_status: "active" | "leaving" | "inactive" | null;
};

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }

    const token = authHeader.substring(7);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: "Configuration Supabase incomplète." },
        { status: 500 },
      );
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Session invalide." }, { status: 401 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: specialist, error: specialistError } = await supabaseAdmin
      .from("therapists")
      .select("id, work_status")
      .eq("id", user.id)
      .maybeSingle<SpecialistRow>();

    if (specialistError) {
      throw specialistError;
    }

    if (!specialist) {
      return NextResponse.json(
        { error: "Accès réservé aux spécialistes." },
        { status: 403 },
      );
    }

    if (specialist.work_status === "inactive") {
      return NextResponse.json(
        { error: "Votre accès spécialiste est désactivé." },
        { status: 403 },
      );
    }

    const clientId = process.env.ZOOM_OAUTH_CLIENT_ID;
    const redirectUri = process.env.ZOOM_OAUTH_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return NextResponse.json(
        { error: "Configuration Zoom incomplète." },
        { status: 500 },
      );
    }

    const state = crypto.randomBytes(32).toString("hex");

    const authorizationUrl =
      `https://zoom.us/oauth/authorize?${new URLSearchParams({
        response_type: "code",
        client_id: clientId,
        redirect_uri: redirectUri,
        state,
      }).toString()}`;

    const response = NextResponse.json({ authorizationUrl });

    response.cookies.set("zoom_oauth_state", state, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });

    response.cookies.set("zoom_oauth_user", user.id, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Zoom connect error:", error);

    return NextResponse.json(
      { error: "Erreur lors de la connexion Zoom." },
      { status: 500 },
    );
  }
}

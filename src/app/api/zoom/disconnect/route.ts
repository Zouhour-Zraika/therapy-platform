import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
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

    const { data: connection, error: connectionError } = await supabaseAdmin
      .from("therapist_zoom_connections")
      .select("access_token")
      .eq("therapist_id", user.id)
      .maybeSingle<{ access_token: string | null }>();

    if (connectionError) {
      throw connectionError;
    }

    if (connection?.access_token) {
      const clientId = process.env.ZOOM_OAUTH_CLIENT_ID;
      const clientSecret = process.env.ZOOM_OAUTH_CLIENT_SECRET;

      if (clientId && clientSecret) {
        try {
          const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

          await fetch(
            `https://zoom.us/oauth/revoke?${new URLSearchParams({
              token: connection.access_token,
            }).toString()}`,
            {
              method: "POST",
              headers: {
                Authorization: `Basic ${basicAuth}`,
              },
            },
          );
        } catch (error) {
          console.error("Zoom revoke request error:", error);
        }
      }
    }

    const { error: deleteError } = await supabaseAdmin
      .from("therapist_zoom_connections")
      .delete()
      .eq("therapist_id", user.id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Zoom disconnect route error:", error);

    return NextResponse.json(
      { error: "Impossible de déconnecter le compte Zoom." },
      { status: 500 },
    );
  }
}

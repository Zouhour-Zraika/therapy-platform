import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type InviteAdminBody = {
  email?: string;
  language?: "en" | "ar";
};

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseServerKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServerKey) {
    throw new Error(
      "Supabase server configuration is missing.",
    );
  }

  return createClient(
    supabaseUrl,
    supabaseServerKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    },
  );
}

async function getAuthenticatedAdmin(
  request: Request,
  supabaseAdmin: ReturnType<
    typeof getSupabaseAdmin
  >,
) {
  const authorization =
    request.headers.get("authorization");

  if (
    !authorization?.startsWith("Bearer ")
  ) {
    return null;
  }

  const accessToken = authorization
    .slice("Bearer ".length)
    .trim();

  if (!accessToken) {
    return null;
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(
    accessToken,
  );

  if (userError || !user) {
    return null;
  }

  const {
    data: profile,
    error: profileError,
  } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (
    profileError ||
    profile?.role !== "admin"
  ) {
    return null;
  }

  return user;
}

export async function POST(
  request: Request,
) {
  try {
    const supabaseAdmin =
      getSupabaseAdmin();

    const currentAdmin =
      await getAuthenticatedAdmin(
        request,
        supabaseAdmin,
      );

    if (!currentAdmin) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Administrator access required.",
        },
        {
          status: 403,
        },
      );
    }

    const body =
      (await request.json()) as InviteAdminBody;

    const email = body.email
      ?.trim()
      .toLowerCase();

    const language =
      body.language === "ar"
        ? "ar"
        : "en";

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error:
            language === "ar"
              ? "البريد الإلكتروني مطلوب."
              : "Email address is required.",
        },
        {
          status: 400,
        },
      );
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL
        ?.replace(/\/$/, "") ||
      new URL(request.url).origin;

    const {
      data: invitedUser,
      error: inviteError,
    } =
      await supabaseAdmin.auth.admin
        .inviteUserByEmail(email, {
          redirectTo:
            `${siteUrl}/admin-accept-invite`,
          data: {
            role: "admin",
            invited_by:
              currentAdmin.id,
          },
        });

    if (inviteError) {
      console.error(
        "Admin invitation error:",
        inviteError,
      );

      return NextResponse.json(
        {
          success: false,
          error: inviteError.message,
        },
        {
          status: 400,
        },
      );
    }

    const invitedUserId =
      invitedUser.user?.id;

    if (!invitedUserId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to create the administrator account.",
        },
        {
          status: 500,
        },
      );
    }

    const {
      data: existingProfile,
      error: profileReadError,
    } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", invitedUserId)
      .maybeSingle();

    if (profileReadError) {
      throw profileReadError;
    }

    if (existingProfile) {
      const { error: updateError } =
        await supabaseAdmin
          .from("profiles")
          .update({
            email,
            role: "admin",
          })
          .eq("id", invitedUserId);

      if (updateError) {
        throw updateError;
      }
    } else {
      const { error: insertError } =
        await supabaseAdmin
          .from("profiles")
          .insert({
            id: invitedUserId,
            email,
            role: "admin",
          });

      if (insertError) {
        throw insertError;
      }
    }

    return NextResponse.json({
      success: true,
      userId: invitedUserId,
      email,
    });
  } catch (error) {
    console.error(
      "Invite administrator route error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to invite administrator.",
      },
      {
        status: 500,
      },
    );
  }
}
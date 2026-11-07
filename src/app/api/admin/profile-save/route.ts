import {
  createClient,
} from "@supabase/supabase-js";

import {
  NextResponse,
} from "next/server";

export const runtime =
  "nodejs";

const supabaseUrl =
  process.env
    .NEXT_PUBLIC_SUPABASE_URL;

const serviceRoleKey =
  process.env
    .SUPABASE_SERVICE_ROLE_KEY ||
  process.env
    .SUPABASE_SECRET_KEY;

if (!supabaseUrl) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL",
  );
}

if (!serviceRoleKey) {
  throw new Error(
    "Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY",
  );
}

const supabaseAdmin =
  createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken:
          false,
        persistSession:
          false,
        detectSessionInUrl:
          false,
      },
    },
  );

async function verifyAdmin(
  request: Request,
) {
  const authorization =
    request.headers.get(
      "authorization",
    );

  if (
    !authorization?.startsWith(
      "Bearer ",
    )
  ) {
    return {
      error:
        NextResponse.json(
          {
            error:
              "Authentication required.",
          },
          {
            status: 401,
          },
        ),
    };
  }

  const accessToken =
    authorization
      .slice(
        "Bearer ".length,
      )
      .trim();

  if (!accessToken) {
    return {
      error:
        NextResponse.json(
          {
            error:
              "Authentication required.",
          },
          {
            status: 401,
          },
        ),
    };
  }

  const {
    data: {
      user,
    },
    error:
      userError,
  } =
    await supabaseAdmin.auth.getUser(
      accessToken,
    );

  if (
    userError ||
    !user
  ) {
    return {
      error:
        NextResponse.json(
          {
            error:
              "Invalid or expired session.",
          },
          {
            status: 401,
          },
        ),
    };
  }

  const {
    data: profile,
    error:
      profileError,
  } = await supabaseAdmin
    .from("profiles")
    .select(
      "role",
    )
    .eq(
      "id",
      user.id,
    )
    .maybeSingle<{
      role:
        | string
        | null;
    }>();

  if (profileError) {
    console.error(
      "Admin profile lookup error:",
      profileError,
    );

    return {
      error:
        NextResponse.json(
          {
            error:
              "Unable to verify administrator access.",
          },
          {
            status: 500,
          },
        ),
    };
  }

  if (
    profile?.role !==
    "admin"
  ) {
    return {
      error:
        NextResponse.json(
          {
            error:
              "Admin access required.",
          },
          {
            status: 403,
          },
        ),
    };
  }

  return {
    error: null,
  };
}


const profileFields = [
  "full_name", "full_name_ar",
  "job_title", "job_title_ar",
  "specialty", "specialty_ar",
  "experience_years",
  "bio", "bio_ar",
  "education", "education_ar",
  "certifications", "certifications_ar",
  "therapeutic_approach", "therapeutic_approach_ar",
  "services", "services_ar",
  "languages", "languages_ar",
  "photo_url",
] as const;

const therapistFields = [
  "full_name", "full_name_ar",
  "professional_title", "professional_title_fr", "professional_title_ar",
  "specialty", "specialty_fr", "specialty_ar",
  "experience_years",
  "bio", "bio_fr", "bio_ar",
  "education", "education_fr", "education_ar",
  "certifications", "certifications_fr", "certifications_ar",
  "therapeutic_approach", "therapeutic_approach_fr", "therapeutic_approach_ar",
  "services", "services_fr", "services_ar",
  "languages", "languages_fr", "languages_ar",
  "photo_url", "price",
] as const;

export async function PUT(request: Request) {
  try {
    const verification = await verifyAdmin(request);
    if (verification.error) return verification.error;

    const authorization = request.headers.get("authorization")!;
    const token = authorization.slice("Bearer ".length).trim();

    const { data: { user }, error: userError } =
      await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      !body.profile ||
      typeof body.profile !== "object" ||
      Array.isArray(body.profile) ||
      !body.therapist ||
      typeof body.therapist !== "object" ||
      Array.isArray(body.therapist)
    ) {
      return NextResponse.json(
        { error: "Invalid profile payload." },
        { status: 400 }
      );
    }

    const profile: Record<string, string | number | null> = {};
    const therapist: Record<string, string | number | null> = {};

    for (const field of profileFields) {
      const value = body.profile[field];
      if (value === undefined) continue;

      if (
        value !== null &&
        typeof value !== "string" &&
        typeof value !== "number"
      ) {
        return NextResponse.json(
          { error: "Invalid profile field." },
          { status: 400 }
        );
      }

      profile[field] = value;
    }

    for (const field of therapistFields) {
      const value = body.therapist[field];
      if (value === undefined) continue;

      if (
        value !== null &&
        typeof value !== "string" &&
        typeof value !== "number"
      ) {
        return NextResponse.json(
          { error: "Invalid therapist field." },
          { status: 400 }
        );
      }

      therapist[field] = value;
    }

    if (
      typeof therapist.price !== "number" ||
      !Number.isFinite(therapist.price) ||
      therapist.price < 0
    ) {
      return NextResponse.json(
        { error: "Invalid price." },
        { status: 400 }
      );
    }

    if (
      typeof profile.experience_years !== "number" ||
      !Number.isFinite(profile.experience_years) ||
      profile.experience_years < 0 ||
      !Number.isInteger(profile.experience_years)
    ) {
      return NextResponse.json(
        { error: "Invalid experience years." },
        { status: 400 }
      );
    }

    const { error: saveError } = await supabaseAdmin.rpc(
    "admin_save_profile_atomic",
    {
      p_user_id: user.id,
      p_profile: profile,
      p_therapist: therapist,
    }
  );

  if (saveError) {
    console.error("Atomic admin profile save failed:", saveError.code);
    return NextResponse.json(
      { error: "Unable to save profile" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin profile save error:", error);

    return NextResponse.json(
      { error: "Unable to save administrator profile." },
      { status: 500 }
    );
  }
}

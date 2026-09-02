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

export async function GET(
  request: Request,
) {
  try {
    const verification =
      await verifyAdmin(
        request,
      );

    if (
      verification.error
    ) {
      return verification.error;
    }

    const {
      data:
        therapistRows,
      error:
        therapistError,
    } = await supabaseAdmin
      .from("therapists")
      .select(
        `
          id,
          full_name,
          specialty,
          bio,
          price
        `,
      )
      .order(
        "full_name",
        {
          ascending: true,
        },
      );

    if (
      therapistError
    ) {
      return NextResponse.json(
        {
          error:
            therapistError.message,
        },
        {
          status: 500,
        },
      );
    }

    const therapistIds =
      (
        therapistRows ??
        []
      ).map(
        (
          therapist,
        ) =>
          therapist.id,
      );

    if (
      therapistIds.length ===
      0
    ) {
      return NextResponse.json({
        therapists: [],
      });
    }

    const {
      data: profiles,
      error:
        profilesError,
    } = await supabaseAdmin
      .from("profiles")
      .select(
        `
          id,
          email,
          role
        `,
      )
      .in(
        "id",
        therapistIds,
      );

    if (
      profilesError
    ) {
      return NextResponse.json(
        {
          error:
            profilesError.message,
        },
        {
          status: 500,
        },
      );
    }

    const {
      data:
        serviceRows,
      error:
        servicesError,
    } = await supabaseAdmin
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
          price_per_participant,
          min_participants,
          max_participants,
          is_active
        `,
      )
      .in(
        "therapist_id",
        therapistIds,
      )
      .order(
        "service_type",
        {
          ascending: true,
        },
      );

    if (
      servicesError
    ) {
      console.error(
        "Therapist services loading error:",
        servicesError,
      );

      return NextResponse.json(
        {
          error:
            servicesError.message,
        },
        {
          status: 500,
        },
      );
    }

    const profileMap =
      new Map(
        (
          profiles ??
          []
        ).map(
          (
            profile,
          ) => [
            profile.id,
            profile,
          ],
        ),
      );

    const servicesMap =
      new Map<
        string,
        Array<{
          id: string;
          service_type:
            | "individual"
            | "couples"
            | "family"
            | "group";
          price: number;
          duration_minutes:
            number;
          price_per_participant:
            boolean;
          min_participants:
            | number
            | null;
          max_participants:
            | number
            | null;
          is_active:
            boolean;
        }>
      >();

    for (
      const service
      of serviceRows ??
      []
    ) {
      const current =
        servicesMap.get(
          service.therapist_id,
        ) ??
        [];

      current.push({
        id:
          service.id,

        service_type:
          service.service_type as
            | "individual"
            | "couples"
            | "family"
            | "group",

        price:
          Number(
            service.price ??
            0,
          ),

        duration_minutes:
          Number(
            service.duration_minutes ??
            0,
          ),

        price_per_participant:
          service
            .price_per_participant ===
          true,

        min_participants:
          service
            .min_participants ===
          null
            ? null
            : Number(
                service
                  .min_participants,
              ),

        max_participants:
          service
            .max_participants ===
          null
            ? null
            : Number(
                service
                  .max_participants,
              ),

        is_active:
          service.is_active ===
          true,
      });

      servicesMap.set(
        service.therapist_id,
        current,
      );
    }

    const therapists =
      (
        therapistRows ??
        []
      ).map(
        (
          therapist,
        ) => {
          const profile =
            profileMap.get(
              therapist.id,
            );

          return {
            ...therapist,

            email:
              profile?.email ??
              null,

            role:
              profile?.role ??
              null,

            price:
              Number(
                therapist.price ??
                0,
              ),

            services:
              servicesMap.get(
                therapist.id,
              ) ??
              [],
          };
        },
      );

    return NextResponse.json({
      therapists,
    });
  } catch (error) {
    console.error(
      "Load therapists error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof
          Error
            ? error.message
            : "Server error while loading therapists.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
  request: Request,
) {
  try {
    const verification =
      await verifyAdmin(
        request,
      );

    if (
      verification.error
    ) {
      return verification.error;
    }

    const body =
      await request.json();

    const therapistId =
      String(
        body.therapistId ??
        "",
      ).trim();

    if (!therapistId) {
      return NextResponse.json(
        {
          error:
            "Therapist ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const {
      error,
    } = await supabaseAdmin
      .from("therapists")
      .delete()
      .eq(
        "id",
        therapistId,
      );

    if (error) {
      return NextResponse.json(
        {
          error:
            error.message,
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Delete therapist error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof
          Error
            ? error.message
            : "Server error while deleting therapist.",
      },
      {
        status: 500,
      },
    );
  }
}

import {
  createClient,
} from "@supabase/supabase-js";

import {
  NextResponse,
} from "next/server";

export const runtime =
  "nodejs";

type UpdateTherapistServiceRequest = {
  therapistId?: string;
  serviceType?:
    | "individual"
    | "couples"
    | "family"
    | "group";
  price?:
    | number
    | string;
  durationMinutes?:
    | number
    | string;
  isActive?: boolean;
};

const ALLOWED_SERVICE_TYPES =
  new Set([
    "individual",
    "couples",
    "family",
    "group",
  ]);

export async function POST(
  request: Request,
) {
  try {
    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL;

    const supabaseServerKey =
      process.env
        .SUPABASE_SECRET_KEY ||
      process.env
        .SUPABASE_SERVICE_ROLE_KEY;

    if (
      !supabaseUrl ||
      !supabaseServerKey
    ) {
      return NextResponse.json(
        {
          error:
            "Supabase server configuration is missing.",
        },
        {
          status: 500,
        },
      );
    }

    const supabaseAdmin =
      createClient(
        supabaseUrl,
        supabaseServerKey,
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

    const authorization =
      request.headers.get(
        "authorization",
      );

    if (
      !authorization?.startsWith(
        "Bearer ",
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Authentication required.",
        },
        {
          status: 401,
        },
      );
    }

    const accessToken =
      authorization
        .slice(
          "Bearer ".length,
        )
        .trim();

    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            "Authentication required.",
        },
        {
          status: 401,
        },
      );
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
      return NextResponse.json(
        {
          error:
            "Invalid or expired session.",
        },
        {
          status: 401,
        },
      );
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

      return NextResponse.json(
        {
          error:
            "Unable to verify administrator access.",
        },
        {
          status: 500,
        },
      );
    }

    if (
      profile?.role !==
      "admin"
    ) {
      return NextResponse.json(
        {
          error:
            "Admin access required.",
        },
        {
          status: 403,
        },
      );
    }

    const body =
      (
        await request.json()
      ) as UpdateTherapistServiceRequest;

    const therapistId =
      body.therapistId
        ?.trim();

    const serviceType =
      body.serviceType
        ?.trim();

    const price =
      Number(
        body.price,
      );

    const durationMinutes =
      Number(
        body.durationMinutes,
      );

    const isActive =
      body.isActive;

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

    if (
      !serviceType ||
      !ALLOWED_SERVICE_TYPES.has(
        serviceType,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "A valid service type is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !Number.isFinite(
        price,
      ) ||
      price <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Price must be greater than 0.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !Number.isInteger(
        durationMinutes,
      ) ||
      durationMinutes <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Duration must be a positive whole number.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      typeof isActive !==
      "boolean"
    ) {
      return NextResponse.json(
        {
          error:
            "Active status is required.",
        },
        {
          status: 400,
        },
      );
    }

    const {
      data:
        existingTherapist,
      error:
        therapistReadError,
    } = await supabaseAdmin
      .from("therapists")
      .select(
        "id, full_name",
      )
      .eq(
        "id",
        therapistId,
      )
      .maybeSingle();

    if (
      therapistReadError
    ) {
      console.error(
        "Therapist lookup error:",
        therapistReadError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to verify the specialist.",
        },
        {
          status: 500,
        },
      );
    }

    if (
      !existingTherapist
    ) {
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

    const {
      data:
        existingService,
      error:
        serviceReadError,
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
      .eq(
        "therapist_id",
        therapistId,
      )
      .eq(
        "service_type",
        serviceType,
      )
      .maybeSingle();

    if (
      serviceReadError
    ) {
      console.error(
        "Therapist service lookup error:",
        serviceReadError,
      );

      return NextResponse.json(
        {
          error:
            serviceReadError.message,
        },
        {
          status: 500,
        },
      );
    }

    if (
      !existingService
    ) {
      return NextResponse.json(
        {
          error:
            "This service has not been configured for the specialist yet.",
        },
        {
          status: 404,
        },
      );
    }

    const {
      data: service,
      error:
        updateError,
    } = await supabaseAdmin
      .from(
        "therapist_services",
      )
      .update({
        price,
        duration_minutes:
          durationMinutes,
        is_active:
          isActive,
        updated_at:
          new Date()
            .toISOString(),
      })
      .eq(
        "id",
        existingService.id,
      )
      .eq(
        "therapist_id",
        therapistId,
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
      .maybeSingle();

    if (updateError) {
      console.error(
        "Therapist service update error:",
        updateError,
      );

      return NextResponse.json(
        {
          error:
            updateError.message,
        },
        {
          status: 500,
        },
      );
    }

    if (!service) {
      return NextResponse.json(
        {
          error:
            "The specialist service could not be updated.",
        },
        {
          status: 500,
        },
      );
    }

    console.log(
      "THERAPIST SERVICE UPDATED:",
      {
        adminUserId:
          user.id,
        therapistId,
        serviceType,
        previousPrice:
          existingService.price,
        newPrice:
          service.price,
        previousDuration:
          existingService
            .duration_minutes,
        newDuration:
          service
            .duration_minutes,
        previousActive:
          existingService
            .is_active,
        newActive:
          service
            .is_active,
      },
    );

    return NextResponse.json({
      success: true,
      service,
    });
  } catch (error) {
    console.error(
      "Update therapist service error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof
          Error
            ? error.message
            : "Server error while updating the specialist service.",
      },
      {
        status: 500,
      },
    );
  }
}

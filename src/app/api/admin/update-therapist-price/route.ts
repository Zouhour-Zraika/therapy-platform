import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type UpdateTherapistPriceRequest = {
  therapistId?: string;
  price?: number | string;
};

export async function POST(
  request: Request,
) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseServerKey =
      process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY;

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
      data: { user },
      error: userError,
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
      error: profileError,
    } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle<{
        role: string | null;
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
      (await request.json()) as UpdateTherapistPriceRequest;

    const therapistId =
      body.therapistId?.trim();

    const price =
      Number(body.price);

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
      !Number.isFinite(price) ||
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

    /*
     * Vérifier que le spécialiste
     * existe avant la modification.
     */
    const {
      data: existingTherapist,
      error: therapistReadError,
    } = await supabaseAdmin
      .from("therapists")
      .select(
        `
          id,
          full_name,
          price
        `,
      )
      .eq(
        "id",
        therapistId,
      )
      .maybeSingle();

    if (therapistReadError) {
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

    if (!existingTherapist) {
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
      data: therapist,
      error: updateError,
    } = await supabaseAdmin
      .from("therapists")
      .update({
        price,
      })
      .eq(
        "id",
        therapistId,
      )
      .select(
        `
          id,
          full_name,
          specialty,
          bio,
          price
        `,
      )
      .maybeSingle();

    if (updateError) {
      console.error(
        "Therapist price update error:",
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

    if (!therapist) {
      return NextResponse.json(
        {
          error:
            "The specialist price could not be updated.",
        },
        {
          status: 500,
        },
      );
    }

    console.log(
      "THERAPIST PRICE UPDATED:",
      {
        adminUserId:
          user.id,
        therapistId,
        previousPrice:
          existingTherapist.price,
        newPrice:
          therapist.price,
      },
    );

    return NextResponse.json({
      success: true,
      therapist,
    });
  } catch (error) {
    console.error(
      "Update therapist price error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Server error while updating the price.",
      },
      {
        status: 500,
      },
    );
  }
}
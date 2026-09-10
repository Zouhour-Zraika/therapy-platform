import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type TherapistRow = {
  id: string;
  work_status: string | null;
};

type TherapistServiceRow = {
  id: string;
  therapist_id: string;
  service_type: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
};

type BusinessSettingsRow = {
  patient_pack_sessions: number;
  patient_pack_discount_rate: number;
  patient_pack_validity_months: number;
};

function createSupabaseAdmin() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY;

  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    throw new Error(
      "Supabase server configuration is missing.",
    );
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    },
  );
}

function roundMoney(value: number) {
  return Math.round(
    (value + Number.EPSILON) * 100,
  ) / 100;
}

export async function GET(
  request: NextRequest,
) {
  try {
    const therapistId =
      request.nextUrl.searchParams
        .get("therapistId")
        ?.trim() || "";

    const serviceId =
      request.nextUrl.searchParams
        .get("serviceId")
        ?.trim() || "";

    if (
      !therapistId ||
      !serviceId
    ) {
      return NextResponse.json(
        {
          error:
            "therapistId and serviceId are required.",
        },
        {
          status: 400,
        },
      );
    }

    const supabaseAdmin =
      createSupabaseAdmin();

    const [
      {
        data: therapist,
        error: therapistError,
      },
      {
        data: service,
        error: serviceError,
      },
      {
        data: settings,
        error: settingsError,
      },
    ] = await Promise.all([
      supabaseAdmin
        .from("therapists")
        .select(
          "id, work_status",
        )
        .eq(
          "id",
          therapistId,
        )
        .maybeSingle<TherapistRow>(),

      supabaseAdmin
        .from("therapist_services")
        .select(
          "id, therapist_id, service_type, price, duration_minutes, is_active",
        )
        .eq(
          "id",
          serviceId,
        )
        .eq(
          "therapist_id",
          therapistId,
        )
        .eq(
          "is_active",
          true,
        )
        .maybeSingle<TherapistServiceRow>(),

      supabaseAdmin
        .from(
          "platform_business_settings",
        )
        .select(
          "patient_pack_sessions, patient_pack_discount_rate, patient_pack_validity_months",
        )
        .eq(
          "id",
          1,
        )
        .maybeSingle<BusinessSettingsRow>(),
    ]);

    if (therapistError) {
      throw therapistError;
    }

    if (serviceError) {
      throw serviceError;
    }

    if (settingsError) {
      throw settingsError;
    }

    if (
      !therapist ||
      therapist.work_status !==
        "active"
    ) {
      return NextResponse.json(
        {
          available: false,
          reason:
            "SPECIALIST_UNAVAILABLE",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * Le Pack Patient ne concerne que
     * les consultations individuelles.
     */
    if (
      !service ||
      service.service_type !==
        "individual"
    ) {
      return NextResponse.json({
        available: false,
        reason:
          "INDIVIDUAL_ONLY",
      });
    }

    if (!settings) {
      throw new Error(
        "Patient Pack business settings are missing.",
      );
    }

    const sessions =
      Number(
        settings.patient_pack_sessions,
      );

    const discountRate =
      Number(
        settings.patient_pack_discount_rate,
      );

    const validityMonths =
      Number(
        settings.patient_pack_validity_months,
      );

    const sessionPrice =
      Number(
        service.price,
      );

    if (
      !Number.isInteger(sessions) ||
      sessions <= 0 ||
      !Number.isFinite(discountRate) ||
      discountRate < 0 ||
      discountRate > 100 ||
      !Number.isInteger(validityMonths) ||
      validityMonths <= 0 ||
      !Number.isFinite(sessionPrice) ||
      sessionPrice <= 0
    ) {
      throw new Error(
        "Patient Pack configuration is invalid.",
      );
    }

    const regularTotal =
      roundMoney(
        sessionPrice *
          sessions,
      );

    const totalPrice =
      roundMoney(
        regularTotal *
          (
            1 -
            discountRate /
              100
          ),
      );

    const savings =
      roundMoney(
        regularTotal -
          totalPrice,
      );

    return NextResponse.json({
      available: true,

      serviceType:
        "individual",

      durationMinutes:
        Number(
          service.duration_minutes,
        ),

      sessions,

      discountRate,

      validityMonths,

      sessionPrice,

      regularTotal,

      totalPrice,

      savings,
    });
  } catch (error) {
    console.error(
      "Patient Pack options error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load Patient Pack options.",
      },
      {
        status: 500,
      },
    );
  }
}

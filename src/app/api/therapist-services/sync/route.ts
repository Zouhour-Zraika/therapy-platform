import {
  createClient,
} from "@supabase/supabase-js";

import {
  NextResponse,
} from "next/server";

export const runtime =
  "nodejs";

type SpecialistRow = {
  id: string;
  experience_years:
    | number
    | null;
  work_status:
    | "active"
    | "leaving"
    | "inactive"
    | null;
};

type ExistingServiceRow = {
  service_type: string;
};

type ServiceDefinition = {
  therapist_id: string;
  service_type:
    | "individual"
    | "couples"
    | "family"
    | "group";
  price: number;
  duration_minutes: number;
  price_per_participant: boolean;
  min_participants:
    | number
    | null;
  max_participants:
    | number
    | null;
  is_active: boolean;
};

function createSupabaseAdmin() {
  const supabaseUrl =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env
      .SUPABASE_SERVICE_ROLE_KEY ||
    process.env
      .SUPABASE_SECRET_KEY;

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
        autoRefreshToken:
          false,
        persistSession:
          false,
        detectSessionInUrl:
          false,
      },
    },
  );
}

async function getAuthenticatedUser(
  request: Request,
  supabaseAdmin:
    ReturnType<
      typeof createSupabaseAdmin
    >,
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
    return null;
  }

  const accessToken =
    authorization
      .slice(
        "Bearer ".length,
      )
      .trim();

  if (!accessToken) {
    return null;
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
    return null;
  }

  return user;
}

function buildServices(
  specialistId: string,
  experienceYears: number,
): ServiceDefinition[] {
  const standardPrice =
    experienceYears <= 5
      ? {
          individual: 60,
          couples: 80,
          family: 100,
        }
      : {
          individual: 80,
          couples: 110,
          family: 130,
        };

  const groupPrice =
    experienceYears <= 3
      ? 25
      : 35;

  return [
    {
      therapist_id:
        specialistId,
      service_type:
        "individual",
      price:
        standardPrice.individual,
      duration_minutes: 50,
      price_per_participant:
        false,
      min_participants: null,
      max_participants: null,
      is_active: true,
    },
    {
      therapist_id:
        specialistId,
      service_type:
        "couples",
      price:
        standardPrice.couples,
      duration_minutes: 60,
      price_per_participant:
        false,
      min_participants: null,
      max_participants: null,
      is_active: true,
    },
    {
      therapist_id:
        specialistId,
      service_type:
        "family",
      price:
        standardPrice.family,
      duration_minutes: 75,
      price_per_participant:
        false,
      min_participants: null,
      max_participants: null,
      is_active: true,
    },
    {
      therapist_id:
        specialistId,
      service_type:
        "group",
      price:
        groupPrice,
      duration_minutes: 90,
      price_per_participant:
        true,
      min_participants: 4,
      max_participants: 10,

      /*
       * TEMPORAIREMENT INACTIF :
       * le modèle actuel availability_slots
       * réserve tout le créneau au premier booking.
       * Il ne gère donc pas encore plusieurs
       * participants sur une même séance de groupe.
       */
      is_active: false,
    },
  ];
}

export async function POST(
  request: Request,
) {
  const supabaseAdmin =
    createSupabaseAdmin();

  try {
    const user =
      await getAuthenticatedUser(
        request,
        supabaseAdmin,
      );

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Authentication is required.",
        },
        {
          status: 401,
        },
      );
    }

    /*
     * SYSTÈME GÉNÉRIQUE SPÉCIALISTE
     *
     * Pour cette API clinique, la source de vérité
     * est la présence de l'utilisateur connecté
     * dans public.therapists.
     *
     * Le rôle général profiles.role n'est pas utilisé
     * pour déterminer l'accès spécialiste.
     *
     * Ainsi :
     * - un spécialiste classique fonctionne ;
     * - un admin + spécialiste fonctionne ;
     * - un admin purement administratif sans ligne
     *   dans therapists n'a pas accès à cette API.
     *
     * "therapists" et "therapist_id" sont des noms
     * historiques de la base conservés pour compatibilité.
     */
    const {
      data: specialist,
      error:
        specialistError,
    } = await supabaseAdmin
      .from("therapists")
      .select(
        "id, experience_years, work_status",
      )
      .eq(
        "id",
        user.id,
      )
      .maybeSingle<SpecialistRow>();

    if (specialistError) {
      throw specialistError;
    }

    if (!specialist) {
      return NextResponse.json(
        {
          error:
            "Specialist access is required.",
        },
        {
          status: 403,
        },
      );
    }

    /*
     * active
     * → accès normal
     *
     * leaving
     * → accès encore autorisé
     *
     * inactive
     * → accès clinique refusé
     *
     * Même règle que dans les autres
     * protections de l'espace spécialiste.
     */
    if (
      specialist.work_status ===
      "inactive"
    ) {
      return NextResponse.json(
        {
          error:
            "Specialist access is inactive.",
        },
        {
          status: 403,
        },
      );
    }

    const experienceYears =
      Number(
        specialist.experience_years,
      );

    if (
      specialist.experience_years ===
        null ||
      !Number.isInteger(
        experienceYears,
      ) ||
      experienceYears < 0 ||
      experienceYears > 80
    ) {
      return NextResponse.json(
        {
          error:
            "A valid number of experience years is required before services can be configured.",
          code:
            "EXPERIENCE_REQUIRED",
        },
        {
          status: 400,
        },
      );
    }

    const serviceDefinitions =
      buildServices(
        specialist.id,
        experienceYears,
      );

    const {
      data: existingServices,
      error:
        existingServicesError,
    } = await supabaseAdmin
      .from(
        "therapist_services",
      )
      .select(
        "service_type",
      )
      .eq(
        "therapist_id",
        specialist.id,
      );

    if (existingServicesError) {
      throw existingServicesError;
    }

    const existingTypes =
      new Set(
        (
          existingServices as
            | ExistingServiceRow[]
            | null
        )?.map(
          (service) =>
            service.service_type,
        ) || [],
      );

    /*
     * IMPORTANT :
     * on crée uniquement les services absents.
     *
     * Une fois qu'un service existe,
     * ses prix/réglages peuvent être personnalisés
     * par l'administration sans être écrasés
     * lorsque le spécialiste resauvegarde son profil.
     */
    const missingServices =
      serviceDefinitions.filter(
        (service) =>
          !existingTypes.has(
            service.service_type,
          ),
      );

    if (
      missingServices.length > 0
    ) {
      const {
        error:
          insertError,
      } = await supabaseAdmin
        .from(
          "therapist_services",
        )
        .insert(
          missingServices,
        );

      if (insertError) {
        throw insertError;
      }
    }

    return NextResponse.json({
      success: true,
      experienceYears,
      createdServices:
        missingServices.map(
          (service) =>
            service.service_type,
        ),
      existingServices:
        Array.from(
          existingTypes,
        ),
    });
  } catch (error) {
    console.error(
      "Specialist services sync error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof
          Error
            ? error.message
            : "Unable to configure specialist services.",
      },
      {
        status: 500,
      },
    );
  }
}

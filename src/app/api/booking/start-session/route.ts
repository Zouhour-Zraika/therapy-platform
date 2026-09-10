import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  createClient,
} from "@supabase/supabase-js";

export const runtime = "nodejs";

type BookingRow = {
  id: string;
  therapist_id: string;
  status: string;
  meeting_provider: string | null;
  meeting_url: string | null;
  zoom_start_url: string | null;
};

export async function POST(
  request: NextRequest,
) {
  try {
    const authHeader =
      request.headers.get(
        "authorization",
      );

    if (
      !authHeader?.startsWith(
        "Bearer ",
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Non autorisé.",
        },
        {
          status: 401,
        },
      );
    }

    const token =
      authHeader.substring(7);

    const body =
      (await request.json()) as {
        bookingId?: string;
      };

    const bookingId =
      String(
        body.bookingId || "",
      ).trim();

    if (!bookingId) {
      return NextResponse.json(
        {
          error:
            "bookingId est requis.",
        },
        {
          status: 400,
        },
      );
    }

    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL;

    const supabaseAnonKey =
      process.env
        .NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const supabaseServiceRoleKey =
      process.env
        .SUPABASE_SERVICE_ROLE_KEY ||
      process.env
        .SUPABASE_SECRET_KEY;

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      !supabaseServiceRoleKey
    ) {
      return NextResponse.json(
        {
          error:
            "Configuration Supabase incomplète.",
        },
        {
          status: 500,
        },
      );
    }

    const supabaseAuth =
      createClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          auth: {
            persistSession:
              false,
            autoRefreshToken:
              false,
          },
        },
      );

    const {
      data: {
        user,
      },
      error:
        userError,
    } =
      await supabaseAuth.auth.getUser(
        token,
      );

    if (
      userError ||
      !user
    ) {
      return NextResponse.json(
        {
          error:
            "Session invalide.",
        },
        {
          status: 401,
        },
      );
    }

    const supabaseAdmin =
      createClient(
        supabaseUrl,
        supabaseServiceRoleKey,
        {
          auth: {
            persistSession:
              false,
            autoRefreshToken:
              false,
          },
        },
      );

    const {
      data:
        specialist,
      error:
        specialistError,
    } =
      await supabaseAdmin
        .from("therapists")
        .select(
          "id, work_status",
        )
        .eq(
          "id",
          user.id,
        )
        .maybeSingle<{
          id: string;
          work_status:
            | "active"
            | "leaving"
            | "inactive"
            | null;
        }>();

    if (
      specialistError
    ) {
      throw specialistError;
    }

    if (
      !specialist ||
      specialist.work_status ===
        "inactive"
    ) {
      return NextResponse.json(
        {
          error:
            "Accès spécialiste non disponible.",
        },
        {
          status: 403,
        },
      );
    }

    /*
     * Source de vérité UNIQUE :
     * la réservation telle qu'elle est enregistrée côté serveur.
     *
     * Cette route ne change JAMAIS de plateforme.
     * Elle renvoie seulement le lien de la plateforme active.
     */
    const {
      data:
        booking,
      error:
        bookingError,
    } =
      await supabaseAdmin
        .from("bookings")
        .select(
          "id, therapist_id, status, meeting_provider, meeting_url, zoom_start_url",
        )
        .eq(
          "id",
          bookingId,
        )
        .maybeSingle<BookingRow>();

    if (
      bookingError
    ) {
      throw bookingError;
    }

    if (!booking) {
      return NextResponse.json(
        {
          error:
            "Réservation introuvable.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      booking.therapist_id !==
      user.id
    ) {
      return NextResponse.json(
        {
          error:
            "Vous ne pouvez pas démarrer cette séance.",
        },
        {
          status: 403,
        },
      );
    }

    if (
      booking.status !==
      "paid"
    ) {
      return NextResponse.json(
        {
          error:
            "Cette séance n'est pas confirmée.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      booking.meeting_provider ===
        "google_meet"
    ) {
      if (
        !booking.meeting_url
      ) {
        return NextResponse.json(
          {
            error:
              "Le lien Google Meet actif est manquant.",
            provider:
              "google_meet",
          },
          {
            status: 409,
          },
        );
      }

      return NextResponse.json({
        provider:
          "google_meet",
        startUrl:
          booking.meeting_url,
      });
    }

    if (
      booking.meeting_provider ===
        "zoom"
    ) {
      if (
        !booking.zoom_start_url
      ) {
        return NextResponse.json(
          {
            error:
              "Le lien Zoom actif est manquant.",
            provider:
              "zoom",
          },
          {
            status: 409,
          },
        );
      }

      return NextResponse.json({
        provider:
          "zoom",
        startUrl:
          booking.zoom_start_url,
      });
    }

    return NextResponse.json(
      {
        error:
          "Aucune plateforme active n'est enregistrée pour cette séance.",
        provider:
          booking.meeting_provider,
      },
      {
        status: 409,
      },
    );
  } catch (error) {
    console.error(
      "Start session route error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Impossible de démarrer la séance.",
      },
      {
        status: 500,
      },
    );
  }
}

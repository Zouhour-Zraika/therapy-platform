import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ApproveTherapistRequest = {
  applicationId?: string;
  email?: string;
  fullName?: string;
  specialty?: string | null;
};

export async function POST(request: Request) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseServerKey =
      process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServerKey) {
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

    const supabaseAdmin = createClient(
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

    /*
     * =========================================================
     * Vérifier l'authentification de l'administrateur
     * =========================================================
     */

    const authorization =
      request.headers.get("authorization");

    if (
      !authorization ||
      !authorization.startsWith("Bearer ")
    ) {
      return NextResponse.json(
        {
          error: "Authentication is required.",
        },
        {
          status: 401,
        },
      );
    }

    const accessToken =
      authorization
        .slice("Bearer ".length)
        .trim();

    if (!accessToken) {
      return NextResponse.json(
        {
          error: "Authentication is required.",
        },
        {
          status: 401,
        },
      );
    }

    const {
      data: authData,
      error: authError,
    } =
      await supabaseAdmin.auth.getUser(
        accessToken,
      );

    if (
      authError ||
      !authData.user
    ) {
      return NextResponse.json(
        {
          error: "Invalid authentication.",
        },
        {
          status: 401,
        },
      );
    }

    /*
     * Vérifier côté serveur que l'utilisateur
     * connecté possède réellement le rôle admin.
     */

    const {
      data: adminProfile,
      error: adminProfileError,
    } = await supabaseAdmin
      .from("profiles")
      .select("id, role")
      .eq(
        "id",
        authData.user.id,
      )
      .maybeSingle();

    if (adminProfileError) {
      throw adminProfileError;
    }

    if (
      !adminProfile ||
      adminProfile.role !== "admin"
    ) {
      return NextResponse.json(
        {
          error:
            "Administrator access is required.",
        },
        {
          status: 403,
        },
      );
    }

    /*
     * =========================================================
     * Lire la requête
     * =========================================================
     */

    const body =
      (await request.json()) as ApproveTherapistRequest;

    const applicationId =
      body.applicationId?.trim();

    const email =
      body.email
        ?.trim()
        .toLowerCase();

    const fullName =
      body.fullName?.trim() || "";

    const specialty =
      body.specialty?.trim() || "";

    if (!applicationId) {
      return NextResponse.json(
        {
          error:
            "Application ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          error: "Email is required.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * =========================================================
     * Vérifier la candidature
     * =========================================================
     */

    const {
      data: application,
      error: applicationReadError,
    } = await supabaseAdmin
      .from("therapist_applications")
      .select(`
        id,
        email,
        status
      `)
      .eq(
        "id",
        applicationId,
      )
      .maybeSingle();

    if (applicationReadError) {
      throw applicationReadError;
    }

    if (!application) {
      return NextResponse.json(
        {
          error:
            "Therapist application was not found.",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * Si déjà approuvée, ne pas relancer
     * l'invitation ni modifier le spécialiste.
     */

    if (
      application.status ===
      "approved"
    ) {
      return NextResponse.json({
        success: true,
        alreadyApproved: true,
        application,
      });
    }

    const applicationEmail =
      application.email
        ?.trim()
        .toLowerCase();

    if (
      applicationEmail &&
      applicationEmail !== email
    ) {
      return NextResponse.json(
        {
          error:
            "Application email does not match.",
        },
        {
          status: 400,
        },
      );
    }

    const requestOrigin =
      new URL(request.url).origin;

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL
        ?.replace(/\/$/, "") ||
      requestOrigin;

    /*
     * =========================================================
     * Inviter le spécialiste
     * =========================================================
     */

    const {
      data: invitedUser,
      error: inviteError,
    } =
      await supabaseAdmin.auth.admin
        .inviteUserByEmail(
          email,
          {
            redirectTo:
              `${siteUrl}/reset-password`,
          },
        );

    let userId =
      invitedUser?.user?.id ||
      null;

    /*
     * Si le compte existe déjà,
     * retrouver son profil.
     */

    if (inviteError) {
      console.log(
        "Therapist invitation response:",
        inviteError.message,
      );

      const {
        data: existingProfile,
        error: existingProfileError,
      } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq(
          "email",
          email,
        )
        .maybeSingle();

      if (existingProfileError) {
        throw existingProfileError;
      }

      if (existingProfile?.id) {
        userId =
          existingProfile.id;
      } else {
        return NextResponse.json(
          {
            error:
              inviteError.message,
          },
          {
            status: 500,
          },
        );
      }
    }

    if (!userId) {
      return NextResponse.json(
        {
          error:
            "Unable to determine the therapist user ID.",
        },
        {
          status: 500,
        },
      );
    }

    /*
     * =========================================================
     * Profil
     * =========================================================
     */

    const {
      error: profileError,
    } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: userId,
          email,
          role: "therapist",
        },
        {
          onConflict: "id",
        },
      );

    if (profileError) {
      throw profileError;
    }

    /*
     * =========================================================
     * Fiche spécialiste
     *
     * IMPORTANT :
     * - nouveau spécialiste => price = 0
     * - spécialiste existant => ne jamais écraser
     *   son prix ni sa bio
     * =========================================================
     */

    const {
      data: existingTherapist,
      error: therapistReadError,
    } = await supabaseAdmin
      .from("therapists")
      .select("id")
      .eq(
        "id",
        userId,
      )
      .maybeSingle();

    if (therapistReadError) {
      throw therapistReadError;
    }

    if (existingTherapist) {
      /*
       * On actualise uniquement les informations
       * provenant de la candidature.
       *
       * price, bio et autres paramètres existants
       * restent intacts.
       */

      const {
        error: therapistUpdateError,
      } = await supabaseAdmin
        .from("therapists")
        .update({
          full_name: fullName,
          specialty,
        })
        .eq(
          "id",
          userId,
        );

      if (therapistUpdateError) {
        throw therapistUpdateError;
      }
    } else {
      /*
       * Pour un nouveau spécialiste,
       * aucun tarif n'est inventé.
       *
       * L'administrateur devra définir le prix
       * avant qu'une réservation soit possible.
       */

      const {
        error: therapistInsertError,
      } = await supabaseAdmin
        .from("therapists")
        .insert({
          id: userId,
          full_name: fullName,
          specialty,
          bio: "",
          price: 0,
        });

      if (therapistInsertError) {
        throw therapistInsertError;
      }
    }

    /*
     * =========================================================
     * Marquer LA candidature comme approuvée
     * =========================================================
     */

    const {
      data: updatedApplication,
      error: applicationUpdateError,
    } = await supabaseAdmin
      .from("therapist_applications")
      .update({
        status: "approved",
      })
      .eq(
        "id",
        applicationId,
      )
      .select(`
        id,
        email,
        status
      `)
      .maybeSingle();

    if (applicationUpdateError) {
      throw applicationUpdateError;
    }

    if (!updatedApplication) {
      return NextResponse.json(
        {
          error:
            "The application status was not updated.",
        },
        {
          status: 500,
        },
      );
    }

    if (
      updatedApplication.status !==
      "approved"
    ) {
      return NextResponse.json(
        {
          error:
            "The application was not marked as approved.",
        },
        {
          status: 500,
        },
      );
    }

    /*
     * =========================================================
     * E-mail d'approbation
     * =========================================================
     */

    try {
      const emailResponse =
        await fetch(
          `${siteUrl}/api/send-therapist-approval-email`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              email,
              fullName,
              loginUrl:
                `${siteUrl}/clinician`,
            }),
          },
        );

      if (!emailResponse.ok) {
        console.error(
          "Therapist approval email failed:",
          emailResponse.status,
          await emailResponse.text(),
        );
      }
    } catch (emailError) {
      /*
       * L'échec de l'e-mail ne remet
       * pas en cause l'approbation.
       */

      console.error(
        "Therapist approval email request failed:",
        emailError,
      );
    }

    console.log(
      "THERAPIST APPLICATION APPROVED:",
      {
        applicationId,
        email,
        userId,
        approvedBy:
          authData.user.id,
        status:
          updatedApplication.status,
      },
    );

    return NextResponse.json({
      success: true,
      applicationId,
      userId,
      status:
        updatedApplication.status,
    });
  } catch (error) {
    console.error(
      "Approve therapist error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to approve therapist application.",
      },
      {
        status: 500,
      },
    );
  }
}
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

    const body =
      (await request.json()) as ApproveTherapistRequest;

    const applicationId =
      body.applicationId?.trim();

    const email =
      body.email?.trim().toLowerCase();

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
          error:
            "Email is required.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Vérifier que la candidature existe
     * réellement avant de continuer.
     */
    const {
      data: application,
      error: applicationReadError,
    } = await supabaseAdmin
      .from("therapist_applications")
      .select(
        `
          id,
          email,
          status
        `,
      )
      .eq("id", applicationId)
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
     * Si elle est déjà approuvée,
     * on évite de relancer inutilement
     * toute la procédure.
     */
    if (application.status === "approved") {
      return NextResponse.json({
        success: true,
        alreadyApproved: true,
        application,
      });
    }

    /*
     * Sécurité supplémentaire :
     * l'e-mail envoyé par le navigateur
     * doit correspondre à celui enregistré
     * dans la candidature.
     */
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
      process.env.NEXT_PUBLIC_SITE_URL?.replace(
        /\/$/,
        "",
      ) || requestOrigin;

    /*
     * Première tentative :
     * inviter le spécialiste.
     */
    const {
      data: invitedUser,
      error: inviteError,
    } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        {
          redirectTo:
            `${siteUrl}/reset-password`,
        },
      );

    let userId =
      invitedUser?.user?.id || null;

    /*
     * Si l'utilisateur existe déjà,
     * Supabase peut refuser une nouvelle invitation.
     *
     * Dans ce cas, on essaie de retrouver
     * son profil existant.
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
        .eq("email", email)
        .maybeSingle();

      if (existingProfileError) {
        throw existingProfileError;
      }

      if (existingProfile?.id) {
        userId = existingProfile.id;
      } else {
        /*
         * Si Supabase a renvoyé une vraie erreur
         * et qu'aucun profil n'existe,
         * on ne prétend pas que l'approbation
         * a fonctionné.
         */
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
     * Créer ou mettre à jour le profil.
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
     * Créer ou mettre à jour
     * la fiche spécialiste.
     */
    const {
      error: therapistError,
    } = await supabaseAdmin
      .from("therapists")
      .upsert(
        {
          id: userId,
          full_name: fullName,
          specialty,
          bio: "",
          price: 0,
        },
        {
          onConflict: "id",
        },
      );

    if (therapistError) {
      throw therapistError;
    }

    /*
     * IMPORTANT :
     * on met à jour LA candidature précise
     * grâce à applicationId,
     * et non plus toutes les candidatures
     * partageant éventuellement le même e-mail.
     *
     * .select() permet aussi de vérifier
     * qu'une ligne a réellement été modifiée.
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
      .select(
        `
          id,
          email,
          status
        `,
      )
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

    console.log(
      "THERAPIST APPLICATION APPROVED:",
      {
        applicationId,
        email,
        userId,
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
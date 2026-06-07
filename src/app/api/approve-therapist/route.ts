import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { email, fullName, specialty } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";

    const { data: invitedUser, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${origin}/reset-password`,
      });

    if (inviteError && !inviteError.message.includes("already registered")) {
      return NextResponse.json(
        { error: inviteError.message },
        { status: 500 }
      );
    }

    const userId = invitedUser?.user?.id;

    if (userId) {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .upsert({
          id: userId,
          email,
          role: "therapist",
        });

      if (profileError) {
        return NextResponse.json(
          { error: profileError.message },
          { status: 500 }
        );
      }

      await supabaseAdmin.from("therapists").upsert({
        id: userId,
        full_name: fullName || "",
        specialty: specialty || "",
        bio: "",
        price: 0,
      });
    } else {
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();

      if (existingProfile?.id) {
        await supabaseAdmin
          .from("profiles")
          .update({ role: "therapist" })
          .eq("email", email);

        await supabaseAdmin.from("therapists").upsert({
          id: existingProfile.id,
          full_name: fullName || "",
          specialty: specialty || "",
          bio: "",
          price: 0,
        });
      }
    }

    const { error: applicationError } = await supabaseAdmin
      .from("therapist_applications")
      .update({
        status: "approved",
      })
      .eq("email", email);

    if (applicationError) {
      return NextResponse.json(
        { error: applicationError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
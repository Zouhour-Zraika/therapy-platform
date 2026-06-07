import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("email", email)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          error:
            "This therapist must first create an account on the platform.",
        },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        role: "therapist",
      })
      .eq("email", email);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
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
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const accessToken = authorization.replace("Bearer ", "");

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Invalid or expired session." },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const therapistId = String(body.therapistId || "");
    const price = Number(body.price);

    if (!therapistId) {
      return NextResponse.json(
        { error: "Therapist ID is required." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        { error: "Price must be greater than 0." },
        { status: 400 }
      );
    }

    const { data: therapist, error: updateError } = await supabaseAdmin
      .from("therapists")
      .update({ price })
      .eq("id", therapistId)
      .select("id, full_name, specialty, bio, price")
      .single();

    if (updateError || !therapist) {
      return NextResponse.json(
        {
          error:
            updateError?.message ||
            "The therapist price could not be updated.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      therapist,
    });
  } catch (error) {
    console.error("Update therapist price error:", error);

    return NextResponse.json(
      { error: "Server error while updating the price." },
      { status: 500 }
    );
  }
}
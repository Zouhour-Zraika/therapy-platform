import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function verifyAdmin(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return {
      error: NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      ),
    };
  }

  const accessToken = authorization.replace("Bearer ", "");

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (userError || !user) {
    return {
      error: NextResponse.json(
        { error: "Invalid or expired session." },
        { status: 401 }
      ),
    };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    return {
      error: NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      ),
    };
  }

  return { error: null };
}

export async function GET(request: Request) {
  try {
    const verification = await verifyAdmin(request);

    if (verification.error) {
      return verification.error;
    }

    const { data: therapistRows, error: therapistError } = await supabaseAdmin
      .from("therapists")
      .select("id, full_name, specialty, bio, price")
      .order("full_name", { ascending: true });

    if (therapistError) {
      return NextResponse.json(
        { error: therapistError.message },
        { status: 500 }
      );
    }

    const therapistIds = (therapistRows ?? []).map((therapist) => therapist.id);

    if (therapistIds.length === 0) {
      return NextResponse.json({ therapists: [] });
    }

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, role")
      .in("id", therapistIds);

    if (profilesError) {
      return NextResponse.json(
        { error: profilesError.message },
        { status: 500 }
      );
    }

    const profileMap = new Map(
      (profiles ?? []).map((profile) => [profile.id, profile])
    );

    const therapists = (therapistRows ?? [])
      .map((therapist) => {
        const profile = profileMap.get(therapist.id);

        return {
          ...therapist,
          email: profile?.email ?? null,
          role: profile?.role ?? null,
          price: Number(therapist.price ?? 0),
        };
      })
      .filter((therapist) => therapist.role === "therapist");

    return NextResponse.json({ therapists });
  } catch (error) {
    console.error("Load therapists error:", error);

    return NextResponse.json(
      { error: "Server error while loading therapists." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const verification = await verifyAdmin(request);

    if (verification.error) {
      return verification.error;
    }

    const body = await request.json();
    const therapistId = String(body.therapistId ?? "");

    if (!therapistId) {
      return NextResponse.json(
        { error: "Therapist ID is required." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("therapists")
      .delete()
      .eq("id", therapistId);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete therapist error:", error);

    return NextResponse.json(
      { error: "Server error while deleting therapist." },
      { status: 500 }
    );
  }
}
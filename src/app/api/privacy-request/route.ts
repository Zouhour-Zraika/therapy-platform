import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type PrivacyRequestBody = {
  fullName?: string;
  email?: string;
  requestType?:
    | "access"
    | "correction"
    | "deletion"
    | "restriction"
    | "portability"
    | "objection"
    | "other";
  message?: string;
};

const allowedRequestTypes = [
  "access",
  "correction",
  "deletion",
  "restriction",
  "portability",
  "objection",
  "other",
] as const;

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseServerKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServerKey) {
    throw new Error(
      "Supabase server configuration is missing.",
    );
  }

  return createClient(
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
}

export async function POST(
  request: Request,
) {
  try {
    const body =
      (await request.json()) as PrivacyRequestBody;

    const fullName =
      body.fullName?.trim();

    const email =
      body.email?.trim().toLowerCase();

    const requestType =
      body.requestType;

    const message =
      body.message?.trim();

    if (
      !fullName ||
      !email ||
      !requestType ||
      !message
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "All required fields must be completed.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !allowedRequestTypes.includes(
        requestType,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid privacy request type.",
        },
        {
          status: 400,
        },
      );
    }

    if (fullName.length > 150) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Full name is too long.",
        },
        {
          status: 400,
        },
      );
    }

    if (email.length > 254) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Email address is too long.",
        },
        {
          status: 400,
        },
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Request message is too long.",
        },
        {
          status: 400,
        },
      );
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid email address.",
        },
        {
          status: 400,
        },
      );
    }

    const supabaseAdmin =
      getSupabaseAdmin();

    const { data, error } =
      await supabaseAdmin
        .from("privacy_requests")
        .insert({
          full_name: fullName,
          email,
          request_type: requestType,
          message,
          status: "pending",
        })
        .select("id, created_at")
        .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        success: true,
        requestId: data.id,
        createdAt: data.created_at,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Privacy request API error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to submit privacy request.",
      },
      {
        status: 500,
      },
    );
  }
}
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type FeedbackStatus = "open" | "in_progress" | "done";

type FeedbackRequestBody = {
  id?: string;
  pagePath?: string;
  pageUrl?: string;
  note?: string;
  elementText?: string;
  elementTag?: string;
  xPosition?: number;
  yPosition?: number;
  pageWidth?: number;
  pageHeight?: number;
  status?: FeedbackStatus;
};

const REVIEW_COOKIE_NAME = "aan_review_access";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

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

function hasReviewCookie(request: Request) {
  const cookieHeader =
    request.headers.get("cookie") || "";

  return cookieHeader
    .split(";")
    .map((item) => item.trim())
    .some(
      (item) =>
        item ===
        `${REVIEW_COOKIE_NAME}=allowed`,
    );
}

async function getAdminUserId(
  request: Request,
  supabaseAdmin: ReturnType<
    typeof getSupabaseAdmin
  >,
) {
  const authorization =
    request.headers.get("authorization");

  if (
    !authorization?.startsWith("Bearer ")
  ) {
    return null;
  }

  const accessToken = authorization
    .slice("Bearer ".length)
    .trim();

  if (!accessToken) {
    return null;
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(
    accessToken,
  );

  if (userError || !user) {
    return null;
  }

  const { data: profile, error } =
    await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

  if (error || profile?.role !== "admin") {
    return null;
  }

  return user.id;
}

async function authorizeReviewRequest(
  request: Request,
  supabaseAdmin: ReturnType<
    typeof getSupabaseAdmin
  >,
) {
  const adminUserId =
    await getAdminUserId(
      request,
      supabaseAdmin,
    );

  if (adminUserId) {
    return {
      allowed: true,
      userId: adminUserId,
      accessType: "admin" as const,
    };
  }

  if (hasReviewCookie(request)) {
    return {
      allowed: true,
      userId: null,
      accessType: "review-code" as const,
    };
  }

  return {
    allowed: false,
    userId: null,
    accessType: null,
  };
}

export async function GET(
  request: Request,
) {
  try {
    const supabaseAdmin =
      getSupabaseAdmin();

    const authorization =
      await authorizeReviewRequest(
        request,
        supabaseAdmin,
      );

    if (!authorization.allowed) {
      return NextResponse.json(
        {
          error: "Review access required.",
        },
        {
          status: 401,
        },
      );
    }

    const url = new URL(request.url);

    const pagePath =
      url.searchParams.get("pagePath");

    if (!pagePath) {
      return NextResponse.json(
        {
          error: "pagePath is required.",
        },
        {
          status: 400,
        },
      );
    }

    const { data, error } =
      await supabaseAdmin
        .from("site_feedback")
        .select("*")
        .eq("page_path", pagePath)
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      feedback: data || [],
    });
  } catch (error) {
    console.error(
      "Site feedback GET error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load feedback.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(
  request: Request,
) {
  try {
    const supabaseAdmin =
      getSupabaseAdmin();

    const authorization =
      await authorizeReviewRequest(
        request,
        supabaseAdmin,
      );

    if (!authorization.allowed) {
      return NextResponse.json(
        {
          error: "Review access required.",
        },
        {
          status: 401,
        },
      );
    }

    const body =
      (await request.json()) as
        FeedbackRequestBody;

    const pagePath =
      body.pagePath?.trim();

    const pageUrl =
      body.pageUrl?.trim();

    const note = body.note?.trim();

    if (!pagePath || !pageUrl || !note) {
      return NextResponse.json(
        {
          error:
            "Page and note information are required.",
        },
        {
          status: 400,
        },
      );
    }

    const { data, error } =
      await supabaseAdmin
        .from("site_feedback")
        .insert({
          page_path: pagePath,
          page_url: pageUrl,
          note,
          element_text:
            body.elementText?.trim() ||
            null,
          element_tag:
            body.elementTag?.trim() ||
            null,
          x_position:
            typeof body.xPosition ===
            "number"
              ? body.xPosition
              : null,
          y_position:
            typeof body.yPosition ===
            "number"
              ? body.yPosition
              : null,
          page_width:
            typeof body.pageWidth ===
            "number"
              ? body.pageWidth
              : null,
          page_height:
            typeof body.pageHeight ===
            "number"
              ? body.pageHeight
              : null,
          status: "open",
          created_by:
            authorization.userId,
        })
        .select("*")
        .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      feedback: data,
    });
  } catch (error) {
    console.error(
      "Site feedback POST error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save feedback.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(
  request: Request,
) {
  try {
    const supabaseAdmin =
      getSupabaseAdmin();

    const authorization =
      await authorizeReviewRequest(
        request,
        supabaseAdmin,
      );

    if (!authorization.allowed) {
      return NextResponse.json(
        {
          error: "Review access required.",
        },
        {
          status: 401,
        },
      );
    }

    const body =
      (await request.json()) as
        FeedbackRequestBody;

    const id = body.id?.trim();

    const allowedStatuses:
      FeedbackStatus[] = [
      "open",
      "in_progress",
      "done",
    ];

    if (
      !id ||
      !body.status ||
      !allowedStatuses.includes(
        body.status,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "A valid feedback ID and status are required.",
        },
        {
          status: 400,
        },
      );
    }

    const { data, error } =
      await supabaseAdmin
        .from("site_feedback")
        .update({
          status: body.status,
        })
        .eq("id", id)
        .select("*")
        .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      feedback: data,
    });
  } catch (error) {
    console.error(
      "Site feedback PATCH error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update feedback.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
  request: Request,
) {
  try {
    const supabaseAdmin =
      getSupabaseAdmin();

    const authorization =
      await authorizeReviewRequest(
        request,
        supabaseAdmin,
      );

    if (!authorization.allowed) {
      return NextResponse.json(
        {
          error: "Review access required.",
        },
        {
          status: 401,
        },
      );
    }

    const body =
      (await request.json()) as
        FeedbackRequestBody;

    const id = body.id?.trim();

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Feedback ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const { error } =
      await supabaseAdmin
        .from("site_feedback")
        .delete()
        .eq("id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Site feedback DELETE error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to delete feedback.",
      },
      {
        status: 500,
      },
    );
  }
}
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const COOKIE_NAME = "aan_review_access";

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";

  const hasAccess = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .some((item) => item === `${COOKIE_NAME}=allowed`);

  return NextResponse.json({
    allowed: hasAccess,
  });
}

export async function POST(request: Request) {
  try {
    const expectedCode = process.env.REVIEW_ACCESS_CODE;

    if (!expectedCode) {
      return NextResponse.json(
        {
          error: "REVIEW_ACCESS_CODE is missing.",
        },
        {
          status: 500,
        },
      );
    }

    const body = (await request.json()) as {
      code?: string;
    };

    const submittedCode = body.code?.trim();

    if (!submittedCode || submittedCode !== expectedCode) {
      return NextResponse.json(
        {
          error: "Invalid review access code.",
        },
        {
          status: 401,
        },
      );
    }

    const response = NextResponse.json({
      allowed: true,
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: "allowed",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });

    return response;
  } catch (error) {
    console.error("Review access error:", error);

    return NextResponse.json(
      {
        error: "Unable to verify review access.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    allowed: false,
  });

  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
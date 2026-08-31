import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Google Meet integration is not configured yet.",
    },
    {
      status: 503,
    },
  );
}
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Creating additional administrator accounts is disabled.",
    },
    { status: 403 },
  );
}

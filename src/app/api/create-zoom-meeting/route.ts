import { NextResponse } from "next/server";
import axios from "axios";

async function getZoomAccessToken() {
  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!accountId || !clientId || !clientSecret) {
    throw new Error("Zoom configuration is missing.");
  }

  const response = await axios.post(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    {},
    {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
      },
    }
  );

  return response.data.access_token;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      therapist,
      scheduledStart,
      duration = 60,
      agenda,
    } = body;

    if (!therapist || !scheduledStart) {
      return NextResponse.json(
        {
          error: "therapist and scheduledStart are required.",
        },
        {
          status: 400,
        }
      );
    }

    const startDate = new Date(scheduledStart);

    if (Number.isNaN(startDate.getTime())) {
      return NextResponse.json(
        {
          error: "Invalid scheduledStart.",
        },
        {
          status: 400,
        }
      );
    }

    const accessToken = await getZoomAccessToken();

    const zoomResponse = await axios.post(
      "https://api.zoom.us/v2/users/me/meetings",
      {
        topic: `AAN Therapy Session with ${therapist}`,
        type: 2,
        start_time: startDate.toISOString(),
        duration: Number(duration),
        timezone: "Asia/Beirut",
        agenda: agenda || "AAN psychotherapy session",
        settings: {
          join_before_host: true,
          waiting_room: false,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return NextResponse.json({
      meeting_id: zoomResponse.data.id,
      join_url: zoomResponse.data.join_url,
      start_url: zoomResponse.data.start_url,
    });
  } catch (error: any) {
    console.error(
      "Zoom meeting creation failed:",
      error.response?.data || error
    );

    return NextResponse.json(
      {
        error: "Failed to create Zoom meeting",
      },
      {
        status: 500,
      }
    );
  }
}
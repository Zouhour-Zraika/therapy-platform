import { NextResponse } from "next/server";
import axios from "axios";

async function getZoomAccessToken() {
  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

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
      slot,
    } = body;

    const accessToken = await getZoomAccessToken();

    const zoomResponse = await axios.post(
      "https://api.zoom.us/v2/users/me/meetings",
      {
        topic: `Therapy Session with ${therapist}`,
        type: 2,
        start_time: new Date().toISOString(),
        duration: 60,
        timezone: "Europe/Paris",
        agenda: slot,
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
      join_url: zoomResponse.data.join_url,
      start_url: zoomResponse.data.start_url,
    });
  } catch (error: any) {
    console.log(error.response?.data || error);

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
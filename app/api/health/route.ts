import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "insta-autopost",
    instagramConnected: false,
    automationEnabled: false
  });
}

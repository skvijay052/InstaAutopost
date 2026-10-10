import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SCOPES = [
  "instagram_business_basic",
  "instagram_business_content_publish",
  "instagram_business_manage_comments",
  "instagram_business_manage_messages",
];

export async function GET(request: Request) {
  const clientId = process.env.META_APP_ID;
  const redirectUri = process.env.META_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      {
        error: "Instagram login is not configured.",
        requiredEnvironmentVariables: ["META_APP_ID", "META_REDIRECT_URI"],
      },
      { status: 503 },
    );
  }

  let configuredRedirect: URL;
  try {
    configuredRedirect = new URL(redirectUri);
  } catch {
    return NextResponse.json({ error: "META_REDIRECT_URI must be a valid URL." }, { status: 500 });
  }

  if (configuredRedirect.protocol !== "https:" && configuredRedirect.hostname !== "localhost") {
    return NextResponse.json({ error: "META_REDIRECT_URI must use HTTPS." }, { status: 500 });
  }

  const state = randomBytes(32).toString("hex");
  const authorizeUrl = new URL("https://www.instagram.com/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", SCOPES.join(","));
  authorizeUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set("instagram_oauth_state", state, {
    httpOnly: true,
    secure: configuredRedirect.protocol === "https:",
    sameSite: "lax",
    path: "/api/auth/instagram",
    maxAge: 10 * 60,
  });
  return response;
}

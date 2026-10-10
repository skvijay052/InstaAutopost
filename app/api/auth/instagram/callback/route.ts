import { createCipheriv, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

type TokenResponse = {
  access_token?: string;
  user_id?: number | string;
  expires_in?: number;
  error_message?: string;
  error?: { message?: string };
};

function encryptAccessToken(token: string): string {
  const keyHex = process.env.TOKEN_ENCRYPTION_KEY;
  if (!keyHex || !/^[a-fA-F0-9]{64}$/.test(keyHex)) {
    throw new Error("TOKEN_ENCRYPTION_KEY must be a 64-character hexadecimal key.");
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", Buffer.from(keyHex, "hex"), iv);
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return ["v1", iv.toString("hex"), authTag.toString("hex"), ciphertext.toString("hex")].join(":");
}

function safeError(message: string) {
  const url = new URL("/", process.env.META_REDIRECT_URI ?? "https://localhost");
  url.searchParams.set("instagram_login", "error");
  url.searchParams.set("reason", message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const redirectUri = process.env.META_REDIRECT_URI;
  const clientId = process.env.META_APP_ID;
  const clientSecret = process.env.META_APP_SECRET;
  const encryptionKey = process.env.TOKEN_ENCRYPTION_KEY;

  const returnedState = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get("instagram_oauth_state")?.value;
  const code = request.nextUrl.searchParams.get("code");
  const oauthError = request.nextUrl.searchParams.get("error");

  const clearStateCookie = (response: NextResponse) => {
    response.cookies.set("instagram_oauth_state", "", {
      httpOnly: true,
      secure: request.nextUrl.protocol === "https:",
      sameSite: "lax",
      path: "/api/auth/instagram",
      maxAge: 0,
    });
    return response;
  };

  if (oauthError) return clearStateCookie(safeError("Instagram authorization was cancelled or denied."));
  if (!returnedState || !expectedState || returnedState !== expectedState) {
    return clearStateCookie(safeError("OAuth state check failed. Please try connecting again."));
  }
  if (!code) return clearStateCookie(safeError("Instagram did not return an authorization code."));
  if (!redirectUri || !clientId || !clientSecret || !encryptionKey || !process.env.DATABASE_URL) {
    return clearStateCookie(safeError("Server setup is incomplete. Check Vercel environment variables."));
  }

  try {
    const tokenForm = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code,
    });

    const shortTokenResponse = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenForm,
      cache: "no-store",
    });
    const shortToken = (await shortTokenResponse.json()) as TokenResponse;
    if (!shortTokenResponse.ok || !shortToken.access_token) {
      return clearStateCookie(safeError("Instagram token exchange failed. Check the Meta app settings and redirect URL."));
    }

    const longTokenUrl = new URL("https://graph.instagram.com/access_token");
    longTokenUrl.searchParams.set("grant_type", "ig_exchange_token");
    longTokenUrl.searchParams.set("client_secret", clientSecret);
    longTokenUrl.searchParams.set("access_token", shortToken.access_token);

    const longTokenResponse = await fetch(longTokenUrl, { cache: "no-store" });
    const longToken = (await longTokenResponse.json()) as TokenResponse;
    if (!longTokenResponse.ok || !longToken.access_token) {
      return clearStateCookie(safeError("Instagram token could not be exchanged for a long-lived token."));
    }

    const profileUrl = new URL("https://graph.instagram.com/me");
    profileUrl.searchParams.set("fields", "id,username");
    profileUrl.searchParams.set("access_token", longToken.access_token);
    const profileResponse = await fetch(profileUrl, { cache: "no-store" });
    const profile = (await profileResponse.json()) as { id?: string | number; username?: string };
    if (!profileResponse.ok || !profile.id) {
      return clearStateCookie(safeError("Instagram profile lookup failed. Check the granted permissions."));
    }

    const expiresIn = typeof longToken.expires_in === "number" ? longToken.expires_in : 60 * 24 * 60 * 60;
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);
    await prisma.instagramAccount.upsert({
      where: { instagramBusinessId: String(profile.id) },
      create: {
        instagramBusinessId: String(profile.id),
        username: profile.username ?? null,
        encryptedAccessToken: encryptAccessToken(longToken.access_token),
        tokenExpiresAt,
        automationStatus: "PAUSED",
      },
      update: {
        username: profile.username ?? null,
        encryptedAccessToken: encryptAccessToken(longToken.access_token),
        tokenExpiresAt,
        automationStatus: "PAUSED",
      },
    });

    const successUrl = new URL("/", redirectUri);
    successUrl.searchParams.set("instagram_login", "connected");
    successUrl.searchParams.set("username", profile.username ?? "");
    return clearStateCookie(NextResponse.redirect(successUrl));
  } catch {
    // Do not log access tokens, authorization codes, or provider response bodies.
    return clearStateCookie(safeError("Connection failed. Verify DATABASE_URL, TOKEN_ENCRYPTION_KEY, and Meta credentials."));
  }
}

import { createHmac, timingSafeEqual, createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");
  const expectedToken = process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (!expectedToken || mode !== "subscribe" || !token || !challenge || !safeEqual(token, expectedToken)) {
    return new NextResponse("Webhook verification failed", { status: 403 });
  }

  return new NextResponse(challenge, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function POST(request: NextRequest) {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    return NextResponse.json({ error: "Webhook endpoint is not configured." }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256") ?? "";
  const expectedSignature = `sha256=${createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;

  if (!signature || !safeEqual(signature, expectedSignature)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  // Persist verified events for later processing. No comments or messages are replied to yet.
  if (process.env.DATABASE_URL) {
    try {
      const payload: unknown = JSON.parse(rawBody);
      const providerEventId = createHash("sha256").update(rawBody).digest("hex");
      const record = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
      const eventType = typeof record.object === "string" ? record.object : "instagram";
      await prisma.webhookEvent.upsert({
        where: { providerEventId },
        create: { providerEventId, eventType, payload: payload as object },
        update: {},
      });
    } catch {
      // Return an error so Meta can retry rather than silently dropping an unpersisted event.
      return NextResponse.json({ error: "Could not persist webhook event." }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}

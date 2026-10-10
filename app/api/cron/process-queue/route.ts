import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Intentionally does not publish or reply yet. Implement queue processing only
  // after Meta OAuth, database persistence, idempotency, and pause checks are ready.
  return NextResponse.json({
    status: "paused",
    processed: 0,
    message: "Instagram automation is not enabled. No external actions were performed."
  });
}

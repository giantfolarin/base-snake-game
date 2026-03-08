import { NextRequest, NextResponse } from "next/server";

/**
 * Optional webhook endpoint for Farcaster Mini App events.
 * Extend this to handle notifications, frame events, etc.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[webhook] event received:", body);

    // TODO: handle specific event types
    // e.g. body.event === "frame_added", "notifications_enabled", etc.

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhook] error:", err);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

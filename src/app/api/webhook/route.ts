import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

// Lazily init Redis so missing env vars don't crash the module during build
function getRedis() {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const HASH_KEY = "notif_tokens";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, fid, notificationDetails } = body ?? {};

    console.log("[webhook] event:", event, "fid:", fid);

    const redis = getRedis();

    if (event === "frame_added" && notificationDetails?.url && notificationDetails?.token) {
      if (redis) {
        await redis.hset(HASH_KEY, {
          [String(fid)]: JSON.stringify({
            url:   notificationDetails.url,
            token: notificationDetails.token,
          }),
        });
        console.log("[webhook] stored notification token for fid:", fid);
      }
    }

    if (
      (event === "frame_removed" || event === "notifications_disabled") &&
      fid != null
    ) {
      if (redis) {
        await redis.hdel(HASH_KEY, String(fid));
        console.log("[webhook] removed notification token for fid:", fid);
      }
    }

    if (event === "notifications_enabled" && notificationDetails?.url && notificationDetails?.token) {
      if (redis) {
        await redis.hset(HASH_KEY, {
          [String(fid)]: JSON.stringify({
            url:   notificationDetails.url,
            token: notificationDetails.token,
          }),
        });
        console.log("[webhook] re-stored notification token for fid:", fid);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhook] error:", err);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

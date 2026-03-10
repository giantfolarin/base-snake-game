import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const HASH_KEY  = "notif_tokens";
const APP_URL   = process.env.NEXT_PUBLIC_APP_URL ?? "https://snakebase.xyz";

function getRedis() {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

// Group tokens by notification URL so we can batch per endpoint
function groupByUrl(entries: Record<string, string>) {
  const map = new Map<string, string[]>();
  for (const raw of Object.values(entries)) {
    try {
      const { url, token } = JSON.parse(raw) as { url: string; token: string };
      if (!map.has(url)) map.set(url, []);
      map.get(url)!.push(token);
    } catch {
      // skip malformed entries
    }
  }
  return map;
}

async function handleNotify(req: NextRequest) {
  // Accept CRON_SECRET (Vercel cron) or NOTIFY_SECRET (manual trigger)
  const cronSecret   = process.env.CRON_SECRET;
  const notifySecret = process.env.NOTIFY_SECRET;
  const auth = req.headers.get("authorization");
  const authorized =
    (cronSecret   && auth === `Bearer ${cronSecret}`) ||
    (notifySecret && auth === `Bearer ${notifySecret}`);
  if (cronSecret || notifySecret) {
    if (!authorized) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ ok: false, error: "Redis not configured" }, { status: 500 });
  }

  const all = await redis.hgetall<Record<string, string>>(HASH_KEY);
  if (!all || Object.keys(all).length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: "No subscribers" });
  }

  const groups = groupByUrl(all);
  const notificationId = `weekly-${new Date().toISOString().slice(0, 10)}`;

  let totalSent = 0;
  const errors: string[] = [];

  for (const [url, tokens] of Array.from(groups)) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notificationId,
          title:     "Time to play SnakeBase!",
          body:      "New week, new chance to climb the SnakeBase leaderboard. Beat your previous high score and climb higher. Top players may unlock rewards 👀",
          targetUrl: APP_URL,
          tokens,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        errors.push(`${url}: ${res.status} ${text}`);
      } else {
        totalSent += tokens.length;
      }
    } catch (err) {
      errors.push(`${url}: ${String(err)}`);
    }
  }

  console.log(`[notify] sent to ${totalSent} subscribers, errors: ${errors.length}`);

  return NextResponse.json({
    ok:     errors.length === 0,
    sent:   totalSent,
    errors: errors.length > 0 ? errors : undefined,
  });
}

// Vercel cron calls GET; manual trigger can use POST with Authorization header
export async function GET(req: NextRequest) {
  return handleNotify(req);
}

export async function POST(req: NextRequest) {
  return handleNotify(req);
}

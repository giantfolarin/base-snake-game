import { NextResponse } from "next/server";

/**
 * Serves /.well-known/farcaster.json
 *
 * This manifest is required for Base Mini Apps (Farcaster Frames v2).
 * Replace the placeholder values below with your production domain and
 * the accountAssociation signature generated via the Farcaster developer tools.
 *
 * Generate your accountAssociation at:
 *   https://warpcast.com/~/developers/frames
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://your-domain.com";

export async function GET() {
  const manifest = {
    // accountAssociation links this Mini App to a Farcaster account.
    // Replace with your real signed values.
    accountAssociation: {
      header: "REPLACE_WITH_SIGNED_HEADER",
      payload: "REPLACE_WITH_SIGNED_PAYLOAD",
      signature: "REPLACE_WITH_SIGNATURE",
    },

    frame: {
      version: "1",
      name: "Snake",
      iconUrl: `${APP_URL}/icon.png`,
      homeUrl: APP_URL,
      imageUrl: `${APP_URL}/og-image.png`,
      buttonTitle: "Play Snake",
      splashImageUrl: `${APP_URL}/splash.png`,
      splashBackgroundColor: "#84c234",

      // Optional: webhook for notifications
      // webhookUrl: `${APP_URL}/api/webhook`,
    },
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // Read env vars inside the handler so they're never frozen at build time
  const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? "https://snakebase.xyz";
  const header    = process.env.FARCASTER_HEADER;
  const payload   = process.env.FARCASTER_PAYLOAD;
  const signature = process.env.FARCASTER_SIGNATURE;

  const manifest = {
    accountAssociation:
      header && payload && signature
        ? { header, payload, signature }
        : null,

    frame: {
      version: "1",
      name: "Snake",
      iconUrl: `${appUrl}/icon.png`,
      homeUrl: appUrl,
      imageUrl: `${appUrl}/og-image.png`,
      buttonTitle: "Play Snake",
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#84c234",
      screenshotUrls: [
        `${appUrl}/screenshot1.jpg`,
        `${appUrl}/screenshot2.jpg`,
        `${appUrl}/screenshot3.jpg`,
      ],
    },
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

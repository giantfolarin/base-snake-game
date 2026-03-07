import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
});

// Mini App frame metadata — Farcaster / Base Mini App spec
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://your-domain.com";

export const metadata: Metadata = {
  title: "Snake | Base Mini App",
  description: "Classic Snake game built as a Base Mini App",
  other: {
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: `${APP_URL}/og-image.png`,
      button: {
        title: "Play Snake",
        action: {
          type: "launch_frame",
          name: "Snake",
          url: APP_URL,
          splashImageUrl: `${APP_URL}/splash.png`,
          splashBackgroundColor: "#84c234",
        },
      },
    }),
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ height: "100%" }} className={pixelFont.variable}>
      <body style={{ height: "100%", margin: 0 }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

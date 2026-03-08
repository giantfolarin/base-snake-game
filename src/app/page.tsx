"use client";

import { useEffect } from "react";
import { SnakeGame } from "@/components/SnakeGame";

async function signalReady() {
  try {
    const { sdk } = await import("@farcaster/miniapp-sdk");
    await sdk.actions.ready();
  } catch {
    // Running outside Farcaster shell — safe to ignore
  }
}

export default function Home() {
  useEffect(() => {
    signalReady();
  }, []);

  return <SnakeGame />;
}

"use client";

import { useReadContract } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";

export type OnChainEntry = {
  player: string;
  name: string;
  score: number;
  timestamp: number;
};

export function useLeaderboard() {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getTopScores",
    args: [BigInt(10)],
  });

  const entries: OnChainEntry[] = data
    ? [...data]
        .map((e) => ({
          player:    e.player,
          name:      e.name,
          score:     Number(e.score),
          timestamp: Number(e.timestamp),
        }))
        .sort((a, b) => b.score - a.score)
    : [];

  return { entries, isLoading, error, refetch };
}

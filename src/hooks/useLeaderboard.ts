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
        // Keep only the highest score per wallet address
        .reduce((acc, entry) => {
          const existing = acc.find(
            (e) => e.player.toLowerCase() === entry.player.toLowerCase()
          );
          if (!existing) {
            acc.push(entry);
          } else if (entry.score > existing.score) {
            existing.score = entry.score;
            existing.name  = entry.name;
          }
          return acc;
        }, [] as OnChainEntry[])
        .sort((a, b) => b.score - a.score)
    : [];

  return { entries, isLoading, error, refetch };
}

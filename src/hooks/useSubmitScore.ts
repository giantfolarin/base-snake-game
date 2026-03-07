"use client";

import { useSendTransaction } from "wagmi";
import { CONTRACT_ADDRESS, encodeSubmitScore } from "@/lib/contract";

export function useSubmitScore() {
  const { sendTransaction, isPending, isSuccess, error } = useSendTransaction();

  function submitScore(name: string, score: number) {
    if (!name || score <= 0) return;
    sendTransaction({
      to: CONTRACT_ADDRESS,
      data: encodeSubmitScore(name, score),
    });
  }

  return { submitScore, isPending, isSuccess, error };
}

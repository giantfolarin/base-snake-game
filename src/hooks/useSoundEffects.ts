"use client";

import { useCallback, useEffect, useRef } from "react";

export function useSoundEffects(enabled: boolean) {
  const audioCtxRef    = useRef<AudioContext | null>(null);
  const gameOverAudio  = useRef<HTMLAudioElement | null>(null);

  // Pre-load the aww.mp3 once
  useEffect(() => {
    if (typeof window === "undefined") return;
    const audio = new Audio("/sounds/aww.mp3");
    audio.preload = "auto";
    gameOverAudio.current = audio;
  }, []);

  function getCtx(): AudioContext | null {
    if (!enabled || typeof window === "undefined") return null;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      )();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }

  // Retro "blip" — quick upward sweep when eating food
  const playEat = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;

    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "square";
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.13);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.13);
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // "Aww" crowd sound on game over — plays /sounds/aww.mp3
  const playGameOver = useCallback(() => {
    if (!enabled) return;
    const audio = gameOverAudio.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  return { playEat, playGameOver };
}

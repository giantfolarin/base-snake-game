"use client";

import { useEffect, useRef } from "react";

const PLAYLIST = [
  "/sounds/music/no-batidao.mp3",
  "/sounds/music/sempero.mp3",
  "/sounds/music/montagem-rugada.mp3",
  "/sounds/music/funk-criminal.mp3",
  "/sounds/music/gozalo.mp3",
];

function pickRandom(exclude?: number): number {
  if (PLAYLIST.length === 1) return 0;
  let idx: number;
  do { idx = Math.floor(Math.random() * PLAYLIST.length); } while (idx === exclude);
  return idx;
}

export function useMusicPlayer(enabled: boolean, gameState: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackRef = useRef(pickRandom());

  // Create audio element once on mount and preload immediately
  useEffect(() => {
    const audio = new Audio(PLAYLIST[trackRef.current]);
    audio.volume = 0.55;
    audio.preload = "auto";

    function onEnded() {
      trackRef.current = pickRandom(trackRef.current);
      audio.src = PLAYLIST[trackRef.current];
      audio.play().catch(() => {});
    }

    audio.addEventListener("ended", onEnded);
    audioRef.current = audio;

    return () => {
      audio.removeEventListener("ended", onEnded);
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  // Play or pause — no reloading, no src swaps mid-game
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (enabled && gameState === "playing") {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [enabled, gameState]);
}

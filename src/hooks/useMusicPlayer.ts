"use client";

import { useEffect, useRef } from "react";

const PLAYLIST = [
  "/sounds/music/no-batidao.mp3",
  "/sounds/music/sempero.mp3",
  "/sounds/music/montagem-rugada.mp3",
  "/sounds/music/funk-criminal.mp3",
  "/sounds/music/gozalo.mp3",
];

export function useMusicPlayer(enabled: boolean, gameState: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    const shouldPlay = enabled && gameState === "playing";

    if (shouldPlay) {
      // Create a fresh audio element at game start (after idle/gameover reset)
      if (!audioRef.current) {
        indexRef.current = 0;
        const audio = new Audio(PLAYLIST[0]);
        audio.volume = 0.55;
        audio.onended = () => {
          indexRef.current = (indexRef.current + 1) % PLAYLIST.length;
          audio.src = PLAYLIST[indexRef.current];
          audio.play().catch(() => {});
        };
        audioRef.current = audio;
      }
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current?.pause();
      // Reset playlist position when game ends so next game starts fresh
      if (gameState === "gameover" || gameState === "idle") {
        if (audioRef.current) {
          audioRef.current.onended = null;
          audioRef.current = null;
        }
        indexRef.current = 0;
      }
    }
  }, [enabled, gameState]);

  // Stop and clean up when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.onended = null;
        audioRef.current = null;
      }
    };
  }, []);
}

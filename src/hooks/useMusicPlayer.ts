"use client";

import { useEffect, useRef } from "react";

const PLAYLIST = [
  "/sounds/music/no-batidao.mp3",
  "/sounds/music/sempero.mp3",
  "/sounds/music/montagem-rugada.mp3",
  "/sounds/music/funk-criminal.mp3",
  "/sounds/music/gozalo.mp3",
];

function randomIndex(exclude?: number): number {
  if (PLAYLIST.length === 1) return 0;
  let idx: number;
  do { idx = Math.floor(Math.random() * PLAYLIST.length); } while (idx === exclude);
  return idx;
}

export function useMusicPlayer(enabled: boolean, gameState: string) {
  const audioRef    = useRef<HTMLAudioElement | null>(null);
  const indexRef    = useRef<number>(randomIndex());
  const preloadedRef = useRef(false);

  // Preload a random track on mount so it's ready instantly when game starts
  useEffect(() => {
    if (preloadedRef.current) return;
    preloadedRef.current = true;
    indexRef.current = randomIndex();
    const audio = new Audio(PLAYLIST[indexRef.current]);
    audio.volume = 0.55;
    audio.preload = "auto";
    audio.onended = () => {
      indexRef.current = randomIndex(indexRef.current);
      audio.src = PLAYLIST[indexRef.current];
      audio.play().catch(() => {});
    };
    audioRef.current = audio;
  }, []);

  useEffect(() => {
    const shouldPlay = enabled && gameState === "playing";

    if (shouldPlay) {
      if (!audioRef.current) {
        indexRef.current = randomIndex();
        const audio = new Audio(PLAYLIST[indexRef.current]);
        audio.volume = 0.55;
        audio.preload = "auto";
        audio.onended = () => {
          indexRef.current = randomIndex(indexRef.current);
          audio.src = PLAYLIST[indexRef.current];
          audio.play().catch(() => {});
        };
        audioRef.current = audio;
      }
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current?.pause();
      if (gameState === "gameover" || gameState === "idle") {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          // Pick a new random track for next game
          indexRef.current = randomIndex(indexRef.current);
          audioRef.current.src = PLAYLIST[indexRef.current];
          audioRef.current.load();
        }
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

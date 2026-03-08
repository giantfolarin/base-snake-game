"use client";

import { useEffect, useRef } from "react";
import type { Direction } from "@/lib/types";

const SWIPE_THRESHOLD = 30; // minimum px to register a swipe

export function useSwipeControls(
  onDirection: (dir: Direction) => void,
  targetRef: React.RefObject<HTMLElement | null>
) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onDirectionRef = useRef(onDirection);
  onDirectionRef.current = onDirection;

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      touchStart.current = { x: t.clientX, y: t.clientY };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStart.current.x;
      const dy = t.clientY - touchStart.current.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (Math.max(absDx, absDy) < SWIPE_THRESHOLD) return;

      let dir: Direction;
      if (absDx > absDy) {
        dir = dx > 0 ? "RIGHT" : "LEFT";
      } else {
        dir = dy > 0 ? "DOWN" : "UP";
      }

      onDirectionRef.current(dir);
      touchStart.current = null;
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Prevent page scroll while swiping on the canvas
      e.preventDefault();
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchend", handleTouchEnd);
      el.removeEventListener("touchmove", handleTouchMove);
    };
  }, [targetRef]);
}

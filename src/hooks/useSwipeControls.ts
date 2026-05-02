"use client";

import { useEffect, useRef } from "react";
import type { Direction } from "@/lib/types";

const SWIPE_THRESHOLD = 30; // minimum px to register a swipe

export function useSwipeControls(
  onDirection: (dir: Direction) => void,
  targetRef?: React.RefObject<HTMLElement | null>
) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onDirectionRef = useRef(onDirection);
  onDirectionRef.current = onDirection;

  useEffect(() => {
    const docEl = document.documentElement;
    const body = document.body;
    const target = targetRef?.current;

    const previousDocOverscroll = docEl.style.overscrollBehavior;
    const previousDocTouchAction = docEl.style.touchAction;
    const previousBodyOverscroll = body.style.overscrollBehavior;
    const previousBodyTouchAction = body.style.touchAction;
    const previousBodyOverflow = body.style.overflow;
    const previousTargetTouchAction = target?.style.touchAction;

    docEl.style.overscrollBehavior = "none";
    docEl.style.touchAction = "none";
    body.style.overscrollBehavior = "none";
    body.style.touchAction = "none";
    body.style.overflow = "hidden";
    if (target) target.style.touchAction = "none";

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
      // Prevent mobile webviews from treating downward swipes as pull-to-refresh.
      e.preventDefault();
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      docEl.style.overscrollBehavior = previousDocOverscroll;
      docEl.style.touchAction = previousDocTouchAction;
      body.style.overscrollBehavior = previousBodyOverscroll;
      body.style.touchAction = previousBodyTouchAction;
      body.style.overflow = previousBodyOverflow;
      if (target && previousTargetTouchAction !== undefined) {
        target.style.touchAction = previousTargetTouchAction;
      }
    };
  }, [targetRef]);
}

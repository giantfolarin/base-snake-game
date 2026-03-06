"use client";

import type { Direction } from "@/lib/types";

interface MobileControlsProps {
  onDirection: (dir: Direction) => void;
  disabled?: boolean;
}

function DPadButton({
  label,
  dir,
  onDirection,
  disabled,
  className,
}: {
  label: string;
  dir: Direction;
  onDirection: (dir: Direction) => void;
  disabled?: boolean;
  className?: string;
}) {
  const handlePress = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!disabled) onDirection(dir);
  };

  return (
    <button
      onTouchStart={handlePress}
      onMouseDown={handlePress}
      disabled={disabled}
      aria-label={`Move ${dir.toLowerCase()}`}
      className={`
        flex items-center justify-center
        w-14 h-14 rounded-xl
        bg-white/5 border border-white/10
        text-white/70 text-xl font-bold
        active:bg-white/15 active:scale-95
        transition-all duration-75 select-none
        disabled:opacity-30
        ${className ?? ""}
      `}
    >
      {label}
    </button>
  );
}

export function MobileControls({ onDirection, disabled }: MobileControlsProps) {
  return (
    <div className="flex flex-col items-center gap-1 mt-3" aria-label="D-pad controls">
      {/* Up */}
      <DPadButton label="▲" dir="UP" onDirection={onDirection} disabled={disabled} />

      {/* Left + Right */}
      <div className="flex items-center gap-1">
        <DPadButton label="◀" dir="LEFT" onDirection={onDirection} disabled={disabled} />
        {/* Center (empty spacer) */}
        <div className="w-14 h-14 rounded-xl bg-white/[0.02] border border-white/5 opacity-40" />
        <DPadButton label="▶" dir="RIGHT" onDirection={onDirection} disabled={disabled} />
      </div>

      {/* Down */}
      <DPadButton label="▼" dir="DOWN" onDirection={onDirection} disabled={disabled} />
    </div>
  );
}

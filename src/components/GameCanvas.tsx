"use client";

import { useEffect, useRef, useCallback } from "react";
import { CELL_SIZE, BOARD_LIGHT, BOARD_DARK } from "@/lib/constants";
import type { Direction, Position, SnakeGameState } from "@/lib/types";
import { useSwipeControls } from "@/hooks/useSwipeControls";

// ─── Drawing helpers ───────────────────────────────────────────────────────────

function drawBoard(ctx: CanvasRenderingContext2D, cols: number, rows: number) {
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      ctx.fillStyle = (c + r) % 2 === 0 ? BOARD_LIGHT : BOARD_DARK;
      ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
  }
}

function drawApple(ctx: CanvasRenderingContext2D, food: Position, time: number) {
  const cx = food.x * CELL_SIZE + CELL_SIZE / 2;
  const cy = food.y * CELL_SIZE + CELL_SIZE / 2;
  const r  = CELL_SIZE * 0.38;
  const pulse = 0.97 + Math.sin(time * 0.003) * 0.03;

  ctx.save();

  // Soft glow
  ctx.shadowColor = "rgba(180,0,0,0.45)";
  ctx.shadowBlur  = 8;

  // Apple body
  ctx.fillStyle = "#e8322a";
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.06, r * pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;

  // Highlight
  ctx.fillStyle = "rgba(255,255,255,0.42)";
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.25, cy - r * 0.18 + r * 0.06, r * 0.22, r * 0.17, -0.5, 0, Math.PI * 2);
  ctx.fill();

  // Stem
  ctx.strokeStyle = "#5d2d00";
  ctx.lineWidth   = 1.5;
  ctx.lineCap     = "round";
  ctx.beginPath();
  ctx.moveTo(cx + 1, cy - r * pulse + 2);
  ctx.quadraticCurveTo(cx + 4, cy - r * pulse - 3, cx + 3, cy - r * pulse - 6);
  ctx.stroke();

  // Leaf
  ctx.fillStyle = "#2a8a00";
  ctx.beginPath();
  ctx.ellipse(cx + 5, cy - r * pulse - 3, 5, 3, -0.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawObstacle(ctx: CanvasRenderingContext2D, pos: Position) {
  const x = pos.x * CELL_SIZE + 1;
  const y = pos.y * CELL_SIZE + 1;
  const s = CELL_SIZE - 2;

  // Base stone
  ctx.fillStyle = "#4a3728";
  ctx.fillRect(x, y, s, s);

  // Top-left highlight
  ctx.fillStyle = "#6b5040";
  ctx.fillRect(x + 1, y + 1, s - 2, 3);
  ctx.fillRect(x + 1, y + 1, 3, s - 2);

  // Bottom-right shadow
  ctx.fillStyle = "#2e211a";
  ctx.fillRect(x + 1, y + s - 3, s - 2, 2);
  ctx.fillRect(x + s - 3, y + 1, 2, s - 2);

  // Center cross texture
  ctx.fillStyle = "#3d2d20";
  const mid = Math.floor(s / 2);
  ctx.fillRect(x + mid - 1, y + 3, 2, s - 6);
  ctx.fillRect(x + 3, y + mid - 1, s - 6, 2);
}

function drawSnakeBody(ctx: CanvasRenderingContext2D, snake: Position[], time: number) {
  if (snake.length < 2) return;

  const baseHue = (time * 0.04) % 360;
  const R       = CELL_SIZE * 0.46;

  ctx.save();
  ctx.lineCap  = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = R * 2;

  // Draw tail → neck (tail first, head drawn on top separately)
  for (let i = snake.length - 1; i >= 1; i--) {
    const hue   = (baseHue + (snake.length - i) * 10) % 360;
    const color = `hsl(${hue}, 96%, 55%)`;

    const cx1 = snake[i].x * CELL_SIZE + CELL_SIZE / 2;
    const cy1 = snake[i].y * CELL_SIZE + CELL_SIZE / 2;
    const cx2 = snake[i - 1].x * CELL_SIZE + CELL_SIZE / 2;
    const cy2 = snake[i - 1].y * CELL_SIZE + CELL_SIZE / 2;

    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx1, cy1);
    ctx.lineTo(cx2, cy2);
    ctx.stroke();

    // Circle at joint fills corner gaps
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx1, cy1, R, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawHead(ctx: CanvasRenderingContext2D, pos: Position, dir: Direction) {
  const cx = pos.x * CELL_SIZE + CELL_SIZE / 2;
  const cy = pos.y * CELL_SIZE + CELL_SIZE / 2;
  const R  = CELL_SIZE * 0.47;

  ctx.save();

  // Head body (blue)
  ctx.fillStyle   = "#5aaeff";
  ctx.shadowColor = "rgba(80,150,255,0.5)";
  ctx.shadowBlur  = 10;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;

  // Highlight
  ctx.fillStyle = "rgba(255,255,255,0.32)";
  ctx.beginPath();
  ctx.ellipse(cx - R * 0.28, cy - R * 0.28, R * 0.34, R * 0.24, -0.5, 0, Math.PI * 2);
  ctx.fill();

  // Eye positions based on direction
  const eyeOff = CELL_SIZE * 0.15;
  const eyeFwd = CELL_SIZE * 0.19;
  const eyeR   = CELL_SIZE * 0.075;

  let e1: [number, number], e2: [number, number];
  switch (dir) {
    case "RIGHT": e1 = [cx + eyeFwd, cy - eyeOff]; e2 = [cx + eyeFwd, cy + eyeOff]; break;
    case "LEFT":  e1 = [cx - eyeFwd, cy - eyeOff]; e2 = [cx - eyeFwd, cy + eyeOff]; break;
    case "UP":    e1 = [cx - eyeOff, cy - eyeFwd]; e2 = [cx + eyeOff, cy - eyeFwd]; break;
    default:      e1 = [cx - eyeOff, cy + eyeFwd]; e2 = [cx + eyeOff, cy + eyeFwd]; break;
  }

  // Pupils
  ctx.fillStyle = "#1a1a40";
  for (const [ex, ey] of [e1, e2]) {
    ctx.beginPath();
    ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
    ctx.fill();
  }

  // Eye shine
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  for (const [ex, ey] of [e1, e2]) {
    ctx.beginPath();
    ctx.arc(ex - eyeR * 0.3, ey - eyeR * 0.3, eyeR * 0.38, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ─── Component ────────────────────────────────────────────────────────────────

interface GameCanvasProps {
  gameState: SnakeGameState;
  width:     number;
  height:    number;
  onDirection: (dir: Direction) => void;
}

export function GameCanvas({ gameState, width, height, onDirection }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const stateRef  = useRef(gameState);
  stateRef.current = gameState;

  useSwipeControls(onDirection, canvasRef as React.RefObject<HTMLElement | null>);

  const cols = Math.floor(width  / CELL_SIZE);
  const rows = Math.floor(height / CELL_SIZE);

  const render = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Scale canvas to device pixel ratio for crisp rendering
      const dpr   = Math.min(window.devicePixelRatio || 1, 3);
      const physW = Math.round(width  * dpr);
      const physH = Math.round(height * dpr);
      if (canvas.width !== physW || canvas.height !== physH) {
        canvas.width  = physW;
        canvas.height = physH;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const { snake, food, obstacles, direction } = stateRef.current;
      drawBoard(ctx, cols, rows);
      obstacles.forEach((obs) => drawObstacle(ctx, obs));
      drawApple(ctx, food, time);
      drawSnakeBody(ctx, snake, time);
      if (snake.length > 0) drawHead(ctx, snake[0], direction);

      rafRef.current = requestAnimationFrame(render);
    },
    [cols, rows, width, height]
  );

  useEffect(() => {
    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [render]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ width, height, display: "block" }}
      className="touch-none select-none"
    />
  );
}

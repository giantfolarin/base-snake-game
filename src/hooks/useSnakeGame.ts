"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { INITIAL_SPEED, MIN_SPEED, SPEED_DECREASE, INITIAL_SNAKE_LENGTH, OBSTACLE_COUNT } from "@/lib/constants";
import type { Direction, GameAction, Position, SnakeGameState } from "@/lib/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomFood(snake: Position[], obstacles: Position[], cols: number, rows: number): Position {
  if (cols <= 0 || rows <= 0) return { x: 0, y: 0 };

  const occupied = new Set([
    ...snake.map((s) => `${s.x},${s.y}`),
    ...obstacles.map((o) => `${o.x},${o.y}`),
  ]);
  const totalCells = cols * rows;
  if (occupied.size >= totalCells) return { x: 0, y: 0 };

  let pos: Position;
  do {
    pos = {
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows),
    };
  } while (occupied.has(`${pos.x},${pos.y}`));
  return pos;
}

function randomObstacles(
  snake: Position[],
  food: Position,
  cols: number,
  rows: number,
  count: number,
): Position[] {
  // Build occupied set + safe zone around snake head
  const occupied = new Set([
    ...snake.map((s) => `${s.x},${s.y}`),
    `${food.x},${food.y}`,
  ]);
  // Avoid placing obstacles adjacent to the starting snake
  const safeZone = new Set(
    snake.flatMap((s) => [
      `${s.x},${s.y}`,
      `${s.x + 1},${s.y}`,
      `${s.x - 1},${s.y}`,
      `${s.x},${s.y + 1}`,
      `${s.x},${s.y - 1}`,
    ]),
  );

  const obstacles: Position[] = [];
  let attempts = 0;
  while (obstacles.length < count && attempts < 2000) {
    attempts++;
    const pos: Position = {
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows),
    };
    const key = `${pos.x},${pos.y}`;
    if (!occupied.has(key) && !safeZone.has(key)) {
      obstacles.push(pos);
      occupied.add(key);
    }
  }
  return obstacles;
}

function buildInitialSnake(cols: number, rows: number): Position[] {
  const safeCols = Math.max(1, cols);
  const safeRows = Math.max(1, rows);
  const midY = Math.floor(safeRows / 2);
  const startX = Math.floor(safeCols / 2);
  return Array.from({ length: Math.min(INITIAL_SNAKE_LENGTH, safeCols) }, (_, i) => ({
    x: Math.max(0, startX - i),
    y: midY,
  }));
}

function isOpposite(a: Direction, b: Direction): boolean {
  return (
    (a === "UP" && b === "DOWN") ||
    (a === "DOWN" && b === "UP") ||
    (a === "LEFT" && b === "RIGHT") ||
    (a === "RIGHT" && b === "LEFT")
  );
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

function makeInitialState(cols: number, rows: number, initialHighScore = 0): SnakeGameState {
  const safeCols = Math.max(5, cols);
  const safeRows = Math.max(5, rows);
  const snake = buildInitialSnake(safeCols, safeRows);
  const obstacles = randomObstacles(snake, { x: -1, y: -1 }, safeCols, safeRows, OBSTACLE_COUNT);
  const food = randomFood(snake, obstacles, safeCols, safeRows);
  return {
    snake,
    food,
    obstacles,
    direction: "RIGHT",
    nextDirection: "RIGHT",
    score: 0,
    highScore: initialHighScore,
    gameState: "idle",
    speed: INITIAL_SPEED,
    gridCols: safeCols,
    gridRows: safeRows,
  };
}

function gameReducer(state: SnakeGameState, action: GameAction): SnakeGameState {
  switch (action.type) {
    case "START_GAME": {
      const { gridCols, gridRows } = action;
      return {
        ...makeInitialState(gridCols, gridRows, state.highScore),
        gameState: "playing",
      };
    }

    case "RESTART_GAME": {
      return {
        ...makeInitialState(state.gridCols, state.gridRows, state.highScore),
        gameState: "playing",
      };
    }

    case "PAUSE_GAME":
      if (state.gameState !== "playing") return state;
      return { ...state, gameState: "paused" };

    case "RESUME_GAME":
      if (state.gameState !== "paused") return state;
      return { ...state, gameState: "playing" };

    case "SET_DIRECTION": {
      if (state.gameState !== "playing") return state;
      if (isOpposite(action.direction, state.direction)) return state;
      return { ...state, nextDirection: action.direction };
    }

    case "TICK": {
      if (state.gameState !== "playing") return state;

      const dir = state.nextDirection;
      const head = state.snake[0];

      const delta: Record<Direction, Position> = {
        UP:    { x: 0,  y: -1 },
        DOWN:  { x: 0,  y: 1  },
        LEFT:  { x: -1, y: 0  },
        RIGHT: { x: 1,  y: 0  },
      };

      const newHead: Position = {
        x: head.x + delta[dir].x,
        y: head.y + delta[dir].y,
      };

      // Wall collision
      if (
        newHead.x < 0 ||
        newHead.x >= state.gridCols ||
        newHead.y < 0 ||
        newHead.y >= state.gridRows
      ) {
        return {
          ...state,
          gameState: "gameover",
          highScore: Math.max(state.score, state.highScore),
        };
      }

      // Self collision (skip last tail segment — it moves away this tick)
      const body = state.snake.slice(0, state.snake.length - 1);
      if (body.some((s) => s.x === newHead.x && s.y === newHead.y)) {
        return {
          ...state,
          gameState: "gameover",
          highScore: Math.max(state.score, state.highScore),
        };
      }

      // Obstacle collision
      if (state.obstacles.some((o) => o.x === newHead.x && o.y === newHead.y)) {
        return {
          ...state,
          gameState: "gameover",
          highScore: Math.max(state.score, state.highScore),
        };
      }

      const ateFood = newHead.x === state.food.x && newHead.y === state.food.y;
      const newSnake = ateFood
        ? [newHead, ...state.snake]
        : [newHead, ...state.snake.slice(0, -1)];

      const newScore = ateFood ? state.score + 1 : state.score;
      const newSpeed = ateFood
        ? Math.max(MIN_SPEED, state.speed - SPEED_DECREASE)
        : state.speed;
      const newFood = ateFood
        ? randomFood(newSnake, state.obstacles, state.gridCols, state.gridRows)
        : state.food;

      return {
        ...state,
        snake: newSnake,
        food: newFood,
        direction: dir,
        score: newScore,
        speed: newSpeed,
      };
    }

    default:
      return state;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSnakeGame(gridCols: number, gridRows: number, initialHighScore = 0) {
  const safeCols = Math.max(5, gridCols);
  const safeRows = Math.max(5, gridRows);

  const [state, dispatch] = useReducer(
    gameReducer,
    { gridCols: safeCols, gridRows: safeRows },
    ({ gridCols, gridRows }) => ({
      ...makeInitialState(gridCols, gridRows),
      highScore: initialHighScore,
    })
  );

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // ── Game loop ───────────────────────────────────────────────────────────────
  const stopLoop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startLoop = useCallback(
    (speed: number) => {
      stopLoop();
      intervalRef.current = setInterval(() => {
        dispatch({ type: "TICK" });
      }, speed);
    },
    [stopLoop]
  );

  useEffect(() => {
    if (state.gameState === "playing") {
      startLoop(state.speed);
    } else {
      stopLoop();
    }
    return stopLoop;
  }, [state.gameState, state.speed, startLoop, stopLoop]);

  // ── Keyboard controls ───────────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp:    "UP",
        ArrowDown:  "DOWN",
        ArrowLeft:  "LEFT",
        ArrowRight: "RIGHT",
        w: "UP",
        s: "DOWN",
        a: "LEFT",
        d: "RIGHT",
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        dispatch({ type: "SET_DIRECTION", direction: dir });
      }
      if (e.key === "Escape" || e.key === "p") {
        if (stateRef.current.gameState === "playing") {
          dispatch({ type: "PAUSE_GAME" });
        } else if (stateRef.current.gameState === "paused") {
          dispatch({ type: "RESUME_GAME" });
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // ── Public API ──────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    dispatch({ type: "START_GAME", gridCols: safeCols, gridRows: safeRows });
  }, [safeCols, safeRows]);

  const restartGame = useCallback(() => {
    dispatch({ type: "RESTART_GAME" });
  }, []);

  const setDirection = useCallback((dir: Direction) => {
    dispatch({ type: "SET_DIRECTION", direction: dir });
  }, []);

  const togglePause = useCallback(() => {
    if (stateRef.current.gameState === "playing") {
      dispatch({ type: "PAUSE_GAME" });
    } else if (stateRef.current.gameState === "paused") {
      dispatch({ type: "RESUME_GAME" });
    }
  }, []);

  return { state, startGame, restartGame, setDirection, togglePause };
}

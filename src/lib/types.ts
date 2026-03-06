export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

export type GameState = "idle" | "playing" | "paused" | "gameover";

export interface Position {
  x: number;
  y: number;
}

export interface SnakeGameState {
  snake: Position[];
  food: Position;
  obstacles: Position[];
  direction: Direction;
  nextDirection: Direction;
  score: number;
  highScore: number;
  gameState: GameState;
  speed: number;
  gridCols: number;
  gridRows: number;
}

export type GameAction =
  | { type: "START_GAME"; gridCols: number; gridRows: number }
  | { type: "RESTART_GAME" }
  | { type: "PAUSE_GAME" }
  | { type: "RESUME_GAME" }
  | { type: "SET_DIRECTION"; direction: Direction }
  | { type: "TICK" };

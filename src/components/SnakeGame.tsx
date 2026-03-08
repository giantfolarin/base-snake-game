"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { CELL_SIZE } from "@/lib/constants";
import { useSnakeGame } from "@/hooks/useSnakeGame";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useMusicPlayer } from "@/hooks/useMusicPlayer";
import { useSubmitScore } from "@/hooks/useSubmitScore";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { GameCanvas } from "./GameCanvas";
import { ScoreDisplay } from "./ScoreDisplay";
import { WalletButton, shortenAddress } from "./WalletButton";

// ─── Player name persistence (one name per wallet) ────────────────────────────

function getSavedName(walletAddress?: string): string {
  if (typeof window === "undefined") return "";
  const key = walletAddress ? `snake-name-${walletAddress.toLowerCase()}` : "snake-name-guest";
  return localStorage.getItem(key) ?? "";
}

function setSavedName(name: string, walletAddress?: string) {
  if (typeof window === "undefined") return;
  const key = walletAddress ? `snake-name-${walletAddress.toLowerCase()}` : "snake-name-guest";
  localStorage.setItem(key, name);
}

// ─── Leaderboard helpers ──────────────────────────────────────────────────────

type LeaderEntry = { name: string; score: number; walletAddress?: string };

function getLeaderboard(): LeaderEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("snake-lb") || "[]");
  } catch {
    return [];
  }
}

function saveScore(name: string, score: number, walletAddress?: string) {
  if (!name || score <= 0) return;
  const board = getLeaderboard();
  const existing = board.find((e) => e.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    if (score > existing.score) existing.score = score;
    if (walletAddress) existing.walletAddress = walletAddress;
  } else {
    board.push({ name, score, walletAddress });
  }
  board.sort((a, b) => b.score - a.score);
  try {
    localStorage.setItem("snake-lb", JSON.stringify(board.slice(0, 20)));
  } catch {}
}

function getPlayerBest(name: string): number {
  return (
    getLeaderboard().find((e) => e.name.toLowerCase() === name.toLowerCase())?.score ?? 0
  );
}

// ─── Screen types ─────────────────────────────────────────────────────────────

type Screen = "home" | "name-entry" | "game" | "settings" | "leaderboard" | "about";

// ─── Root component ───────────────────────────────────────────────────────────

export function SnakeGame() {
  const [screen, setScreen]       = useState<Screen>("home");
  const [playerName, setPlayerName] = useState("");
  const [soundOn, setSoundOn]     = useState(true);
  const [musicOn, setMusicOn]     = useState(true);
  const { address: walletAddress } = useAccount();

  // Load saved name on mount and when wallet connects
  useEffect(() => {
    const saved = getSavedName(walletAddress);
    if (saved) setPlayerName(saved);
  }, [walletAddress]);

  function handlePlay() {
    const saved = getSavedName(walletAddress);
    if (saved) {
      setPlayerName(saved);
      setScreen("game");
    } else {
      setScreen("name-entry");
    }
  }

  function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({ title: "Snake", text: "I just played Snake on Base! 🐍", url: window.location.href })
        .catch(() => {});
    }
  }

  if (screen === "home") {
    return (
      <HomeScreen
        onPlay={handlePlay}
        onSettings={() => setScreen("settings")}
        onLeaderboard={() => setScreen("leaderboard")}
        onAbout={() => setScreen("about")}
      />
    );
  }

  if (screen === "name-entry") {
    return (
      <NameEntryScreen
        onConfirm={(name) => { setSavedName(name, walletAddress); setPlayerName(name); setScreen("game"); }}
        onBack={() => setScreen("home")}
      />
    );
  }

  if (screen === "settings") {
    return (
      <SettingsScreen
        soundOn={soundOn}
        onToggleSound={() => setSoundOn((s) => !s)}
        musicOn={musicOn}
        onToggleMusic={() => setMusicOn((m) => !m)}
        onBack={() => setScreen("home")}
      />
    );
  }

  if (screen === "leaderboard") {
    return <LeaderboardScreen onBack={() => setScreen("home")} />;
  }

  if (screen === "about") {
    return <AboutScreen onBack={() => setScreen("home")} />;
  }

  // "game"
  return (
    <GameContent
      playerName={playerName}
      walletAddress={walletAddress}
      soundOn={soundOn}
      musicOn={musicOn}
      onSoundToggle={() => { setSoundOn((s) => !s); setMusicOn((m) => !m); }}
      onShare={handleShare}
      onClose={() => setScreen("home")}
    />
  );
}

// ─── Shared pixel decoration ──────────────────────────────────────────────────

function PixelDecor({
  style,
  cols,
  rows,
}: {
  style: React.CSSProperties;
  cols: number;
  rows: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        ...style,
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 6px)`,
        gap: 2,
        opacity: 0.45,
        pointerEvents: "none",
      }}
    >
      {Array.from({ length: cols * rows }).map((_, i) => (
        <div key={i} style={{ width: 6, height: 6, background: "#1a3d05" }} />
      ))}
    </div>
  );
}

// ─── Shared menu button ───────────────────────────────────────────────────────

function MenuBtn({
  onClick,
  children,
  primary,
  icon,
}: {
  onClick: () => void;
  children: React.ReactNode;
  primary?: boolean;
  icon?: string;
}) {
  const shadow = primary ? "0 4px 0 #0d1203" : "0 4px 0 #1a3d05";
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        height: 54,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        fontFamily: "var(--font-pixel), monospace",
        fontSize: "clamp(9px, 2.5vw, 12px)",
        letterSpacing: 2,
        background: primary ? "#141e04" : "rgba(200,225,155,0.88)",
        color: primary ? "#84c234" : "#1a2006",
        border: primary ? "3px solid #84c234" : "3px solid #1a3d05",
        borderRadius: 4,
        cursor: "pointer",
        boxShadow: shadow,
        transition: "transform 0.07s, box-shadow 0.07s",
      }}
      onPointerDown={(e) => {
        e.currentTarget.style.transform = "translateY(4px)";
        e.currentTarget.style.boxShadow = "none";
      }}
      onPointerUp={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = shadow;
      }}
      onPointerLeave={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = shadow;
      }}
    >
      {icon && <span style={{ fontSize: 17, lineHeight: 1 }}>{icon}</span>}
      {children}
    </button>
  );
}

// ─── Background wrapper ───────────────────────────────────────────────────────

function GreenBg({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        width: "100vw",
        height: "100dvh",
        background: "#84c234",
        backgroundImage: [
          "linear-gradient(to right, rgba(0,50,0,0.13) 1px, transparent 1px)",
          "linear-gradient(to bottom, rgba(0,50,0,0.13) 1px, transparent 1px)",
        ].join(","),
        backgroundSize: "24px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Animated background snake ────────────────────────────────────────────────

function HomeSnakeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === "undefined") return;

    const CELL = 18;
    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.width  = w;
    canvas.height = h;

    let cols = Math.floor(w / CELL);
    let rows = Math.floor(h / CELL);

    // Direction: right
    let dir = { x: 1, y: 0 };
    let hue = 120;
    let stepsSinceTurn = 0;
    let nextTurnAt = 10 + Math.floor(Math.random() * 8);

    // Build initial snake body going left from a starting point
    const startX = Math.min(cols - 3, Math.floor(cols / 2));
    const startY = Math.floor(rows / 2);
    const snake: { x: number; y: number }[] = [];
    for (let i = 0; i < 30; i++) {
      snake.push({ x: Math.max(2, startX - i), y: startY });
    }

    // Clockwise: (x,y) -> (-y, x)  |  Counter-clockwise: (x,y) -> (y, -x)
    function turnCW()  { dir = { x: -dir.y, y:  dir.x }; }
    function turnCCW() { dir = { x:  dir.y, y: -dir.x }; }

    function valid(dx: number, dy: number) {
      const nx = snake[0].x + dx;
      const ny = snake[0].y + dy;
      return nx >= 2 && nx < cols - 2 && ny >= 2 && ny < rows - 2;
    }

    function tick() {
      stepsSinceTurn++;
      const needsTurn = !valid(dir.x, dir.y) || stepsSinceTurn >= nextTurnAt;

      if (needsTurn) {
        const savedDir = { ...dir };
        const cw = Math.random() > 0.5;
        if (cw) turnCW(); else turnCCW();

        if (!valid(dir.x, dir.y)) {
          dir = savedDir;
          if (cw) turnCCW(); else turnCW();
          if (!valid(dir.x, dir.y)) {
            dir = { x: -savedDir.x, y: -savedDir.y };
          }
        }
        stepsSinceTurn = 0;
        nextTurnAt = 8 + Math.floor(Math.random() * 10);
      }

      const head = snake[0];
      snake.unshift({ x: head.x + dir.x, y: head.y + dir.y });
      snake.pop();
      hue = (hue + 2.5) % 360;
    }

    function rrect(
      ctx: CanvasRenderingContext2D,
      x: number, y: number, size: number, r: number,
    ) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + size - r, y);
      ctx.quadraticCurveTo(x + size, y, x + size, y + r);
      ctx.lineTo(x + size, y + size - r);
      ctx.quadraticCurveTo(x + size, y + size, x + size - r, y + size);
      ctx.lineTo(x + r, y + size);
      ctx.quadraticCurveTo(x, y + size, x, y + size - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }

    function draw() {
      const ctx = canvas!.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);

      const pad  = 2;
      const size = CELL - pad * 2;
      const r    = size * 0.38;

      snake.forEach((seg, i) => {
        const color =
          i === 0
            ? "#5aaeff"
            : `hsl(${(hue - i * 7 + 720) % 360}, 96%, 55%)`;
        ctx.fillStyle = color;
        rrect(ctx, seg.x * CELL + pad, seg.y * CELL + pad, size, r);
        ctx.fill();

        // Eyes on head
        if (i === 0) {
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          const cx = seg.x * CELL + CELL / 2;
          const cy = seg.y * CELL + CELL / 2;
          const ex = dir.y * 4;
          const ey = dir.x * 4;
          ctx.beginPath();
          ctx.arc(cx + dir.x * 2 + ex, cy + dir.y * 2 + ey, 2.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(cx + dir.x * 2 - ex, cy + dir.y * 2 - ey, 2.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#1a2006";
          ctx.beginPath();
          ctx.arc(cx + dir.x * 2.8 + ex * 0.6, cy + dir.y * 2.8 + ey * 0.6, 1.1, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(cx + dir.x * 2.8 - ex * 0.6, cy + dir.y * 2.8 - ey * 0.6, 1.1, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    let animId: number;
    let lastTick = 0;
    const SPEED = 105;

    function loop(ts: number) {
      animId = requestAnimationFrame(loop);
      if (ts - lastTick >= SPEED) {
        tick();
        lastTick = ts;
      }
      draw();
    }

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        opacity: 0.55,
      }}
    />
  );
}

// ─── Screen 0: Wallet Connect ─────────────────────────────────────────────────

function WalletConnectScreen({ onContinue }: { onContinue: () => void }) {
  const { isConnected, address } = useAccount();

  return (
    <GreenBg>
      <div
        style={{
          width: "min(90vw, 360px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        {/* Title */}
        <div
          style={{
            fontFamily: "var(--font-pixel), monospace",
            fontSize: "clamp(38px, 12vw, 60px)",
            color: "#1a2006",
            letterSpacing: "clamp(3px, 1vw, 8px)",
            textShadow: "3px 3px 0 rgba(0,0,0,0.22)",
            animation: "pixelPop 0.4s ease both",
            userSelect: "none",
            lineHeight: 1,
            marginBottom: 2,
          }}
        >
          SNAKE
        </div>

        {/* Divider */}
        <div style={{ width: "100%", height: 2, background: "#1a3d05", opacity: 0.3, borderRadius: 1 }} />

        {/* Info text */}
        <div
          style={{
            fontFamily: "var(--font-pixel), monospace",
            fontSize: "clamp(7px, 1.9vw, 9px)",
            color: "#1a3d05",
            letterSpacing: 1,
            lineHeight: 2,
            textAlign: "center",
            padding: "0 4px",
          }}
        >
          {isConnected
            ? "WALLET CONNECTED. SCORES\nWILL BE SAVED ON-CHAIN."
            : "CONNECT YOUR WALLET TO\nSAVE SCORES ON BASE."}
        </div>

        {/* Wallet section */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
          <WalletButton />
        </div>

        {/* Divider */}
        <div style={{ width: "100%", height: 2, background: "#1a3d05", opacity: 0.3, borderRadius: 1 }} />

        {/* Continue */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
          <MenuBtn onClick={onContinue} primary icon="🎮">
            {isConnected ? `PLAY  (${address ? shortenAddress(address) : ""})` : "PLAY GAME"}
          </MenuBtn>
          {!isConnected && (
            <MenuBtn onClick={onContinue}>SKIP — PLAY OFFLINE</MenuBtn>
          )}
        </div>
      </div>
    </GreenBg>
  );
}

// ─── Screen 1: Home ───────────────────────────────────────────────────────────

function HomeScreen({
  onPlay,
  onSettings,
  onLeaderboard,
  onAbout,
}: {
  onPlay: () => void;
  onSettings: () => void;
  onLeaderboard: () => void;
  onAbout: () => void;
}) {
  return (
    <GreenBg>
      {/* Animated background snake */}
      <HomeSnakeCanvas />

      {/* Corner pixel decorations */}
      <PixelDecor style={{ top: "5%", left: "3%" }}  cols={6} rows={3} />
      <PixelDecor style={{ top: "5%", right: "3%" }} cols={6} rows={3} />
      <PixelDecor style={{ top: "10%", left: "2%" }} cols={4} rows={2} />
      <PixelDecor style={{ bottom: "18%", left: "2%" }}  cols={3} rows={7} />
      <PixelDecor style={{ bottom: "8%",  right: "3%" }} cols={6} rows={3} />
      {/* Side cross marks */}
      <PixelDecor style={{ top: "42%", left: "4%" }}  cols={3} rows={3} />
      <PixelDecor style={{ top: "42%", right: "4%" }} cols={3} rows={3} />

      <div
        style={{
          width: "min(90vw, 400px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
        }}
      >
        {/* SNAKE title */}
        <div
          style={{
            fontFamily: "var(--font-pixel), monospace",
            fontSize: "clamp(44px, 14vw, 70px)",
            color: "#1a2006",
            letterSpacing: "clamp(4px, 1.5vw, 10px)",
            textShadow: "3px 3px 0 rgba(0,0,0,0.22), 6px 6px 0 rgba(0,0,0,0.08)",
            animation: "pixelPop 0.45s ease both",
            userSelect: "none",
            lineHeight: 1,
          }}
        >
          SNAKE
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontFamily: "var(--font-pixel), monospace",
            fontSize: "clamp(8px, 2.2vw, 11px)",
            color: "#1a3d05",
            letterSpacing: "clamp(2px, 0.8vw, 5px)",
            animation: "fadeIn 0.4s ease 0.1s both",
            userSelect: "none",
            marginBottom: 20,
          }}
        >
          &apos;RETRO CLASSIC
        </div>

        {/* Menu buttons */}
        <MenuBtn onClick={onPlay} primary icon="🎮">PLAY GAME</MenuBtn>
        <MenuBtn onClick={onSettings} icon="⚙">SETTINGS</MenuBtn>
        <MenuBtn onClick={onLeaderboard} icon="🏆">LEADERBOARD</MenuBtn>
        <MenuBtn onClick={onAbout} icon="ℹ">ABOUT</MenuBtn>
      </div>
    </GreenBg>
  );
}

// ─── Screen 2: Name Entry ─────────────────────────────────────────────────────

function NameEntryScreen({
  onConfirm,
  onBack,
}: {
  onConfirm: (name: string) => void;
  onBack: () => void;
}) {
  const [name, setName]   = useState("");
  const inputRef          = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = () => { if (name.trim()) onConfirm(name.trim()); };

  return (
    <GreenBg>
      <div
        style={{
          width: "min(90vw, 360px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        {/* Title */}
        <div
          style={{
            fontFamily: "var(--font-pixel), monospace",
            fontSize: "clamp(13px, 3.8vw, 18px)",
            color: "#1a2006",
            letterSpacing: 3,
            textShadow: "2px 2px 0 rgba(0,0,0,0.2)",
            marginBottom: 8,
            animation: "pixelPop 0.35s ease both",
          }}
        >
          ENTER NAME
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 12).toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="YOUR NAME"
          maxLength={12}
          style={{
            width: "100%",
            height: 54,
            fontFamily: "var(--font-pixel), monospace",
            fontSize: "clamp(11px, 3vw, 14px)",
            letterSpacing: 3,
            textAlign: "center",
            background: "#141e04",
            color: "#84c234",
            border: "3px solid #84c234",
            borderRadius: 4,
            outline: "none",
            padding: "0 12px",
            caretColor: "#84c234",
          }}
        />

        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
          <MenuBtn onClick={submit} primary icon="🎮">PLAY GAME</MenuBtn>
          <MenuBtn onClick={onBack}>BACK</MenuBtn>
        </div>
      </div>
    </GreenBg>
  );
}

// ─── Screen 3: Settings ───────────────────────────────────────────────────────

function SettingsScreen({
  soundOn,
  onToggleSound,
  musicOn,
  onToggleMusic,
  onBack,
}: {
  soundOn: boolean;
  onToggleSound: () => void;
  musicOn: boolean;
  onToggleMusic: () => void;
  onBack: () => void;
}) {
  return (
    <GreenBg>
      <div
        style={{
          width: "min(90vw, 360px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-pixel), monospace",
            fontSize: "clamp(13px, 3.8vw, 18px)",
            color: "#1a2006",
            letterSpacing: 3,
            textShadow: "2px 2px 0 rgba(0,0,0,0.2)",
            marginBottom: 6,
            animation: "pixelPop 0.35s ease both",
          }}
        >
          SETTINGS
        </div>

        <SettingRow label={`${soundOn ? "🔊" : "🔇"} SOUND`} value={soundOn} onToggle={onToggleSound} />
        <SettingRow label={`${musicOn ? "🎵" : "🎵"} MUSIC`} value={musicOn} onToggle={onToggleMusic} />

        <div style={{ width: "100%", marginTop: 6 }}>
          <MenuBtn onClick={onBack}>BACK</MenuBtn>
        </div>
      </div>
    </GreenBg>
  );
}

function SettingRow({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 18px",
        background: "rgba(200,225,155,0.88)",
        border: "3px solid #1a3d05",
        borderRadius: 4,
        boxShadow: "0 4px 0 #1a3d05",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-pixel), monospace",
          fontSize: "clamp(9px, 2.5vw, 12px)",
          color: "#1a2006",
          letterSpacing: 2,
        }}
      >
        {label}
      </span>
      <button
        onClick={onToggle}
        style={{
          fontFamily: "var(--font-pixel), monospace",
          fontSize: "clamp(9px, 2.5vw, 12px)",
          letterSpacing: 2,
          padding: "8px 16px",
          background: value ? "#1a3d05" : "rgba(0,0,0,0.15)",
          color: value ? "#84c234" : "#1a2006",
          border: "2px solid #1a3d05",
          borderRadius: 4,
          cursor: "pointer",
        }}
      >
        {value ? "ON" : "OFF"}
      </button>
    </div>
  );
}

// ─── Screen 4: About ─────────────────────────────────────────────────────────

function AboutScreen({ onBack }: { onBack: () => void }) {
  return (
    <GreenBg>
      <div
        style={{
          width: "min(90vw, 380px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        {/* Title */}
        <div
          style={{
            fontFamily: "var(--font-pixel), monospace",
            fontSize: "clamp(13px, 3.8vw, 18px)",
            color: "#1a2006",
            letterSpacing: 3,
            textShadow: "2px 2px 0 rgba(0,0,0,0.2)",
            marginBottom: 4,
            animation: "pixelPop 0.35s ease both",
          }}
        >
          ABOUT
        </div>

        {/* Card */}
        <div
          style={{
            width: "100%",
            background: "rgba(200,225,155,0.88)",
            border: "3px solid #1a3d05",
            borderRadius: 4,
            boxShadow: "0 4px 0 #1a3d05",
            padding: "20px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            animation: "slideUp 0.35s ease 0.05s both",
          }}
        >
          {/* Game title */}
          <div
            style={{
              fontFamily: "var(--font-pixel), monospace",
              fontSize: "clamp(14px, 4vw, 20px)",
              color: "#1a2006",
              letterSpacing: 4,
              textAlign: "center",
            }}
          >
            🐍 SNAKE
          </div>

          <div
            style={{
              height: 2,
              background: "#1a3d05",
              borderRadius: 1,
              opacity: 0.35,
            }}
          />

          {[
            "Classic retro snake: eat apples, dodge obstacles, and climb the leaderboard.",
            "Swipe or use arrow keys to move. The more apple you eat, the more sped up the game becomes. Hit a wall, block, or yourself and it's game over.",
            "Your best score is saved to the leaderboard by name.",
          ].map((line, i) => (
            <p
              key={i}
              style={{
                fontFamily: "var(--font-pixel), monospace",
                fontSize: "clamp(7px, 1.9vw, 9px)",
                color: "#1a2006",
                lineHeight: 2,
                letterSpacing: 1,
                margin: 0,
                textAlign: "center",
              }}
            >
              {line}
            </p>
          ))}

          <div
            style={{
              height: 2,
              background: "#1a3d05",
              borderRadius: 1,
              opacity: 0.35,
            }}
          />

          {/* Built by */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "var(--font-pixel), monospace",
                fontSize: "clamp(7px, 1.9vw, 9px)",
                color: "#1a3d05",
                letterSpacing: 1,
                marginBottom: 8,
                opacity: 0.75,
              }}
            >
              BUILT BY
            </div>
            <a
              href="https://x.com/InvestorFola"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "var(--font-pixel), monospace",
                fontSize: "clamp(10px, 2.8vw, 13px)",
                letterSpacing: 2,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#1a2006",
                color: "#84c234",
                padding: "8px 16px",
                borderRadius: 4,
                border: "2px solid #84c234",
              }}
            >
              𝕏 @Bigfola
            </a>
          </div>
        </div>

        <div style={{ width: "100%" }}>
          <MenuBtn onClick={onBack}>BACK</MenuBtn>
        </div>
      </div>
    </GreenBg>
  );
}

// ─── Screen 5: Leaderboard ───────────────────────────────────────────────────

function LeaderboardScreen({ onBack }: { onBack: () => void }) {
  const { entries: onChainEntries, isLoading, error, refetch } = useLeaderboard();

  // Fall back to localStorage if on-chain has nothing yet
  const [localEntries, setLocalEntries] = useState<LeaderEntry[]>([]);
  useEffect(() => { setLocalEntries(getLeaderboard()); }, []);

  const useOnChain = !isLoading && !error && onChainEntries.length > 0;
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <GreenBg>
      <div
        style={{
          width: "min(90vw, 380px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          maxHeight: "90dvh",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-pixel), monospace",
            fontSize: "clamp(13px, 3.8vw, 18px)",
            color: "#1a2006",
            letterSpacing: 3,
            textShadow: "2px 2px 0 rgba(0,0,0,0.2)",
            marginBottom: 4,
            animation: "pixelPop 0.35s ease both",
          }}
        >
          LEADERBOARD
        </div>

        {/* Chain badge */}
        <div
          style={{
            fontFamily: "var(--font-pixel), monospace",
            fontSize: "clamp(6px, 1.6vw, 8px)",
            color: useOnChain ? "#1a5c30" : "#2a6010",
            letterSpacing: 1,
            opacity: 0.75,
            marginTop: -6,
          }}
        >
          {isLoading ? "LOADING CHAIN..." : useOnChain ? "⛓ ON-CHAIN" : "LOCAL SCORES"}
        </div>

        {/* List */}
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            overflowY: "auto",
            maxHeight: "55dvh",
          }}
        >
          {isLoading ? (
            <div
              style={{
                fontFamily: "var(--font-pixel), monospace",
                fontSize: "clamp(8px, 2.2vw, 11px)",
                color: "#1a3d05",
                textAlign: "center",
                padding: "24px 0",
                opacity: 0.7,
              }}
            >
              LOADING...
            </div>
          ) : useOnChain ? (
            onChainEntries.map((e, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 14px",
                  background: i % 2 === 0 ? "rgba(200,225,155,0.88)" : "rgba(180,210,130,0.75)",
                  border: "2px solid #1a3d05",
                  borderRadius: 4,
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 16, width: 24, textAlign: "center", flexShrink: 0 }}>
                  {medals[i] ?? `${i + 1}.`}
                </span>
                <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", gap: 2 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-pixel), monospace",
                      fontSize: "clamp(8px, 2.2vw, 11px)",
                      color: "#1a2006",
                      letterSpacing: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {e.name || "ANON"}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-pixel), monospace",
                      fontSize: "clamp(6px, 1.6vw, 8px)",
                      color: "#2a6010",
                      letterSpacing: 0.5,
                    }}
                  >
                    {shortenAddress(e.player)}
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-pixel), monospace",
                    fontSize: "clamp(10px, 2.8vw, 14px)",
                    color: i === 0 ? "#c87800" : "#1a2006",
                    fontWeight: "bold",
                    flexShrink: 0,
                  }}
                >
                  {e.score}
                </span>
              </div>
            ))
          ) : localEntries.length === 0 ? (
            <div
              style={{
                fontFamily: "var(--font-pixel), monospace",
                fontSize: "clamp(8px, 2.2vw, 11px)",
                color: "#1a3d05",
                textAlign: "center",
                padding: "24px 0",
                opacity: 0.7,
              }}
            >
              NO SCORES YET
            </div>
          ) : (
            localEntries.slice(0, 10).map((e, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 14px",
                  background: i % 2 === 0 ? "rgba(200,225,155,0.88)" : "rgba(180,210,130,0.75)",
                  border: "2px solid #1a3d05",
                  borderRadius: 4,
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 16, width: 24, textAlign: "center", flexShrink: 0 }}>
                  {medals[i] ?? `${i + 1}.`}
                </span>
                <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", gap: 2 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-pixel), monospace",
                      fontSize: "clamp(8px, 2.2vw, 11px)",
                      color: "#1a2006",
                      letterSpacing: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {e.name}
                  </span>
                  {e.walletAddress && (
                    <span
                      style={{
                        fontFamily: "var(--font-pixel), monospace",
                        fontSize: "clamp(6px, 1.6vw, 8px)",
                        color: "#2a6010",
                        letterSpacing: 0.5,
                      }}
                    >
                      {shortenAddress(e.walletAddress)}
                    </span>
                  )}
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-pixel), monospace",
                    fontSize: "clamp(10px, 2.8vw, 14px)",
                    color: i === 0 ? "#c87800" : "#1a2006",
                    fontWeight: "bold",
                    flexShrink: 0,
                  }}
                >
                  {e.score}
                </span>
              </div>
            ))
          )}
        </div>

        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          {error && (
            <button
              onClick={() => refetch()}
              style={{
                fontFamily: "var(--font-pixel), monospace",
                fontSize: "clamp(7px, 1.9vw, 9px)",
                letterSpacing: 1,
                padding: "8px 0",
                background: "transparent",
                color: "#1a3d05",
                border: "2px solid #1a3d05",
                borderRadius: 4,
                cursor: "pointer",
                opacity: 0.7,
              }}
            >
              RETRY CHAIN
            </button>
          )}
          <MenuBtn onClick={onBack}>BACK</MenuBtn>
        </div>
      </div>
    </GreenBg>
  );
}

// ─── Screen 5: Game Content ───────────────────────────────────────────────────

function GameContent({
  playerName,
  walletAddress,
  soundOn,
  musicOn,
  onSoundToggle,
  onShare,
  onClose,
}: {
  playerName: string;
  walletAddress?: string;
  soundOn: boolean;
  musicOn: boolean;
  onSoundToggle: () => void;
  onShare: () => void;
  onClose: () => void;
}) {
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const [grid, setGrid]             = useState({ cols: 0, rows: 0 });
  const startedRef                  = useRef(false);
  const savedRef                    = useRef(false);
  const gameAreaRef                 = useRef<HTMLDivElement>(null);
  const { submitScore: submitOnChain, isPending: savePending, isSuccess: saveSuccess } = useSubmitScore();

  // Measure the actual game-area element so the canvas fills it exactly.
  // Freeze once the game starts — grid must never change mid-game.
  useEffect(() => {
    function measure() {
      if (startedRef.current) return;
      const el = gameAreaRef.current;
      if (!el) return;
      const { width, height } = el.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      const cols = Math.max(10, Math.floor(width  / CELL_SIZE));
      const rows = Math.max(8,  Math.floor(height / CELL_SIZE));
      setCanvasSize({ w: cols * CELL_SIZE, h: rows * CELL_SIZE });
      setGrid({ cols, rows });
    }
    const ro = new ResizeObserver(measure);
    if (gameAreaRef.current) ro.observe(gameAreaRef.current);
    measure();
    return () => ro.disconnect();
  }, []);

  const initialHighScore = getPlayerBest(playerName);
  const { playEat, playGameOver } = useSoundEffects(soundOn);

  const { state, startGame, restartGame, setDirection, togglePause } = useSnakeGame(
    grid.cols,
    grid.rows,
    initialHighScore,
  );

  useMusicPlayer(musicOn, state.gameState);

  // Auto-start when grid is ready
  useEffect(() => {
    if (grid.cols > 0 && grid.rows > 0 && !startedRef.current) {
      startedRef.current = true;
      startGame();
    }
  }, [grid.cols, grid.rows, startGame]);

  // Save score locally on game over + play sound
  const prevGameStateRef = useRef<string>("");
  useEffect(() => {
    if (state.gameState === "gameover" && !savedRef.current) {
      savedRef.current = true;
      saveScore(playerName, state.score, walletAddress);
      if (prevGameStateRef.current === "playing") playGameOver();
    }
    if (state.gameState !== "gameover") savedRef.current = false;
    prevGameStateRef.current = state.gameState;
  }, [state.gameState, state.score, playerName, walletAddress, playGameOver]);

  // Play eat sound when score increases
  const prevScoreRef = useRef(0);
  useEffect(() => {
    if (state.score > prevScoreRef.current) playEat();
    prevScoreRef.current = state.score;
  }, [state.score, playEat]);

  const isGameOver = state.gameState === "gameover";
  const isPaused   = state.gameState === "paused";

  return (
    <div
      style={{
        width: "100vw",
        height: "100dvh",
        background: "#84c234",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <ScoreDisplay
        score={state.score}
        highScore={state.highScore}
        soundOn={soundOn}
        isPaused={isPaused}
        onPause={togglePause}
        onSoundToggle={onSoundToggle}
        onShare={onShare}
        onClose={onClose}
      />

      {/* Game area — ref measured so canvas fills portrait height exactly */}
      <div
        ref={gameAreaRef}
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {canvasSize.w > 0 && grid.cols > 0 && (
          <div
            style={{
              border: "4px solid #2a5c05",
              borderRadius: 4,
              overflow: "hidden",
              boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
              lineHeight: 0,
            }}
          >
            <GameCanvas
              gameState={state}
              width={canvasSize.w}
              height={canvasSize.h}
              onDirection={setDirection}
            />
          </div>
        )}
      </div>

      {isGameOver && (
        <GameOverOverlay
          score={state.score}
          highScore={state.highScore}
          playerName={playerName}
          onSaveScore={walletAddress && state.score > 0 ? () => submitOnChain(playerName, state.score) : undefined}
          savePending={savePending}
          saveSuccess={saveSuccess}
          onRestart={restartGame}
          onSelect={onClose}
        />
      )}
      {isPaused && <PauseOverlay onResume={togglePause} />}
    </div>
  );
}

// ─── Game Over overlay ────────────────────────────────────────────────────────

function GameOverOverlay({
  score,
  highScore,
  playerName,
  onSaveScore,
  savePending,
  saveSuccess,
  onRestart,
  onSelect,
}: {
  score:         number;
  highScore:     number;
  playerName:    string;
  onSaveScore?:  () => void;
  savePending?:  boolean;
  saveSuccess?:  boolean;
  onRestart:     () => void;
  onSelect:      () => void;
}) {
  const isNewBest = score > 0 && score === highScore;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 30,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.82)",
        backdropFilter: "blur(4px)",
        animation: "fadeIn 0.25s ease both",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-pixel), monospace",
          fontSize: "clamp(28px, 8.5vw, 52px)",
          lineHeight: 1.15,
          textAlign: "center",
          background: "linear-gradient(to bottom, #FFE000 0%, #FF8C00 55%, #FF2200 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          letterSpacing: "2px",
          animation: "pixelPop 0.4s ease both",
          filter: "drop-shadow(0 4px 0px rgba(0,0,0,0.5))",
        }}
      >
        GAME<br />OVER
      </div>

      {playerName && (
        <div
          style={{
            marginTop: 10,
            fontFamily: "var(--font-pixel), monospace",
            fontSize: "clamp(8px, 2.2vw, 11px)",
            color: "rgba(255,255,255,0.55)",
            letterSpacing: 2,
          }}
        >
          {playerName}
        </div>
      )}

      {isNewBest && (
        <div
          style={{
            marginTop: 8,
            fontFamily: "var(--font-pixel), monospace",
            fontSize: "clamp(9px, 2.5vw, 13px)",
            color: "#FFD700",
            animation: "fadeIn 0.5s ease 0.2s both",
          }}
        >
          NEW BEST!
        </div>
      )}

      <div
        style={{
          marginTop: 22,
          display: "flex",
          gap: 36,
          animation: "slideUp 0.4s ease 0.15s both",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontFamily: "var(--font-pixel), monospace",
              fontSize: "clamp(8px, 2.2vw, 11px)",
              color: "rgba(255,255,255,0.45)",
              letterSpacing: 2,
            }}
          >
            SCORE
          </span>
          <span
            style={{
              fontFamily: "var(--font-pixel), monospace",
              fontSize: "clamp(22px, 6.5vw, 36px)",
              color: "#fff",
              lineHeight: 1,
            }}
          >
            {score}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontFamily: "var(--font-pixel), monospace",
              fontSize: "clamp(8px, 2.2vw, 11px)",
              color: "rgba(255,255,255,0.45)",
              letterSpacing: 2,
            }}
          >
            BEST
          </span>
          <span
            style={{
              fontFamily: "var(--font-pixel), monospace",
              fontSize: "clamp(22px, 6.5vw, 36px)",
              color: "#FFD700",
              lineHeight: 1,
            }}
          >
            {highScore}
          </span>
        </div>
      </div>

      {/* On-chain save button */}
      {onSaveScore && (
        <button
          onClick={saveSuccess ? undefined : onSaveScore}
          disabled={savePending || saveSuccess}
          style={{
            marginTop: 18,
            fontFamily: "var(--font-pixel), monospace",
            fontSize: "clamp(8px, 2.2vw, 11px)",
            letterSpacing: 2,
            padding: "10px 20px",
            background: saveSuccess ? "rgba(132,194,52,0.2)" : "rgba(255,215,0,0.15)",
            color: saveSuccess ? "#84c234" : "#FFD700",
            border: `2px solid ${saveSuccess ? "#84c234" : "#FFD700"}`,
            borderRadius: 6,
            cursor: savePending || saveSuccess ? "default" : "pointer",
            opacity: savePending ? 0.6 : 1,
            animation: "slideUp 0.4s ease 0.2s both",
            minWidth: 200,
          }}
        >
          {saveSuccess ? "⛓ SAVED ON-CHAIN ✓" : savePending ? "SAVING..." : "⛓ SAVE SCORE ON-CHAIN"}
        </button>
      )}

      <div
        style={{
          marginTop: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          animation: "slideUp 0.4s ease 0.25s both",
        }}
      >
        <PixelBtn onClick={onRestart} primary>PLAY AGAIN</PixelBtn>
        <PixelBtn onClick={onSelect}>GO HOME</PixelBtn>
      </div>
    </div>
  );
}

function PauseOverlay({ onResume }: { onResume: () => void }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 30,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(4px)",
        animation: "fadeIn 0.2s ease both",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-pixel), monospace",
          fontSize: "clamp(18px, 5vw, 28px)",
          color: "#fff",
          letterSpacing: 3,
          marginBottom: 28,
        }}
      >
        PAUSED
      </div>
      <PixelBtn onClick={onResume} primary>RESUME</PixelBtn>
    </div>
  );
}

// ─── Shared pixel button ──────────────────────────────────────────────────────

function PixelBtn({
  onClick,
  children,
  primary,
}: {
  onClick: () => void;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "var(--font-pixel), monospace",
        fontSize: "clamp(9px, 2.6vw, 13px)",
        letterSpacing: 2,
        padding: "14px 28px",
        background: primary ? "#84c234" : "rgba(255,255,255,0.08)",
        color: primary ? "#1a3d05" : "rgba(255,255,255,0.75)",
        border: primary ? "3px solid #1a3d05" : "2px solid rgba(255,255,255,0.2)",
        borderRadius: 6,
        cursor: "pointer",
        boxShadow: primary ? "3px 3px 0px #1a3d05" : "none",
        transition: "transform 0.08s, box-shadow 0.08s",
        minWidth: 180,
        textAlign: "center",
      }}
      onPointerDown={(e) => {
        if (primary) {
          e.currentTarget.style.transform = "translate(3px,3px)";
          e.currentTarget.style.boxShadow = "none";
        }
      }}
      onPointerUp={(e) => {
        if (primary) {
          e.currentTarget.style.transform = "";
          e.currentTarget.style.boxShadow = "3px 3px 0px #1a3d05";
        }
      }}
      onPointerLeave={(e) => {
        if (primary) {
          e.currentTarget.style.transform = "";
          e.currentTarget.style.boxShadow = "3px 3px 0px #1a3d05";
        }
      }}
    >
      {children}
    </button>
  );
}

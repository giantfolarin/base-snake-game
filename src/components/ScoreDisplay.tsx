"use client";

interface ScoreDisplayProps {
  score: number;
  highScore: number;
  soundOn: boolean;
  onSoundToggle: () => void;
  onShare: () => void;
  onClose: () => void;
}

export function ScoreDisplay({
  score,
  highScore,
  soundOn,
  onSoundToggle,
  onShare,
  onClose,
}: ScoreDisplayProps) {
  return (
    <div
      style={{
        width: "100%",
        height: 52,
        background: "#1a3d05",
        display: "flex",
        alignItems: "center",
        padding: "0 10px",
        gap: 8,
        borderBottom: "3px solid #0d2002",
        flexShrink: 0,
      }}
    >
      {/* Apple + Score */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 56 }}>
        <span style={{ fontSize: 22, lineHeight: 1, userSelect: "none" }}>🍎</span>
        <span
          style={{
            color: "#fff",
            fontSize: 13,
            fontFamily: "var(--font-pixel), monospace",
            fontWeight: "bold",
            minWidth: 22,
            letterSpacing: 1,
          }}
        >
          {score}
        </span>
      </div>

      {/* Trophy + High Score */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, flex: 1 }}>
        <span style={{ fontSize: 22, lineHeight: 1, userSelect: "none" }}>🏆</span>
        <span
          style={{
            color: "#FFD700",
            fontSize: 13,
            fontFamily: "var(--font-pixel), monospace",
            fontWeight: "bold",
            minWidth: 22,
            letterSpacing: 1,
          }}
        >
          {highScore}
        </span>
      </div>

      {/* Right controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <TopBarBtn onClick={onSoundToggle} label="Toggle sound">
          <span style={{ fontSize: 18 }}>{soundOn ? "🔊" : "🔇"}</span>
        </TopBarBtn>
        <TopBarBtn onClick={onShare} label="Share score">
          <ShareIcon />
        </TopBarBtn>
        <TopBarBtn onClick={onClose} label="Back to menu">
          <span style={{ fontSize: 16, color: "#fff", lineHeight: 1 }}>✕</span>
        </TopBarBtn>
      </div>
    </div>
  );
}

function TopBarBtn({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        width: 36,
        height: 36,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(255,255,255,0.1)",
        border: "2px solid rgba(255,255,255,0.18)",
        borderRadius: 6,
        cursor: "pointer",
        flexShrink: 0,
        transition: "background 0.1s",
      }}
    >
      {children}
    </button>
  );
}

function ShareIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 2v9" />
      <path d="M5 6l4-4 4 4" />
      <path d="M3 12v3a1 1 0 001 1h10a1 1 0 001-1v-3" />
    </svg>
  );
}

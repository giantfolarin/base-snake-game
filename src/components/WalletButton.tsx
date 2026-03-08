"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";

export function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const btnBase: React.CSSProperties = {
    width: "100%",
    height: 54,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontFamily: "var(--font-pixel), monospace",
    fontSize: "clamp(8px, 2.2vw, 11px)",
    letterSpacing: 2,
    border: "3px solid #1a3d05",
    borderRadius: 4,
    cursor: "pointer",
    transition: "transform 0.07s",
  };

  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        style={{
          ...btnBase,
          background: "#141e04",
          color: "#84c234",
          border: "3px solid #84c234",
          boxShadow: "0 4px 0 #0d1203",
        }}
      >
        ✓ {shortenAddress(address)}
      </button>
    );
  }

  // Show Coinbase Wallet first, then injected (MetaMask etc.)
  const cbConnector  = connectors.find((c) => c.id === "coinbaseWalletSDK") ?? connectors[0];
  const injConnector = connectors.find((c) => c.id === "injected");

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
      {cbConnector && (
        <button
          onClick={() => connect({ connector: cbConnector })}
          disabled={isPending}
          style={{
            ...btnBase,
            background: "rgba(200,225,155,0.88)",
            color: "#1a2006",
            boxShadow: "0 4px 0 #1a3d05",
            opacity: isPending ? 0.6 : 1,
          }}
        >
          🔵 {isPending ? "CONNECTING..." : "COINBASE WALLET"}
        </button>
      )}
      {injConnector && (
        <button
          onClick={() => connect({ connector: injConnector })}
          disabled={isPending}
          style={{
            ...btnBase,
            background: "rgba(200,225,155,0.7)",
            color: "#1a2006",
            boxShadow: "0 4px 0 #1a3d05",
            opacity: isPending ? 0.6 : 1,
          }}
        >
          🦊 {isPending ? "CONNECTING..." : "METAMASK"}
        </button>
      )}
    </div>
  );
}

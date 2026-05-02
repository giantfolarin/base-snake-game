# Retro Classic Snake Game: Built on Base Mini App

A Retro Snake game built on Base App.

## Features

- Rainbow snake rendered on HTML5 Canvas
- Retro pixel art UI with Press Start 2P font
- Game Boy-inspired selection screen
- Snake starts as a single cell and grows with each apple eaten
- Progressive speed increase — apple spawns toward center as game gets faster
- Full portrait layout optimised for mobile screens
- Swipe gestures + keyboard (arrow keys) controls
- Score + high score tracking with named leaderboard
- Wallet login via Coinbase Wallet or MetaMask — scores tied to wallet address
- On-chain leaderboard — scores submitted to a smart contract on Base mainnet
- Builder attribution via Base Builder Code `bc_4ecjsrzu` appended to every on-chain transaction
- Leaderboard falls back to localStorage when wallet is disconnected or chain is unavailable
- Sound toggle and share button
- Base Mini App manifest at `/.well-known/base/miniapp.json`
- Farcaster Mini App manifest at `/.well-known/farcaster.json`
- Ready signal sent via `@farcaster/miniapp-sdk` on load

---

## Project Structure

```
snake-base-miniapp/
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout + fc:frame meta tag
│   │   ├── page.tsx                    # Home page, signals sdk.ready()
│   │   ├── providers.tsx               # WagmiProvider + QueryClientProvider
│   │   ├── globals.css
│   │   ├── .well-known/
│   │   │   └── farcaster.json/
│   │   │       └── route.ts            # Farcaster manifest endpoint
│   │   └── api/
│   │       └── webhook/
│   │           └── route.ts            # Optional event webhook
│   ├── components/
│   │   ├── SnakeGame.tsx               # Main orchestrator + all screens
│   │   ├── GameCanvas.tsx              # Canvas renderer (rainbow snake)
│   │   ├── ScoreDisplay.tsx            # Score / high score top bar
│   │   └── WalletButton.tsx            # Wallet connect / disconnect
│   ├── hooks/
│   │   ├── useSnakeGame.ts             # Game state machine + loop
│   │   ├── useSwipeControls.ts         # Swipe gesture detection
│   │   ├── useSubmitScore.ts           # On-chain score submission (Base mainnet)
│   │   └── useLeaderboard.ts           # Read top scores from smart contract
│   └── lib/
│       ├── constants.ts                # Cell size, speeds, colours
│       ├── wagmi.ts                    # wagmi config (Base mainnet)
│       ├── contract.ts                 # Contract address, ABI, calldata encoder
│       └── types.ts                    # Shared TypeScript types
├── public/
│   └── .well-known/
│       └── base/
│           └── miniapp.json            # Base Mini App manifest
├── package.json
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Environment variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## Deploying as a Base Mini App

### Step 1 — Deploy to Vercel (recommended)

```bash
npm install -g vercel
vercel
```

Set `NEXT_PUBLIC_APP_URL` to your production URL in the Vercel dashboard.

### Step 2 — Add required public assets

Place these images in the `/public` folder:

| File | Size | Purpose |
|------|------|---------|
| `icon.png` | 512×512 px | App icon |
| `og-image.png` | 1200×630 px | Preview image for the frame |
| `splash.png` | 200×200 px | Splash screen while loading |
| `screenshot1.png` | 1200×630 px | Base Mini App directory screenshot |

### Step 3 — Generate accountAssociation

1. Go to [https://farcaster.xyz/~/developers/mini-apps/manifest?domain=snakebase.xyz](https://farcaster.xyz/~/developers/mini-apps/manifest?domain=snakebase.xyz) (replace `snakebase.xyz` with your domain)
2. Enter your production domain (without `https://`)
3. Sign with your Farcaster account to generate the domain manifest
4. Copy the `header`, `payload`, and `signature` values from the `accountAssociation` object
5. Add them as environment variables in Vercel: `FARCASTER_HEADER`, `FARCASTER_PAYLOAD`, `FARCASTER_SIGNATURE`
6. Redeploy — the manifest at `/.well-known/farcaster.json` will automatically include them
7. Return to the Farcaster Manifests page and click **Check domain status** to verify

### Step 4 — Register with Base / Farcaster

Share your Mini App URL in Farcaster or submit it to the Base Mini App directory.
The app will be discovered via the `fc:frame` meta tag in `layout.tsx` and
the manifests at `/.well-known/farcaster.json` and `/.well-known/base/miniapp.json`.

---

## Controls

| Input | Action |
|-------|--------|
| Arrow keys | Change direction |
| Swipe on canvas | Change direction (mobile) |

---

## Customisation

| File | What to change |
|------|---------------|
| `src/lib/constants.ts` | Cell size, initial speed, obstacle count |
| `src/lib/wagmi.ts` | Chain config, wallet connectors |
| `src/lib/contract.ts` | Contract address, ABI, builder code |
| `src/components/GameCanvas.tsx` | Snake/food rendering style |
| `src/app/layout.tsx` | Frame metadata title, description |
| `public/.well-known/base/miniapp.json` | Base Mini App manifest details |

---

## Tech Stack

- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **TailwindCSS**
- **HTML5 Canvas**
- **wagmi v2 + viem** (wallet connection, on-chain calls, Base mainnet)
- **@coinbase/wallet-sdk** (Coinbase Wallet connector)
- **@farcaster/miniapp-sdk** (ready signal)
- **Base Smart Contract** — leaderboard at `0xB9e2D368Cc09ad609Dc29606d88F6ac67F0132Cd`

# Snake — Base Mini App

A Snake game built as a Base Mini App (Farcaster Mini App).

## Features

- Rainbow snake rendered on HTML5 Canvas
- Retro pixel art UI with Press Start 2P font
- Game Boy-inspired selection screen
- Progressive speed increase as the snake grows
- Mobile-first: swipe gestures + keyboard (arrow keys)
- Score + high score tracking
- Sound toggle and share button
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
│   │   ├── globals.css
│   │   ├── .well-known/
│   │   │   └── farcaster.json/
│   │   │       └── route.ts            # Farcaster manifest endpoint
│   │   └── api/
│   │       └── webhook/
│   │           └── route.ts            # Optional event webhook
│   ├── components/
│   │   ├── SnakeGame.tsx               # Main orchestrator + overlays
│   │   ├── GameCanvas.tsx              # Canvas renderer (rainbow snake)
│   │   └── ScoreDisplay.tsx            # Score / high score top bar
│   ├── hooks/
│   │   ├── useSnakeGame.ts             # Game state machine + loop
│   │   └── useSwipeControls.ts         # Swipe gesture detection
│   └── lib/
│       ├── constants.ts                # Cell size, speeds, colours
│       └── types.ts                    # Shared TypeScript types
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
| `icon.png` | 200×200 px | App icon in Farcaster |
| `og-image.png` | 1200×630 px | Preview image for the frame |
| `splash.png` | 200×200 px | Splash screen while loading |

### Step 3 — Generate accountAssociation

1. Go to [https://warpcast.com/~/developers/frames](https://warpcast.com/~/developers/frames)
2. Enter your production domain
3. Sign with your Farcaster account
4. Copy the `header`, `payload`, and `signature` values
5. Paste them into `src/app/.well-known/farcaster.json/route.ts`

### Step 4 — Register with Base / Farcaster

Share your frame URL in Warpcast or submit it to the Base Mini App directory.
The frame will be discovered via the `fc:frame` meta tag in `layout.tsx` and
the manifest at `/.well-known/farcaster.json`.

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
| `src/lib/constants.ts` | Cell size, initial speed, colors |
| `src/components/GameCanvas.tsx` | Snake/food rendering style |
| `src/app/layout.tsx` | Frame metadata title, description |
| `src/app/.well-known/farcaster.json/route.ts` | Manifest details |

---

## Tech Stack

- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **TailwindCSS**
- **HTML5 Canvas**
- **@farcaster/miniapp-sdk** (ready signal)
- **@coinbase/onchainkit** (ready for wallet integration)

# Dialogue Pong

A multiplayer web game where every paddle hit forces you to write a message to your opponent. Classic Pong mechanics, experimental dialogue experience.

**[Play Now →](https://dialogue-pong.onrender.com)** 

---

## What Is This?

Two strangers play Pong. Every time the ball hits a paddle, the game pauses and that player **must** type a message before the game resumes. No skipping. No spectating. Just a weird, forced conversation through a sports metaphor.

- Anonymous — no accounts, no usernames
- Ephemeral — messages disappear when the game ends
- Anti-competitive — dialogue is the point, not the score

---

## Quick Start (Development)

### Prerequisites
- Node.js 18+
- npm

### Run the server
```bash
cd dialogue_pong/server
npm install
node index.js
# Server running at http://localhost:3001
```

### Run the client
```bash
cd dialogue_pong/client
npm install
npm run dev
# Client running at http://localhost:5173
```

Open two browser tabs at `http://localhost:5173`, click **Play Online** in both, and you'll be matched.

---

## Controls

| Player | Up | Down |
|--------|-----|------|
| **Player 1** | W | S |
| **Player 2** | ↑ | ↓ |

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + Vite + HTML5 Canvas |
| Backend | Node.js + Express + Socket.io |
| Audio | Web Audio API (programmatic, no files) |
| Styling | CSS (neon cyberpunk theme) |
| Tests | Vitest |

---

## Project Structure

```
dialogue_pong/
├── client/                    # React + Vite frontend
│   ├── src/
│   │   ├── audio/             # soundManager.js — Web Audio API engine
│   │   ├── components/        # React components (MenuScreen, LocalGame, NetworkGame, etc.)
│   │   ├── game/              # Canvas game engine (physics, renderer, gameLoop, particles)
│   │   ├── network/           # Socket.io client singleton
│   │   └── styles/            # CSS stylesheets
│   └── vite.config.js
├── server/                    # Node.js backend
│   ├── game/                  # Server-side game loop and room management
│   ├── matchmaking/           # Queue and pairing logic
│   ├── analytics.js           # In-memory stats (ephemeral)
│   └── index.js               # Entry point
├── shared/
│   └── constants.js           # Shared config (speeds, sizes, colors, events)
├── tests/                     # Vitest unit tests (58 tests)
├── render.yaml                # Render deployment config
└── README.md
```

---

## Run Tests

```bash
cd dialogue_pong/client
npm test
# 58 tests across physics, particles, profanity filter, analytics
```

---

## Deploy to Render (Free)

1. Push this repository to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Set **Root Directory** to `dialogue_pong`
5. Render auto-detects `render.yaml` — review and confirm:
   - **Build Command:** `npm install --prefix server && npm install --prefix client && npm run build --prefix client`
   - **Start Command:** `node server/index.js`
   - **Environment Variable:** `NODE_ENV=production`
6. Click **Deploy**
7. Once live, update the Play Now link at the top of this README

> **Note:** Free tier sleeps after 15 minutes of inactivity. First visitor after idle gets a ~30 second cold start. Acceptable for an MVP.

---

## Architecture Notes

- **Server-authoritative:** All ball physics run on the server. Client sends only paddle direction (-1, 0, 1).
- **Dialogue is mandatory:** Cannot skip. 30-second timer enforced on both client (auto-submit) and server (32-second safety net).
- **No database:** All state is in-memory. Messages are ephemeral by design.
- **Programmatic audio:** All sounds synthesized via Web Audio API — no audio files, no external dependencies.
- **Quality toggle:** High/Low graphics quality switch (affects canvas `shadowBlur`) for low-end devices.

---

## Implementation Phases

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Local Pong (physics, canvas rendering) | ✅ Done |
| 2 | Dialogue mechanics (modal, timer, chat feed) | ✅ Done |
| 3 | Network multiplayer (Socket.io, matchmaking) | ✅ Done |
| 4 | UI/UX polish (animations, responsive) | ✅ Done |
| 5 | Sound & visual effects (Web Audio, particles) | ✅ Done |
| 6 | Testing & optimization (58 tests, perf fixes) | ✅ Done |
| 7 | MVP Launch (production deploy, README) | ✅ Done |

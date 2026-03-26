# Play Counter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display live global stats (total players, total dialogues) on the MenuScreen, refreshed every 30 seconds.

**Architecture:** Add a `totalPlayersJoined` counter to the existing in-memory analytics module; expose it via the existing `/api/stats` endpoint; fetch and poll that endpoint from MenuScreen and render a stats bar.

**Tech Stack:** Node.js (analytics), React 19 + useEffect/useState (client), vitest (tests), CSS (styling)

---

## File Map

| File | Change |
|-|-|
| `server/analytics.js` | Add `totalPlayersJoined` counter + `recordPlayersJoined()` export |
| `server/index.js` | Import + call `recordPlayersJoined()` when a room starts |
| `tests/server/analytics.test.js` | Add tests for `recordPlayersJoined` and updated `getStats` |
| `client/src/components/MenuScreen.jsx` | Add fetch + 30s poll + stats display |
| `client/src/styles/MenuScreen.css` | Add `.menu-stats` styles |

---

## Task 1: Add `totalPlayersJoined` to analytics

**Files:**
- Modify: `server/analytics.js`
- Modify: `tests/server/analytics.test.js`

- [ ] **Step 1: Write the failing tests**

Open `tests/server/analytics.test.js`. Add `recordPlayersJoined` to the dynamic import line and add these test cases at the bottom of the file:

```js
// At the top of the file, update the import line:
let recordGameStarted, recordGameCompleted, recordMessage, getStats, recordPlayersJoined;

// In the beforeEach block, add:
recordPlayersJoined = mod.recordPlayersJoined;

// Add these describe blocks at the bottom of the file:
describe('recordPlayersJoined', () => {
  it('increments totalPlayersJoined by 2', () => {
    recordPlayersJoined();
    expect(getStats().totalPlayersJoined).toBe(2);
  });

  it('accumulates across multiple calls', () => {
    recordPlayersJoined();
    recordPlayersJoined();
    expect(getStats().totalPlayersJoined).toBe(4);
  });
});

describe('getStats includes totalPlayersJoined', () => {
  it('starts at 0', () => {
    expect(getStats().totalPlayersJoined).toBe(0);
  });
});
```

Also update the existing `'starts with all counters at zero'` test to include the new field:

```js
it('starts with all counters at zero', () => {
  const s = getStats();
  expect(s.totalGamesStarted).toBe(0);
  expect(s.totalGamesCompleted).toBe(0);
  expect(s.totalMessages).toBe(0);
  expect(s.totalPlayersJoined).toBe(0);
  expect(s.avgDialogueDurationMs).toBe(0);
  expect(s.avgDialogueDurationSec).toBe(0);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd dialogue_pong/client && npm test
```

Expected: FAIL — `recordPlayersJoined is not a function` and `totalPlayersJoined` is undefined.

- [ ] **Step 3: Implement `recordPlayersJoined` in `server/analytics.js`**

Add `totalPlayersJoined: 0` to the `stats` object and add the export function. Final file:

```js
/**
 * analytics.js — In-memory analytics for Dialogue Pong
 * Tracks game counts and average dialogue duration.
 * Ephemeral — resets on server restart (no database by design).
 */

const stats = {
  totalGamesStarted: 0,
  totalGamesCompleted: 0,
  totalMessages: 0,
  totalDialogueTimeMs: 0,
  dialogueCount: 0,
  totalPlayersJoined: 0,
  serverStartedAt: Date.now(),
};

/** Called when a new game room starts. */
export function recordGameStarted() {
  stats.totalGamesStarted++;
}

/** Called when a game ends (disconnect or natural end). */
export function recordGameCompleted() {
  stats.totalGamesCompleted++;
}

/**
 * Called when a match is made. Increments totalPlayersJoined by 2
 * because each room always has exactly 2 players.
 */
export function recordPlayersJoined() {
  stats.totalPlayersJoined += 2;
}

/**
 * Called when a message is processed by the server.
 * @param {number} dialogueDurationMs - Time from paddle hit to message submission
 */
export function recordMessage(dialogueDurationMs) {
  stats.totalMessages++;
  if (typeof dialogueDurationMs === 'number' && dialogueDurationMs > 0) {
    stats.totalDialogueTimeMs += dialogueDurationMs;
    stats.dialogueCount++;
  }
}

/** Returns a snapshot of current stats. */
export function getStats() {
  const avgMs =
    stats.dialogueCount > 0
      ? Math.round(stats.totalDialogueTimeMs / stats.dialogueCount)
      : 0;
  return {
    totalGamesStarted: stats.totalGamesStarted,
    totalGamesCompleted: stats.totalGamesCompleted,
    totalMessages: stats.totalMessages,
    totalPlayersJoined: stats.totalPlayersJoined,
    avgDialogueDurationMs: avgMs,
    avgDialogueDurationSec: +(avgMs / 1000).toFixed(1),
    serverUptimeMs: Date.now() - stats.serverStartedAt,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd dialogue_pong/client && npm test
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
cd dialogue_pong
git add server/analytics.js tests/server/analytics.test.js
git commit -m "[Phase 7] analytics: add totalPlayersJoined counter"
```

---

## Task 2: Wire `recordPlayersJoined` into the server

**Files:**
- Modify: `server/index.js` lines 19-29 (import block) and line 103 (room start)

- [ ] **Step 1: Update the import in `server/index.js`**

Find the existing analytics import (around line 19):

```js
import { recordGameStarted, recordGameCompleted, getStats } from './analytics.js';
```

Replace with:

```js
import { recordGameStarted, recordGameCompleted, recordPlayersJoined, getStats } from './analytics.js';
```

- [ ] **Step 2: Call `recordPlayersJoined` when a room starts**

Find the block where `recordGameStarted()` is called (around line 103):

```js
      gameRoom.start();
      recordGameStarted();
```

Replace with:

```js
      gameRoom.start();
      recordGameStarted();
      recordPlayersJoined();
```

- [ ] **Step 3: Verify manually**

Start the server and hit the stats endpoint:

```bash
node dialogue_pong/server/index.js
# In another terminal:
curl http://localhost:3001/api/stats
```

Expected JSON includes `"totalPlayersJoined": 0` (zero until a match is made).

- [ ] **Step 4: Commit**

```bash
cd dialogue_pong
git add server/index.js
git commit -m "[Phase 7] server: record players joined on room creation"
```

---

## Task 3: Display stats on MenuScreen

**Files:**
- Modify: `client/src/components/MenuScreen.jsx`
- Modify: `client/src/styles/MenuScreen.css`

- [ ] **Step 1: Update `MenuScreen.jsx`**

Replace the entire file with:

```jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import HowToPlay from './HowToPlay.jsx';
import '../styles/MenuScreen.css';

const STATS_POLL_MS = 30000;

/**
 * MenuScreen — Main menu with Local / Online game options and HowToPlay modal
 */
function MenuScreen({ onLocal, onOnline }) {
  const { t } = useTranslation();
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats');
        if (!res.ok) return;
        const data = await res.json();
        setStats({
          totalPlayers: data.totalPlayersJoined,
          totalDialogues: data.totalMessages,
        });
      } catch {
        // Keep previous state on error
      }
    }

    fetchStats();
    const interval = setInterval(fetchStats, STATS_POLL_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="menu-container">
      <h1 className="menu-title">{t('appTitle')}</h1>
      <p className="menu-subtitle">{t('menu.subtitle')}</p>

      <div className="menu-buttons">
        <button className="menu-button menu-local" onClick={onLocal}>
          <span className="menu-button-icon">🎮</span>
          <span className="menu-button-text">{t('menu.playLocal')}</span>
          <span className="menu-button-desc">{t('menu.playLocalDesc')}</span>
        </button>

        <button className="menu-button menu-online" onClick={onOnline}>
          <span className="menu-button-icon">🌐</span>
          <span className="menu-button-text">{t('menu.playOnline')}</span>
          <span className="menu-button-desc">{t('menu.playOnlineDesc')}</span>
        </button>
      </div>

      <div className="menu-stats">
        <span>👥 {stats ? stats.totalPlayers.toLocaleString() : '—'} players</span>
        <span>💬 {stats ? stats.totalDialogues.toLocaleString() : '—'} dialogues</span>
      </div>

      <div className="menu-footer">
        <p>{t('menu.footer1')}</p>
        <p>{t('menu.footer2')}</p>
      </div>

      <button
        className="menu-howtoplay-btn"
        onClick={() => setShowHowToPlay(true)}
        aria-label={t('menu.howToPlayAria')}
      >
        ?
      </button>

      {showHowToPlay && <HowToPlay onClose={() => setShowHowToPlay(false)} />}
    </div>
  );
}

export default MenuScreen;
```

- [ ] **Step 2: Add `.menu-stats` styles to `MenuScreen.css`**

Add these lines at the end of `client/src/styles/MenuScreen.css`:

```css
.menu-stats {
  display: flex;
  gap: 2rem;
  font-size: 0.875rem;
  color: rgba(200, 200, 200, 0.6);
  font-family: "Courier New", monospace;
  letter-spacing: 1px;
}
```

- [ ] **Step 3: Verify in dev**

Start both server and client:

```bash
node dialogue_pong/server/index.js
npm run dev --prefix dialogue_pong/client
```

Open `http://localhost:5173`. The menu should show `👥 — players  💬 — dialogues` on first load (server stats start at 0 until games are played). Numbers should not be `undefined` or throw errors.

Note: In development, the client runs on port 5173 and the server on 3001. The `/api/stats` fetch will hit the Vite proxy or fail with a network error (which is caught silently). To test the full flow, either configure the Vite proxy or test in production build mode:

```bash
cd dialogue_pong && NODE_ENV=production npm run build && node server/index.js
# Open http://localhost:3001
```

- [ ] **Step 4: Commit**

```bash
cd dialogue_pong
git add client/src/components/MenuScreen.jsx client/src/styles/MenuScreen.css
git commit -m "[Phase 7] menu: add live play counter stats bar"
```

---

## Task 4: Configure Vite proxy for dev (if needed)

**Files:**
- Modify: `client/vite.config.js`

If the stats bar shows `—` permanently in dev (because `/api/stats` 404s on port 5173), add a proxy:

- [ ] **Step 1: Add proxy to `client/vite.config.js`**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
```

- [ ] **Step 2: Restart dev server and verify**

```bash
npm run dev --prefix dialogue_pong/client
```

Open `http://localhost:5173`. Stats bar should now show `👥 0 players  💬 0 dialogues` (fetched from server).

- [ ] **Step 3: Commit**

```bash
cd dialogue_pong
git add client/vite.config.js
git commit -m "[Phase 7] vite: proxy /api to backend in dev"
```

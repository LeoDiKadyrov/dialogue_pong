# Live Player Count Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the misleading cumulative `totalPlayersJoined` counter with a real-time `onlinePlayers` count from Socket.io, and keep `totalMessages` as the dialogue counter.

**Architecture:** Remove `recordPlayersJoined` from analytics entirely. Inject `io.sockets.sockets.size` directly into the `/api/stats` response at request time. Frontend maps `data.onlinePlayers` instead of `data.totalPlayersJoined` — no other frontend changes needed.

**Tech Stack:** Node.js + Express + Socket.io (server), React + fetch (client), Vitest (tests)

---

### Task 1: Clean up analytics.js

**Files:**
- Modify: `dialogue_pong/server/analytics.js`
- Test: `dialogue_pong/tests/server/analytics.test.js`

- [ ] **Step 1: Remove `totalPlayersJoined` from analytics test**

In `dialogue_pong/tests/server/analytics.test.js`:

Remove `recordPlayersJoined` from the destructured import on line 10:
```js
let recordGameStarted, recordGameCompleted, recordMessage, getStats;
```

Remove the assignment in `beforeEach` (line 19):
```js
// delete this line:
recordPlayersJoined = mod.recordPlayersJoined;
```

Remove the `totalPlayersJoined` assertion from the initial state test (lines 28):
```js
// delete this line:
expect(s.totalPlayersJoined).toBe(0);
```

Remove the two `describe` blocks at lines 111–128:
```js
// delete entirely:
describe('recordPlayersJoined', () => { ... });
describe('getStats includes totalPlayersJoined', () => { ... });
```

- [ ] **Step 2: Run analytics tests to confirm no regressions before touching source**

```bash
cd dialogue_pong/client && npx vitest run ../../tests/server/analytics.test.js --reporter=verbose
```

Expected: all remaining tests PASS.

- [ ] **Step 3: Remove `totalPlayersJoined` and `recordPlayersJoined` from analytics.js**

In `dialogue_pong/server/analytics.js`, the final file should be:

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
    avgDialogueDurationMs: avgMs,
    avgDialogueDurationSec: +(avgMs / 1000).toFixed(1),
    serverUptimeMs: Date.now() - stats.serverStartedAt,
  };
}
```

- [ ] **Step 4: Run analytics tests**

```bash
cd dialogue_pong/client && npx vitest run ../../tests/server/analytics.test.js --reporter=verbose
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add dialogue_pong/server/analytics.js dialogue_pong/tests/server/analytics.test.js
git commit -m "[Phase 7] analytics: remove totalPlayersJoined, replaced by live socket count"
```

---

### Task 2: Update /api/stats to include onlinePlayers

**Files:**
- Modify: `dialogue_pong/server/index.js`

- [ ] **Step 1: Remove `recordPlayersJoined` import and call**

In `dialogue_pong/server/index.js`, line 19 — remove `recordPlayersJoined` from the import:
```js
import { recordGameStarted, recordGameCompleted, getStats } from './analytics.js';
```

Line 104 — remove the call:
```js
// delete this line:
recordPlayersJoined();
```

- [ ] **Step 2: Update `/api/stats` endpoint to include `onlinePlayers`**

Change the endpoint (currently lines 38–40) to:
```js
app.get('/api/stats', (_req, res) => {
  res.json({ ...getStats(), onlinePlayers: io.sockets.sockets.size });
});
```

Note: `io` is defined at line 53 (after this endpoint definition), but the callback only executes at request time — after `io` is fully initialized. This works correctly as-is.

- [ ] **Step 3: Verify server starts without errors**

```bash
node dialogue_pong/server/index.js
```

Expected: `[Server] Listening on port 3001` with no import errors. Stop with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add dialogue_pong/server/index.js
git commit -m "[Phase 7] server: expose live onlinePlayers count in /api/stats"
```

---

### Task 3: Update MenuScreen to use onlinePlayers

**Files:**
- Modify: `dialogue_pong/client/src/components/MenuScreen.jsx`

- [ ] **Step 1: Update the stats mapping**

In `dialogue_pong/client/src/components/MenuScreen.jsx`, find the fetch handler (around line 23):
```js
// Change:
totalPlayers: data.totalPlayersJoined,
// To:
totalPlayers: data.onlinePlayers,
```

- [ ] **Step 2: Verify visually**

Start the dev server and open the menu:
```bash
npm run dev --prefix dialogue_pong/client
```
Open http://localhost:5173. The `👥` counter should show the current socket count (at minimum 1 — your own connection). The `💬` counter shows total messages as before.

- [ ] **Step 3: Commit**

```bash
git add dialogue_pong/client/src/components/MenuScreen.jsx
git commit -m "[Phase 7] MenuScreen: show live socket count instead of cumulative players"
```

---

### Task 4: Run full test suite

- [ ] **Step 1: Run all tests**

```bash
cd dialogue_pong/client && npx vitest run --reporter=verbose
```

Expected: all 86 tests PASS (or the same count as before — no new failures).

- [ ] **Step 2: Commit if any test files were auto-adjusted**

If no changes needed, no commit required.

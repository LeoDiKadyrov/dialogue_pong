# Live Player Count — Design Spec

**Date:** 2026-03-26
**Status:** Approved

---

## Summary

Replace the misleading cumulative `totalPlayersJoined` counter with a real-time `onlinePlayers` count derived from `io.sockets.sockets.size`. Keep `totalMessages` (dialogues) unchanged. The result is two accurate stats on the MenuScreen: "X players online" and "Y dialogues".

---

## Problem

`totalPlayersJoined` incremented by 2 on every match, so the same two players playing ten games would show 20 "players". It was cumulative, not indicative of real activity.

---

## Backend

### `server/analytics.js`

- Remove `totalPlayersJoined` from the `stats` object.
- Remove `recordPlayersJoined()` export.
- No other changes.

### `server/index.js`

- Remove the `recordPlayersJoined` import.
- Remove the `recordPlayersJoined()` call in the `EV_JOIN_QUEUE` handler.
- Update `/api/stats` to spread `getStats()` and append `onlinePlayers: io.sockets.sockets.size`:
  ```js
  app.get('/api/stats', (_req, res) => {
    res.json({ ...getStats(), onlinePlayers: io.sockets.sockets.size });
  });
  ```
  Note: the `/api/stats` handler is defined before `io` in the file, but the callback executes at request time — after `io` is fully initialized. No reordering needed.

---

## Frontend

### `client/src/components/MenuScreen.jsx`

- Change the stats mapping from `data.totalPlayersJoined` to `data.onlinePlayers`.
- No changes to display markup, CSS, or i18n keys.

---

## Tests

### `tests/server/analytics.test.js`

- Remove tests for `recordPlayersJoined` and `totalPlayersJoined`.
- No new tests needed — `onlinePlayers` comes directly from Socket.io, not from analytics.js.

---

## Out of Scope

- Push-based real-time updates via Socket.io (30s polling is sufficient).
- Per-player stats or session tracking.
- Persistence across server restarts (in-memory by design).

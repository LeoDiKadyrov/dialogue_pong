# Play Counter — Design Spec

**Date:** 2026-03-26
**Status:** Approved

---

## Summary

Add a live stats display to the MenuScreen showing two global counters:
- **Total players** — cumulative number of players who have joined a game
- **Total dialogues** — cumulative number of messages sent across all games

Stats are fetched from the existing `/api/stats` endpoint and refreshed every 30 seconds.

---

## Backend

### `server/analytics.js`

- Add `totalPlayersJoined: 0` to the `stats` object.
- Add `export function recordPlayersJoined()` — increments `totalPlayersJoined` by 2 (one room = two players).
- Include `totalPlayersJoined` in the `getStats()` return value.

### `server/index.js`

- Import `recordPlayersJoined` from `analytics.js`.
- Call `recordPlayersJoined()` alongside the existing `recordGameStarted()` call when a room is created.

No new routes needed — `/api/stats` already exists.

---

## Frontend

### `client/src/components/MenuScreen.jsx`

- Add state: `stats` (object with `totalPlayers` and `totalDialogues`, initially `null`).
- On mount: fetch `/api/stats`, populate state. Set up a `setInterval` at 30 000ms to re-fetch.
- On unmount: clear the interval.
- Map API fields: `totalPlayersJoined` → `totalPlayers`, `totalMessages` → `totalDialogues`.
- If fetch fails, keep previous state (or show `—` on first load).

### Display

Render a `<div className="menu-stats">` between the existing buttons and footer:

```
👥 142 players   💬 1,847 dialogues
```

- Numbers formatted with `toLocaleString()`.
- Shows `—` while loading or on fetch error.

### `client/src/styles/MenuScreen.css`

- Add `.menu-stats` styles: centered, small muted text, consistent with existing footer style.

---

## Out of Scope

- Per-player dialogue count (requires persistent identity — deferred).
- Real-time push via Socket.io (polling at 30s is sufficient).
- Persistence across server restarts (in-memory only, by design).

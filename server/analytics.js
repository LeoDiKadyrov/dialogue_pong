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

/**
 * analytics.test.js — Unit tests for server/analytics.js
 * Uses vi.resetModules() in beforeEach to get a fresh module state per test,
 * avoiding cross-test contamination of the in-memory counters.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Dynamically imported after resetModules() so each test gets fresh state
let recordGameStarted, recordGameCompleted, recordMessage, getStats;

beforeEach(async () => {
  vi.resetModules();
  const mod = await import('../../server/analytics.js');
  recordGameStarted  = mod.recordGameStarted;
  recordGameCompleted = mod.recordGameCompleted;
  recordMessage      = mod.recordMessage;
  getStats           = mod.getStats;
});

describe('initial state', () => {
  it('starts with all counters at zero', () => {
    const s = getStats();
    expect(s.totalGamesStarted).toBe(0);
    expect(s.totalGamesCompleted).toBe(0);
    expect(s.totalMessages).toBe(0);
    expect(s.avgDialogueDurationMs).toBe(0);
    expect(s.avgDialogueDurationSec).toBe(0);
  });

  it('serverUptimeMs is a non-negative number', () => {
    // May be 0 if module import and Date.now() resolve in the same ms
    expect(getStats().serverUptimeMs).toBeGreaterThanOrEqual(0);
    expect(typeof getStats().serverUptimeMs).toBe('number');
  });
});

describe('recordGameStarted', () => {
  it('increments totalGamesStarted', () => {
    recordGameStarted();
    recordGameStarted();
    expect(getStats().totalGamesStarted).toBe(2);
  });
});

describe('recordGameCompleted', () => {
  it('increments totalGamesCompleted', () => {
    recordGameCompleted();
    expect(getStats().totalGamesCompleted).toBe(1);
  });
});

describe('recordMessage', () => {
  it('increments totalMessages', () => {
    recordMessage(5000);
    recordMessage(3000);
    expect(getStats().totalMessages).toBe(2);
  });

  it('accumulates dialogue duration and increments dialogueCount', () => {
    recordMessage(5000);
    recordMessage(7000);
    const s = getStats();
    expect(s.avgDialogueDurationMs).toBe(6000);
    expect(s.avgDialogueDurationSec).toBe(6.0);
  });

  it('does NOT count duration when value is 0 (avoids skewing average)', () => {
    recordMessage(10000);
    recordMessage(0);       // should not affect average
    const s = getStats();
    expect(s.avgDialogueDurationMs).toBe(10000);
  });

  it('does NOT count duration when value is negative', () => {
    recordMessage(8000);
    recordMessage(-500);    // invalid — should not affect average
    const s = getStats();
    expect(s.avgDialogueDurationMs).toBe(8000);
  });

  it('still increments totalMessages even when duration is 0', () => {
    recordMessage(0);
    expect(getStats().totalMessages).toBe(1);
  });
});

describe('getStats averages', () => {
  it('computes correct average across multiple messages', () => {
    recordMessage(4000);
    recordMessage(8000);
    recordMessage(6000);
    expect(getStats().avgDialogueDurationMs).toBe(6000);
  });

  it('avgDialogueDurationSec rounds to 1 decimal place', () => {
    recordMessage(3333);
    recordMessage(3334);
    // avg = 3333.5 ms = 3.3 sec (rounded to 1dp)
    expect(getStats().avgDialogueDurationSec).toBe(3.3);
  });

  it('returns 0 for average when no messages recorded', () => {
    expect(getStats().avgDialogueDurationMs).toBe(0);
    expect(getStats().avgDialogueDurationSec).toBe(0);
  });
});


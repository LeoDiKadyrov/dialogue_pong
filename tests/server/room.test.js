/**
 * Unit tests for GameRoom — server-side game controller.
 * Covers: start(), handleMessage(), handleDisconnect(), destroy()
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameRoom } from '../../server/game/room.js';
import {
  EV_OPPONENT_MESSAGE,
  EV_GAME_RESUME,
  EV_OPPONENT_LEFT,
} from '../../shared/constants.js';

// Prevent real physics ticks from interfering with timer-based tests.
// updatePhysics is mocked to return no-op results by default; individual
// tests can override via vi.mocked(...).mockReturnValueOnce() if needed.
vi.mock('../../shared/physics-server.js', () => ({
  updatePhysics: vi.fn(() => ({ scorer: null, paddleHit: null })),
  resetBall: vi.fn(),
}));

function mockSocket(id) {
  return { id, emit: vi.fn() };
}

describe('GameRoom', () => {
  let socket1, socket2, events, room;

  beforeEach(() => {
    vi.useFakeTimers();
    socket1 = mockSocket('p1');
    socket2 = mockSocket('p2');
    events = [];
    room = new GameRoom(socket1, socket2, 'test-room', (event, data) => {
      events.push({ event, data });
    });
  });

  afterEach(() => {
    room.destroy();
    vi.useRealTimers();
  });

  // ── start() ──────────────────────────────────────────────────────────────

  describe('start()', () => {
    it('sets paused to false', () => {
      room.paused = true;
      room.start();
      expect(room.paused).toBe(false);
    });

    it('sets interval so physics loop is running', () => {
      room.start();
      expect(room.interval).not.toBeNull();
    });

    it('does not double-start — clears existing interval before creating new one', () => {
      room.start();
      const first = room.interval;
      room.start();
      const second = room.interval;
      // Both calls should succeed without error and interval should be set
      expect(room.interval).not.toBeNull();
      // After second start the interval object is replaced (new setInterval call)
      expect(second).not.toBe(first);
    });
  });

  // ── handleMessage() ───────────────────────────────────────────────────────

  describe('handleMessage()', () => {
    it('clears dialogueTimeout so it does not fire', () => {
      // Simulate a pending dialogue timeout
      const spy = vi.fn();
      room.dialogueTimeout = setTimeout(spy, 10000);

      room.handleMessage('player1', 'hello');

      // Advance past the original timeout — spy must NOT be called
      vi.advanceTimersByTime(15000);
      expect(spy).not.toHaveBeenCalled();
      expect(room.dialogueTimeout).toBeNull();
    });

    it('emits EV_OPPONENT_MESSAGE with correct player and text via onEvent', () => {
      room.handleMessage('player1', 'hello world');

      const ev = events.find((e) => e.event === EV_OPPONENT_MESSAGE);
      expect(ev).toBeDefined();
      expect(ev.data.player).toBe('player1');
      expect(ev.data.text).toBe('hello world');
    });

    it('emits EV_GAME_RESUME via onEvent', () => {
      room.handleMessage('player2', 'hi');

      const ev = events.find((e) => e.event === EV_GAME_RESUME);
      expect(ev).toBeDefined();
    });

    it('sets paused to false', () => {
      room.paused = true;
      room.handleMessage('player1', 'resuming');
      expect(room.paused).toBe(false);
    });

    it('filters profanity before emitting opponent message', () => {
      room.handleMessage('player1', 'you fuck');

      const ev = events.find((e) => e.event === EV_OPPONENT_MESSAGE);
      expect(ev).toBeDefined();
      expect(ev.data.text).toBe('you ***');
    });
  });

  // ── handleDisconnect() ────────────────────────────────────────────────────

  describe('handleDisconnect()', () => {
    it('stops the physics interval', () => {
      room.start();
      expect(room.interval).not.toBeNull();

      room.handleDisconnect('p1');
      expect(room.interval).toBeNull();
    });

    it('emits EV_OPPONENT_LEFT on the remaining player socket when player1 disconnects', () => {
      room.handleDisconnect('p1');

      expect(socket2.emit).toHaveBeenCalledWith(EV_OPPONENT_LEFT, {});
      expect(socket1.emit).not.toHaveBeenCalledWith(EV_OPPONENT_LEFT, {});
    });

    it('emits EV_OPPONENT_LEFT on the remaining player socket when player2 disconnects', () => {
      room.handleDisconnect('p2');

      expect(socket1.emit).toHaveBeenCalledWith(EV_OPPONENT_LEFT, {});
      expect(socket2.emit).not.toHaveBeenCalledWith(EV_OPPONENT_LEFT, {});
    });
  });

  // ── destroy() ─────────────────────────────────────────────────────────────

  describe('destroy()', () => {
    it('clears the physics interval', () => {
      room.start();
      room.destroy();
      expect(room.interval).toBeNull();
    });

    it('clears dialogueTimeout and nulls it', () => {
      const spy = vi.fn();
      room.dialogueTimeout = setTimeout(spy, 10000);

      room.destroy();

      vi.advanceTimersByTime(15000);
      expect(spy).not.toHaveBeenCalled();
      expect(room.dialogueTimeout).toBeNull();
    });

    it('is safe to call when no interval or timeout is set', () => {
      // Should not throw when called on a fresh room
      expect(() => room.destroy()).not.toThrow();
    });
  });
});

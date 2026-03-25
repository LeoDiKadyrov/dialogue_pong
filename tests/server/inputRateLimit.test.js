import { describe, it, expect } from 'vitest';

function createRateLimiter(limitMs) {
  const lastTime = new Map();
  return {
    isAllowed(socketId) {
      const now = Date.now();
      const last = lastTime.get(socketId) ?? 0;
      if (now - last < limitMs) return false;
      lastTime.set(socketId, now);
      return true;
    },
    delete(socketId) {
      lastTime.delete(socketId);
    },
  };
}

describe('input rate limiter', () => {
  it('allows first input', () => {
    const limiter = createRateLimiter(50);
    expect(limiter.isAllowed('socket-a')).toBe(true);
  });

  it('blocks input within limit window', () => {
    const limiter = createRateLimiter(50);
    limiter.isAllowed('socket-a');
    expect(limiter.isAllowed('socket-a')).toBe(false);
  });

  it('allows input after window expires', async () => {
    const limiter = createRateLimiter(10);
    limiter.isAllowed('socket-a');
    await new Promise((r) => setTimeout(r, 15));
    expect(limiter.isAllowed('socket-a')).toBe(true);
  });

  it('tracks different sockets independently', () => {
    const limiter = createRateLimiter(50);
    limiter.isAllowed('socket-a');
    expect(limiter.isAllowed('socket-b')).toBe(true);
  });
});

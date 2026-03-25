import { describe, it, expect } from 'vitest';

// Isolated test of the role resolution logic
function resolvePlayerRole(socketId, room) {
  if (socketId === room.players.player1.id) return 'player1';
  if (socketId === room.players.player2.id) return 'player2';
  return null;
}

describe('resolvePlayerRole', () => {
  const mockRoom = {
    players: {
      player1: { id: 'socket-aaa' },
      player2: { id: 'socket-bbb' },
    },
  };

  it('returns player1 for player1 socket', () => {
    expect(resolvePlayerRole('socket-aaa', mockRoom)).toBe('player1');
  });

  it('returns player2 for player2 socket', () => {
    expect(resolvePlayerRole('socket-bbb', mockRoom)).toBe('player2');
  });

  it('returns null for unknown socket', () => {
    expect(resolvePlayerRole('socket-unknown', mockRoom)).toBeNull();
  });
});

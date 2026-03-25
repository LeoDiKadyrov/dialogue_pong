/**
 * Dialogue Pong Server
 * Node.js + Express + Socket.io
 * Runs at localhost:3001
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';

// ESM __dirname shim
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { addToQueue, removeFromQueue, tryMatch } from './matchmaking/queue.js';
import { createGameRoom } from './game/room.js';
import { recordGameStarted, recordGameCompleted, getStats } from './analytics.js';
import {
  SERVER_PORT,
  EV_JOIN_QUEUE,
  EV_LEAVE_QUEUE,
  EV_MATCH_FOUND,
  EV_INPUT,
  EV_MESSAGE,
  MESSAGE_MIN_LENGTH,
  MESSAGE_MAX_LENGTH,
} from '../shared/constants.js';

const app = express();
app.use(express.json());

/**
 * GET /api/stats — In-memory analytics snapshot.
 * Returns game counts and average dialogue duration.
 */
app.get('/api/stats', (_req, res) => {
  res.json(getStats());
});

// In production, serve the built React client from client/dist/
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../client/dist');
  app.use(express.static(distPath));
  // SPA catch-all — serve index.html for all non-API routes
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    // In production, client and server share the same origin — no CORS needed.
    // In development, allow the Vite dev server.
    origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// In-memory storage for active game rooms
const rooms = new Map(); // roomId → GameRoom instance
const playerToRoom = new Map(); // socketId → roomId
const lastMessageTime = new Map(); // socketId → timestamp of last accepted EV_MESSAGE
const MESSAGE_RATE_LIMIT_MS = 2000; // 2 seconds between messages (per CLAUDE.md)

/**
 * Handle a new socket connection
 */
io.on('connection', (socket) => {
  console.log(`[Connection] Player connected: ${socket.id}`);

  socket.on(EV_JOIN_QUEUE, () => {
    console.log(`[Queue] ${socket.id} joined queue`);
    addToQueue(socket);

    // Try to match
    const match = tryMatch();
    if (match) {
      console.log(
        `[Match] Paired ${match.p1Socket.id} (P1) with ${match.p2Socket.id} (P2)`
      );
      const roomId = createRoomId();
      const gameRoom = createGameRoom(
        match.p1Socket,
        match.p2Socket,
        roomId,
        (event, data) => onRoomEvent(roomId, event, data)
      );
      rooms.set(roomId, gameRoom);
      playerToRoom.set(match.p1Socket.id, roomId);
      playerToRoom.set(match.p2Socket.id, roomId);

      // Notify both players
      match.p1Socket.emit(EV_MATCH_FOUND, { roomId, playerId: 'player1' });
      match.p2Socket.emit(EV_MATCH_FOUND, { roomId, playerId: 'player2' });

      // Start the game room
      gameRoom.start();
      recordGameStarted();
    }
  });

  socket.on(EV_LEAVE_QUEUE, () => {
    console.log(`[Queue] ${socket.id} left queue`);
    removeFromQueue(socket.id);
  });

  socket.on(EV_INPUT, (data) => {
    // Validate: direction must be exactly -1, 0, or 1
    if (!data || ![-1, 0, 1].includes(data.direction)) return;

    const roomId = playerToRoom.get(socket.id);
    const room = rooms.get(roomId);
    if (room) {
      const playerId = socket.id === room.players.player1.id
        ? 'player1'
        : socket.id === room.players.player2.id
          ? 'player2'
          : null;
      if (!playerId) return;
      room.handleInput(playerId, data.direction);
    }
  });

  socket.on(EV_MESSAGE, (data) => {
    // Validate message type and length (server is source of truth per CLAUDE.md)
    if (
      !data ||
      typeof data.text !== 'string' ||
      data.text.length < MESSAGE_MIN_LENGTH ||
      data.text.length > MESSAGE_MAX_LENGTH
    ) return;

    // Rate limit: max 1 message per 2 seconds
    const now = Date.now();
    const lastTime = lastMessageTime.get(socket.id) ?? 0;
    if (now - lastTime < MESSAGE_RATE_LIMIT_MS) {
      console.log(`[RateLimit] ${socket.id} message rejected (too fast)`);
      return;
    }
    lastMessageTime.set(socket.id, now);

    const roomId = playerToRoom.get(socket.id);
    const room = rooms.get(roomId);
    if (room) {
      const playerId = socket.id === room.players.player1.id
        ? 'player1'
        : socket.id === room.players.player2.id
          ? 'player2'
          : null;
      if (!playerId) return;
      room.handleMessage(playerId, data.text);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Disconnect] ${socket.id}`);
    removeFromQueue(socket.id);
    lastMessageTime.delete(socket.id);

    const roomId = playerToRoom.get(socket.id);
    if (roomId) {
      const room = rooms.get(roomId);
      if (room) {
        // Clean up the OTHER player's playerToRoom entry before destroying the room
        const otherSocket =
          socket.id === room.players.player1.id
            ? room.players.player2
            : room.players.player1;
        playerToRoom.delete(otherSocket.id);
        lastMessageTime.delete(otherSocket.id);

        room.handleDisconnect(socket.id);
        room.destroy();
        rooms.delete(roomId);
        recordGameCompleted();
      }
      playerToRoom.delete(socket.id);
    }
  });
});

/**
 * Handle room events (emitted from GameRoom via callback).
 * The callback pattern allows server-level concerns (analytics, logging)
 * without coupling GameRoom to index.js.
 */
function onRoomEvent(roomId, event, data) {
  const room = rooms.get(roomId);
  if (room) {
    room.broadcast(event, data);
  }
}

/**
 * Generate a unique room ID
 */
function createRoomId() {
  return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Start the HTTP server
 */
const PORT = process.env.PORT || SERVER_PORT;
httpServer.listen(PORT, () => {
  console.log(`[Server] Listening on port ${PORT}`);
  console.log(`[Server] NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
});

/**
 * Socket.io singleton client
 * Used across the app for network communication
 * Connects to local server in development, same origin in production
 */

import { io } from 'socket.io-client';

// In development, connect to local server. In production, connect to Render backend.
const SERVER_URL = import.meta.env.DEV
  ? 'http://localhost:3001'
  : (import.meta.env.VITE_SERVER_URL || 'https://chpong.onrender.com');

let socket = null;

/**
 * Get or create the socket connection
 * @returns {Socket} Socket.io socket instance
 */
export function getSocket() {
  if (!socket) {
    socket = io(SERVER_URL, {
      autoConnect: false, // Don't connect until explicitly told
      reconnection: false, // Per CLAUDE.md: no reconnection in MVP
      transports: ['websocket'], // Skip HTTP polling; use WebSocket from the start
    });
  }
  return socket;
}

/**
 * Connect the socket
 */
export function connectSocket() {
  const s = getSocket();
  if (!s.connected && !s.connecting) {
    s.connect();
  }
}

/**
 * Disconnect the socket
 */
export function disconnectSocket() {
  const s = getSocket();
  if (s.connected || s.connecting) {
    s.disconnect();
  }
}

/**
 * Reset the socket (for starting fresh)
 */
export function resetSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

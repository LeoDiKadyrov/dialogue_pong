import React, { useRef, useState, useEffect } from 'react';
import {
  FIELD_WIDTH,
  FIELD_HEIGHT,
  PADDLE_WIDTH,
  PADDLE_HEIGHT,
  PADDLE_MARGIN,
  PLAYER_1,
  PLAYER_2,
  KEY_P1_UP,
  KEY_P1_DOWN,
  KEY_P2_UP,
  KEY_P2_DOWN,
  EV_INPUT,
  EV_GAME_STATE,
  EV_PADDLE_HIT,
  EV_GOAL,
  EV_MESSAGE,
  EV_OPPONENT_MESSAGE,
  EV_GAME_RESUME,
  EV_OPPONENT_LEFT,
  SERVER_TICK_MS,
  COLOR_PADDLE_P1,
  COLOR_PADDLE_P2,
} from '@shared/constants.js';
import { filterMessage } from '../game/profanity.js';
import { renderFrame } from '../game/renderer.js';
import { spawnParticles, updateParticles } from '../game/particles.js';
import soundManager from '../audio/soundManager.js';
import GameCanvas from './GameCanvas.jsx';
import SessionTimer from './SessionTimer.jsx';
import ChatFeed from './ChatFeed.jsx';
import DialogueModal from './DialogueModal.jsx';
import WaitingOverlay from './WaitingOverlay.jsx';
import GameOverScreen from './GameOverScreen.jsx';
import VolumeControl from './VolumeControl.jsx';

// Maximum ball trail length (positions stored)
const TRAIL_MAX = 6;

/**
 * NetworkGame — Online multiplayer game
 * Fully server-authoritative: no client-side physics, no local prediction.
 * Render loop extrapolates ball position between server ticks for smooth 144Hz motion.
 * Props: socket, playerId, roomId, onLeave, onPlayAgain
 */
function NetworkGame({ socket, playerId, roomId, onLeave, onPlayAgain }) {
  // Game state is entirely driven by the server
  const canvasRef = useRef(null);
  const gameStateRef = useRef({
    paddle1: { x: PADDLE_MARGIN, y: FIELD_HEIGHT / 2 - PADDLE_HEIGHT / 2, vy: 0 },
    paddle2: { x: FIELD_WIDTH - PADDLE_MARGIN - PADDLE_WIDTH, y: FIELD_HEIGHT / 2 - PADDLE_HEIGHT / 2, vy: 0 },
    ball: { x: FIELD_WIDTH / 2, y: FIELD_HEIGHT / 2, vx: -4, vy: 0 },
  });
  const scoresRef = useRef({ player1: 0, player2: 0 });
  const animFrameRef = useRef(null);
  // Tracks when the last EV_GAME_STATE arrived — used to extrapolate ball position
  // between server ticks so motion looks smooth at high refresh rates.
  const lastServerTimeRef = useRef(performance.now());

  // Particle and ball trail state (updated per render frame, no React state)
  const particlesRef = useRef([]);
  const ballTrailRef = useRef([]);

  // Ref mirror of dialogueState — avoids stale closure in key handlers
  const dialogueStateRef = useRef(null);

  // React state
  const [dialogueState, setDialogueState] = useState(null); // null | 'mine' | 'opponent'
  const [messages, setMessages] = useState([]);
  const [gameEnded, setGameEnded] = useState(false);
  const [endReason, setEndReason] = useState(null); // 'left' | 'opponentLeft'

  // Keep dialogueStateRef in sync with dialogueState
  useEffect(() => {
    dialogueStateRef.current = dialogueState;
  }, [dialogueState]);

  const isPlayer1 = playerId === PLAYER_1;
  const myUp = isPlayer1 ? KEY_P1_UP : KEY_P2_UP;
  const myDown = isPlayer1 ? KEY_P1_DOWN : KEY_P2_DOWN;

  /**
   * Render loop — server is authoritative for position, but we extrapolate
   * the ball forward between server ticks so motion is smooth at high refresh rates.
   * Paddles are not extrapolated (direction can change instantly on key press).
   * Capped at 3 ticks to prevent wild extrapolation on packet loss/tab blur.
   * Also updates particles and ball trail each frame (Phase 5).
   */
  const startRenderLoop = () => {
    // Reset server time on (re)start to prevent a stale large elapsed value
    // that would cause the ball to teleport on the first rendered frame.
    lastServerTimeRef.current = performance.now();
    let lastRenderTime = performance.now();

    const loop = (now) => {
      if (canvasRef.current) {
        const dtMs = Math.min(now - lastRenderTime, 50);
        const dt = (dtMs / 1000) * 60; // normalize to 60Hz units
        lastRenderTime = now;

        const ball = gameStateRef.current.ball;
        const elapsed = Math.min(performance.now() - lastServerTimeRef.current, SERVER_TICK_MS * 3);
        const serverDt = elapsed / SERVER_TICK_MS;
        const displayBall = {
          ...ball,
          x: ball.x + ball.vx * serverDt,
          y: ball.y + ball.vy * serverDt,
        };
        const displayState = {
          ...gameStateRef.current,
          ball: displayBall,
        };

        // Update particles and ball trail
        updateParticles(particlesRef.current, dt);
        ballTrailRef.current.push({ x: displayBall.x, y: displayBall.y });
        if (ballTrailRef.current.length > TRAIL_MAX) ballTrailRef.current.shift();

        renderFrame(
          canvasRef.current,
          displayState,
          scoresRef.current,
          particlesRef.current,
          ballTrailRef.current,
        );
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
  };

  const stopRenderLoop = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  };

  /**
   * Handle keydown — sends direction to server only (no local prediction).
   * Uses dialogueStateRef to avoid stale closure.
   */
  const handleKeyDown = (e) => {
    if (dialogueStateRef.current !== null) return;
    if (e.code === myUp) {
      e.preventDefault();
      socket.emit(EV_INPUT, { direction: -1 });
    } else if (e.code === myDown) {
      e.preventDefault();
      socket.emit(EV_INPUT, { direction: 1 });
    }
  };

  const handleKeyUp = (e) => {
    if (e.code === myUp || e.code === myDown) {
      e.preventDefault();
      socket.emit(EV_INPUT, { direction: 0 });
    }
  };

  /**
   * Stop paddle movement when window loses focus (prevents stuck keys on Alt-Tab)
   */
  const handleBlur = () => {
    socket.emit(EV_INPUT, { direction: 0 });
  };

  const handleMessageSubmit = (text) => {
    const filtered = filterMessage(text);
    socket.emit(EV_MESSAGE, { text: filtered });
  };

  /**
   * Leave Game button — show GameOverScreen instead of leaving immediately
   */
  const handleLeaveGame = () => {
    stopRenderLoop();
    soundManager.stopBgMusic();
    setEndReason('left');
    setGameEnded(true);
  };

  /**
   * Setup audio, socket events, and input handlers
   */
  useEffect(() => {
    soundManager.init();
    soundManager.startBgMusic();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    // Apply authoritative state from server every tick.
    // Both paddles updated here — no client-side prediction at any point.
    // Reset lastServerTimeRef so extrapolation starts fresh from this snapshot.
    socket.on(EV_GAME_STATE, (data) => {
      gameStateRef.current.ball = { ...data.ball };
      gameStateRef.current.paddle1.y = data.paddle1y;
      gameStateRef.current.paddle2.y = data.paddle2y;
      lastServerTimeRef.current = performance.now();
    });

    socket.on(EV_PADDLE_HIT, ({ hitter }) => {
      soundManager.play('blip');

      // Spawn particles at current ball position in the hitter's color
      const { ball } = gameStateRef.current;
      const color = hitter === PLAYER_1 ? COLOR_PADDLE_P1 : COLOR_PADDLE_P2;
      spawnParticles(particlesRef.current, ball.x, ball.y, color);

      stopRenderLoop();
      if (hitter === playerId) {
        setDialogueState('mine');
      } else {
        setDialogueState('opponent');
      }
    });

    socket.on(EV_GOAL, ({ scorer, scores, ball }) => {
      soundManager.play('goal');
      scoresRef.current = { ...scores };
      // Clear trail on goal so old positions don't show at wrong location
      ballTrailRef.current = [];
      // Apply ball reset immediately so the ball snaps to center
      if (ball) {
        gameStateRef.current.ball = { ...ball };
      }
    });

    socket.on(EV_OPPONENT_MESSAGE, ({ player, text }) => {
      soundManager.play('receiveChime');
      setMessages((prev) => [...prev, { player, text, timestamp: Date.now() }]);
    });

    socket.on(EV_GAME_RESUME, () => {
      setDialogueState(null);
      startRenderLoop();
    });

    socket.on(EV_OPPONENT_LEFT, () => {
      stopRenderLoop();
      soundManager.stopBgMusic();
      ballTrailRef.current = [];
      setEndReason('opponentLeft');
      setGameEnded(true);
    });

    startRenderLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      socket.off(EV_GAME_STATE);
      socket.off(EV_PADDLE_HIT);
      socket.off(EV_GOAL);
      socket.off(EV_OPPONENT_MESSAGE);
      socket.off(EV_GAME_RESUME);
      socket.off(EV_OPPONENT_LEFT);
      stopRenderLoop();
      soundManager.stopBgMusic();
      soundManager.close();
    };
  }, [playerId, socket]);

  if (gameEnded) {
    return (
      <GameOverScreen
        reason={endReason}
        messages={messages}
        playerId={playerId}
        onPlayAgain={onPlayAgain}
        onMainMenu={onLeave}
      />
    );
  }

  return (
    <div className="app-container">
      <h1 className="app-title">Dialogue Pong — Online ({playerId === PLAYER_1 ? 'P1' : 'P2'})</h1>

      <div className="game-wrapper">
        <GameCanvas ref={canvasRef} />
        <SessionTimer />

        {dialogueState === 'mine' && (
          <DialogueModal
            player={playerId}
            onSubmit={handleMessageSubmit}
          />
        )}

        {dialogueState === 'opponent' && (
          <WaitingOverlay waitingFor={playerId === PLAYER_1 ? PLAYER_2 : PLAYER_1} />
        )}
      </div>

      <ChatFeed messages={messages} />

      <div className="controls">
        <button className="back-button" onClick={handleLeaveGame}>
          ← Leave Game
        </button>
        <VolumeControl />
      </div>

      <div className="instructions">
        <p><strong>{isPlayer1 ? 'You' : 'Opponent'}:</strong> W/S (up/down)</p>
        <p><strong>{!isPlayer1 ? 'You' : 'Opponent'}:</strong> Arrow Up/Down</p>
      </div>
    </div>
  );
}

export default NetworkGame;

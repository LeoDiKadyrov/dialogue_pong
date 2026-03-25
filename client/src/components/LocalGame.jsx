import React, { useRef, useState, useEffect } from 'react';
import { useCanvasScale } from '../hooks/useCanvasScale.js';
import {
  FIELD_WIDTH,
  FIELD_HEIGHT,
  PADDLE_WIDTH,
  PADDLE_HEIGHT,
  PADDLE_MARGIN,
  BALL_RADIUS,
  PLAYER_1,
  PLAYER_2,
  COLOR_PADDLE_P1,
  COLOR_PADDLE_P2,
  SOUND_DEFAULT_MUSIC,
  SOUND_DIALOGUE_MUSIC_DUCK,
} from '@shared/constants.js';
import { createInputHandlers } from '../game/input.js';
import { resetBall } from '../game/physics.js';
import { createGameLoop } from '../game/gameLoop.js';
import { filterMessage } from '../game/profanity.js';
import { spawnParticles } from '../game/particles.js';
import soundManager from '../audio/soundManager.js';
import GameCanvas from './GameCanvas.jsx';
import SessionTimer from './SessionTimer.jsx';
import RestartButton from './RestartButton.jsx';
import DialogueModal from './DialogueModal.jsx';
import ChatFeed from './ChatFeed.jsx';
import VolumeControl from './VolumeControl.jsx';

/**
 * LocalGame — Local 2-player game
 * Extracted from original App.jsx
 * Props: onBack (callback to return to menu)
 */
function LocalGame({ onBack }) {
  // Scale factor for mobile — CSS transform scales the game wrapper without
  // touching physics coordinates (which always run at 800×600 internally).
  const scale = useCanvasScale();

  // Canvas and game refs (no re-renders per frame)
  const canvasRef = useRef(null);
  const keysRef = useRef(new Set());
  const gameLoopRef = useRef(null);

  // Game state ref (updated per frame, not React state)
  const gameStateRef = useRef({
    paddle1: {
      x: PADDLE_MARGIN,
      y: FIELD_HEIGHT / 2 - PADDLE_HEIGHT / 2,
      vy: 0,
    },
    paddle2: {
      x: FIELD_WIDTH - PADDLE_MARGIN - PADDLE_WIDTH,
      y: FIELD_HEIGHT / 2 - PADDLE_HEIGHT / 2,
      vy: 0,
    },
    ball: {
      x: FIELD_WIDTH / 2,
      y: FIELD_HEIGHT / 2,
      vx: -4,
      vy: 0,
    },
  });

  // Scores ref (updated when goal scored, triggers React state update)
  const scoresRef = useRef({
    player1: 0,
    player2: 0,
  });

  // Particle and trail refs (updated per frame, no React re-renders)
  const particlesRef = useRef([]);
  const ballTrailRef = useRef([]);

  // Dialogue state (Phase 2+)
  const [dialogueState, setDialogueState] = useState(null); // null | 'player1' | 'player2'
  const [messages, setMessages] = useState([]); // { player, text, timestamp }[]

  // Input handlers
  const inputHandlers = useRef(null);
  const gameLoop = useRef(null);

  /**
   * Initialize game and set up event listeners
   */
  useEffect(() => {
    // Init audio (lazy AudioContext, safe to call here — game hasn't started yet;
    // actual sound will only play after first user interaction per browser policy)
    soundManager.init();
    soundManager.startBgMusic();

    // Create input handlers
    inputHandlers.current = createInputHandlers(keysRef);
    inputHandlers.current.attach();

    // Create game loop
    gameLoop.current = createGameLoop(
      {
        canvasRef,
        gameStateRef,
        keysRef,
        gameLoopRef,
        scoresRef,
        particlesRef,
        ballTrailRef,
      },
      handleGoal,
      handlePaddleHit,
      handleWallBounce,
    );

    // Start the game
    gameLoop.current.start();

    // Cleanup on unmount
    return () => {
      inputHandlers.current.detach();
      gameLoop.current.stop();
      soundManager.stopBgMusic();
      soundManager.close();
    };
  }, []);

  /**
   * Handle goal scored - update score, play goal sound
   * @param {string} scorer - PLAYER_1 or PLAYER_2
   */
  const handleGoal = (scorer) => {
    soundManager.play('goal');

    // Update scores ref
    scoresRef.current[scorer === PLAYER_1 ? 'player1' : 'player2']++;
  };

  /**
   * Handle paddle hit - pause game, play blip, spawn particles, show dialogue modal
   * @param {string} hitter - PLAYER_1 or PLAYER_2
   */
  const handlePaddleHit = (hitter) => {
    soundManager.play('blip');

    // Spawn particles at ball position in paddle color
    const { ball } = gameStateRef.current;
    const color = hitter === PLAYER_1 ? COLOR_PADDLE_P1 : COLOR_PADDLE_P2;
    spawnParticles(particlesRef.current, ball.x, ball.y, color);

    keysRef.current.clear(); // Flush stale keyboard inputs
    setDialogueState(hitter); // Show modal for hitter
  };

  /**
   * Handle wall bounce — play bonk sound
   */
  const handleWallBounce = () => {
    soundManager.play('bonk');
  };

  /**
   * Handle message submission from dialogue modal
   * @param {string} text - Message text
   */
  const handleMessageSubmit = (text) => {
    const filtered = filterMessage(text);
    setMessages((prev) => [
      ...prev,
      {
        player: dialogueState,
        text: filtered,
        timestamp: Date.now(),
      },
    ]);
    setDialogueState(null); // Close modal
    gameLoop.current.start(); // Resume game
  };

  /**
   * Handle restart button - reset game state and scores
   */
  const handleRestart = () => {
    // Stop loop
    gameLoop.current.stop();

    // Reset game state
    gameStateRef.current = {
      paddle1: {
        x: PADDLE_MARGIN,
        y: FIELD_HEIGHT / 2 - PADDLE_HEIGHT / 2,
        vy: 0,
      },
      paddle2: {
        x: FIELD_WIDTH - PADDLE_MARGIN - PADDLE_WIDTH,
        y: FIELD_HEIGHT / 2 - PADDLE_HEIGHT / 2,
        vy: 0,
      },
      ball: {
        x: FIELD_WIDTH / 2,
        y: FIELD_HEIGHT / 2,
        vx: -4,
        vy: 0,
      },
    };

    // Reset scores
    scoresRef.current = { player1: 0, player2: 0 };

    // Reset dialogue state (Phase 2+)
    setDialogueState(null);
    setMessages([]);

    // Clear particles and trail
    particlesRef.current = [];
    ballTrailRef.current = [];

    // Clear pressed keys
    keysRef.current.clear();

    // Restart loop
    gameLoop.current.start();
  };

  // SessionTimer: ~44px rendered height + 16px gap below canvas
  const GAME_WRAPPER_EXTRA_HEIGHT = 60;

  return (
    <div className="app-container">
      <h1 className="app-title">Dialogue Pong — Local</h1>

      <div style={{
        height: scale < 1 ? `${(FIELD_HEIGHT + GAME_WRAPPER_EXTRA_HEIGHT) * scale}px` : undefined,
      }}>
        <div className="game-wrapper" style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
        }}>
          <GameCanvas ref={canvasRef} />
          <SessionTimer />
          {dialogueState && (
            <DialogueModal
              player={dialogueState}
              onSubmit={handleMessageSubmit}
            />
          )}
        </div>
      </div>

      <ChatFeed messages={messages} />

      <div className="controls">
        <RestartButton onRestart={handleRestart} />
        <button className="back-button" onClick={onBack}>
          ← Back to Menu
        </button>
        <VolumeControl />
      </div>

      <div className="instructions">
        <p><strong>Player 1:</strong> W (up) / S (down)</p>
        <p><strong>Player 2:</strong> Arrow Up / Arrow Down</p>
      </div>
    </div>
  );
}

export default LocalGame;

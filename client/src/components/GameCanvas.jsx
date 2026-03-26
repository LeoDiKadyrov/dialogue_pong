import React from 'react';
import { FIELD_WIDTH, FIELD_HEIGHT } from '@shared/constants.js';
import '../styles/GameCanvas.css';

/**
 * GameCanvas component - Canvas element for rendering game
 * Exported as forwardRef to allow App.jsx to access canvas directly
 */
const GameCanvas = React.forwardRef((props, ref) => {
  return (
    <canvas
      ref={ref}
      width={FIELD_WIDTH}
      height={FIELD_HEIGHT}
      aria-label="Chat Pong game canvas"
      className="game-canvas"
    />
  );
});

GameCanvas.displayName = 'GameCanvas';

export default GameCanvas;

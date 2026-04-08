import {
  KEY_P1_UP,
  KEY_P1_DOWN,
  KEY_P2_UP,
  KEY_P2_DOWN,
  PADDLE_SPEED,
} from '@shared/constants.js';

/**
 * Creates input handlers for keyboard input
 * Stores pressed keys in a Set to handle simultaneous keypresses
 * @param {React.MutableRefObject} keysRef - Reference to store pressed keys
 * @returns {object} Object with attach() and detach() functions
 */
export function createInputHandlers(keysRef) {
  const handleKeyDown = (event) => {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    if (
      event.code === KEY_P1_UP ||
      event.code === KEY_P1_DOWN ||
      event.code === KEY_P2_UP ||
      event.code === KEY_P2_DOWN
    ) {
      event.preventDefault();
      keysRef.current.add(event.code);
    }
  };

  const handleKeyUp = (event) => {
    keysRef.current.delete(event.code);
  };

  return {
    attach() {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
    },
    detach() {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    },
  };
}

/**
 * Updates paddle positions based on current input
 * @param {Set} pressedKeys - Set of currently pressed key codes
 * @param {object} gameState - Game state object with paddles
 */
export function updateInput(pressedKeys, gameState) {
  const { paddle1, paddle2 } = gameState;

  // Player 1: W/S
  let p1Velocity = 0;
  if (pressedKeys.has(KEY_P1_UP)) p1Velocity -= PADDLE_SPEED;
  if (pressedKeys.has(KEY_P1_DOWN)) p1Velocity += PADDLE_SPEED;
  paddle1.vy = p1Velocity;

  // Player 2: Arrow Up/Down
  let p2Velocity = 0;
  if (pressedKeys.has(KEY_P2_UP)) p2Velocity -= PADDLE_SPEED;
  if (pressedKeys.has(KEY_P2_DOWN)) p2Velocity += PADDLE_SPEED;
  paddle2.vy = p2Velocity;
}

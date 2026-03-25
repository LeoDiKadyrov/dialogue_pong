import React, { useState, useEffect, useRef } from 'react';
import {
  PLAYER_1,
  MESSAGE_MAX_LENGTH,
  DIALOGUE_TIMEOUT_MS,
  COLOR_PADDLE_P1,
  COLOR_PADDLE_P2,
  SOUND_DEFAULT_MUSIC,
  SOUND_DIALOGUE_MUSIC_DUCK,
} from '@shared/constants.js';
import soundManager from '../audio/soundManager.js';
import '../styles/DialogueModal.css';

/**
 * DialogueModal - Modal overlay for player to type a message
 * Shows only to the player whose paddle was just hit
 */
function DialogueModal({ player, onSubmit }) {
  const [text, setText] = useState('');
  const [timeLeft, setTimeLeft] = useState(DIALOGUE_TIMEOUT_MS / 1000);
  const [submitted, setSubmitted] = useState(false);
  const textareaRef = useRef(null);

  // Determine player label and color
  const isPlayer1 = player === PLAYER_1;
  const playerLabel = isPlayer1 ? 'Player 1' : 'Player 2';
  const playerColor = isPlayer1 ? COLOR_PADDLE_P1 : COLOR_PADDLE_P2;

  // On mount: play whoosh, duck background music
  useEffect(() => {
    soundManager.play('whoosh');
    soundManager.fadeBgMusic(SOUND_DIALOGUE_MUSIC_DUCK, 300);
    textareaRef.current?.focus();
    // On unmount: restore music volume
    return () => {
      soundManager.fadeBgMusic(SOUND_DEFAULT_MUSIC, 300);
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          // Auto-submit silence if timer expires
          handleSubmit('...');
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (messageText = text) => {
    if (submitted) return;
    setSubmitted(true);
    soundManager.play('sendAlert');
    onSubmit(messageText || '...');
  };

  const handleTextChange = (e) => {
    const newText = e.target.value;
    if (newText.length <= MESSAGE_MAX_LENGTH) {
      setText(newText);
    }
  };

  const handleKeyDown = (e) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (text.trim().length === 0) return;
      handleSubmit();
    }
  };

  const isDisabled = text.trim().length === 0 || submitted;
  const timerColor = timeLeft <= 10 ? '#FF006E' : '#00D9FF'; // Red if <10s

  return (
    <div className="dialogue-modal-overlay">
      <div className="dialogue-modal" style={{ borderColor: playerColor }}>
        <h2 className="dialogue-header" style={{ color: playerColor }}>
          {playerLabel}, say something...
        </h2>

        <textarea
          ref={textareaRef}
          className="dialogue-textarea"
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message (1-200 chars)..."
          maxLength={MESSAGE_MAX_LENGTH}
          disabled={submitted}
          style={{ borderColor: playerColor }}
        />

        <div className="dialogue-footer">
          <div className="dialogue-timer" style={{ color: timerColor }}>
            {Math.ceil(timeLeft)}s
          </div>

          <div className="dialogue-counter">
            {text.length}/{MESSAGE_MAX_LENGTH}
          </div>

          <button
            className="dialogue-send-button"
            onClick={() => handleSubmit()}
            disabled={isDisabled}
            style={{
              borderColor: playerColor,
              color: playerColor,
              opacity: isDisabled ? 0.5 : 1,
            }}
          >
            Send →
          </button>
        </div>

        {submitted && (
          <p className="dialogue-submitting">Submitting...</p>
        )}
      </div>
    </div>
  );
}

export default DialogueModal;

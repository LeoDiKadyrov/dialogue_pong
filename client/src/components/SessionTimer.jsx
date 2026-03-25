import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/SessionTimer.css';

/**
 * SessionTimer — Shows elapsed time since the game session started.
 * Replaces ScoreBoard: conveys "how long have we been talking" without competitive scores.
 */
function SessionTimer() {
  const { t } = useTranslation();
  const [elapsed, setElapsed] = useState(0); // seconds
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setElapsed((s) => s + 1);
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;
  const pad = (n) => String(n).padStart(2, '0');
  const display = hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;

  return (
    <div className="session-timer" aria-label="Session duration">
      <span className="session-timer-label">{t('session.label')}</span>
      <span className="session-timer-value">{display}</span>
    </div>
  );
}

export default SessionTimer;

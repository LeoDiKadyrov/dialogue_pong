import React from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/WaitingScreen.css';

/**
 * WaitingScreen — Shown while in matchmaking queue
 * Props: onCancel (callback to leave queue and return to menu)
 */
function WaitingScreen({ onCancel }) {
  const { t } = useTranslation();
  return (
    <div className="waiting-container">
      <h1 className="waiting-title">{t('waiting.title')}</h1>

      <div className="waiting-spinner">
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>

      <p className="waiting-text">
        {t('waiting.text')}
      </p>

      <button className="waiting-cancel-button" onClick={onCancel}>
        {t('waiting.cancel')}
      </button>
    </div>
  );
}

export default WaitingScreen;

import React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import '../styles/HowToPlay.css';

/**
 * HowToPlay — Modal overlay explaining game mechanics.
 * Closed by clicking the X button or the backdrop.
 * @param {function} onClose - callback to close modal
 */
function HowToPlay({ onClose }) {
  const { t } = useTranslation();
  return (
    <div className="howtoplay-backdrop" onClick={onClose}>
      <div className="howtoplay-modal" onClick={(e) => e.stopPropagation()}>
        <button className="howtoplay-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <h2 className="howtoplay-title">{t('howtoplay.title')}</h2>

        <ul className="howtoplay-list">
          <li>
            <span className="howtoplay-icon">🏓</span>
            <span>{t('howtoplay.rule1')}</span>
          </li>
          <li>
            <span className="howtoplay-icon">✍️</span>
            <span><Trans i18nKey="howtoplay.rule2" /></span>
          </li>
          <li>
            <span className="howtoplay-icon">💬</span>
            <span>{t('howtoplay.rule3')}</span>
          </li>
          <li>
            <span className="howtoplay-icon">🎯</span>
            <span>{t('howtoplay.rule4')}</span>
          </li>
        </ul>

        <div className="howtoplay-controls">
          <h3 className="howtoplay-controls-title">{t('howtoplay.controlsTitle')}</h3>
          <div className="howtoplay-controls-grid">
            <span className="howtoplay-player">{t('howtoplay.player1')}</span>
            <span className="howtoplay-keys">{t('howtoplay.keys1')}</span>
            <span className="howtoplay-player">{t('howtoplay.player2')}</span>
            <span className="howtoplay-keys">{t('howtoplay.keys2')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HowToPlay;

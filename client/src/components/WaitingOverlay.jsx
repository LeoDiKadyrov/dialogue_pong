import React from 'react';
import { useTranslation } from 'react-i18next';
import { PLAYER_1, COLOR_PADDLE_P1, COLOR_PADDLE_P2 } from '@shared/constants.js';

/**
 * WaitingOverlay — Shown to non-hitter when opponent is typing
 * Props: waitingFor ('player1' or 'player2')
 */
function WaitingOverlay({ waitingFor }) {
  const { t } = useTranslation();
  const playerName = waitingFor === PLAYER_1 ? t('howtoplay.player1') : t('howtoplay.player2');
  const playerColor = waitingFor === PLAYER_1 ? COLOR_PADDLE_P1 : COLOR_PADDLE_P2;

  return (
    <div className="dialogue-modal-overlay">
      <div className="waiting-overlay-content" style={{ borderColor: playerColor }}>
        <p className="waiting-overlay-text" style={{ color: playerColor }}>
          {t('waiting_overlay.typing', { playerName })}
        </p>
        <div className="waiting-overlay-dots">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      </div>
    </div>
  );
}

export default WaitingOverlay;

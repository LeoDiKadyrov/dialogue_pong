import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * RestartButton component - Button to reset game state
 */
function RestartButton({ onRestart }) {
  const { t } = useTranslation();
  return (
    <button className="restart-button" onClick={onRestart}>
      {t('controls.restart')}
    </button>
  );
}

export default RestartButton;

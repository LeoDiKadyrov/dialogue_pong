import React from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/GameOverScreen.css';

/**
 * GameOverScreen — Shown when game ends (player left or opponent disconnected).
 * Displays dialogue history and options to save, play again, or return to menu.
 * @param {string} reason - 'left' | 'opponentLeft'
 * @param {Array} messages - [{player, text, timestamp}]
 * @param {string} playerId - local player's ID
 * @param {function} onPlayAgain - rejoin matchmaking queue
 * @param {function} onMainMenu - return to main menu
 */
function GameOverScreen({ reason, messages, playerId, onPlayAgain, onMainMenu }) {
  const { t } = useTranslation();
  const reasonText =
    reason === 'opponentLeft'
      ? t('gameover.opponentLeft')
      : t('gameover.youLeft');

  /**
   * Download the full dialogue as a .txt file via Blob API.
   * Includes timestamp, players, and each message.
   */
  const handleSave = () => {
    const lines = ['Dialogue Pong — Conversation Log', '='.repeat(40), ''];
    messages.forEach(({ player, text, timestamp }) => {
      const time = new Date(timestamp).toLocaleTimeString();
      const label = player === playerId ? 'You' : 'Opponent';
      lines.push(`[${time}] ${label}: ${text}`);
    });
    lines.push('', '='.repeat(40));
    lines.push(`Exported from Dialogue Pong on ${new Date().toLocaleDateString()}`);

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dialogue-pong-conversation.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="gameover-overlay">
      <div className="gameover-container">
        <h1 className="gameover-title">{t('gameover.title')}</h1>
        <p className="gameover-reason">{reasonText}</p>

        <div className="gameover-history">
          <h2 className="gameover-history-title">{t('gameover.conversation')}</h2>
          {messages.length === 0 ? (
            <p className="gameover-no-messages">{t('gameover.noMessages')}</p>
          ) : (
            <ul className="gameover-messages">
              {messages.map(({ player, text, timestamp }, i) => {
                const isMe = player === playerId;
                return (
                  <li
                    key={i}
                    className={`gameover-message ${isMe ? 'gameover-message-mine' : 'gameover-message-theirs'}`}
                  >
                    <span className="gameover-message-label">{isMe ? t('gameover.labelYou') : t('gameover.labelOpponent')}</span>
                    <span className="gameover-message-text">{text}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="gameover-actions">
          {messages.length > 0 && (
            <button className="gameover-btn gameover-btn-save" onClick={handleSave}>
              {t('gameover.saveConversation')}
            </button>
          )}
          <button className="gameover-btn gameover-btn-again" onClick={onPlayAgain}>
            {t('gameover.playAgain')}
          </button>
          <button className="gameover-btn gameover-btn-menu" onClick={onMainMenu}>
            {t('gameover.mainMenu')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameOverScreen;

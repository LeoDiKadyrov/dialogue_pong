import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import HowToPlay from './HowToPlay.jsx';
import '../styles/MenuScreen.css';

const STATS_POLL_MS = 30000;

/**
 * MenuScreen — Main menu with Local / Online game options and HowToPlay modal
 */
function MenuScreen({ onLocal, onOnline }) {
  const { t } = useTranslation();
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats');
        if (!res.ok) return;
        const data = await res.json();
        setStats({
          totalPlayers: data.onlinePlayers,
          totalDialogues: data.totalMessages,
        });
      } catch {
        // Keep previous state on error
      }
    }

    fetchStats();
    const interval = setInterval(fetchStats, STATS_POLL_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="menu-container">
      <h1 className="menu-title">{t('appTitle')}</h1>
      <p className="menu-subtitle">{t('menu.subtitle')}</p>

      <div className="menu-buttons">
        <button className="menu-button menu-local" onClick={onLocal}>
          <span className="menu-button-icon">🎮</span>
          <span className="menu-button-text">{t('menu.playLocal')}</span>
          <span className="menu-button-desc">{t('menu.playLocalDesc')}</span>
        </button>

        <button className="menu-button menu-online" onClick={onOnline}>
          <span className="menu-button-icon">🌐</span>
          <span className="menu-button-text">{t('menu.playOnline')}</span>
          <span className="menu-button-desc">{t('menu.playOnlineDesc')}</span>
        </button>
      </div>

      <div className="menu-stats">
        <span>👥 {stats ? stats.totalPlayers.toLocaleString() : '—'} {t('menu.stats.playersLabel')}</span>
        <span>💬 {stats ? stats.totalDialogues.toLocaleString() : '—'} {t('menu.stats.dialoguesLabel')}</span>
      </div>

      <div className="menu-footer">
        <p>{t('menu.footer1')}</p>
        <p>{t('menu.footer2')}</p>
      </div>

      <button
        className="menu-howtoplay-btn"
        onClick={() => setShowHowToPlay(true)}
        aria-label={t('menu.howToPlayAria')}
      >
        ?
      </button>

      {showHowToPlay && <HowToPlay onClose={() => setShowHowToPlay(false)} />}
    </div>
  );
}

export default MenuScreen;

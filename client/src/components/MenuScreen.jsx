import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import HowToPlay from './HowToPlay.jsx';
import '../styles/MenuScreen.css';

const STATS_POLL_MS = 30000;

/**
 * MenuScreen — Main menu with Local / Online game options and HowToPlay modal
 */
const DONATE_OPTIONS = [
  { label: 'Boosty', href: 'https://boosty.to/leodikadyrov/donate', color: '#ff6b35' },
  { label: 'Ko-fi', href: 'https://ko-fi.com/leodikadyrov', color: '#29abe0' },
  { label: 'USDT TRC-20', href: null, copy: 'TK1a57uV8ecdjLykVmA6okpZH5bD1q5Srh', color: '#26a17b' },
  { label: 'USDT ERC-20', href: null, copy: '0x030a1fd9b364b8ed25371ae33de368b99b2c0eb5', color: '#627eea' },
];

function MenuScreen({ onLocal, onOnline }) {
  const { t } = useTranslation();
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showDonate, setShowDonate] = useState(false);
  const [copied, setCopied] = useState(null);
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

      <button
        className="menu-donate-btn"
        onClick={() => setShowDonate(true)}
        aria-label="Support the developer"
      >
        ♥
      </button>

      {showDonate && (
        <div className="donate-overlay" onClick={() => setShowDonate(false)}>
          <div className="donate-modal" onClick={e => e.stopPropagation()}>
            <p className="donate-title">Support the dev</p>
            {DONATE_OPTIONS.map(opt => (
              opt.href ? (
                <a
                  key={opt.label}
                  href={opt.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="donate-option"
                  style={{ borderColor: opt.color, color: opt.color }}
                >
                  {opt.label}
                </a>
              ) : (
                <button
                  key={opt.label}
                  className="donate-option donate-copy"
                  style={{ borderColor: opt.color, color: opt.color }}
                  onClick={() => {
                    navigator.clipboard.writeText(opt.copy);
                    setCopied(opt.label);
                    setTimeout(() => setCopied(null), 2000);
                  }}
                >
                  {copied === opt.label ? '✓ Copied!' : opt.label}
                </button>
              )
            ))}
            <button className="donate-close" onClick={() => setShowDonate(false)}>✕</button>
          </div>
        </div>
      )}

      {showHowToPlay && <HowToPlay onClose={() => setShowHowToPlay(false)} />}
    </div>
  );
}

export default MenuScreen;

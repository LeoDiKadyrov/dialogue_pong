import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getSocket, connectSocket, disconnectSocket, resetSocket } from './network/socket.js';
import { EV_JOIN_QUEUE, EV_LEAVE_QUEUE, EV_MATCH_FOUND } from '@shared/constants.js';
import MenuScreen from './components/MenuScreen.jsx';
import LocalGame from './components/LocalGame.jsx';
import WaitingScreen from './components/WaitingScreen.jsx';
import NetworkGame from './components/NetworkGame.jsx';
import LanguagePicker from './components/LanguagePicker.jsx';
import './App.css';

const BUG_REPORT_BASE_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScGaAcscqVJCTBO63QjhFAcchOeGuDoKxYHnMdEO1BGqNyI4g/viewform';

const HL_MAP = {
  en: 'en', fr: 'fr', de: 'de', es: 'es',
  pt: 'pt-BR', ru: 'ru', zh: 'zh-CN', ja: 'ja', ar: 'ar',
};

function App() {
  const { i18n, t } = useTranslation();
  // Game mode: 'menu' | 'local' | 'waiting' | 'online'
  const [mode, setMode] = useState('menu');
  const [networkSession, setNetworkSession] = useState(null); // { socket, playerId, roomId }

  // Handle RTL for Arabic, LTR for all others
  useEffect(() => {
    const lang = i18n.language.split('-')[0];
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [i18n.language]);

  const bugFormUrl = `${BUG_REPORT_BASE_URL}?hl=${HL_MAP[i18n.language] || 'en'}`;

  /**
   * Handle Local game button
   */
  const handlePlayLocal = () => {
    setMode('local');
  };

  /**
   * Handle Online game button
   */
  const handlePlayOnline = () => {
    const socket = getSocket();

    // Setup match found listener before joining queue
    socket.once(EV_MATCH_FOUND, (data) => {
      console.log('[App] Match found:', data);
      setNetworkSession({
        socket,
        playerId: data.playerId,
        roomId: data.roomId,
      });
      setMode('online');
    });

    connectSocket();
    socket.emit(EV_JOIN_QUEUE, {});
    setMode('waiting');
  };

  /**
   * Handle leaving waiting queue
   */
  const handleLeaveQueue = () => {
    const socket = getSocket();
    socket.emit(EV_LEAVE_QUEUE, {});
    disconnectSocket();
    resetSocket();
    setMode('menu');
  };

  /**
   * Handle leaving online game
   */
  const handleLeaveOnline = () => {
    const socket = getSocket();
    socket.disconnect();
    resetSocket();
    setNetworkSession(null);
    setMode('menu');
  };

  /**
   * Handle "Play Again" from GameOverScreen — disconnect current session and rejoin queue
   */
  const handlePlayAgain = () => {
    const socket = getSocket();
    socket.disconnect();
    resetSocket();
    setNetworkSession(null);
    handlePlayOnline();
  };

  /**
   * Handle returning from local game
   */
  const handleBackToMenu = () => {
    setMode('menu');
  };

  return (
    <div id="root">
      <LanguagePicker />
      {mode === 'menu' && (
        <MenuScreen
          onLocal={handlePlayLocal}
          onOnline={handlePlayOnline}
        />
      )}

      {mode === 'local' && (
        <LocalGame onBack={handleBackToMenu} />
      )}

      {mode === 'waiting' && (
        <WaitingScreen onCancel={handleLeaveQueue} />
      )}

      {mode === 'online' && networkSession && (
        <NetworkGame
          socket={networkSession.socket}
          playerId={networkSession.playerId}
          roomId={networkSession.roomId}
          onLeave={handleLeaveOnline}
          onPlayAgain={handlePlayAgain}
        />
      )}

      <a
        href={bugFormUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="report-bug-btn"
        aria-label={t('controls.reportBugAria')}
      >
        🐛
      </a>
    </div>
  );
}

export default App;

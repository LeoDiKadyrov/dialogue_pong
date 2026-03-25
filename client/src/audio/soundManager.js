/**
 * soundManager — Singleton Web Audio API engine for Dialogue Pong
 * All sounds are synthesized programmatically; no audio files required.
 * AudioContext is created lazily after the first user gesture (browser requirement).
 */

let ctx = null;
let masterGain = null;
let musicGain = null;
let sfxGain = null;
let bgMusicNodes = [];   // Active oscillators / nodes for bg music
let isMuted = false;
let masterVolume = 0.8;
let musicVolume = 0.4;
let sfxVolume = 0.7;

/**
 * Create AudioContext and gain hierarchy (call once after a user gesture).
 * Safe to call multiple times — subsequent calls are no-ops.
 */
function init() {
  if (ctx) return;

  ctx = new (window.AudioContext || window.webkitAudioContext)();

  // Gain hierarchy: sfx/music → master → destination
  masterGain = ctx.createGain();
  masterGain.gain.value = masterVolume;
  masterGain.connect(ctx.destination);

  musicGain = ctx.createGain();
  musicGain.gain.value = musicVolume;
  musicGain.connect(masterGain);

  sfxGain = ctx.createGain();
  sfxGain.gain.value = sfxVolume;
  sfxGain.connect(masterGain);
}

/**
 * Internal helper — ensure ctx exists before playing sounds.
 * Returns false if audio unavailable.
 */
function ready() {
  if (!ctx) return false;
  if (ctx.state === 'suspended') ctx.resume();
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sound effects
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Paddle hit — short high-pitched blip (sine, 880→1200 Hz, 0.08s)
 */
function playBlip() {
  if (!ready()) return;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.08);

  env.gain.setValueAtTime(0.5, ctx.currentTime);
  env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

  osc.connect(env);
  env.connect(sfxGain);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.08);
}

/**
 * Wall bounce — muted medium bonk (triangle, 440→200 Hz, 0.15s)
 */
function playBonk() {
  if (!ready()) return;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(440, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);

  env.gain.setValueAtTime(0.35, ctx.currentTime);
  env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

  osc.connect(env);
  env.connect(sfxGain);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);
}

/**
 * Dialogue modal open — soft whoosh (white noise + bandpass, 0.3s)
 */
function playWhoosh() {
  if (!ready()) return;
  const bufferSize = ctx.sampleRate * 0.35;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1);
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(300, ctx.currentTime);
  filter.frequency.linearRampToValueAtTime(2000, ctx.currentTime + 0.3);
  filter.Q.value = 1.5;

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0, ctx.currentTime);
  env.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.05);
  env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

  noise.connect(filter);
  filter.connect(env);
  env.connect(sfxGain);
  noise.start(ctx.currentTime);
  noise.stop(ctx.currentTime + 0.35);
}

/**
 * Message sent — two ascending sine tones (523→784 Hz, 0.1s each)
 */
function playSendAlert() {
  if (!ready()) return;
  [523, 784].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    const t = ctx.currentTime + i * 0.11;

    osc.type = 'sine';
    osc.frequency.value = freq;

    env.gain.setValueAtTime(0.0, t);
    env.gain.linearRampToValueAtTime(0.3, t + 0.01);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(env);
    env.connect(sfxGain);
    osc.start(t);
    osc.stop(t + 0.12);
  });
}

/**
 * Message received — light chime chord (3 detuned sine waves, 523+659+784 Hz, 0.4s)
 */
function playReceiveChime() {
  if (!ready()) return;
  [523, 659, 784].forEach((freq) => {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;

    env.gain.setValueAtTime(0.0, ctx.currentTime);
    env.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(env);
    env.connect(sfxGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.42);
  });
}

/**
 * Goal — low resonating sine tone (80 Hz, 1.2s)
 */
function playGoal() {
  if (!ready()) return;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.value = 80;

  env.gain.setValueAtTime(0.0, ctx.currentTime);
  env.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 0.05);
  env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

  osc.connect(env);
  env.connect(sfxGain);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 1.25);
}

// Map of sound names to their play functions
const sounds = {
  blip: playBlip,
  bonk: playBonk,
  whoosh: playWhoosh,
  sendAlert: playSendAlert,
  receiveChime: playReceiveChime,
  goal: playGoal,
};

// ─────────────────────────────────────────────────────────────────────────────
// Background music — procedural ambient pad
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Starts looping ambient music: 3 detuned sawtooth oscillators with LFO modulation.
 * Style: lo-fi synthwave drone, ~60-80 BPM feel, contemplative mood.
 */
function startBgMusic() {
  if (!ready() || bgMusicNodes.length > 0) return;

  // Low-pass filter for warmth
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 900;
  filter.Q.value = 0.8;
  filter.connect(musicGain);

  // LFO — slow amplitude breathing (0.12 Hz)
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.type = 'sine';
  lfo.frequency.value = 0.12;
  lfoGain.gain.value = 0.06; // depth of LFO modulation
  lfo.connect(lfoGain);

  // Carrier gain that the LFO will modulate
  const carrierGain = ctx.createGain();
  carrierGain.gain.value = 0.12;
  lfoGain.connect(carrierGain.gain); // LFO modulates carrier amplitude
  carrierGain.connect(filter);

  // Three detuned oscillators for rich pad texture
  const freqs = [110, 110.4, 220.2];
  const oscs = freqs.map((freq) => {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;

    // Subtle pitch drift per oscillator for organic feel
    const driftAmount = (Math.random() - 0.5) * 0.3;
    osc.frequency.linearRampToValueAtTime(freq + driftAmount, ctx.currentTime + 8);
    osc.frequency.linearRampToValueAtTime(freq, ctx.currentTime + 16);

    osc.connect(carrierGain);
    osc.start(ctx.currentTime);
    return osc;
  });

  lfo.start(ctx.currentTime);

  bgMusicNodes = [...oscs, lfo, lfoGain, carrierGain, filter];
}

/**
 * Stops all background music nodes immediately.
 */
function stopBgMusic() {
  bgMusicNodes.forEach((node) => {
    try {
      if (node.stop) node.stop();
      node.disconnect();
    } catch (_) {
      // Already stopped — ignore
    }
  });
  bgMusicNodes = [];
}

/**
 * Smoothly ramp music gain to a new value over `ms` milliseconds.
 * Used to duck music during dialogue input.
 * @param {number} targetVolume - 0 to 1
 * @param {number} ms - Ramp duration in milliseconds
 */
function fadeBgMusic(targetVolume, ms = 300) {
  if (!musicGain) return;
  const t = ctx.currentTime;
  musicGain.gain.cancelScheduledValues(t);
  musicGain.gain.setValueAtTime(musicGain.gain.value, t);
  musicGain.gain.linearRampToValueAtTime(
    isMuted ? 0 : targetVolume * musicVolume,
    t + ms / 1000
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Volume control
// ─────────────────────────────────────────────────────────────────────────────

function setMasterVolume(v) {
  masterVolume = Math.max(0, Math.min(1, v));
  if (masterGain && !isMuted) masterGain.gain.value = masterVolume;
}

function setMusicVolume(v) {
  musicVolume = Math.max(0, Math.min(1, v));
  if (musicGain && !isMuted) musicGain.gain.value = musicVolume;
}

function setSfxVolume(v) {
  sfxVolume = Math.max(0, Math.min(1, v));
  if (sfxGain && !isMuted) sfxGain.gain.value = sfxVolume;
}

function getMusicVolume() { return musicVolume; }
function getSfxVolume()   { return sfxVolume; }

function setMuted(muted) {
  isMuted = muted;
  if (!masterGain) return;
  masterGain.gain.value = isMuted ? 0 : masterVolume;
}

function getIsMuted() { return isMuted; }

/**
 * Close the AudioContext — call when game session ends.
 * Safe to call multiple times (guards on ctx).
 */
function close() {
  if (!ctx) return;
  stopBgMusic();
  ctx.close();
  ctx = null;
  masterGain = null;
  musicGain = null;
  sfxGain = null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

const soundManager = {
  init,
  play(name) {
    if (!ready()) return;
    if (sounds[name]) sounds[name]();
  },
  startBgMusic,
  stopBgMusic,
  fadeBgMusic,
  setMasterVolume,
  setMusicVolume,
  setSfxVolume,
  getMusicVolume,
  getSfxVolume,
  setMuted,
  getIsMuted,
  close,
};

export default soundManager;

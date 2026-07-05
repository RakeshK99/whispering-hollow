// Small synthesized chiptune-style SFX via the Web Audio API — no audio
// files, matching the rest of the game (everything is generated in code,
// not loaded from asset files).
let audioCtx = null;
let muted = false;

function ensureContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

// Browsers only allow starting/resuming audio from inside a real user
// gesture handler, so unlock synchronously on the first key/pointer event
// rather than waiting for the game loop to get around to it.
export function initAudio() {
  const unlock = () => {
    ensureContext();
    window.removeEventListener("keydown", unlock);
    window.removeEventListener("pointerdown", unlock);
  };
  window.addEventListener("keydown", unlock);
  window.addEventListener("pointerdown", unlock);
}

export function setMuted(value) {
  muted = value;
}

export function isMuted() {
  return muted;
}

function playNote({ freq, duration = 0.12, type = "square", volume = 0.15, delay = 0, glideTo = null }) {
  if (muted) return;
  const ctx = ensureContext();
  const startAt = ctx.currentTime + delay;

  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startAt);
  if (glideTo) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(glideTo, 1), startAt + duration);
  }

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  osc.connect(gain).connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.02);
}

export function playFootstep() {
  playNote({ freq: 120, duration: 0.045, type: "square", volume: 0.05 });
}

export function playUiClick() {
  playNote({ freq: 900, duration: 0.03, type: "square", volume: 0.07 });
}

export function playBlip() {
  playNote({ freq: 480, duration: 0.05, type: "triangle", volume: 0.12 });
}

export function playPickupChime() {
  [523.25, 659.25, 783.99].forEach((freq, i) => {
    playNote({ freq, duration: 0.1, type: "square", volume: 0.14, delay: i * 0.09 });
  });
}

export function playStumpJingle() {
  [392.0, 493.88, 587.33, 783.99].forEach((freq, i) => {
    playNote({ freq, duration: 0.08, type: "square", volume: 0.12, delay: i * 0.07 });
  });
}

export function playPondBlorp() {
  playNote({ freq: 320, glideTo: 90, duration: 0.18, type: "sine", volume: 0.14 });
}

export function playCelebrationFanfare() {
  [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
    playNote({ freq, duration: 0.16, type: "triangle", volume: 0.16, delay: i * 0.11 });
  });
}

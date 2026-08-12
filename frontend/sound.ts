// Tiny synthesized SFX via the Web Audio API — no audio files, works in
// Telegram WebView + web. Must be primed on a user gesture (autoplay policy).
let ctx: AudioContext | null = null;
let muted = (() => {
  try { return localStorage.getItem("learningo_muted") === "1"; } catch { return false; }
})();

function getCtx(): AudioContext | null {
  if (muted) return null;
  if (!ctx) {
    const AC: typeof AudioContext | undefined =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch { return null; }
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

/** Call from a user-gesture handler so audio can start on mobile/Telegram. */
export function primeAudio() { getCtx(); }
export function isMuted() { return muted; }
export function toggleMuted(): boolean {
  muted = !muted;
  try { localStorage.setItem("learningo_muted", muted ? "1" : "0"); } catch {}
  if (!muted) getCtx();
  return muted;
}

function blip(freq: number, dur: number, type: OscillatorType, vol: number, slideTo?: number) {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.03);
}

export const sfx = {
  /** Countdown tick — urgency 0..1 raises pitch + volume → rising tension. */
  tick(urgency = 0) { blip(640 + urgency * 620, 0.05, "square", 0.05 + urgency * 0.13); },
  /** Opponent locked in their answer. */
  oppLock() { blip(420, 0.05, "square", 0.07); },
  correct() { blip(660, 0.09, "sine", 0.18); setTimeout(() => blip(990, 0.13, "sine", 0.18), 85); },
  wrong() { blip(200, 0.28, "sawtooth", 0.14, 110); },
  /** Combo milestone (3/5/7 in a row) — bright rising arpeggio. */
  combo(n = 3) { const base = 660 + n * 40; [0, 90, 180].forEach((d, i) => setTimeout(() => blip(base + i * 220, 0.1, "triangle", 0.16), d)); },
  /** VS reveal slam. */
  vs() { blip(130, 0.4, "sawtooth", 0.2, 520); },
  win() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => blip(f, 0.2, "triangle", 0.18), i * 110)); },
  lose() { blip(340, 0.42, "sine", 0.13, 150); },
  /** Applause burst — band-passed white noise with a fast swell + slow decay. */
  applause() {
    const c = getCtx();
    if (!c) return;
    const dur = 1.4;
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      const t = i / d.length;
      const swell = Math.min(1, t / 0.08) * Math.pow(1 - t, 1.5); // fast attack, slow tail
      d[i] = (Math.random() * 2 - 1) * swell;
    }
    const src = c.createBufferSource(); src.buffer = buf;
    const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 2200; bp.Q.value = 0.6;
    const g = c.createGain(); g.gain.value = 0.5;
    src.connect(bp).connect(g).connect(c.destination);
    src.start();
  },
  /** Lesson-complete celebration: applause + the triumphant win arpeggio. */
  celebrate() { this.applause(); this.win(); },
};

/* Synthesized sound effects via Web Audio — zero audio files, fully offline.
   Context is created lazily on first user gesture (autoplay policy). */

let ctx: AudioContext | null = null;
let muted = false;

function ac(): AudioContext | null {
  if (muted) return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function setMuted(m: boolean) {
  muted = m;
}
export function isMuted() {
  return muted;
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType,
  vol: number,
  when = 0,
  glideTo?: number
) {
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(dur: number, vol: number, filterFreq: number, when = 0) {
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + when;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = filterFreq;
  f.Q.value = 0.8;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f).connect(g).connect(c.destination);
  src.start(t0);
}

/** Short scrub burst — call repeatedly while brushing. */
export function brush() {
  noise(0.09, 0.18, 2600);
}

/** Water spray hiss. */
export function spray() {
  noise(0.22, 0.16, 5200);
}

/** Dental drill buzz — one short burst. */
export function drill() {
  tone(2400, 0.16, 'sawtooth', 0.05);
  tone(170, 0.16, 'square', 0.06);
}

/** Soft pop (tap feedback, debris flicked away). */
export function pop() {
  tone(440, 0.09, 'sine', 0.22, 0, 880);
}

/** Squelch for filling goo / gel. */
export function squish() {
  tone(300, 0.18, 'sine', 0.2, 0, 90);
}

/** Wiggle creak for loose tooth. */
export function creak() {
  tone(180, 0.12, 'triangle', 0.16, 0, 240);
}

/** Tooth out — pop + boing. */
export function pull() {
  tone(220, 0.1, 'sine', 0.25, 0, 700);
  tone(520, 0.22, 'triangle', 0.18, 0.08, 260);
}

/** Sparkle chime when a tooth is fully fixed. */
export function sparkle() {
  tone(880, 0.12, 'sine', 0.16);
  tone(1320, 0.12, 'sine', 0.14, 0.07);
  tone(1760, 0.18, 'sine', 0.12, 0.14);
}

/** Gentle "uh oh" for wrong tool — never harsh. */
export function uhoh() {
  tone(330, 0.14, 'sine', 0.14, 0, 290);
}

/** Patient-complete fanfare. */
export function fanfare() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((f, i) => tone(f, 0.22, 'triangle', 0.2, i * 0.12));
  tone(1319, 0.4, 'sine', 0.16, 0.5);
}

/** Star earned ding. */
export function ding() {
  tone(988, 0.15, 'sine', 0.2);
  tone(1480, 0.25, 'sine', 0.15, 0.06);
}

/** Animal happy chirp (generic). */
export function chirp() {
  tone(600, 0.1, 'sine', 0.18, 0, 900);
  tone(900, 0.12, 'sine', 0.15, 0.1, 1200);
}

/**
 * FitFlow Pulse — original procedural music, no samples or external assets.
 * Run: node scripts/promo/generate-audio.mjs
 * 30 seconds, 120 BPM, stereo 48 kHz / 16-bit PCM. All randomness is seeded.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const SAMPLE_RATE = 48_000;
const DURATION = 30;
const BEAT = 0.5;
const SAMPLE_COUNT = SAMPLE_RATE * DURATION;
const channels = [
  new Float64Array(SAMPLE_COUNT),
  new Float64Array(SAMPLE_COUNT),
];
const TAU = Math.PI * 2;
let seed = 0x46495446;
const noise = () => {
  seed ^= seed << 13;
  seed ^= seed >>> 17;
  seed ^= seed << 5;
  return (seed >>> 0) / 0x80000000 - 1;
};
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);
const ease = (x) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

function voice(start, duration, synth, gain = 1, pan = 0) {
  const first = Math.round(start * SAMPLE_RATE);
  const count = Math.min(
    Math.ceil(duration * SAMPLE_RATE),
    SAMPLE_COUNT - first,
  );
  const left = Math.cos(((pan + 1) * Math.PI) / 4) * gain;
  const right = Math.sin(((pan + 1) * Math.PI) / 4) * gain;
  for (let i = 0; i < count; i++) {
    const value = synth(i / SAMPLE_RATE, i);
    if (first + i < 0) continue;
    channels[0][first + i] += value * left;
    channels[1][first + i] += value * right;
  }
}

function kick(start, gain) {
  voice(
    start,
    0.38,
    (t) => {
      const phase = TAU * (46 * t + 65 * 0.025 * (1 - Math.exp(-t / 0.025)));
      const body = Math.sin(phase) * Math.exp(-t * 12) * ease(t / 0.003);
      const click = noise() * Math.exp(-t * 280) * 0.1;
      return body + click;
    },
    gain,
  );
}

function hat(start, gain, open = false, pan = 0.25) {
  let previous = 0;
  voice(
    start,
    open ? 0.2 : 0.08,
    (t) => {
      const sample = noise();
      const high = sample - previous;
      previous = sample;
      return high * Math.exp(-t * (open ? 24 : 75)) * ease(t / 0.001);
    },
    gain,
    pan,
  );
}

function snare(start, gain) {
  let low = 0;
  voice(
    start,
    0.18,
    (t) => {
      const sample = noise();
      low += 0.12 * (sample - low);
      const snap = (sample - low) * Math.exp(-t * 34);
      const body = Math.sin(TAU * 185 * t) * Math.exp(-t * 42);
      return (snap * 0.65 + body * 0.35) * ease(t / 0.002);
    },
    gain,
    -0.07,
  );
}

function bass(start, note, gain) {
  const frequency = hz(note);
  voice(
    start,
    0.42,
    (t) => {
      const envelope =
        ease(t / 0.012) * Math.exp(-t * 5) * (1 - ease((t - 0.33) / 0.09));
      return (
        (Math.sin(TAU * frequency * t) +
          0.25 * Math.sin(TAU * frequency * 2 * t)) *
        envelope
      );
    },
    gain,
  );
}

function pluck(start, note, gain, pan) {
  const frequency = hz(note);
  const synth = (t) => {
    const attack = ease(t / 0.007);
    const fundamental = Math.sin(TAU * frequency * t) * Math.exp(-t * 5.5);
    const glass =
      0.18 * Math.sin(TAU * frequency * 2.001 * t) * Math.exp(-t * 11);
    return (fundamental + glass) * attack * (1 - ease((t - 0.7) / 0.2));
  };
  voice(start, 0.9, synth, gain, pan);
  // A quiet dotted-eighth echo gives width without obscuring the beat.
  voice(start + 0.375, 0.9, synth, gain * 0.27, -pan);
  voice(start + 0.75, 0.9, synth, gain * 0.1, pan);
}

// D minor 9 → B-flat major 7 → F major 9 → C add 9.
const chords = [
  { bass: 38, notes: [62, 65, 69, 72, 76] },
  { bass: 34, notes: [62, 65, 69, 70, 77] },
  { bass: 41, notes: [60, 64, 67, 69, 77] },
  { bass: 36, notes: [60, 64, 67, 74, 79] },
];

for (let bar = 0; bar < 15; bar++) {
  const start = bar * 2;
  const chord = chords[Math.floor(bar / 2) % chords.length];
  const energy =
    start < 4
      ? 0.55
      : start < 11
        ? 0.85
        : start < 17
          ? 1
          : start < 23
            ? 0.72
            : 1;

  chord.notes.slice(0, 4).forEach((note, index) => {
    const frequency = hz(note - 12);
    voice(
      start - 0.18,
      2.65,
      (t) => {
        const envelope = ease(t / 0.45) * (1 - ease((t - 1.9) / 0.75));
        const flutter = 0.93 + 0.07 * Math.sin(TAU * 0.21 * t + index);
        return (
          (Math.sin(TAU * frequency * 0.998 * t) +
            Math.sin(TAU * frequency * 1.002 * t) +
            0.12 * Math.sin(TAU * frequency * 2 * t)) *
          envelope *
          flutter
        );
      },
      0.032 * energy,
      (index - 1.5) / 2.2,
    );
  });

  for (let beat = 0; beat < 4; beat++) {
    const time = start + beat * BEAT;
    // A small breathing space leads into the final logo hold.
    if (time >= 29) continue;
    kick(time, 0.28 * energy);
    bass(time + 0.04, chord.bass, 0.19 * energy);
    if (start >= 4 && beat % 2 === 1) snare(time, 0.09 * energy);
    hat(time + BEAT / 2, 0.037 * energy, beat === 3, 0.3);
    if (start >= 11 && start < 17) hat(time + 0.125, 0.014, false, -0.3);
  }

  const pattern = [0, 2, 1, 4, 2, 3, 1, 2];
  for (let step = 0; step < 8; step++) {
    const time = start + step * 0.25;
    if (time >= 28.6 || (start < 4 && step % 2)) continue;
    const note = chord.notes[pattern[step]] + (start >= 23 ? 12 : 0);
    pluck(
      time,
      note,
      0.052 * energy * (step % 2 ? 0.78 : 1),
      step % 2 ? 0.45 : -0.45,
    );
  }
}

// Soft reverse air and a resolved chime mark each visual scene change.
for (const transition of [4, 11, 17, 23]) {
  let filtered = 0;
  voice(
    transition - 0.55,
    0.7,
    (t) => {
      filtered += 0.08 * (noise() - filtered);
      const envelope = t < 0.55 ? (t / 0.55) ** 2 : Math.exp(-(t - 0.55) * 28);
      return filtered * envelope;
    },
    0.2,
  );
  pluck(transition, transition === 23 ? 86 : 81, 0.11, -0.15);
}
pluck(28, 74, 0.09, 0);
pluck(28.25, 81, 0.06, 0.25);

let peak = 0;
for (let i = 0; i < SAMPLE_COUNT; i++) {
  const time = i / SAMPLE_RATE;
  const fade = ease(time / 0.16) * (1 - ease((time - 28.7) / 1.3));
  for (const channel of channels) {
    channel[i] = Math.tanh(channel[i] * 1.25) * fade;
    peak = Math.max(peak, Math.abs(channel[i]));
  }
}

const targetPeak = 10 ** (-1.5 / 20);
const normalization = targetPeak / peak;
const pcmBytes = SAMPLE_COUNT * 4;
const wav = Buffer.alloc(44 + pcmBytes);
wav.write("RIFF", 0);
wav.writeUInt32LE(36 + pcmBytes, 4);
wav.write("WAVEfmt ", 8);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(2, 22);
wav.writeUInt32LE(SAMPLE_RATE, 24);
wav.writeUInt32LE(SAMPLE_RATE * 4, 28);
wav.writeUInt16LE(4, 32);
wav.writeUInt16LE(16, 34);
wav.write("data", 36);
wav.writeUInt32LE(pcmBytes, 40);
let sumSquares = 0;
for (let i = 0; i < SAMPLE_COUNT; i++) {
  for (let channel = 0; channel < 2; channel++) {
    const sample = channels[channel][i] * normalization;
    sumSquares += sample * sample;
    wav.writeInt16LE(Math.round(sample * 32767), 44 + i * 4 + channel * 2);
  }
}

const destination = new URL(
  "../../remotion/public/audio/fitflow-pulse.wav",
  import.meta.url,
);
await mkdir(new URL(".", destination), { recursive: true });
await writeFile(destination, wav);
const rmsDb = 20 * Math.log10(Math.sqrt(sumSquares / (SAMPLE_COUNT * 2)));
console.log(`Wrote ${fileURLToPath(destination)}`);
console.log(
  `${DURATION}s · 120 BPM · stereo ${SAMPLE_RATE} Hz · peak -1.50 dBFS · RMS ${rmsDb.toFixed(2)} dBFS`,
);

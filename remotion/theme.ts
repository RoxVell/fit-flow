import { Easing, interpolate, spring } from "remotion";

export const palette = {
  background: "#09090b",
  surface: "#151518",
  raised: "#202023",
  border: "#333237",
  text: "#faf8f4",
  muted: "#a2a0a6",
  orange: "#ff7a24",
  green: "#69dfaa",
};

export const type = {
  label: 20,
  body: 28,
  subtitle: 36,
  heading: 102,
  display: 128,
};
export const mono = '"Geist Mono", monospace';
export const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export function progress(frame: number, from: number, to: number) {
  return interpolate(frame, [from, to], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
}

export function entrance(frame: number, delay = 0) {
  return spring({
    frame: frame - delay,
    fps: 30,
    config: { damping: 22, stiffness: 100, mass: 0.85 },
  });
}

// Accent colors the dashboard uses beyond the shared theme (web: tailwind blue-500 / red-500).
export const Accent = {
  blue: "#3b82f6",
  red: "#ef4444",
} as const;

/** 6-digit hex + alpha, for tinted icon backgrounds. */
export function tint(hex: string, alpha = 0.15): string {
  return `${hex}${Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0")}`;
}

import { Platform } from "react-native";

// Palette mirrors the web app's oklch tokens (src/app/globals.css),
// converted to sRGB. Primary is the brand orange.
export type ThemeColors = {
  primary: string;
  primaryForeground: string;
  background: string;
  card: string;
  border: string;
  text: string;
  textSecondary: string;
  muted: string;
  success: string;
};

export type ColorScheme = "light" | "dark";

export const Colors: Record<ColorScheme, ThemeColors> = {
  light: {
    primary: "#f97316",
    primaryForeground: "#fafafa",
    background: "#fffdfa",
    card: "#ffffff",
    border: "#efe3d9",
    text: "#2a2420",
    textSecondary: "#8a7c72",
    muted: "#f6efe9",
    success: "#22c55e",
  },
  dark: {
    primary: "#f97316",
    primaryForeground: "#fafafa",
    background: "#0f0f0f",
    card: "#1c1c1c",
    border: "#2e2e2e",
    text: "#f2f2f2",
    textSecondary: "#a3a3a3",
    muted: "#232323",
    success: "#22c55e",
  },
};

export const Fonts = Platform.select({
  ios: { sans: "system-ui", mono: "ui-monospace", rounded: "ui-rounded" },
  default: { sans: "normal", mono: "monospace", rounded: "normal" },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const Radius = {
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

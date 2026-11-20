import Storage from "expo-sqlite/kv-store";

import { defaultLocale, locales, type Locale } from "@/lib/i18n/messages";

export type ThemePreference = "system" | "light" | "dark";

export const themePreferences: ThemePreference[] = ["system", "light", "dark"];

const KEYS = {
  theme: "settings.theme",
  locale: "settings.locale",
} as const;

// Synchronous reads so the first render already has the persisted values.
export function readThemePreference(): ThemePreference {
  const raw = Storage.getItemSync(KEYS.theme);
  return themePreferences.find((p) => p === raw) ?? "system";
}

export function writeThemePreference(value: ThemePreference) {
  Storage.setItemSync(KEYS.theme, value);
}

export function readLocale(fallback: () => Locale = () => defaultLocale): Locale {
  const raw = Storage.getItemSync(KEYS.locale);
  return locales.find((l) => l === raw) ?? fallback();
}

export function writeLocale(value: Locale) {
  Storage.setItemSync(KEYS.locale, value);
}

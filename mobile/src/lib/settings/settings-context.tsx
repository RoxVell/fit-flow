import { getLocales } from "expo-localization";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Appearance } from "react-native";

import { defaultLocale, locales, messages, type Locale, type Messages } from "@/lib/i18n/messages";

import {
  readLocale,
  readThemePreference,
  writeLocale,
  writeThemePreference,
  type ThemePreference,
} from "./settings-store";

type SettingsContextValue = {
  themePreference: ThemePreference;
  setThemePreference: (value: ThemePreference) => void;
  locale: Locale;
  setLocale: (value: Locale) => void;
  t: Messages;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

function detectDeviceLocale(): Locale {
  const code = getLocales()[0]?.languageCode;
  return locales.find((l) => l === code) ?? defaultLocale;
}

// Appearance.setColorScheme also sets the UIWindow override on iOS, so native
// tab bar, headers and SwiftUI controls follow the chosen theme.
function applyTheme(pref: ThemePreference) {
  Appearance.setColorScheme(pref === "system" ? "unspecified" : pref);
}

// Apply the persisted theme before the first frame to avoid a flash.
applyTheme(readThemePreference());

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [themePreference, setThemeState] = useState<ThemePreference>(readThemePreference);
  const [locale, setLocaleState] = useState<Locale>(() => readLocale(detectDeviceLocale));

  const setThemePreference = useCallback((value: ThemePreference) => {
    writeThemePreference(value);
    applyTheme(value);
    setThemeState(value);
  }, []);

  const setLocale = useCallback((value: Locale) => {
    writeLocale(value);
    setLocaleState(value);
  }, []);

  const value = useMemo(
    () => ({ themePreference, setThemePreference, locale, setLocale, t: messages[locale] }),
    [themePreference, setThemePreference, locale, setLocale],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}

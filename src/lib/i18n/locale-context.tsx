"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import type { Locale } from "@/lib/exercises/types";
import {
  resolveClientLocale,
  setLocaleCookie,
  writePersistedLocale,
} from "@/lib/i18n/locale-cookie";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

/** For non-React code paths (repositories). Updated on every render. */
let activeLocale: Locale = "en";

export function getActiveLocale(): Locale {
  return activeLocale;
}

const DEFAULT_LOCALE: Locale = "en";

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  // Server HTML is static and always rendered in the default locale.
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  activeLocale = locale;

  // The bootstrap script in the root layout syncs the cookie from
  // localStorage before hydration; pick up the result (or the browser
  // language on a fresh install) in the same frame to avoid a flash.
  useLayoutEffect(() => {
    const resolved = resolveClientLocale();
    if (resolved !== locale) {
      setLocaleCookie(resolved);
      writePersistedLocale(resolved);
      activeLocale = resolved;
      setLocaleState(resolved);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setLocale = useCallback((next: Locale) => {
    setLocaleCookie(next);
    writePersistedLocale(next);
    activeLocale = next;
    setLocaleState(next);
  }, []);

  const value = useMemo(
    () => ({ locale, setLocale }),
    [locale, setLocale]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): Locale {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    return activeLocale;
  }
  return ctx.locale;
}

export function useSetLocale(): (locale: Locale) => void {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useSetLocale must be used within LocaleProvider");
  }
  return ctx.setLocale;
}

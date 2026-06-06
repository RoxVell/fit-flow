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
  readCookieLocale,
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

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  activeLocale = initialLocale;
  const [locale, setLocaleState] = useState(initialLocale);
  activeLocale = locale;

  // Bootstrap script may set cookie from localStorage before React hydrates.
  // Sync React state in the same frame — avoids delayed zustand rehydrate flash.
  useLayoutEffect(() => {
    const fromCookie = readCookieLocale();
    if (fromCookie && fromCookie !== locale) {
      writePersistedLocale(fromCookie);
      activeLocale = fromCookie;
      setLocaleState(fromCookie);
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

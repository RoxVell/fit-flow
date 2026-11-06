"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
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

const DEFAULT_LOCALE: Locale = "en";
const LOCALE_CHANGE_EVENT = "fitflow-locale-change";
const serverSnapshot = () => DEFAULT_LOCALE;

/** Repositories read the same persisted value as the React subscription. */
export function getActiveLocale(): Locale {
  return typeof window === "undefined" ? DEFAULT_LOCALE : resolveClientLocale();
}

function subscribeLocale(listener: () => void) {
  window.addEventListener(LOCALE_CHANGE_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(LOCALE_CHANGE_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

function setLocale(next: Locale) {
  setLocaleCookie(next);
  writePersistedLocale(next);
  window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT));
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  // Server HTML is static and always rendered in the default locale.
  const locale = useSyncExternalStore(subscribeLocale, getActiveLocale, serverSnapshot);

  // Persist the browser/bootstrap choice without copying it into React state.
  useEffect(() => {
    const resolved = resolveClientLocale();
    setLocaleCookie(resolved);
    writePersistedLocale(resolved);
  }, [locale]);

  const value = useMemo(
    () => ({ locale, setLocale }),
    [locale]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): Locale {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    return getActiveLocale();
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

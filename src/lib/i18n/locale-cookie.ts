import type { Locale } from "@/lib/exercises/types";
import { detectBrowserLocale } from "@/lib/exercises/locale";

export const LOCALE_COOKIE = "fitflow-locale";
export const LOCALE_STORAGE_KEY = "fitflow-locale";

export function parseLocale(value: string | undefined | null): Locale | null {
  if (value === "en" || value === "ru") return value;
  return null;
}

export function readPersistedLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { locale?: string } };
    return parseLocale(parsed?.state?.locale);
  } catch {
    return null;
  }
}

export function writePersistedLocale(locale: Locale) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    LOCALE_STORAGE_KEY,
    JSON.stringify({ state: { locale }, version: 0 })
  );
}

export function readCookieLocale(): Locale | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`)
  );
  return parseLocale(match ? decodeURIComponent(match[1]) : null);
}

export function setLocaleCookie(locale: Locale) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = locale;
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;SameSite=Lax`;
}

export function resolveClientLocale(): Locale {
  return readCookieLocale() ?? readPersistedLocale() ?? detectBrowserLocale();
}

/** Inline script: sync cookie from localStorage before React hydrates. */
export const localeBootstrapScript = `(function(){try{var l=null;var r=localStorage.getItem("${LOCALE_STORAGE_KEY}");if(r){var p=JSON.parse(r);if(p&&p.state&&p.state.locale)l=p.state.locale;}if(!l){var m=document.cookie.match(/(?:^|; )${LOCALE_COOKIE}=([^;]*)/);if(m)l=decodeURIComponent(m[1]);}if(l==="en"||l==="ru"){document.documentElement.lang=l;document.cookie="${LOCALE_COOKIE}="+l+";path=/;max-age=31536000;SameSite=Lax";}}catch(e){}})();`;

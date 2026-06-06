import type { Locale, LocalizedList, LocalizedString } from "./types";

export function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  return navigator.language.toLowerCase().startsWith("ru") ? "ru" : "en";
}

export function pickLocalized(
  value: LocalizedString | undefined,
  locale: Locale
): string {
  if (!value) return "";
  return value[locale] || value.en || value.ru || "";
}

export function pickLocalizedList(
  value: LocalizedList | undefined,
  locale: Locale
): string[] {
  if (!value) return [];
  return value[locale]?.length ? value[locale] : value.en || value.ru || [];
}

import type { Locale } from "./messages";

// Short weekday labels indexed like Date#getDay (0 = Sunday).
export function getDayLabels(locale: Locale): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: "short" });
  // 2024-01-07 is a Sunday.
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2024, 0, 7 + i)));
}

const LOCALE_TAG: Record<Locale, string> = {
  en: "en-US",
  ru: "ru-RU",
};

/** SwiftUI Locale identifier (underscore), for DatePicker environment. */
export function swiftLocaleIdentifier(locale: Locale): string {
  return locale === "ru" ? "ru_RU" : "en_US";
}

export function formatDateTime(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleDateString(LOCALE_TAG[locale], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

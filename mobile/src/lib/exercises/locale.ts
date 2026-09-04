import type { Locale } from "@/lib/i18n/messages";

import type { LocalizedList, LocalizedString } from "./types";

export function pickLocalized(value: LocalizedString | undefined, locale: Locale): string {
  if (!value) return "";
  return value[locale] || value.en || value.ru || "";
}

export function pickLocalizedList(value: LocalizedList | undefined, locale: Locale): string[] {
  if (!value) return [];
  const list = value[locale]?.length ? value[locale] : value.en;
  return list ?? [];
}

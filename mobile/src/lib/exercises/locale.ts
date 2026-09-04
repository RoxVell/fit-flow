import type { Locale } from "@/lib/i18n/messages";

import type { LocalizedString } from "./types";

export function pickLocalized(value: LocalizedString | undefined, locale: Locale): string {
  if (!value) return "";
  return value[locale] || value.en || value.ru || "";
}

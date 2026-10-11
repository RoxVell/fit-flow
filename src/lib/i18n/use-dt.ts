"use client";

import { useLocale } from "@/lib/i18n/locale-context";
import { getDesktopMessages } from "./desktop-messages";

/** Desktop-workspace dictionary. Mirrors `useT()` for the mobile shell. */
export function useDt() {
  return getDesktopMessages(useLocale());
}

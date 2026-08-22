"use client";

import { useLocale } from "@/lib/i18n/locale-context";
import { getMessages } from "./messages";

export function useT() {
  const locale = useLocale();
  return getMessages(locale);
}

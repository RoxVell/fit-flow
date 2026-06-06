"use client";

import { useLocale } from "@/lib/stores/locale-store";
import { getMessages } from "./messages";

export function useT() {
  const locale = useLocale();
  return getMessages(locale);
}

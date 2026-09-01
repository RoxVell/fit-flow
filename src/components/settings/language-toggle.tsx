"use client";

import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { useLocale, useSetLocale } from "@/lib/i18n/locale-context";
import { useT } from "@/lib/i18n/use-t";
import type { Locale } from "@/lib/exercises/types";

const languages: { value: Locale; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "ru", label: "RU" },
];

export function LanguageToggle() {
  const locale = useLocale();
  const setLocale = useSetLocale();
  const t = useT();

  return (
    <SegmentedTabs
      variant="card"
      ariaLabel={t.settings.language}
      items={languages}
      value={locale}
      onChange={setLocale}
      equalWidth={false}
      truncate={false}
      buttonClassName="h-9 min-w-[3rem] px-3.5"
    />
  );
}

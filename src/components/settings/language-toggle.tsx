"use client";

import { cn } from "@/lib/utils";
import { useLocale, useSetLocale } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/exercises/types";

const languages: { value: Locale; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "ru", label: "RU" },
];

export function LanguageToggle() {
  const locale = useLocale();
  const setLocale = useSetLocale();

  return (
    <div className="inline-flex items-center rounded-lg border bg-muted/50 p-0.5">
      {languages.map((lang) => {
        const isActive = locale === lang.value;
        return (
          <button
            key={lang.value}
            type="button"
            onClick={() => setLocale(lang.value)}
            className={cn(
              "inline-flex h-9 min-w-[3rem] items-center justify-center rounded-md px-3.5 text-sm font-medium transition-all",
              isActive
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
}

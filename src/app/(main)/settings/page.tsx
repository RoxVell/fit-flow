"use client";

import { Languages, Palette } from "lucide-react";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import { LanguageToggle } from "@/components/settings/language-toggle";
import { useT } from "@/lib/i18n/use-t";

export default function SettingsPage() {
  const t = useT();

  return (
    <div className="space-y-10 px-4 pb-24 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <div>
        <h1 className="text-2xl font-bold">{t.settings.title}</h1>
      </div>

      <section>
        <h2 className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.settings.userInterface}
        </h2>
        <div className="overflow-hidden rounded-xl border bg-card divide-y">
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="flex items-center gap-3 text-base font-medium">
              <Palette className="h-5 w-5 text-foreground/70" />
              {t.settings.theme}
            </span>
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="flex items-center gap-3 text-base font-medium">
              <Languages className="h-5 w-5 text-foreground/70" />
              {t.settings.language}
            </span>
            <LanguageToggle />
          </div>
        </div>
      </section>
    </div>
  );
}

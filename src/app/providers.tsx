"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { SyncProvider } from "@/components/shared/sync-provider";
import { LocaleProvider } from "@/components/shared/locale-provider";
import type { Locale } from "@/lib/exercises/types";

export function Providers({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  return (
    <ThemeProvider>
      <LocaleProvider initialLocale={initialLocale}>
        <TooltipProvider>
          <SyncProvider>
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          </SyncProvider>
        </TooltipProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}

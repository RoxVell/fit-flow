"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { SyncProvider } from "@/components/shared/sync-provider";
import { LocaleProvider } from "@/components/shared/locale-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <TooltipProvider>
          <SyncProvider>{children}</SyncProvider>
        </TooltipProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}

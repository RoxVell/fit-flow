"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { SyncProvider } from "@/components/shared/sync-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <SyncProvider>{children}</SyncProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}

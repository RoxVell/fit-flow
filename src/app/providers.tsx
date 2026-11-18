"use client";

import { ThemeProvider } from "@/components/shared/theme-provider";
import { SyncProvider } from "@/components/shared/sync-provider";
import { LocaleProvider } from "@/components/shared/locale-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <SyncProvider>{children}</SyncProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}

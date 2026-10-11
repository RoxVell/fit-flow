"use client";

import { useEffect, useState } from "react";
import { useSidebarCollapsed, toggleSidebar } from "@/lib/desktop/client-state";
import { DesktopSidebar } from "./sidebar";
import { DesktopTopbar } from "./topbar";
import { CommandPalette } from "./command-palette";

export function DesktopShell({ children }: { children: React.ReactNode }) {
  const collapsed = useSidebarCollapsed();
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "\\") {
        event.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="desk desk-root flex h-dvh w-full overflow-hidden text-foreground">
      <DesktopSidebar collapsed={collapsed} onToggle={toggleSidebar} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DesktopTopbar onSearch={() => setPaletteOpen(true)} />
        <main className="desk-scroll relative min-h-0 flex-1 overflow-y-auto">
          <div
            aria-hidden
            className="desk-grid-bg pointer-events-none absolute inset-x-0 top-0 h-72"
          />
          <div className="relative mx-auto w-full max-w-[110rem] px-6 py-6">
            {children}
          </div>
        </main>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}

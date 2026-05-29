"use client";

import { Palette } from "lucide-react";
import { ThemeToggle } from "@/components/settings/theme-toggle";

export default function SettingsPage() {
  return (
    <div className="space-y-10 px-4 pb-24 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <section>
        <h2 className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          User Interface
        </h2>
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="flex items-center gap-3 text-base font-medium">
              <Palette className="h-5 w-5 text-foreground/70" />
              Theme
            </span>
            <ThemeToggle />
          </div>
        </div>
      </section>
    </div>
  );
}

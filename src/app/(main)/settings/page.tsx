"use client";

import { useSyncExternalStore } from "react";
import { CalendarClock, Languages, Palette, Info, RefreshCw } from "lucide-react";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import { LanguageToggle } from "@/components/settings/language-toggle";
import { OfflineStatusRow } from "@/components/settings/offline-status";
import { useT } from "@/lib/i18n/use-t";
import { useFormat } from "@/lib/i18n/use-format";
import { useSyncState } from "@/lib/sync/sync-service";
import { Button } from "@/components/ui/button";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "—";
const BUILD_DATE = process.env.NEXT_PUBLIC_BUILD_DATE ?? null;
const subscribeNoop = () => () => {};

export default function SettingsPage() {
  const t = useT();
  const { formatDateTime } = useFormat();
  const { lastSyncAt, config, syncing, error, flush } = useSyncState();
  const buildDate = useSyncExternalStore(
    subscribeNoop,
    () => BUILD_DATE ? formatDateTime(BUILD_DATE) : "—",
    () => "—"
  );

  return (
    <div className="space-y-10 px-4 pb-24 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <div>
        <h1 className="text-2xl font-bold">{t.settings.title}</h1>
      </div>

      {config?.enabled && (
        <section className="space-y-3 rounded-xl border bg-card p-4">
          <h2 className="font-semibold">{t.settings.sync}</h2>
          <Button variant="outline" disabled={syncing} onClick={() => void flush()}>
            <RefreshCw className={syncing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            {t.settings.syncNow}
          </Button>
          {error && <p role="status" className="text-sm text-destructive">
            {error === "rejected" ? t.settings.syncRejected : t.settings.syncUnavailable}
          </p>}
        </section>
      )}

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

      <section>
        <h2 className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.settings.about}
        </h2>
        <div className="overflow-hidden rounded-xl border bg-card divide-y">
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="flex items-center gap-3 text-base font-medium">
              <Info className="h-5 w-5 text-foreground/70" />
              {t.settings.version}
            </span>
            <span className="text-sm text-muted-foreground">{APP_VERSION}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="flex items-center gap-3 text-base font-medium">
              <CalendarClock className="h-5 w-5 text-foreground/70" />
              {t.settings.buildDate}
            </span>
            <time dateTime={BUILD_DATE ?? undefined} className="text-sm text-muted-foreground">{buildDate}</time>
          </div>
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="flex items-center gap-3 text-base font-medium">
              <RefreshCw className="h-5 w-5 text-foreground/70" />
              {t.settings.lastSync}
            </span>
            <span className="text-sm text-muted-foreground">
              {lastSyncAt ? formatDateTime(lastSyncAt) : t.settings.never}
            </span>
          </div>
          <OfflineStatusRow />
        </div>
      </section>
    </div>
  );
}

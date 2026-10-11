"use client";

import Link from "next/link";
import {
  CalendarClock,
  ChevronRight,
  Languages,
  Monitor,
  Palette,
  Info,
  RefreshCw,
} from "lucide-react";
import { useDt } from "@/lib/i18n/use-dt";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import { LanguageToggle } from "@/components/settings/language-toggle";
import { useT } from "@/lib/i18n/use-t";
import { useFormat } from "@/lib/i18n/use-format";
import { useSyncState } from "@/lib/sync/sync-service";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "—";
const BUILD_DATE = process.env.NEXT_PUBLIC_BUILD_DATE ?? null;

export default function SettingsPage() {
  const t = useT();
  const dt = useDt();
  const { formatDateTime } = useFormat();
  const { lastSyncAt } = useSyncState();
  const buildDate = BUILD_DATE ? formatDateTime(BUILD_DATE) : "—";

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
          <Link
            href="/desktop"
            // No prefetch: phones should never pull the desktop bundle just
            // because Settings is on screen.
            prefetch={false}
            className="flex items-center justify-between px-4 py-3.5 active:bg-muted/60"
          >
            <span className="flex items-center gap-3 text-base font-medium">
              <Monitor className="h-5 w-5 text-foreground/70" />
              {dt.workspace}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
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
            <span className="text-sm text-muted-foreground">{buildDate}</span>
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
        </div>
      </section>
    </div>
  );
}

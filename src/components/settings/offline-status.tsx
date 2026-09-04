"use client";

import { WifiOff } from "lucide-react";
import { useT } from "@/lib/i18n/use-t";
import { useOfflineStatus } from "@/lib/hooks/use-offline-status";

export function OfflineStatusRow() {
  const t = useT();
  const status = useOfflineStatus();

  const label = {
    checking: t.settings.offlineChecking,
    unsupported: t.settings.offlineUnsupported,
    "not-installed": t.settings.offlineNotInstalled,
    partial: t.settings.offlinePartial,
    ready: t.settings.offlineReady,
  }[status.readiness];

  const showDetails =
    status.readiness === "ready" || status.readiness === "partial";

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5">
      <span className="flex items-center gap-3 text-base font-medium">
        <WifiOff className="h-5 w-5 text-foreground/70" />
        {t.settings.offlineStatus}
      </span>
      <span className="text-right text-sm text-muted-foreground">
        <span
          className={
            status.readiness === "ready" ? "text-green-600 dark:text-green-500" : undefined
          }
        >
          {label}
        </span>
        {showDetails && (
          <span className="block text-xs">
            {t.settings.offlineDetails(
              status.precachedPages,
              status.totalPages,
              status.rscEntries
            )}
          </span>
        )}
        {status.updateWaiting && (
          <span className="block text-xs">{t.settings.offlineUpdateWaiting}</span>
        )}
      </span>
    </div>
  );
}

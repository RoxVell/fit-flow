"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSyncState } from "@/lib/sync/sync-service";
import { useT } from "@/lib/i18n/use-t";

export function OfflineBanner() {
  const [online, setOnline] = useState(true);
  const { pending, syncing, flush } = useSyncState();
  const t = useT();

  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-1.5 text-xs font-medium transition-all duration-300",
        online
          ? "-translate-y-full bg-green-500 text-white"
          : "translate-y-0 bg-amber-500 text-white"
      )}
    >
      {online ? (
        <>
          <Wifi className="h-3 w-3" />
          {pending > 0 ? t.pwa.backOnlineSyncing(pending) : t.pwa.backOnline}
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          <span>
            {t.pwa.offlineTitle}{" "}
            {pending > 0 ? t.pwa.pendingChanges(pending) : t.pwa.offlineNoPending}
          </span>
          {pending > 0 ? (
            <button
              type="button"
              onClick={() => void flush()}
              disabled={syncing || !online}
              className="ml-1 inline-flex items-center gap-1 rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide hover:bg-white/30 disabled:opacity-60"
            >
              <RefreshCw className={cn("h-3 w-3", syncing && "animate-spin")} />
              {syncing ? t.pwa.syncing : t.pwa.syncNow}
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}

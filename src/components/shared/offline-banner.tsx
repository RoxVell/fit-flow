"use client";

import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";
import { useSyncState } from "@/lib/sync/sync-service";
import { useT } from "@/lib/i18n/use-t";

function subscribeOnline(listener: () => void) {
  window.addEventListener("online", listener);
  window.addEventListener("offline", listener);
  return () => {
    window.removeEventListener("online", listener);
    window.removeEventListener("offline", listener);
  };
}

export function OfflineBanner() {
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
  const { pending } = useSyncState();
  const t = useT();
  if (online) return null;

  return (
    <div
      role="status"
      className="pointer-events-none fixed bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] left-1/2 z-40 flex w-max max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-xs font-medium text-white shadow-sm"
    >
      <WifiOff className="h-3 w-3 shrink-0" aria-hidden />
      <span>
        {t.pwa.offlineTitle}{" "}
        {pending > 0 ? t.pwa.pendingChanges(pending) : t.pwa.offlineNoPending}
      </span>
    </div>
  );
}

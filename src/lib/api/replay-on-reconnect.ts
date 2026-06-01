"use client";

import { useEffect, useRef, useState } from "react";
import { syncOutbox } from "./client";
import { pendingCount } from "./sync-queue";

export interface SyncQueueState {
  pending: number;
  syncing: boolean;
  flush: () => Promise<void>;
}

const listeners = new Set<() => void>();

export function notifyQueueChanged(): void {
  for (const listener of listeners) listener();
}

export function useSyncQueueState(): SyncQueueState {
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const syncingRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    const refresh = () => {
      pendingCount()
        .then((n) => {
          if (mounted) setPending(n);
        })
        .catch(() => undefined);
    };
    refresh();
    const listener = () => refresh();
    listeners.add(listener);
    return () => {
      mounted = false;
      listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      void doFlush();
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        void doFlush();
      }
    };
    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibility);
    if (navigator.onLine) void doFlush();
    return () => {
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function doFlush(): Promise<void> {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);
    try {
      await syncOutbox();
      notifyQueueChanged();
      const n = await pendingCount();
      setPending(n);
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }

  return {
    pending,
    syncing,
    flush: doFlush,
  };
}

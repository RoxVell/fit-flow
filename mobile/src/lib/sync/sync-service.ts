import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { getMeta, setMeta } from "@/lib/db/database";
import { applyServerChanges } from "./apply-server-changes";
import { isOnline, subscribeOnline } from "./online";
import { getPending, markSynced, pendingCount, subscribeSyncQueue } from "./queue";
import type { SyncRequest, SyncResponse } from "./types";

const DEFAULT_SYNC_URL = "http://localhost:3000/api/sync";

let syncing = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((cb) => cb());
}

function syncUrl(): string {
  return process.env.EXPO_PUBLIC_SYNC_URL ?? DEFAULT_SYNC_URL;
}

export function getLastSyncAt(): string | null {
  return getMeta("lastSyncAt");
}

export function getLastPullAt(): string | null {
  return getMeta("lastPullAt");
}

export function isSyncInitialized(): boolean {
  return getMeta("syncInitialized") === "1";
}

export async function sync(): Promise<SyncResponse | null> {
  if (!isOnline()) return null;
  if (syncing) return null;

  syncing = true;
  notify();

  try {
    const pending = getPending();
    const body: SyncRequest = {
      lastPullAt: isSyncInitialized() ? getLastPullAt() : null,
      changes: pending.map((e) => ({
        id: e.id,
        entityType: e.entityType,
        entityId: e.entityId,
        operation: e.operation,
        payload: e.payload,
        revision: e.revision,
      })),
    };

    const res = await fetch(syncUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Sync failed: ${res.status}`);
    }

    const data = (await res.json()) as SyncResponse;
    markSynced([...data.accepted, ...(data.superseded ?? [])]);
    applyServerChanges(data.serverChanges);
    setMeta("lastPullAt", data.serverTime);
    setMeta("lastSyncAt", data.serverTime);
    setMeta("syncInitialized", "1");
    return data;
  } catch (err) {
    console.warn("[sync]", err);
    return null;
  } finally {
    syncing = false;
    notify();
  }
}

export function useSyncState() {
  const [pending, setPending] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(getLastSyncAt);
  const mounted = useRef(true);

  const refresh = useCallback(() => {
    if (!mounted.current) return;
    setPending(pendingCount());
    setIsSyncing(syncing);
    setLastSyncAt(getLastSyncAt());
  }, []);

  useEffect(() => {
    mounted.current = true;
    refresh();
    const onChange = () => refresh();
    listeners.add(onChange);
    const unsubQueue = subscribeSyncQueue(onChange);

    const runSync = () => void sync().then(() => refresh());
    runSync();

    const onAppState = (state: AppStateStatus) => {
      if (state === "active") runSync();
    };
    const appSub = AppState.addEventListener("change", onAppState);
    const unsubOnline = subscribeOnline(() => {
      if (isOnline()) runSync();
    });

    const interval = setInterval(() => {
      if (pendingCount() > 0) runSync();
    }, 60_000);

    return () => {
      mounted.current = false;
      listeners.delete(onChange);
      unsubQueue();
      unsubOnline();
      appSub.remove();
      clearInterval(interval);
    };
  }, [refresh]);

  const flush = useCallback(async () => {
    await sync();
    refresh();
  }, [refresh]);

  return { pending, syncing: isSyncing, lastSyncAt, flush };
}

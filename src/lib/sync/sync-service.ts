"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { db, getAppMeta, migrateFromLegacyIdb, setAppMeta } from "@/lib/db/dexie";
import { ensureSeeded } from "@/lib/db/seed-loader";
import { getPending, markSynced, pendingCount } from "./queue";
import { applyServerChanges } from "./apply-server-changes";
import type { SyncRequest, SyncResponse } from "./types";

let syncing = false;
let initPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((cb) => cb());
}

export async function sync(): Promise<SyncResponse | null> {
  if (typeof window === "undefined") return null;
  if (!navigator.onLine) return null;
  if (syncing) return null;

  syncing = true;
  notify();

  try {
    await initLocalDb();

    const meta = await getAppMeta();
    const pending = await getPending();
    const body: SyncRequest = {
      lastPullAt: meta.initialized ? meta.lastPullAt : null,
      changes: pending.map((e) => ({
        id: e.id,
        entityType: e.entityType,
        entityId: e.entityId,
        operation: e.operation,
        payload: e.payload,
        revision: e.revision,
      })),
    };

    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Sync failed: ${res.status}`);
    }

    const data = (await res.json()) as SyncResponse;
    await markSynced([...data.accepted, ...(data.superseded ?? [])]);
    await applyServerChanges(data.serverChanges);
    await setAppMeta({
      initialized: true,
      lastPullAt: data.serverTime,
      lastSyncAt: data.serverTime,
    });

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
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    const count = await pendingCount();
    if (mounted.current) {
      setPending(count);
      setIsSyncing(syncing);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    const onChange = () => void refresh();
    listeners.add(onChange);

    const runSync = () => void sync().then(() => refresh());

    runSync();

    const onOnline = () => runSync();
    const onVisibility = () => {
      if (document.visibilityState === "visible" && navigator.onLine) runSync();
    };
    const interval = window.setInterval(() => {
      void pendingCount().then((n) => {
        if (n > 0 && navigator.onLine) runSync();
      });
    }, 60_000);

    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      mounted.current = false;
      listeners.delete(onChange);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(interval);
    };
  }, [refresh]);

  const flush = useCallback(async () => {
    await sync();
    await refresh();
  }, [refresh]);

  return { pending, syncing: isSyncing, flush };
}

/** Warm up Dexie on app start (writes — must not run inside useLiveQuery) */
export function initLocalDb(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (!initPromise) {
    initPromise = (async () => {
      await migrateFromLegacyIdb();
      await db.open();
      await ensureSeeded();
    })();
  }
  return initPromise;
}

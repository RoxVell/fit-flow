"use client";

import { useSyncExternalStore } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, getAppMeta, setAppMeta } from "@/lib/db/dexie";
import { ensureSeeded } from "@/lib/db/seed-loader";
import { ensureManifestLoaded } from "@/lib/hooks/use-exercise-library";
import { getPending, markFailed, markSynced, pendingCount } from "./queue";
import { applyServerChanges } from "./apply-server-changes";
import type { SyncConfig, SyncRequest, SyncResponse } from "./types";

type SyncState = {
  syncing: boolean;
  config: SyncConfig | null;
  error: "unavailable" | "rejected" | null;
};
const initialState: SyncState = { syncing: false, config: null, error: null };
let state = initialState;
let initPromise: Promise<void> | null = null;
let configPromise: Promise<SyncConfig> | null = null;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };

function updateState(patch: Partial<SyncState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

async function loadConfig(): Promise<SyncConfig> {
  if (state.config) return state.config;
  if (!configPromise) {
    configPromise = fetch("/api/sync", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) throw new Error("Sync configuration unavailable");
      const config = await response.json() as SyncConfig;
      if (typeof config.enabled !== "boolean") throw new Error("Invalid sync configuration");
      updateState({ config });
      return config;
    }).finally(() => { configPromise = null; });
  }
  return configPromise;
}

export async function sync(): Promise<SyncResponse | null> {
  if (typeof window === "undefined" || !navigator.onLine || state.syncing) return null;
  updateState({ syncing: true, error: null });
  try {
    const config = await loadConfig();
    if (!config.enabled) return null;
    await initLocalDb();
    const headers = { "Content-Type": "application/json" };
    let latest: SyncResponse | null = null;
    for (;;) {
      const pending = (await getPending()).slice(0, 100);
      if (latest && pending.length === 0) return latest;
      const body: SyncRequest = { lastPullAt: null, changes: pending.map(({ id, entityType, entityId, operation, payload, revision }) =>
        ({ id, entityType, entityId, operation, payload, revision })) };
      const response = await fetch("/api/sync", { method: "POST", headers, body: JSON.stringify(body) });
      if (!response.ok) throw new Error(`Sync failed: ${response.status}`);
      const data = await response.json() as SyncResponse;
      const acknowledged = [...data.accepted, ...(data.superseded ?? [])];
      await db.transaction("rw", [db.programs, db.workoutLogs, db.bodyMeasurements, db.cardioSessions, db.syncQueue, db.meta], async () => {
        await markSynced(acknowledged);
        await markFailed(data.rejected.filter((change) => change.permanent).map((change) => change.id));
        await applyServerChanges(data.serverChanges);
        await setAppMeta({ initialized: true, lastPullAt: data.serverTime, lastSyncAt: data.serverTime });
      });
      latest = data;
      if (data.rejected.length) { updateState({ error: "rejected" }); return latest; }
      if (pending.length < 100 || !navigator.onLine || !pending.some((change) => acknowledged.includes(change.id))) return latest;
    }
  } catch (error) {
    console.warn("[sync]", error);
    updateState({ error: "unavailable" });
    return null;
  } finally {
    updateState({ syncing: false });
  }
}

/** Only the provider starts background work; readers merely subscribe. */
export function startSyncRunner(): () => void {
  let stopped = false;
  const run = () => { if (!stopped) void sync(); };
  const onVisibility = () => { if (document.visibilityState === "visible") run(); };
  void initLocalDb().then(run).catch((error) => console.warn("[db]", error));
  window.addEventListener("online", run);
  document.addEventListener("visibilitychange", onVisibility);
  const interval = window.setInterval(() => {
    if (state.config?.enabled && document.visibilityState === "visible") run();
  }, 60_000);
  return () => {
    stopped = true;
    window.clearInterval(interval);
    window.removeEventListener("online", run);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}

export function useSyncState() {
  const snapshot = useSyncExternalStore(subscribe, () => state, () => initialState);
  const pending = useLiveQuery(pendingCount, []) ?? 0;
  const failed = useLiveQuery(() => db.syncQueue.where("status").equals("failed").count(), []) ?? 0;
  const meta = useLiveQuery(getAppMeta, []);
  return { ...snapshot, pending: snapshot.config?.enabled ? pending : 0,
    lastSyncAt: meta?.lastSyncAt ?? null, error: failed ? "rejected" as const : snapshot.error, flush: sync };
}

/** Warm up Dexie on app start; a failed open may be retried. */
export function initLocalDb(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (!initPromise) initPromise = (async () => {
    await db.open();
    await ensureSeeded();
    await ensureManifestLoaded().catch(() => undefined);
  })().catch((error) => { initPromise = null; throw error; });
  return initPromise;
}

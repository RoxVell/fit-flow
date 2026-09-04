import { useSyncExternalStore } from "react";
import { AppState, type AppStateStatus } from "react-native";

const PROBE_URL = "https://captive.apple.com/hotspot-detect.html";
const PROBE_MS = 4000;
const POLL_MS = 20_000;

let online = true;
const listeners = new Set<() => void>();
let monitorStarted = false;

function notify() {
  listeners.forEach((cb) => cb());
}

export function isOnline(): boolean {
  return online;
}

export function subscribeOnline(listener: () => void): () => void {
  listeners.add(listener);
  ensureOnlineMonitor();
  return () => {
    listeners.delete(listener);
  };
}

export async function probeOnline(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_MS);
    const res = await fetch(PROBE_URL, { method: "GET", cache: "no-store", signal: controller.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

async function refreshOnline(): Promise<void> {
  const next = await probeOnline();
  if (next === online) return;
  online = next;
  notify();
}

/** Shared probe so the banner and the sync loop see the same online flag. */
export function ensureOnlineMonitor(): void {
  if (monitorStarted) return;
  monitorStarted = true;
  void refreshOnline();
  AppState.addEventListener("change", (state: AppStateStatus) => {
    if (state === "active") void refreshOnline();
  });
  setInterval(() => void refreshOnline(), POLL_MS);
}

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribeOnline, isOnline, isOnline);
}

"use client";

import { useSyncExternalStore } from "react";

const COLLAPSE_KEY = "fitflow.desktop.sidebar-collapsed";

/* ------------------------------------------------------------------ */
/* hydration                                                           */
/* ------------------------------------------------------------------ */

const noopSubscribe = () => () => {};

/** False during SSR and the first render, true afterwards. */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

/* ------------------------------------------------------------------ */
/* connectivity                                                        */
/* ------------------------------------------------------------------ */

function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true
  );
}

/* ------------------------------------------------------------------ */
/* sidebar                                                             */
/* ------------------------------------------------------------------ */

const sidebarListeners = new Set<() => void>();

/** Used when storage is unavailable, so the rail still toggles for the session. */
let memoryCollapsed = false;

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return memoryCollapsed;
  }
}

function subscribeSidebar(callback: () => void) {
  sidebarListeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    sidebarListeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

export function useSidebarCollapsed(): boolean {
  return useSyncExternalStore(subscribeSidebar, readCollapsed, () => false);
}

export function toggleSidebar(): void {
  const next = !readCollapsed();
  memoryCollapsed = next;
  try {
    localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
  } catch {
    // Ignore — collapsing just will not persist across reloads.
  }
  for (const listener of sidebarListeners) listener();
}

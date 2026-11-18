"use client";

import { useEffect } from "react";
import type { Serwist } from "@serwist/window";
import { clearExerciseLibraryCache } from "@/lib/exercises/library-client";

type Event = "waiting" | "activated";

const listeners: Record<Event, Set<() => void>> = {
  waiting: new Set(),
  activated: new Set(),
};

export function onSerwistEvent(event: Event, listener: () => void): () => void {
  listeners[event].add(listener);
  return () => listeners[event].delete(listener);
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let disposed = false;
    let sw: Serwist | undefined;
    const onWaiting = () => listeners.waiting.forEach((l) => l());
    const onActivated = () => {
      clearExerciseLibraryCache();
      listeners.activated.forEach((l) => l());
    };

    const start = async () => {
      try {
        if (!window.serwist) {
          const mod = await import("@serwist/window");
          if (disposed) return;
          window.serwist ??= new mod.Serwist("/serwist/sw.js", {
            scope: "/",
            updateViaCache: "none",
            type: "classic",
          });
        }
        sw = window.serwist;
        sw.addEventListener("waiting", onWaiting);
        sw.addEventListener("activated", onActivated);
        await sw.register({ immediate: true });
      } catch (err) {
        console.warn("[ServiceWorkerRegister] registration failed", err);
      }
    };

    const checkForUpdates = () => {
      void window.serwist?.update().catch((error) => console.warn("[sw] Update check failed", error));
    };

    void start();

    const onVisible = () => {
      if (document.visibilityState === "visible") checkForUpdates();
    };
    document.addEventListener("visibilitychange", onVisible);
    const interval = setInterval(checkForUpdates, 60 * 60 * 1000);

    return () => {
      disposed = true;
      sw?.removeEventListener("waiting", onWaiting);
      sw?.removeEventListener("activated", onActivated);
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(interval);
    };
  }, []);

  return null;
}

"use client";

import { useEffect } from "react";
import type { Serwist } from "@serwist/window";
import { clearExerciseLibraryCache } from "@/lib/exercises/library-client";

type Event = "waiting" | "controlling" | "activated";

const listeners: Record<Event, Set<() => void>> = {
  waiting: new Set(),
  controlling: new Set(),
  activated: new Set(),
};

export function onSerwistEvent(event: Event, listener: () => void): () => void {
  listeners[event].add(listener);
  return () => listeners[event].delete(listener);
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const wireListeners = (sw: Serwist) => {
      sw.addEventListener("waiting", () => {
        listeners.waiting.forEach((l) => l());
      });
      sw.addEventListener("controlling", () => {
        listeners.controlling.forEach((l) => l());
      });
      sw.addEventListener("activated", () => {
        clearExerciseLibraryCache();
        listeners.activated.forEach((l) => l());
      });
    };

    const start = async () => {
      try {
        if (window.serwist) {
          wireListeners(window.serwist);
          await window.serwist.register({ immediate: true });
          return;
        }
        const mod = await import("@serwist/window");
        const sw = new mod.Serwist("/serwist/sw.js", {
          scope: "/",
          updateViaCache: "none",
          type: "classic",
        });
        window.serwist = sw;
        wireListeners(sw);
        await sw.register({ immediate: true });
      } catch (err) {
        console.warn("[ServiceWorkerRegister] registration failed", err);
      }
    };

    const checkForUpdates = () => {
      void window.serwist?.update();
    };

    void start();

    const onVisible = () => {
      if (document.visibilityState === "visible") checkForUpdates();
    };
    document.addEventListener("visibilitychange", onVisible);
    const interval = setInterval(checkForUpdates, 60 * 60 * 1000);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(interval);
    };
  }, []);

  return null;
}

"use client";

import { useEffect } from "react";
import type { Serwist } from "@serwist/window";

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
        const sw = new mod.Serwist("/sw.js", {
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

    void start();
  }, []);

  return null;
}

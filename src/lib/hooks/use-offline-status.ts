"use client";

import { useEffect, useState } from "react";
import { APP_ROUTES, RSC_CACHE } from "@/lib/pwa/cache";

export type OfflineReadiness =
  | "checking"
  | "unsupported"
  | "not-installed"
  | "partial"
  | "ready";

export interface OfflineStatus {
  readiness: OfflineReadiness;
  /** App routes whose HTML is in the precache. */
  precachedPages: number;
  totalPages: number;
  /** Warmed RSC payloads for client-side navigation. */
  rscEntries: number;
  updateWaiting: boolean;
}

const INITIAL: OfflineStatus = {
  readiness: "checking",
  precachedPages: 0,
  totalPages: APP_ROUTES.length,
  rscEntries: 0,
  updateWaiting: false,
};

async function readStatus(): Promise<OfflineStatus> {
  if (
    typeof navigator === "undefined" ||
    !("serviceWorker" in navigator) ||
    typeof caches === "undefined"
  ) {
    return { ...INITIAL, readiness: "unsupported" };
  }

  const reg = await navigator.serviceWorker.getRegistration();
  const updateWaiting = !!reg?.waiting;
  if (!reg?.active) {
    return { ...INITIAL, readiness: "not-installed", updateWaiting };
  }

  const keys = await caches.keys();
  const precacheKey = keys.find((key) => key.includes("precache"));
  let precachedPages = 0;
  if (precacheKey) {
    const paths = new Set(
      (await (await caches.open(precacheKey)).keys()).map(
        (req) => new URL(req.url).pathname
      )
    );
    precachedPages = APP_ROUTES.filter((route) => paths.has(route)).length;
  }
  const rscKey = keys.find((key) => key.includes(RSC_CACHE));
  const rscEntries = rscKey
    ? (await (await caches.open(rscKey)).keys()).length
    : 0;

  return {
    readiness: precachedPages === APP_ROUTES.length ? "ready" : "partial",
    precachedPages,
    totalPages: APP_ROUTES.length,
    rscEntries,
    updateWaiting,
  };
}

/** Service worker and cache state, for the Settings diagnostics row. */
export function useOfflineStatus(): OfflineStatus {
  const [status, setStatus] = useState<OfflineStatus>(INITIAL);

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      void readStatus()
        .then((next) => {
          if (!cancelled) setStatus(next);
        })
        .catch(() => {
          if (!cancelled) setStatus({ ...INITIAL, readiness: "not-installed" });
        });
    };
    refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    navigator.serviceWorker?.addEventListener("controllerchange", refresh);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      navigator.serviceWorker?.removeEventListener("controllerchange", refresh);
    };
  }, []);

  return status;
}

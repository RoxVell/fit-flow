"use client";

import { useEffect, useState } from "react";
import { APP_ROUTES, RSC_CACHE } from "@/lib/pwa/cache";

/** Serwist names its precache `serwist-precache-v<n>-<origin>`. */
const PRECACHE_PREFIX = "serwist-precache";

/** Re-read this often while the worker is still warming up. */
const WARMUP_POLL_MS = 2000;
const WARMUP_POLL_LIMIT = 15;

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
  const precacheKey = keys.find((key) => key.startsWith(PRECACHE_PREFIX));
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

  // Offline tab switches need the RSC payloads too, not just the HTML.
  const ready =
    precachedPages === APP_ROUTES.length && rscEntries >= APP_ROUTES.length;
  return {
    readiness: ready ? "ready" : "partial",
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
    let polls = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const refresh = () => {
      void readStatus()
        .then((next) => {
          if (cancelled) return;
          setStatus(next);
          // The worker warms the RSC cache right after activation; keep
          // polling for a while so the row does not stay stale.
          const settled =
            next.readiness === "ready" || next.readiness === "unsupported";
          if (!settled && polls < WARMUP_POLL_LIMIT) {
            polls += 1;
            timer = setTimeout(refresh, WARMUP_POLL_MS);
          }
        })
        .catch(() => {
          if (!cancelled) setStatus({ ...INITIAL, readiness: "not-installed" });
        });
    };
    const restart = () => {
      clearTimeout(timer);
      polls = 0;
      refresh();
    };

    refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") restart();
    };
    document.addEventListener("visibilitychange", onVisible);
    navigator.serviceWorker?.addEventListener("controllerchange", restart);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      navigator.serviceWorker?.removeEventListener("controllerchange", restart);
    };
  }, []);

  return status;
}

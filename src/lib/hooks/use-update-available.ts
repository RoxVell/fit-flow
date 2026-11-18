"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { onSerwistEvent } from "@/components/shared/service-worker-register";
import { reloadApp } from "@/lib/pwa/cache";

export interface UpdateAvailableState {
  updateAvailable: boolean;
  applying: boolean;
  applyUpdate: () => Promise<void>;
}

const RELOAD_KEY = "fitflow.update.reloading";
const RETRY_KEY = "fitflow.update.retries";
const MAX_AUTO_RETRIES = 3;
const ACTIVATION_TIMEOUT_MS = 3000;

function activateWaitingWorker(worker: ServiceWorker, timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    function finish() {
      clearTimeout(timer);
      navigator.serviceWorker.removeEventListener("controllerchange", finish);
      resolve();
    }

    const timer = setTimeout(finish, timeoutMs);
    navigator.serviceWorker.addEventListener("controllerchange", finish);
    worker.postMessage({ type: "SKIP_WAITING" });
  });
}

function clearUpdateFlags() {
  sessionStorage.removeItem(RELOAD_KEY);
  sessionStorage.removeItem(RETRY_KEY);
}

function finishUpdate(reloadingRef: { current: boolean }): void {
  if (reloadingRef.current || !navigator.onLine) return;
  reloadingRef.current = true;
  clearUpdateFlags();
  reloadApp();
}

export function useUpdateAvailable(): UpdateAvailableState {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [applying, setApplying] = useState(false);
  const reloadingRef = useRef(false);

  const applyUpdate = useCallback(async () => {
    if (reloadingRef.current) return;

    setApplying(true);
    setUpdateAvailable(false);
    sessionStorage.setItem(RELOAD_KEY, "1");

    try {
      const reg = await navigator.serviceWorker?.getRegistration();

      if (reg?.waiting) {
        await activateWaitingWorker(reg.waiting, ACTIVATION_TIMEOUT_MS);

        const current = await navigator.serviceWorker?.getRegistration();
        if (current?.waiting) {
          await activateWaitingWorker(current.waiting, 1000);
        }
      }
    } catch (err) {
      console.warn("[useUpdateAvailable] apply failed", err);
    } finally {
      finishUpdate(reloadingRef);
      if (!reloadingRef.current) setApplying(false);
    }
  }, []);

  useEffect(() => {
    const offWaiting = onSerwistEvent("waiting", () => setUpdateAvailable(true));
    const offActivated = onSerwistEvent("activated", () =>
      setUpdateAvailable(false)
    );

    const onOnline = () => {
      void navigator.serviceWorker?.getRegistration().then((reg) => {
        if (sessionStorage.getItem(RELOAD_KEY) === "1" && !reg?.waiting) {
          finishUpdate(reloadingRef);
        }
      });
    };
    window.addEventListener("online", onOnline);

    void navigator.serviceWorker?.getRegistration().then(async (reg) => {
      if (!reg?.waiting) {
        clearUpdateFlags();
        return;
      }

      setUpdateAvailable(true);

      if (sessionStorage.getItem(RELOAD_KEY) !== "1") return;

      const retries = Number(sessionStorage.getItem(RETRY_KEY) ?? "0");
      if (retries >= MAX_AUTO_RETRIES) {
        finishUpdate(reloadingRef);
        return;
      }

      sessionStorage.setItem(RETRY_KEY, String(retries + 1));
      await applyUpdate();
    });

    return () => {
      offWaiting();
      offActivated();
      window.removeEventListener("online", onOnline);
    };
  }, [applyUpdate]);

  return { updateAvailable, applying, applyUpdate };
}

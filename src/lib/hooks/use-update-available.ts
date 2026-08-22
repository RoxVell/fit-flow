"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { onSerwistEvent } from "@/components/shared/service-worker-register";
import { clearRuntimeCaches, forceHardReload } from "@/lib/pwa/cache";

export interface UpdateAvailableState {
  updateAvailable: boolean;
  applying: boolean;
  applyUpdate: () => Promise<void>;
}

const RELOAD_KEY = "fitflow.update.reloading";
const RETRY_KEY = "fitflow.update.retries";
const MAX_AUTO_RETRIES = 3;
const ACTIVATION_TIMEOUT_MS = 3000;

function requestSkipWaiting(reg: ServiceWorkerRegistration): void {
  reg.waiting?.postMessage({ type: "SKIP_WAITING" });
  window.serwist?.messageSkipWaiting();
}

function waitForControllerChange(timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (!navigator.serviceWorker) {
      resolve(false);
      return;
    }

    let settled = false;
    const finish = (activated: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange
      );
      resolve(activated);
    };

    const onControllerChange = () => finish(true);
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange
    );

    const timer = setTimeout(() => finish(false), timeoutMs);
  });
}

async function finishUpdate(reloadingRef: { current: boolean }): Promise<void> {
  if (reloadingRef.current) return;
  reloadingRef.current = true;
  sessionStorage.removeItem(RELOAD_KEY);
  sessionStorage.removeItem(RETRY_KEY);
  await clearRuntimeCaches();
  if (navigator.onLine) {
    forceHardReload();
  } else {
    reloadingRef.current = false;
    sessionStorage.setItem(RELOAD_KEY, "1");
  }
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
        requestSkipWaiting(reg);
        await waitForControllerChange(ACTIVATION_TIMEOUT_MS);

        const current = await navigator.serviceWorker?.getRegistration();
        if (current?.waiting) {
          requestSkipWaiting(current);
          await waitForControllerChange(1000);
        }
      }

      await finishUpdate(reloadingRef);
    } catch (err) {
      console.warn("[useUpdateAvailable] apply failed", err);
      await finishUpdate(reloadingRef);
    }
  }, []);

  useEffect(() => {
    const offWaiting = onSerwistEvent("waiting", () => setUpdateAvailable(true));
    const offActivated = onSerwistEvent("activated", () => {
      setUpdateAvailable(false);
      void clearRuntimeCaches();
    });

    const onOnline = () => {
      void navigator.serviceWorker?.getRegistration().then(async (reg) => {
        if (sessionStorage.getItem(RELOAD_KEY) === "1" && !reg?.waiting) {
          sessionStorage.removeItem(RELOAD_KEY);
          sessionStorage.removeItem(RETRY_KEY);
          forceHardReload();
        }
      });
    };
    window.addEventListener("online", onOnline);

    void navigator.serviceWorker?.getRegistration().then(async (reg) => {
      if (!reg?.waiting) {
        sessionStorage.removeItem(RELOAD_KEY);
        sessionStorage.removeItem(RETRY_KEY);
        return;
      }

      setUpdateAvailable(true);

      if (sessionStorage.getItem(RELOAD_KEY) !== "1") return;

      const retries = Number(sessionStorage.getItem(RETRY_KEY) ?? "0");
      if (retries >= MAX_AUTO_RETRIES) {
        await finishUpdate(reloadingRef);
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

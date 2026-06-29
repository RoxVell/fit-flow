"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { onSerwistEvent } from "@/components/shared/service-worker-register";

export interface UpdateAvailableState {
  updateAvailable: boolean;
  applyUpdate: () => Promise<void>;
}

const RELOAD_KEY = "fitflow.update.reloading";
const ACTIVATION_TIMEOUT_MS = 5000;

function requestSkipWaiting(reg: ServiceWorkerRegistration): void {
  if (window.serwist) {
    window.serwist.messageSkipWaiting();
    return;
  }
  reg.waiting?.postMessage({ type: "SKIP_WAITING" });
}

export function useUpdateAvailable(): UpdateAvailableState {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const reloadingRef = useRef(false);

  useEffect(() => {
    const offWaiting = onSerwistEvent("waiting", () => setUpdateAvailable(true));
    const offActivated = onSerwistEvent("activated", () =>
      setUpdateAvailable(false)
    );

    void navigator.serviceWorker?.getRegistration().then((reg) => {
      if (reg?.waiting) setUpdateAvailable(true);
    });

    return () => {
      offWaiting();
      offActivated();
    };
  }, []);

  const applyUpdate = useCallback(async () => {
    if (reloadingRef.current) return;

    let reloadTimer: ReturnType<typeof setTimeout> | undefined;

    const cleanup = () => {
      navigator.serviceWorker?.removeEventListener(
        "controllerchange",
        onControllerChange
      );
      if (reloadTimer) clearTimeout(reloadTimer);
    };

    const reload = () => {
      if (reloadingRef.current) return;
      reloadingRef.current = true;
      cleanup();
      sessionStorage.removeItem(RELOAD_KEY);
      setUpdateAvailable(false);
      window.location.reload();
    };

    const onControllerChange = () => {
      if (sessionStorage.getItem(RELOAD_KEY) === "1") reload();
    };

    try {
      sessionStorage.setItem(RELOAD_KEY, "1");
      const reg = await navigator.serviceWorker?.getRegistration();

      if (!reg?.waiting) {
        reload();
        return;
      }

      navigator.serviceWorker?.addEventListener(
        "controllerchange",
        onControllerChange
      );

      requestSkipWaiting(reg);

      reloadTimer = setTimeout(async () => {
        if (reloadingRef.current) return;
        const current = await navigator.serviceWorker?.getRegistration();
        if (current?.waiting) {
          cleanup();
          sessionStorage.removeItem(RELOAD_KEY);
          console.warn(
            "[useUpdateAvailable] skipWaiting timed out, waiting worker still present"
          );
          return;
        }
        reload();
      }, ACTIVATION_TIMEOUT_MS);
    } catch (err) {
      console.warn("[useUpdateAvailable] apply failed", err);
      cleanup();
      sessionStorage.removeItem(RELOAD_KEY);
    }
  }, []);

  return { updateAvailable, applyUpdate };
}

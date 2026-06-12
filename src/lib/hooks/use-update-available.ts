"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { onSerwistEvent } from "@/components/shared/service-worker-register";

export interface UpdateAvailableState {
  updateAvailable: boolean;
  applyUpdate: () => Promise<void>;
}

const RELOAD_KEY = "fitflow.update.reloading";
const ACTIVATION_TIMEOUT_MS = 5000;

export function useUpdateAvailable(): UpdateAvailableState {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const reloadingRef = useRef(false);

  useEffect(() => {
    const off = onSerwistEvent("waiting", () => setUpdateAvailable(true));
    const offCtrl = onSerwistEvent("controlling", () => {
      if (sessionStorage.getItem(RELOAD_KEY) === "1") {
        sessionStorage.removeItem(RELOAD_KEY);
        reloadingRef.current = true;
        window.location.reload();
      }
    });
    return () => {
      off();
      offCtrl();
    };
  }, []);

  const applyUpdate = useCallback(async () => {
    if (reloadingRef.current) return;
    let reloadTimer: ReturnType<typeof setTimeout> | undefined;
    let activated = false;

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
      window.location.reload();
    };

    const onControllerChange = () => {
      if (sessionStorage.getItem(RELOAD_KEY) === "1") {
        activated = true;
        reload();
      }
    };

    try {
      sessionStorage.setItem(RELOAD_KEY, "1");
      const reg = await navigator.serviceWorker?.getRegistration();
      if (!reg?.waiting) {
        sessionStorage.removeItem(RELOAD_KEY);
        return;
      }

      navigator.serviceWorker?.addEventListener(
        "controllerchange",
        onControllerChange
      );

      reg.waiting.postMessage({ type: "SKIP_WAITING" });

      reloadTimer = setTimeout(() => {
        if (!activated) reload();
      }, ACTIVATION_TIMEOUT_MS);
    } catch (err) {
      console.warn("[useUpdateAvailable] apply failed", err);
      cleanup();
      sessionStorage.removeItem(RELOAD_KEY);
    }
  }, []);

  return { updateAvailable, applyUpdate };
}
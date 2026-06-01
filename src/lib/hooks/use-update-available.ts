"use client";

import { useCallback, useEffect, useState } from "react";
import { onSerwistEvent } from "@/components/shared/service-worker-register";

export interface UpdateAvailableState {
  updateAvailable: boolean;
  applyUpdate: () => Promise<void>;
}

const RELOAD_KEY = "fitflow.update.reloading";

export function useUpdateAvailable(): UpdateAvailableState {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const off = onSerwistEvent("waiting", () => setUpdateAvailable(true));
    const offCtrl = onSerwistEvent("controlling", () => {
      if (sessionStorage.getItem(RELOAD_KEY) === "1") {
        sessionStorage.removeItem(RELOAD_KEY);
        window.location.reload();
      }
    });
    return () => {
      off();
      offCtrl();
    };
  }, []);

  const applyUpdate = useCallback(async () => {
    try {
      sessionStorage.setItem(RELOAD_KEY, "1");
      const reg = await navigator.serviceWorker?.getRegistration();
      reg?.waiting?.postMessage({ type: "SKIP_WAITING" });
      reg?.active?.postMessage({ type: "SKIP_WAITING" });
      setTimeout(() => {
        if (sessionStorage.getItem(RELOAD_KEY) === "1") {
          sessionStorage.removeItem(RELOAD_KEY);
          window.location.reload();
        }
      }, 1500);
    } catch (err) {
      console.warn("[useUpdateAvailable] apply failed", err);
    }
  }, []);

  return { updateAvailable, applyUpdate };
}

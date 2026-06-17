"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export const APP_VIEWPORT_HEIGHT = "--app-viewport-height";

/** Runs before paint so the first frame uses the real visual viewport height. */
export const appViewportBootstrapScript = `(function(){function s(){var h=window.innerHeight;if(window.visualViewport&&visualViewport.height>0)h=visualViewport.height;document.documentElement.style.setProperty("${APP_VIEWPORT_HEIGHT}",Math.round(h)+"px");}s();document.addEventListener("DOMContentLoaded",s);window.addEventListener("pageshow",s);})();`;

function getViewportHeight() {
  return window.visualViewport?.height ?? window.innerHeight;
}

function setAppViewportHeight() {
  const height = getViewportHeight();
  if (!Number.isFinite(height) || height <= 0) return;

  document.documentElement.style.setProperty(
    APP_VIEWPORT_HEIGHT,
    `${Math.round(height)}px`
  );
}

export function AppViewportHeight() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    let frame = 0;
    const timeouts = new Set<number>();

    const sync = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(setAppViewportHeight);
    };

    const syncAfterWebKitSettles = () => {
      sync();
      for (const delay of [50, 250, 750]) {
        const timeout = window.setTimeout(sync, delay);
        timeouts.add(timeout);
      }
    };

    const syncWhenVisible = () => {
      if (document.visibilityState === "visible") {
        syncAfterWebKitSettles();
      }
    };

    syncAfterWebKitSettles();

    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", syncAfterWebKitSettles);
    window.addEventListener("pageshow", syncAfterWebKitSettles);
    document.addEventListener("visibilitychange", syncWhenVisible);
    window.visualViewport?.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("scroll", sync);

    return () => {
      window.cancelAnimationFrame(frame);
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", syncAfterWebKitSettles);
      window.removeEventListener("pageshow", syncAfterWebKitSettles);
      document.removeEventListener("visibilitychange", syncWhenVisible);
      window.visualViewport?.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("scroll", sync);
    };
  }, [pathname]);

  return null;
}

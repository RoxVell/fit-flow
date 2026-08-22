"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/use-t";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const STORAGE_KEY = "fitflow.install-prompt.dismissed";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  if (
    /Mac/.test(ua) &&
    typeof navigator.maxTouchPoints === "number" &&
    navigator.maxTouchPoints > 1
  ) {
    return true;
  }
  return false;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  // @ts-expect-error - non-standard iOS Safari
  if (window.navigator.standalone === true) return true;
  return false;
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const t = useT();

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }

    const isDeviceIOS = isIOS();
    setIos(isDeviceIOS);

    const dismissed = window.localStorage.getItem(STORAGE_KEY);
    if (dismissed) {
      const ts = Number(dismissed);
      if (Number.isFinite(ts) && Date.now() - ts < DISMISS_DURATION_MS) return;
    }

    if (isDeviceIOS) {
      setVisible(true);
      return;
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const onInstalled = () => {
      setInstalled(true);
      setVisible(false);
      setDeferred(null);
      window.localStorage.removeItem(STORAGE_KEY);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || !visible) return null;

  const dismiss = () => {
    setVisible(false);
    window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
  };

  if (ios) {
    return (
      <div
        role="dialog"
        aria-label={t.pwa.installIosAria}
        className={cn(
          "fixed bottom-20 left-1/2 z-40 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm",
          "rounded-xl border bg-background/95 backdrop-blur shadow-lg p-3 flex items-start gap-3"
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Share className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{t.pwa.installTitle}</p>
          <p className="text-xs text-muted-foreground leading-snug">
            {t.pwa.shareHintPrefix} <Share className="inline h-3 w-3 -mt-0.5" />{" "}
            {t.pwa.shareHintSuffix}
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t.pwa.dismiss}
          className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  const handleInstall = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") {
        setVisible(false);
        setDeferred(null);
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      console.warn("[InstallPrompt] install failed", err);
    }
  };

  return (
    <div
      role="dialog"
      aria-label={t.pwa.installAria}
      className={cn(
        "fixed bottom-20 left-1/2 z-40 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm",
        "rounded-xl border bg-background/95 backdrop-blur shadow-lg p-3 flex items-center gap-3"
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Download className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{t.pwa.installTitle}</p>
        <p className="text-xs text-muted-foreground">{t.pwa.installSubtitle}</p>
      </div>
      <Button size="sm" onClick={handleInstall} className="shrink-0">
        {t.pwa.installCta}
      </Button>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t.pwa.dismiss}
        className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

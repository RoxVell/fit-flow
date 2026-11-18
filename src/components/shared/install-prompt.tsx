"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/use-t";
import { useHydrated } from "@/lib/hooks/use-hydrated";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const STORAGE_KEY = "fitflow.install-prompt.dismissed";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function isIOS(): boolean {
  const { userAgent, maxTouchPoints } = navigator;
  return /iPad|iPhone|iPod/.test(userAgent) || (/Mac/.test(userAgent) && maxTouchPoints > 1);
}

function isStandalone(): boolean {
  const iosNavigator = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia?.("(display-mode: standalone)").matches || iosNavigator.standalone === true;
}

export function InstallPrompt() {
  return useHydrated() ? <InstallPromptClient /> : null;
}

function wasDismissed(): boolean {
  const value = window.localStorage.getItem(STORAGE_KEY);
  const timestamp = Number(value);
  return value !== null && Number.isFinite(timestamp) && Date.now() - timestamp < DISMISS_DURATION_MS;
}

function InstallPromptClient() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(wasDismissed);
  const [installed, setInstalled] = useState(isStandalone);
  const ios = isIOS();
  const t = useT();

  useEffect(() => {
    if (installed || ios || dismissed) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      window.localStorage.removeItem(STORAGE_KEY);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [installed, ios, dismissed]);

  if (installed || dismissed || (!ios && !deferred)) return null;

  const dismiss = () => {
    setDismissed(true);
    setDeferred(null);
    window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
  };

  const Icon = ios ? Share : Download;

  const handleInstall = async () => {
    if (!deferred) return;
    setDeferred(null);
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      console.warn("[InstallPrompt] install failed", err);
    }
  };

  return (
    <div
      role="dialog"
      aria-label={ios ? t.pwa.installIosAria : t.pwa.installAria}
      className={cn(
        "fixed bottom-20 left-1/2 z-40 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm",
        "rounded-xl border bg-background/95 backdrop-blur shadow-lg p-3 flex gap-3",
        ios ? "items-start" : "items-center"
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{t.pwa.installTitle}</p>
        <p className={cn("text-xs text-muted-foreground", ios && "leading-snug")}>
          {ios ? (
            <>{t.pwa.shareHintPrefix} <Share className="inline h-3 w-3 -mt-0.5" /> {t.pwa.shareHintSuffix}</>
          ) : t.pwa.installSubtitle}
        </p>
      </div>
      {!ios && (
        <Button size="sm" onClick={handleInstall} className="shrink-0">
          {t.pwa.installCta}
        </Button>
      )}
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

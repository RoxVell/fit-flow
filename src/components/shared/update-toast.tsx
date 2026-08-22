"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUpdateAvailable } from "@/lib/hooks/use-update-available";

export function UpdateToast() {
  const { updateAvailable, applying, applyUpdate } = useUpdateAvailable();
  if (!updateAvailable && !applying) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-32 left-1/2 z-50 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm rounded-xl border bg-background/95 backdrop-blur shadow-lg p-3 flex items-center gap-3"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <RefreshCw className={`h-5 w-5 ${applying ? "animate-spin" : ""}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">Update available</p>
        <p className="text-xs text-muted-foreground">
          {applying ? "Updating…" : "A new version of FitFlow is ready"}
        </p>
      </div>
      <Button
        size="sm"
        onClick={() => void applyUpdate()}
        className="shrink-0"
        disabled={applying}
      >
        {applying ? "Updating…" : "Reload"}
      </Button>
    </div>
  );
}

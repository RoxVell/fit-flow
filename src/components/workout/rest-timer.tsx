"use client";

import { useCallback, useSyncExternalStore } from "react";
import { m } from "framer-motion";
import { SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CircularProgress } from "@/components/ui/circular-progress";
import { useT } from "@/lib/i18n/use-t";
import { formatRestDuration } from "@/lib/workout/rest-duration";

interface RestTimerProps {
  endTime: number | null;
  duration: number;
  isRunning: boolean;
  onStop: () => void;
}

export function RestTimer({ endTime, duration, isRunning, onStop }: RestTimerProps) {
  const t = useT();
  const subscribe = useCallback((notify: () => void) => {
    if (!isRunning || endTime === null) return () => {};
    const interval = setInterval(() => {
      notify();
      if (endTime - Date.now() < 1000) clearInterval(interval);
    }, 100);
    return () => clearInterval(interval);
  }, [endTime, isRunning]);
  const remaining = useSyncExternalStore(
    subscribe,
    () => isRunning && endTime !== null ? Math.max(0, Math.floor((endTime - Date.now()) / 1000)) : 0,
    () => 0
  );

  if (!isRunning || remaining <= 0) return null;

  const progress = duration > 0 ? remaining / duration : 0;

  return (
    <m.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+4rem+0.75rem)] left-1/2 z-50 w-full max-w-lg -translate-x-1/2 px-4"
    >
      <div className="flex items-center gap-3 rounded-xl bg-card/80 backdrop-blur px-4 py-2 shadow-lg border">
        <div className="relative flex items-center justify-center shrink-0">
          <CircularProgress progress={progress} />
          <span className="absolute text-lg font-bold tabular-nums">
            {formatRestDuration(remaining)}
          </span>
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          {t.workout.restTimer}
        </span>
        <div className="flex-1" />
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onStop}>
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>
    </m.div>
  );
}

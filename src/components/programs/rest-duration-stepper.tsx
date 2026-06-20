"use client";

import { Minus, Plus } from "lucide-react";
import {
  formatRestDuration,
  REST_DURATION_MAX_SECONDS,
  REST_DURATION_MIN_SECONDS,
  REST_DURATION_STEP_SECONDS,
} from "@/lib/workout/rest-duration";
import { cn } from "@/lib/utils";

interface RestDurationStepperProps {
  value: number;
  onChange: (seconds: number) => void;
  label: string;
  className?: string;
}

export function RestDurationStepper({
  value,
  onChange,
  label,
  className,
}: RestDurationStepperProps) {
  const decrement = () => {
    onChange(Math.max(REST_DURATION_MIN_SECONDS, value - REST_DURATION_STEP_SECONDS));
  };

  const increment = () => {
    onChange(Math.min(REST_DURATION_MAX_SECONDS, value + REST_DURATION_STEP_SECONDS));
  };

  return (
    <div className={cn("px-4 py-3.5", className)}>
      <label className="mb-2 block text-xs font-medium text-muted-foreground">{label}</label>
      <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2">
        <button
          type="button"
          onClick={decrement}
          disabled={value <= REST_DURATION_MIN_SECONDS}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
          aria-label="Decrease rest duration"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="text-lg font-semibold tabular-nums">{formatRestDuration(value)}</span>
        <button
          type="button"
          onClick={increment}
          disabled={value >= REST_DURATION_MAX_SECONDS}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
          aria-label="Increase rest duration"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

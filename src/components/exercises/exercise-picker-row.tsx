"use client";

import { ExerciseThumbnail } from "@/components/exercises/exercise-thumbnail";
import { cn } from "@/lib/utils";

interface ExercisePickerRowProps {
  name: string;
  thumbnailUri: string | null;
  subtitle?: string;
  usageCount?: number;
  usageLabel?: string;
  onClick: () => void;
  action?: React.ReactNode;
  className?: string;
}

export function ExercisePickerRow({
  name,
  thumbnailUri,
  subtitle,
  usageCount,
  usageLabel,
  onClick,
  action,
  className,
}: ExercisePickerRowProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-accent active:bg-accent/80",
        className
      )}
      onClick={onClick}
    >
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
        <ExerciseThumbnail src={thumbnailUri} alt={name} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        {subtitle ? (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {usageCount != null && usageCount > 0 && usageLabel ? (
          <span className="text-xs text-muted-foreground">{usageLabel}</span>
        ) : null}
        {action}
      </div>
    </button>
  );
}

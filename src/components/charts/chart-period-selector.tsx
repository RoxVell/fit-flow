"use client";

import type { ChartPeriod } from "@/lib/charts/periods";
import { cn } from "@/lib/utils";

interface ChartPeriodSelectorProps {
  period: ChartPeriod;
  onChange: (period: ChartPeriod) => void;
  labels: { value: ChartPeriod; label: string }[];
  className?: string;
}

export function ChartPeriodSelector({
  period,
  onChange,
  labels,
  className,
}: ChartPeriodSelectorProps) {
  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center rounded-lg border bg-muted/50 p-0.5",
        className
      )}
    >
      {labels.map((p) => (
        <button
          key={p.value}
          type="button"
          onClick={() => onChange(p.value)}
          className={cn(
            "rounded-md px-2 py-1 text-xs font-medium transition-all",
            period === p.value
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

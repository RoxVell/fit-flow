"use client";

import { SegmentedTabs } from "@/components/ui/segmented-tabs";
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
    <SegmentedTabs
      variant="card"
      items={labels}
      value={period}
      onChange={onChange}
      className={cn("shrink-0", className)}
      buttonClassName="px-2 py-1 text-xs"
    />
  );
}

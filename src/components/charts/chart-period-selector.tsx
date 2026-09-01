"use client";

import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import type { ChartPeriod } from "@/lib/charts/periods";
import { useT } from "@/lib/i18n/use-t";
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
  const t = useT();
  return (
    <SegmentedTabs
      variant="card"
      items={labels}
      value={period}
      onChange={onChange}
      ariaLabel={t.progress.periodSelector}
      truncate={false}
      className={cn("w-full", className)}
      buttonClassName="px-1.5 py-1 text-xs"
    />
  );
}

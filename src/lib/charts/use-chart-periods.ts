"use client";

import type { ChartPeriod } from "@/lib/charts/periods";
import { useT } from "@/lib/i18n/use-t";

export function useChartPeriods(): { value: ChartPeriod; label: string }[] {
  const t = useT();
  return [
    { value: "1m", label: t.progress.period1m },
    { value: "2m", label: t.progress.period2m },
    { value: "3m", label: t.progress.period3m },
    { value: "6m", label: t.progress.period6m },
    { value: "all", label: t.progress.periodAll },
  ];
}

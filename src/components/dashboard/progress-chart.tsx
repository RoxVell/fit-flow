"use client";

import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useWorkoutLogs } from "@/lib/hooks/use-data";
import { ChartPeriodSelector } from "@/components/charts/chart-period-selector";
import { PeriodChangeIndicator } from "@/components/charts/period-change-indicator";
import { computeFocusDomain, computePeriodChange } from "@/lib/charts/domain";
import { DEFAULT_CHART_PERIOD, type ChartPeriod } from "@/lib/charts/periods";
import { useChartPeriods } from "@/lib/charts/use-chart-periods";
import {
  buildWeeklyExerciseBest1RM,
  buildPerExerciseBaseline,
  computeOverallProgressSeries,
  filterWeeksByPeriod,
  getSortedWeeks,
} from "@/lib/charts/weekly-progress";
import { useT } from "@/lib/i18n/use-t";
import { useFormat } from "@/lib/i18n/use-format";

export function ProgressChart() {
  const logs = useWorkoutLogs(200);
  const [period, setPeriod] = useState<ChartPeriod>(DEFAULT_CHART_PERIOD);
  const t = useT();
  const { formatShortDate } = useFormat();

  const periods = useChartPeriods();

  const { chartData, periodChange } = useMemo(() => {
    if (!logs || logs.length === 0) return { chartData: null, periodChange: null };

    const weeksMap = buildWeeklyExerciseBest1RM(logs);
    const sortedWeeks = getSortedWeeks(weeksMap);
    if (sortedWeeks.length < 2) return { chartData: null, periodChange: null };

    const filteredWeeks = filterWeeksByPeriod(sortedWeeks, period);
    if (filteredWeeks.length < 2) return { chartData: null, periodChange: null };

    const baseline = buildPerExerciseBaseline(sortedWeeks);
    const data = computeOverallProgressSeries(filteredWeeks, baseline, formatShortDate);
    return {
      chartData: data,
      periodChange: computePeriodChange(data.map((d) => d.progress)),
    };
  }, [logs, period, formatShortDate]);

  const yDomain = useMemo(() => {
    if (!chartData?.length) return undefined;
    return computeFocusDomain(chartData.map((d) => d.progress));
  }, [chartData]);

  if (!chartData || periodChange === null) return null;

  const isPositive = periodChange.percent >= 0;
  const strokeColor = isPositive ? "#22c55e" : "#ef4444";

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-heading font-medium">{t.progress.generalProgress}</p>
          <PeriodChangeIndicator
            change={periodChange}
            variant="percent-points"
            className="mt-1"
          />
        </div>
        <ChartPeriodSelector period={period} onChange={setPeriod} labels={periods} />
      </div>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="progressFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.35} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-muted)" vertical={false} />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 10 }}
              stroke="var(--color-muted-foreground)"
            />
            <YAxis
              tick={{ fontSize: 10 }}
              stroke="var(--color-muted-foreground)"
              domain={yDomain}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              wrapperStyle={{ outline: "none" }}
              contentStyle={{
                backgroundColor: "var(--color-popover)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "var(--color-popover-foreground)",
              }}
              formatter={(value) => [`${value}%`, t.progress.title]}
              cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="progress"
              stroke={strokeColor}
              strokeWidth={2}
              fill="url(#progressFill)"
              dot={{ fill: strokeColor, r: 2.5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

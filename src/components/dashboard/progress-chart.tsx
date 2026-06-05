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
import { e1RM } from "@/lib/training-metrics";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

const periods = [
  { value: "4w", label: "4W", days: 28 },
  { value: "8w", label: "8W", days: 56 },
  { value: "all", label: "All", days: Infinity },
] as const;

type Period = (typeof periods)[number]["value"];

export function ProgressChart() {
  const logs = useWorkoutLogs(50);
  const [period, setPeriod] = useState<Period>("8w");

  const chartData = useMemo(() => {
    if (!logs || logs.length === 0) return null;

    const weeksMap = new Map<string, Map<string, number>>();

    for (const log of logs) {
      if (!log.endedAt) continue;
      const weekStart = getMonday(new Date(log.endedAt)).toISOString();

      if (!weeksMap.has(weekStart)) {
        weeksMap.set(weekStart, new Map());
      }
      const weekExercises = weeksMap.get(weekStart)!;

      for (const ex of log.exercises) {
        const completed = ex.sets.filter((s) => s.completed && s.weight > 0 && s.reps > 0);
        if (completed.length === 0) continue;

        let best1RM = 0;
        for (const set of completed) {
          const e1rm = e1RM(set.weight, set.reps);
          if (e1rm > best1RM) best1RM = e1rm;
        }

        const current = weekExercises.get(ex.exerciseId) || 0;
        if (best1RM > current) {
          weekExercises.set(ex.exerciseId, best1RM);
        }
      }
    }

    const sortedWeeks = [...weeksMap.entries()].sort(
      ([a], [b]) => new Date(a).getTime() - new Date(b).getTime()
    );

    if (sortedWeeks.length < 2) return null;

    const selected = periods.find((p) => p.value === period)!;
    let filteredWeeks = sortedWeeks;
    if (selected.days !== Infinity) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - selected.days);
      filteredWeeks = sortedWeeks.filter(
        ([weekStart]) => new Date(weekStart) >= cutoff
      );
    }

    if (filteredWeeks.length < 2) return null;

    const baseline = new Map(sortedWeeks[0][1]);

    const result = filteredWeeks.map(([weekStart, exercises]) => {
      let total = 0;
      let count = 0;

      for (const [exId, value] of exercises) {
        const baseValue = baseline.get(exId);
        if (baseValue && baseValue > 0) {
          total += (value / baseValue) * 100;
          count++;
        }
      }

      const progress = count > 0 ? total / count : 100;

      const d = new Date(weekStart);
      const label = `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

      return { week: label, progress: Math.round(progress * 10) / 10 };
    });

    return result;
  }, [logs, period]);

  const change = useMemo(() => {
    if (!chartData || chartData.length < 2) return null;
    return Math.round((chartData[chartData.length - 1].progress - chartData[0].progress) * 10) / 10;
  }, [chartData]);

  if (!chartData || change === null) return null;

  const isPositive = change >= 0;
  const strokeColor = isPositive ? "#22c55e" : "#ef4444";

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-heading font-medium">General progress</p>
          <p className="text-lg font-bold flex items-center gap-1">
            {isPositive ? (
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-500" />
            )}
            {isPositive ? "+" : ""}
            {change}%
          </p>
        </div>
        <div className="inline-flex items-center rounded-lg border bg-muted/50 p-0.5">
          {periods.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
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
              domain={["dataMin - 2", "dataMax + 2"]}
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
              formatter={(value) => [`${value}%`, "Прогресс"]}
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

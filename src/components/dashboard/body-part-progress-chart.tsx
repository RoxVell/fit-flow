"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useWorkoutLogs } from "@/lib/hooks/use-data";
import { useExerciseManifest } from "@/lib/hooks/use-exercise-library";
import { ChartPeriodSelector } from "@/components/charts/chart-period-selector";
import { BODY_PART_CHART_COLORS } from "@/lib/charts/body-part-colors";
import { computeFocusDomain, type PeriodChange } from "@/lib/charts/domain";
import { DEFAULT_CHART_PERIOD, type ChartPeriod } from "@/lib/charts/periods";
import { useChartPeriods } from "@/lib/charts/use-chart-periods";
import {
  buildWeeklyExerciseBest1RM,
  buildPerExerciseBaseline,
  collectNumericValues,
  computeBodyPartChartChanges,
  computeBodyPartProgressSeries,
  computeExerciseProgressSummaries,
  filterWeeksByPeriod,
  getSortedWeeks,
  type ExerciseProgressSummary,
} from "@/lib/charts/weekly-progress";
import { pickLocalized } from "@/lib/exercises/locale";
import { BODY_PART_LABELS, labelFor } from "@/lib/exercises/labels";
import type { BodyPart } from "@/lib/exercises/types";
import { useT } from "@/lib/i18n/use-t";
import { useFormat } from "@/lib/i18n/use-format";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

function formatChange(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}%`;
}

function ChangeBadge({ value }: { value: number }) {
  const isPositive = value > 0;
  const isNegative = value < 0;

  return (
    <span
      className={cn(
        "text-xs font-medium tabular-nums",
        isPositive && "text-green-500",
        isNegative && "text-red-500",
        !isPositive && !isNegative && "text-muted-foreground"
      )}
    >
      {formatChange(value)}
    </span>
  );
}

function ExerciseProgressRow({
  name,
  current,
  change,
}: {
  name: string;
  current: number | null;
  change: ExerciseProgressSummary["change"];
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm">
      <span className="min-w-0 truncate text-muted-foreground">{name}</span>
      <div className="flex shrink-0 items-baseline gap-1.5">
        {current !== null ? (
          <span className="font-medium tabular-nums">{Math.round(current * 10) / 10}%</span>
        ) : null}
        {change ? <ChangeBadge value={change.percent} /> : null}
      </div>
    </div>
  );
}

export function BodyPartProgressChart() {
  const logs = useWorkoutLogs(200);
  const { manifest } = useExerciseManifest();
  const [period, setPeriod] = useState<ChartPeriod>(DEFAULT_CHART_PERIOD);
  const [expandedBodyPart, setExpandedBodyPart] = useState<BodyPart | null>(null);
  const t = useT();
  const locale = useLocale();
  const { formatShortDate } = useFormat();
  const periods = useChartPeriods();

  const chartModel = useMemo(() => {
    if (!logs?.length || !manifest) return null;

    const exerciseBodyPart = new Map(
      manifest.map((item) => [item.id, item.bodyPart] as const)
    );
    const exerciseNames = new Map(
      manifest.map((item) => [item.id, pickLocalized(item.name, locale)] as const)
    );

    const weeksMap = buildWeeklyExerciseBest1RM(logs);
    const sortedWeeks = getSortedWeeks(weeksMap);
    if (sortedWeeks.length < 2) return null;

    const filteredWeeks = filterWeeksByPeriod(sortedWeeks, period);
    if (filteredWeeks.length < 2) return null;

    const baseline = buildPerExerciseBaseline(sortedWeeks);
    const series = computeBodyPartProgressSeries(
      filteredWeeks,
      baseline,
      exerciseBodyPart,
      formatShortDate
    );

    if (series.bodyParts.length === 0) return null;

    const exerciseSummaries = new Map<BodyPart, ExerciseProgressSummary[]>();
    for (const bodyPart of series.bodyParts) {
      exerciseSummaries.set(
        bodyPart,
        computeExerciseProgressSummaries(
          filteredWeeks,
          baseline,
          exerciseBodyPart,
          bodyPart
        )
      );
    }

    return {
      chartData: series.chartData,
      bodyParts: series.bodyParts,
      bodyPartChartChanges: computeBodyPartChartChanges(
        series.chartData,
        series.bodyParts
      ),
      exerciseSummaries,
      exerciseNames,
    };
  }, [logs, manifest, period, formatShortDate, locale]);

  const yDomain = useMemo(() => {
    if (!chartModel?.chartData.length || chartModel.bodyParts.length === 0) return undefined;
    return computeFocusDomain(
      collectNumericValues(chartModel.chartData, chartModel.bodyParts)
    );
  }, [chartModel]);

  if (!chartModel) return null;

  const { chartData, bodyParts, bodyPartChartChanges, exerciseSummaries, exerciseNames } =
    chartModel;

  const toggleBodyPart = (bodyPart: BodyPart) => {
    setExpandedBodyPart((current) => (current === bodyPart ? null : bodyPart));
  };

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-heading font-medium">{t.progress.bodyPartProgress}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{t.progress.bodyPartChartHint}</p>
        </div>
        <ChartPeriodSelector period={period} onChange={setPeriod} labels={periods} />
      </div>

      <div className="h-52 outline-none">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
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
              formatter={(value, name) => [
                `${value}%`,
                labelFor(BODY_PART_LABELS, String(name), locale),
              ]}
              cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }}
            />
            {bodyParts.map((bodyPart) => (
              <Line
                key={bodyPart}
                type="monotone"
                dataKey={bodyPart}
                stroke={BODY_PART_CHART_COLORS[bodyPart]}
                strokeWidth={expandedBodyPart === bodyPart ? 2.5 : 2}
                dot={false}
                connectNulls
                hide={expandedBodyPart !== null && expandedBodyPart !== bodyPart}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {bodyParts.map((bodyPart) => (
          <div key={bodyPart} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: BODY_PART_CHART_COLORS[bodyPart] }}
            />
            <span className="text-xs text-muted-foreground">
              {labelFor(BODY_PART_LABELS, bodyPart, locale)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 space-y-2">
        {bodyParts.map((bodyPart) => {
          const chartChange: PeriodChange | null | undefined =
            bodyPartChartChanges.get(bodyPart);
          const isExpanded = expandedBodyPart === bodyPart;
          const exercises = exerciseSummaries.get(bodyPart) ?? [];

          return (
            <div key={bodyPart} className="overflow-hidden rounded-lg border bg-muted/20">
              <button
                type="button"
                onClick={() => toggleBodyPart(bodyPart)}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-muted/40"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: BODY_PART_CHART_COLORS[bodyPart] }}
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {labelFor(BODY_PART_LABELS, bodyPart, locale)}
                </span>
                {chartChange ? <ChangeBadge value={chartChange.percent} /> : null}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                    isExpanded && "rotate-180"
                  )}
                />
              </button>

              {isExpanded ? (
                <div className="space-y-0.5 border-t bg-background/60 px-1 py-1">
                  {exercises.length > 0 ? (
                    exercises.map((exercise) => (
                      <ExerciseProgressRow
                        key={exercise.exerciseId}
                        name={
                          exerciseNames.get(exercise.exerciseId) ??
                          t.workout.unknownExercise
                        }
                        current={exercise.current}
                        change={exercise.change}
                      />
                    ))
                  ) : (
                    <p className="px-2 py-2 text-xs text-muted-foreground">
                      {t.progress.noData}
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

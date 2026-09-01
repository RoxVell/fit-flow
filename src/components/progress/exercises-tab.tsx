"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartPeriodSelector } from "@/components/charts/chart-period-selector";
import { PeriodChangeIndicator } from "@/components/charts/period-change-indicator";
import { ExercisePickerDialog } from "@/components/exercises/exercise-picker-dialog";
import { ExerciseThumbnail } from "@/components/exercises/exercise-thumbnail";
import {
  useExerciseHistory,
  useExerciseDetailedHistory,
  useExercise,
} from "@/lib/hooks/use-data";
import { useExerciseUsageCounts } from "@/lib/hooks/use-exercise-usage";
import { HistoryAccordion } from "@/components/progress/history-accordion";
import { useT } from "@/lib/i18n/use-t";
import { useFormat } from "@/lib/i18n/use-format";
import { computeFocusDomain, computePeriodChange } from "@/lib/charts/domain";
import { DEFAULT_CHART_PERIOD, filterByPeriod, type ChartPeriod } from "@/lib/charts/periods";
import { useChartPeriods } from "@/lib/charts/use-chart-periods";

export function ExercisesTab() {
  const t = useT();
  const { formatShortDate } = useFormat();
  const usageCounts = useExerciseUsageCounts();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [chartType, setChartType] = useState<"1rm" | "volume">("1rm");
  const [period, setPeriod] = useState<ChartPeriod>(DEFAULT_CHART_PERIOD);
  const periods = useChartPeriods();

  const usedExerciseIds = useMemo(() => {
    if (!usageCounts) return undefined;
    return [...usageCounts.entries()]
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);
  }, [usageCounts]);

  useEffect(() => {
    if (!usedExerciseIds) return;
    if (usedExerciseIds.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !usedExerciseIds.includes(selectedId)) {
      setSelectedId(usedExerciseIds[0]);
    }
  }, [usedExerciseIds, selectedId]);

  const history = useExerciseHistory(selectedId ?? "");
  const detailedHistory = useExerciseDetailedHistory(selectedId ?? "");
  const selectedExercise = useExercise(selectedId ?? "");

  const chartData = useMemo(() => {
    if (!history) return undefined;

    const filtered = filterByPeriod(
      history.map((h) => ({ ...h, date: h.date })),
      period
    );

    return filtered.map((h) => ({
      date: formatShortDate(h.date),
      estimated1RM: Math.round(h.estimated1RM * 10) / 10,
      volume: Math.round(h.volume),
    }));
  }, [history, period, formatShortDate]);

  const dataKey = chartType === "1rm" ? "estimated1RM" : "volume";

  const yDomain = useMemo(() => {
    if (!chartData?.length) return undefined;
    return computeFocusDomain(chartData.map((d) => d[dataKey]));
  }, [chartData, dataKey]);

  const periodChange = useMemo(() => {
    if (!chartData?.length) return null;
    return computePeriodChange(chartData.map((d) => d[dataKey]));
  }, [chartData, dataKey]);

  const sessions = detailedHistory || [];
  const hasUsedExercises = usedExerciseIds && usedExerciseIds.length > 0;
  const unit = t.workout.kg;

  return (
    <div className="space-y-4">
      {hasUsedExercises ? (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex w-full items-center gap-3 rounded-xl border bg-card p-3 text-left transition-colors hover:bg-accent/50 active:bg-accent/80"
        >
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
            <ExerciseThumbnail
              src={selectedExercise?.imageUrl ?? null}
              alt={selectedExercise?.name ?? ""}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {selectedExercise?.name ?? "…"}
            </p>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      ) : (
        <div className="rounded-xl border bg-card p-4 text-center text-sm text-muted-foreground">
          {t.progress.noData}
        </div>
      )}

      {pickerOpen ? (
        <ExercisePickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          title={t.progress.exerciseProgress}
          onlyUsed
          onSelect={setSelectedId}
          emptyMessage={t.progress.noData}
        />
      ) : null}

      {selectedId ? (
        <Card>
          <CardHeader className="space-y-2 pb-2">
            <div className="space-y-2">
              <div className="min-w-0">
                <CardTitle className="text-sm font-medium">
                  {t.progress.exerciseProgress}
                </CardTitle>
                {periodChange ? (
                  <PeriodChangeIndicator change={periodChange} unit={unit} className="mt-1" />
                ) : null}
              </div>
              <ChartPeriodSelector
                period={period}
                onChange={setPeriod}
                labels={periods}
              />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={chartType} onValueChange={(v) => setChartType(v as typeof chartType)}>
              <TabsList className="mb-3">
                <TabsTrigger value="1rm" className="text-xs">{t.dashboard.prE1rm}</TabsTrigger>
                <TabsTrigger value="volume" className="text-xs">{t.progress.chartVolume}</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="h-48 outline-none">
              {chartData && chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "1rm" ? (
                    <LineChart data={chartData} margin={{ top: 5, right: 0, left: -15, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-muted)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        stroke="var(--color-muted-foreground)"
                        domain={yDomain}
                        tickFormatter={(v) => `${v}`}
                      />
                      <Tooltip
                        wrapperStyle={{ outline: "none" }}
                        contentStyle={{
                          backgroundColor: "#1f1f1f",
                          border: "1px solid #333",
                          borderRadius: "8px",
                          fontSize: "12px",
                          color: "#eee",
                        }}
                        cursor={{ stroke: "#444", strokeWidth: 1 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="estimated1RM"
                        stroke="var(--color-primary)"
                        strokeWidth={2}
                        dot={{ fill: "var(--color-primary)", r: 3 }}
                      />
                    </LineChart>
                  ) : (
                    <BarChart data={chartData} margin={{ top: 5, right: 0, left: -15, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-muted)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        stroke="var(--color-muted-foreground)"
                        domain={yDomain}
                        tickFormatter={(v) => `${v}`}
                      />
                      <Tooltip
                        wrapperStyle={{ outline: "none" }}
                        contentStyle={{
                          backgroundColor: "#1f1f1f",
                          border: "1px solid #333",
                          borderRadius: "8px",
                          fontSize: "12px",
                          color: "#eee",
                        }}
                        cursor={{ fill: "#333" }}
                      />
                      <Bar dataKey="volume" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  {t.progress.noData}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {selectedId ? <HistoryAccordion sessions={sessions} /> : null}
    </div>
  );
}

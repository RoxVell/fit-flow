"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartPeriodSelector } from "@/components/charts/chart-period-selector";
import { BodyMeasurementHistory } from "@/components/progress/body-measurement-history";
import { useDailyBodyViews } from "@/lib/hooks/use-data";
import {
  BODY_METRIC_FIELDS,
  LEGACY_BODY_METRIC_FIELDS,
} from "@/lib/body-measurements/metrics";
import { DEFAULT_CHART_PERIOD, filterByPeriod, type ChartPeriod } from "@/lib/charts/periods";
import { useT } from "@/lib/i18n/use-t";
import { useFormat } from "@/lib/i18n/use-format";

const COLORS = [
  "var(--color-primary)",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#14b8a6",
  "#a855f7",
  "#64748b",
  "#84cc16",
];

const CIRCUMFERENCE_CHART_FIELDS = [
  ...BODY_METRIC_FIELDS.filter((field) => field !== "weight"),
  ...LEGACY_BODY_METRIC_FIELDS,
] as const;

export function BodyTab() {
  const router = useRouter();
  const dailyViews = useDailyBodyViews();
  const t = useT();
  const { formatChartDate } = useFormat();
  const [period, setPeriod] = useState<ChartPeriod>(DEFAULT_CHART_PERIOD);

  const periods = [
    { value: "1m" as const, label: t.progress.period1m },
    { value: "2m" as const, label: t.progress.period2m },
    { value: "3m" as const, label: t.progress.period3m },
    { value: "6m" as const, label: t.progress.period6m },
    { value: "all" as const, label: t.progress.periodAll },
  ];

  const measurementConfig = CIRCUMFERENCE_CHART_FIELDS.map((key, index) => ({
    key,
    label: t.progress.bodyMeasurements[key],
    color: COLORS[index] ?? COLORS[0]!,
  }));

  const chartData = useMemo(() => {
    if (!dailyViews) return undefined;
    return filterByPeriod(dailyViews, period).map((view) => ({
      date: formatChartDate(view.date),
      weight: view.weight,
      chest: view.chest,
      waist: view.waist,
      leftArm: view.leftArm,
      rightArm: view.rightArm,
      leftThigh: view.leftThigh,
      rightThigh: view.rightThigh,
      leftCalf: view.leftCalf,
      rightCalf: view.rightCalf,
      arms: view.arms,
      thighs: view.thighs,
      calves: view.calves,
    }));
  }, [dailyViews, period, formatChartDate]);

  const hasChartData = chartData && chartData.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <ChartPeriodSelector period={period} onChange={setPeriod} labels={periods} />
        <Button size="sm" onClick={() => router.push("/progress/body/log")}>
          <Plus className="h-4 w-4" />
          {t.progress.logMeasurement}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{t.progress.bodyWeight}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 outline-none">
            {hasChartData ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 0, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-muted)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" />
                  <YAxis tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" domain={["dataMin - 2", "dataMax + 2"]} />
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
                    dataKey="weight"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-primary)", r: 3 }}
                    name={t.progress.bodyMeasurements.weight}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {t.progress.noMeasurementsYet}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{t.progress.bodyMeasurementsTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 outline-none">
            {hasChartData ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 0, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-muted)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" />
                  <YAxis tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" />
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
                  {measurementConfig.map((cfg) => (
                    <Line
                      key={cfg.key}
                      type="monotone"
                      dataKey={cfg.key}
                      stroke={cfg.color}
                      strokeWidth={2}
                      dot={{ fill: cfg.color, r: 2 }}
                      name={cfg.label}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {t.progress.noMeasurementsYet}
              </div>
            )}
          </div>
          {hasChartData && (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
              {measurementConfig.map((cfg) => (
                <div key={cfg.key} className="flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: cfg.color }}
                  />
                  <span className="text-xs text-muted-foreground">{cfg.label}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <BodyMeasurementHistory />
    </div>
  );
}

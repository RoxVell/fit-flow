import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/card";
import { SectionTitle } from "@/components/dashboard/section-title";
import { GlassButton } from "@/components/glass-button";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { computePeriodChange, toDeltaSeries, type ChartPoint } from "@/lib/charts/domain";
import { DEFAULT_CHART_PERIOD, filterByPeriod, type ChartPeriod } from "@/lib/charts/periods";
import { buildDailyBodyViews } from "@/lib/dashboard/daily-body-view";
import { formatShortDate } from "@/lib/dashboard/date";
import { TABLES } from "@/lib/db/database";
import { useLiveQuery } from "@/lib/db/live-query";
import { useLocale, useT } from "@/lib/i18n/locale-context";
import {
  CIRCUMFERENCE_FIELDS,
  fieldsWithData,
  latestMetricValue,
  metricSeries,
  metricUnit,
} from "@/lib/progress/body";
import { listBodyMeasurements, type BodyMetricField } from "@/lib/repositories/measurements";

import { BodyMeasurementHistory } from "./body-measurement-history";
import { EmptyCard } from "./empty-card";
import { PeriodChangeLabel } from "./period-change";
import { PeriodPicker } from "./period-picker";
import { ProgressChart } from "./progress-chart";

// Same palette order as the web BodyTab overlay (chest, waist, arms, …).
const CIRCUMFERENCE_COLORS: Record<Exclude<BodyMetricField, "weight">, string> = {
  chest: "#f97316",
  waist: "#22c55e",
  leftArm: "#f59e0b",
  rightArm: "#ef4444",
  leftThigh: "#8b5cf6",
  rightThigh: "#06b6d4",
  leftCalf: "#ec4899",
  rightCalf: "#14b8a6",
};

// Progress → Body (web: BodyTab). Charts read the daily body view; the
// history lists raw snapshots. Circumferences are one series at a time
// (native Chart is single-line) with a tappable legend of latest values.
export function BodyView() {
  const t = useT();
  const theme = useTheme();
  const router = useRouter();
  const { locale } = useLocale();
  const [period, setPeriod] = useState<ChartPeriod>(DEFAULT_CHART_PERIOD);
  const [pickedField, setPickedField] = useState<BodyMetricField | null>(null);
  const measurements = useLiveQuery(listBodyMeasurements, [TABLES.bodyMeasurements]);

  const openLog = () => router.push("/progress/body-log");

  if (measurements.length === 0) {
    return (
      <EmptyCard symbol="scalemass" title={t.progress.noMeasurementsYet} body={t.progress.noMeasurementsHint}>
        <GlassButton label={t.progress.logMeasurement} symbol="plus" onPress={openLog} />
      </EmptyCard>
    );
  }

  const views = filterByPeriod(buildDailyBodyViews(measurements), period);
  const formatDate = (iso: string) => formatShortDate(iso, locale);
  const weightPoints = metricSeries(views, "weight", formatDate);

  const circumferenceFields = fieldsWithData(views, CIRCUMFERENCE_FIELDS);
  const field = pickedField && circumferenceFields.includes(pickedField) ? pickedField : (circumferenceFields[0] ?? null);
  const fieldPoints = field ? metricSeries(views, field, formatDate) : [];
  const fieldColor = field && field !== "weight" ? CIRCUMFERENCE_COLORS[field] : theme.primary;

  return (
    <>
      <PeriodPicker period={period} onChange={setPeriod} />

      <MetricCard
        symbol="scalemass"
        title={t.progress.bodyWeight}
        points={weightPoints}
        unit={t.progress.kg}
        emptyText={t.progress.noPeriodData}
      />

      <MetricCard
        symbol="ruler"
        title={t.progress.circumferences}
        points={fieldPoints}
        unit={field ? t.progress[metricUnit(field)] : t.progress.cm}
        emptyText={t.progress.noPeriodData}
        color={fieldColor}
        legend={
          circumferenceFields.length > 0 ? (
            <View style={styles.legend}>
              {circumferenceFields.map((item) => {
                const active = item === field;
                const color = item === "weight" ? theme.primary : CIRCUMFERENCE_COLORS[item];
                const latest = latestMetricValue(views, item);
                return (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => setPickedField(item)}
                    style={[
                      styles.legendChip,
                      {
                        borderColor: active ? color : theme.border,
                        backgroundColor: active ? `${color}22` : theme.card,
                      },
                    ]}>
                    <View style={[styles.legendDot, { backgroundColor: color }]} />
                    <Text style={[styles.legendLabel, { color: active ? theme.text : theme.textSecondary }]}>
                      {t.progress.bodyMeasurements[item]}
                      {latest !== null ? ` ${latest}` : ""}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null
        }
      />

      <GlassButton label={t.progress.logMeasurement} symbol="plus" onPress={openLog} />

      <BodyMeasurementHistory measurements={measurements} />
    </>
  );
}

type MetricCardProps = {
  symbol: "scalemass" | "ruler";
  title: string;
  points: ChartPoint[];
  unit: string;
  emptyText: string;
  color?: string;
  legend?: React.ReactNode;
};

// Current value + period change, then the series plotted as change vs period start.
function MetricCard({ symbol, title, points, unit, emptyText, color, legend }: MetricCardProps) {
  const t = useT();
  const theme = useTheme();
  const change = computePeriodChange(points.map((p) => p.y));
  const current = points.length > 0 ? points[points.length - 1].y : null;
  const lineColor = color ?? theme.primary;

  return (
    <Card>
      <SectionTitle symbol={symbol} title={title} />
      {current === null ? (
        <Text style={[styles.empty, { color: theme.textSecondary }]}>{emptyText}</Text>
      ) : (
        <>
          <View style={styles.summary}>
            <Text style={[styles.current, { color: theme.text }]}>
              {current} <Text style={[styles.unit, { color: theme.textSecondary }]}>{unit}</Text>
            </Text>
            {change && <PeriodChangeLabel change={change} unit={unit} size="sm" />}
          </View>
          <ProgressChart points={toDeltaSeries(points)} color={lineColor} zeroLine />
          <Text style={[styles.axisHint, { color: theme.textSecondary }]}>
            {unit} {t.progress.vsPeriodStart}
          </Text>
        </>
      )}
      {legend}
    </Card>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  current: {
    fontSize: 24,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  unit: {
    fontSize: 14,
    fontWeight: "500",
  },
  empty: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: Spacing.lg,
  },
  axisHint: {
    fontSize: 11,
    textAlign: "right",
    marginTop: -Spacing.xs,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  legendChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.sm + Spacing.xs,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
});

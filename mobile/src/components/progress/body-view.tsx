import { Host, Picker, Text as SwiftText } from "@expo/ui/swift-ui";
import { pickerStyle, tag } from "@expo/ui/swift-ui/modifiers";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/card";
import { SectionTitle } from "@/components/dashboard/section-title";
import { GlassButton } from "@/components/glass-button";
import { Spacing } from "@/constants/theme";
import { useScheme, useTheme } from "@/hooks/use-theme";
import { computePeriodChange, toDeltaSeries, type ChartPoint } from "@/lib/charts/domain";
import { DEFAULT_CHART_PERIOD, filterByPeriod, type ChartPeriod } from "@/lib/charts/periods";
import { buildDailyBodyViews } from "@/lib/dashboard/daily-body-view";
import { formatShortDate } from "@/lib/dashboard/date";
import { TABLES } from "@/lib/db/database";
import { useLiveQuery } from "@/lib/db/live-query";
import { useLocale, useT } from "@/lib/i18n/locale-context";
import { CIRCUMFERENCE_FIELDS, fieldsWithData, metricSeries, metricUnit } from "@/lib/progress/body";
import { listBodyMeasurements, type BodyMetricField } from "@/lib/repositories/measurements";

import { BodyMeasurementHistory } from "./body-measurement-history";
import { EmptyCard } from "./empty-card";
import { PeriodChangeLabel } from "./period-change";
import { PeriodPicker } from "./period-picker";
import { ProgressChart } from "./progress-chart";

// Progress → Body (web: BodyTab). Charts read the daily body view; the
// history lists raw snapshots.
export function BodyView() {
  const t = useT();
  const theme = useTheme();
  const scheme = useScheme();
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
        header={
          field && (
            <Host matchContents colorScheme={scheme}>
              <Picker
                label={t.progress.metric}
                selection={field}
                onSelectionChange={setPickedField}
                modifiers={[pickerStyle("menu")]}>
                {circumferenceFields.map((f) => (
                  <SwiftText key={f} modifiers={[tag(f)]}>
                    {t.progress.bodyMeasurements[f]}
                  </SwiftText>
                ))}
              </Picker>
            </Host>
          )
        }
      />

      <GlassButton label={t.progress.logMeasurement} symbol="plus" onPress={openLog} />

      <BodyMeasurementHistory measurements={measurements} />

      <Text style={[styles.footnote, { color: theme.textSecondary }]}>{t.progress.bodyMeasurementsTitle}</Text>
    </>
  );
}

type MetricCardProps = {
  symbol: "scalemass" | "ruler";
  title: string;
  points: ChartPoint[];
  unit: string;
  emptyText: string;
  header?: React.ReactNode;
};

// Current value + period change, then the series plotted as change vs period start.
function MetricCard({ symbol, title, points, unit, emptyText, header }: MetricCardProps) {
  const t = useT();
  const theme = useTheme();
  const change = computePeriodChange(points.map((p) => p.y));
  const current = points.length > 0 ? points[points.length - 1].y : null;

  return (
    <Card>
      <View style={styles.titleRow}>
        <SectionTitle symbol={symbol} title={title} />
        {header}
      </View>
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
          <ProgressChart points={toDeltaSeries(points)} color={theme.primary} zeroLine />
          <Text style={[styles.axisHint, { color: theme.textSecondary }]}>
            {unit} {t.progress.vsPeriodStart}
          </Text>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
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
  footnote: {
    display: "none",
  },
});

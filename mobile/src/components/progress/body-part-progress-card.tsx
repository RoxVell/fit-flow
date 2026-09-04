import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/card";
import { SectionTitle } from "@/components/dashboard/section-title";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { BODY_PART_CHART_COLORS } from "@/lib/charts/body-part-colors";
import { bodyPartSeries, buildBodyPartProgress } from "@/lib/charts/body-part-progress";
import { signed } from "@/lib/charts/domain";
import { DEFAULT_CHART_PERIOD, type ChartPeriod } from "@/lib/charts/periods";
import { formatShortDate } from "@/lib/dashboard/date";
import type { WorkoutLogEntity } from "@/lib/db/types";
import { getExerciseCatalog, getExerciseName } from "@/lib/exercises/catalog";
import { BODY_PART_LABELS, labelFor } from "@/lib/exercises/labels";
import type { BodyPart } from "@/lib/exercises/types";
import { useLocale, useT } from "@/lib/i18n/locale-context";

import { changeColor } from "./period-change";
import { PeriodPicker } from "./period-picker";
import { ProgressChart } from "./progress-chart";

type Props = {
  logs: WorkoutLogEntity[];
};

let bodyPartMap: Map<string, BodyPart> | null = null;
function exerciseBodyPartMap(): Map<string, BodyPart> {
  if (!bodyPartMap) bodyPartMap = new Map(getExerciseCatalog().map((item) => [item.id, item.bodyPart]));
  return bodyPartMap;
}

// "Progress by body part": the native Chart draws one series, so the lines are
// shown one at a time (chips + summary rows select the body part) instead of
// the web's multi-line chart. Hidden until two weeks of data exist.
export function BodyPartProgressCard({ logs }: Props) {
  const t = useT();
  const theme = useTheme();
  const { locale } = useLocale();
  const [period, setPeriod] = useState<ChartPeriod>(DEFAULT_CHART_PERIOD);
  const [picked, setPicked] = useState<BodyPart | null>(null);

  const model = buildBodyPartProgress(logs, period, exerciseBodyPartMap(), (iso) => formatShortDate(iso, locale));
  if (!model) return null;

  const { chartData, bodyParts, changes, exerciseSummaries } = model;
  const selected = picked && bodyParts.includes(picked) ? picked : bodyParts[0];
  const color = BODY_PART_CHART_COLORS[selected];
  // Index (100 = period start) plotted as change in percentage points.
  const points = bodyPartSeries(chartData, selected).map((p) => ({ x: p.x, y: Math.round((p.y - 100) * 10) / 10 }));
  const selectedChange = changes.get(selected);

  return (
    <Card>
      <SectionTitle symbol="figure.strengthtraining.traditional" title={t.progress.bodyPartProgress} />
      <Text style={[styles.hint, { color: theme.textSecondary }]}>{t.progress.bodyPartChartHint}</Text>

      <PeriodPicker period={period} onChange={setPeriod} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {bodyParts.map((bodyPart) => {
          const active = bodyPart === selected;
          const chipColor = BODY_PART_CHART_COLORS[bodyPart];
          return (
            <Pressable
              key={bodyPart}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setPicked(bodyPart)}
              style={[
                styles.chip,
                { borderColor: active ? chipColor : theme.border, backgroundColor: active ? `${chipColor}22` : theme.card },
              ]}>
              <View style={[styles.dot, { backgroundColor: chipColor }]} />
              <Text style={[styles.chipText, { color: active ? theme.text : theme.textSecondary }]}>
                {labelFor(BODY_PART_LABELS, bodyPart, locale)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.chartHeader}>
        <Text style={[styles.chartTitle, { color: theme.text }]}>{labelFor(BODY_PART_LABELS, selected, locale)}</Text>
        {selectedChange && (
          <Text style={[styles.chartChange, { color: changeColor(selectedChange.percent, theme) }]}>
            {signed(selectedChange.percent)}%
          </Text>
        )}
      </View>
      <ProgressChart points={points} color={color} zeroLine />

      <View style={styles.rows}>
        {bodyParts.map((bodyPart) => {
          const change = changes.get(bodyPart) ?? null;
          const last = [...chartData].reverse().find((row) => typeof row[bodyPart] === "number")?.[bodyPart];
          const active = bodyPart === selected;
          return (
            <Pressable
              key={bodyPart}
              accessibilityRole="button"
              onPress={() => setPicked(bodyPart)}
              style={[styles.row, active && { backgroundColor: theme.muted }]}>
              <View style={[styles.dot, { backgroundColor: BODY_PART_CHART_COLORS[bodyPart] }]} />
              <Text style={[styles.rowLabel, { color: theme.text }]}>{labelFor(BODY_PART_LABELS, bodyPart, locale)}</Text>
              {typeof last === "number" && (
                <Text style={[styles.rowValue, { color: theme.text }]}>{Math.round(last * 10) / 10}%</Text>
              )}
              {change && (
                <Text style={[styles.rowChange, { color: changeColor(change.percent, theme) }]}>{signed(change.percent)}%</Text>
              )}
              <SymbolView
                name={active ? "chevron.down" : "chevron.right"}
                size={11}
                weight="semibold"
                tintColor={theme.textSecondary}
              />
            </Pressable>
          );
        })}
      </View>

      {(exerciseSummaries.get(selected) ?? []).length > 0 && (
        <View style={[styles.exercises, { borderTopColor: theme.border }]}>
          {exerciseSummaries.get(selected)!.map((summary) => (
            <View key={summary.exerciseId} style={styles.exerciseRow}>
              <Text style={[styles.exerciseName, { color: theme.textSecondary }]} numberOfLines={1}>
                {getExerciseName(summary.exerciseId, locale, t.dashboard.unknownExercise)}
              </Text>
              {summary.current !== null && (
                <Text style={[styles.rowValue, { color: theme.text }]}>{Math.round(summary.current * 10) / 10}%</Text>
              )}
              {summary.change && (
                <Text style={[styles.rowChange, { color: changeColor(summary.change.percent, theme) }]}>
                  {signed(summary.change.percent)}%
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  hint: {
    fontSize: 12,
    marginTop: -Spacing.xs,
  },
  chips: {
    gap: Spacing.sm,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.sm + Spacing.xs,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  chartChange: {
    fontSize: 16,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  rows: {
    gap: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  rowLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  rowValue: {
    fontSize: 14,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  rowChange: {
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    minWidth: 48,
    textAlign: "right",
  },
  exercises: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.sm,
    gap: Spacing.xs,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  exerciseName: {
    flex: 1,
    fontSize: 13,
  },
});

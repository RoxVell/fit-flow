import { Host, Picker, Text as SwiftText } from "@expo/ui/swift-ui";
import { labelsHidden, pickerStyle, tag } from "@expo/ui/swift-ui/modifiers";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/card";
import { SectionTitle } from "@/components/dashboard/section-title";
import { Radius, Spacing } from "@/constants/theme";
import { useScheme, useTheme } from "@/hooks/use-theme";
import { computePeriodChange, toDeltaSeries } from "@/lib/charts/domain";
import { DEFAULT_CHART_PERIOD, filterByPeriod, type ChartPeriod } from "@/lib/charts/periods";
import { formatShortDate } from "@/lib/dashboard/date";
import { TABLES } from "@/lib/db/database";
import { useLiveQuery } from "@/lib/db/live-query";
import { getExerciseName } from "@/lib/exercises/catalog";
import { useLocale, useT } from "@/lib/i18n/locale-context";
import {
  buildExerciseHistory,
  buildExerciseSessions,
  computeUsageCounts,
  usedExerciseIds,
} from "@/lib/progress/exercise-stats";
import { useSelectedExerciseId } from "@/lib/progress/selected-exercise";
import { listCompletedWorkoutLogs } from "@/lib/repositories/workouts";

import { EmptyCard } from "./empty-card";
import { ExerciseHistoryList } from "./exercise-history-list";
import { PeriodChangeLabel } from "./period-change";
import { PeriodPicker } from "./period-picker";
import { ProgressChart } from "./progress-chart";

type Metric = "1rm" | "volume";

// Progress → Exercises (web: ExercisesTab).
export function ExercisesView() {
  const t = useT();
  const theme = useTheme();
  const scheme = useScheme();
  const router = useRouter();
  const { locale } = useLocale();
  const [metric, setMetric] = useState<Metric>("1rm");
  const [period, setPeriod] = useState<ChartPeriod>(DEFAULT_CHART_PERIOD);
  const logs = useLiveQuery(() => listCompletedWorkoutLogs(200), [TABLES.workoutLogs]);
  const storedId = useSelectedExerciseId();

  const used = usedExerciseIds(computeUsageCounts(logs));
  const selectedId = storedId && used.includes(storedId) ? storedId : (used[0] ?? null);

  if (!selectedId) {
    return (
      <EmptyCard symbol="dumbbell" title={t.progress.noExerciseHistory} body={t.progress.noExerciseHistoryHint} />
    );
  }

  const history = filterByPeriod(buildExerciseHistory(logs, selectedId), period);
  const sessions = buildExerciseSessions(logs, selectedId);
  const values = history.map((h) => (metric === "1rm" ? Math.round(h.estimated1RM * 10) / 10 : Math.round(h.volume)));
  const points = history.map((h, i) => ({ x: formatShortDate(h.date, locale), y: values[i] }));
  const change = computePeriodChange(values);
  const current = values.length > 0 ? values[values.length - 1] : null;
  const name = getExerciseName(selectedId, locale, t.dashboard.unknownExercise);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.progress.chooseExercise}
        onPress={() => router.push("/progress/exercise-picker")}
        style={({ pressed }) => [
          styles.picker,
          { backgroundColor: pressed ? theme.muted : theme.card, borderColor: theme.border },
        ]}>
        <View style={[styles.pickerIcon, { backgroundColor: theme.muted }]}>
          <SymbolView name="dumbbell.fill" size={18} tintColor={theme.primary} />
        </View>
        <Text style={[styles.pickerName, { color: theme.text }]} numberOfLines={1}>
          {name}
        </Text>
        <SymbolView name="chevron.up.chevron.down" size={14} weight="semibold" tintColor={theme.textSecondary} />
      </Pressable>

      <Card>
        <SectionTitle symbol="chart.xyaxis.line" title={t.progress.exerciseProgress} />
        <View style={styles.summary}>
          {change ? (
            <PeriodChangeLabel change={change} unit={t.progress.kg} />
          ) : (
            <Text style={[styles.muted, { color: theme.textSecondary }]}>{t.progress.noPeriodData}</Text>
          )}
          {current !== null && (
            <Text style={[styles.current, { color: theme.textSecondary }]}>
              {t.progress.current}: <Text style={{ color: theme.text, fontWeight: "600" }}>{current} {t.progress.kg}</Text>
            </Text>
          )}
        </View>

        <PeriodPicker period={period} onChange={setPeriod} />

        <Host matchContents colorScheme={scheme}>
          <Picker
            label={t.progress.exerciseProgress}
            selection={metric}
            onSelectionChange={setMetric}
            modifiers={[pickerStyle("segmented"), labelsHidden()]}>
            <SwiftText modifiers={[tag("1rm")]}>{t.dashboard.prE1rm}</SwiftText>
            <SwiftText modifiers={[tag("volume")]}>{t.progress.chartVolume}</SwiftText>
          </Picker>
        </Host>

        {metric === "1rm" ? (
          // e1RM plotted as change vs period start so the zero-anchored axis stays readable.
          <ProgressChart points={toDeltaSeries(points)} color={theme.primary} zeroLine />
        ) : (
          <ProgressChart points={points} color={theme.primary} type="bar" />
        )}
        {metric === "1rm" && points.length > 0 && (
          <Text style={[styles.axisHint, { color: theme.textSecondary }]}>
            {t.progress.kg} {t.progress.vsPeriodStart}
          </Text>
        )}
      </Card>

      <ExerciseHistoryList sessions={sessions} />
    </>
  );
}

const styles = StyleSheet.create({
  picker: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm + Spacing.xs,
    padding: Spacing.sm + Spacing.xs,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pickerIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  summary: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  muted: {
    fontSize: 14,
  },
  current: {
    fontSize: 13,
    fontVariant: ["tabular-nums"],
  },
  axisHint: {
    fontSize: 11,
    textAlign: "right",
    marginTop: -Spacing.xs,
  },
});

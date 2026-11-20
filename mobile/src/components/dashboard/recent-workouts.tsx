import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Badge } from "@/components/badge";
import { Card } from "@/components/card";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { EM_DASH, formatDuration, formatShortDate, getDurationMinutes } from "@/lib/dashboard/date";
import { workoutVolume } from "@/lib/dashboard/stats";
import { TABLES } from "@/lib/db/database";
import { useLiveQuery } from "@/lib/db/live-query";
import type { WorkoutLogEntity } from "@/lib/db/types";
import { getExerciseName } from "@/lib/exercises/catalog";
import { useLocale, useT } from "@/lib/i18n/locale-context";
import { listCompletedWorkoutLogs } from "@/lib/repositories/workouts";

import { SectionTitle } from "./section-title";

const PREVIEW_LIMIT = 5;

function WorkoutDetails({ log }: { log: WorkoutLogEntity }) {
  const t = useT();
  const theme = useTheme();
  const { locale } = useLocale();
  const exercises = log.exercises.filter((e) => e.sets.some((s) => s.completed));

  if (exercises.length === 0) {
    return <Text style={[styles.empty, { color: theme.textSecondary }]}>{t.dashboard.noCompletedSets}</Text>;
  }

  return (
    <View style={styles.details}>
      {exercises.map((exercise) => {
        const completed = exercise.sets.filter((s) => s.completed).sort((a, b) => a.setOrder - b.setOrder);
        const notes = exercise.notes?.trim();
        return (
          <View key={exercise.id} style={styles.exercise}>
            <View style={styles.exerciseHeader}>
              <Text style={[styles.exerciseName, { color: theme.text }]}>
                {getExerciseName(exercise.exerciseId, locale, t.dashboard.unknownExercise)}
              </Text>
              {exercise.excludeFromStats && <Badge variant="outline">{t.dashboard.excludedFromStats}</Badge>}
            </View>
            {notes ? <Text style={[styles.notes, { color: theme.textSecondary }]}>{notes}</Text> : null}
            {completed.map((set, index) => {
              const typeLabel =
                set.type === "warmup"
                  ? t.progress.warmupSet
                  : set.type === "dropset"
                    ? t.progress.dropsetSet
                    : null;
              return (
                <View key={set.id} style={styles.set}>
                  <Text style={[styles.setIndex, { color: theme.textSecondary }]}>{index + 1}</Text>
                  <Text style={[styles.setText, { color: theme.text }]}>
                    {set.weight} {t.dashboard.kg} × {set.reps}
                    {typeLabel ? ` (${typeLabel})` : ""}
                  </Text>
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

export function RecentWorkouts() {
  const t = useT();
  const theme = useTheme();
  const router = useRouter();
  const { locale } = useLocale();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const logs = useLiveQuery(() => listCompletedWorkoutLogs(PREVIEW_LIMIT), [TABLES.workoutLogs]);

  if (logs.length === 0) return null;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <SectionTitle symbol="calendar" title={t.dashboard.recentWorkouts} />
      </View>

      <View style={[styles.row, styles.columns, { borderBottomColor: theme.border }]}>
        <Text style={[styles.colDate, styles.columnLabel, { color: theme.textSecondary }]}>{t.dashboard.date}</Text>
        <Text style={[styles.colSession, styles.columnLabel, { color: theme.textSecondary }]}>{t.dashboard.session}</Text>
        <Text style={[styles.colTime, styles.columnLabel, { color: theme.textSecondary }]}>{t.dashboard.time}</Text>
        <Text style={[styles.colVolume, styles.columnLabel, { color: theme.textSecondary }]}>{t.dashboard.volume}</Text>
        <View style={styles.colChevron} />
      </View>

      {logs.map((log) => {
        const duration = getDurationMinutes(log.startedAt, log.endedAt);
        const totalVolume = workoutVolume(log);
        const isOpen = expandedId === log.id;
        return (
          <View key={log.id} style={[styles.item, { borderTopColor: theme.border }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
              onPress={() => setExpandedId(isOpen ? null : log.id)}
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.muted }]}>
              <Text style={[styles.colDate, styles.cell, { color: theme.textSecondary }]} numberOfLines={1}>
                {formatShortDate(log.startedAt, locale)}
              </Text>
              <Text style={[styles.colSession, styles.cell, styles.cellStrong, { color: theme.text }]} numberOfLines={1}>
                {log.sessionName || t.dashboard.workoutFallback}
              </Text>
              <Text style={[styles.colTime, styles.cell, { color: theme.textSecondary }]} numberOfLines={1}>
                {duration != null ? formatDuration(duration) : EM_DASH}
              </Text>
              <Text style={[styles.colVolume, styles.cell, styles.cellStrong, { color: theme.text }]} numberOfLines={1}>
                {totalVolume > 0 ? `${Math.round(totalVolume)} ${t.dashboard.kg}` : EM_DASH}
              </Text>
              <View style={styles.colChevron}>
                <SymbolView name={isOpen ? "chevron.up" : "chevron.down"} size={12} tintColor={theme.textSecondary} />
              </View>
            </Pressable>
            {isOpen && <WorkoutDetails log={log} />}
          </View>
        );
      })}

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/workout/history")}
        style={({ pressed }) => [styles.footer, { borderTopColor: theme.border }, pressed && { backgroundColor: theme.muted }]}>
        <Text style={[styles.footerText, { color: theme.primary }]}>{t.dashboard.viewAllWorkouts}</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    gap: 0,
    overflow: "hidden",
  },
  header: {
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + Spacing.xs,
  },
  columns: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  columnLabel: {
    fontSize: 11,
  },
  item: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cell: {
    fontSize: 14,
    fontVariant: ["tabular-nums"],
  },
  cellStrong: {
    fontWeight: "500",
  },
  colDate: {
    width: 56,
  },
  colSession: {
    flex: 1,
  },
  colTime: {
    width: 44,
    textAlign: "right",
  },
  colVolume: {
    width: 72,
    textAlign: "right",
  },
  colChevron: {
    width: 14,
    alignItems: "flex-end",
  },
  empty: {
    fontSize: 12,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm + Spacing.xs,
  },
  details: {
    gap: Spacing.sm + Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm + Spacing.xs,
  },
  exercise: {
    gap: 2,
  },
  exerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: 2,
  },
  exerciseName: {
    fontSize: 13,
    fontWeight: "600",
  },
  notes: {
    fontSize: 12,
    fontStyle: "italic",
    paddingLeft: Spacing.sm,
  },
  set: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingLeft: Spacing.sm,
  },
  setIndex: {
    width: 16,
    textAlign: "right",
    fontSize: 12,
    opacity: 0.5,
    fontVariant: ["tabular-nums"],
  },
  setText: {
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.sm + Spacing.xs,
    alignItems: "center",
  },
  footerText: {
    fontSize: 15,
    fontWeight: "600",
  },
});

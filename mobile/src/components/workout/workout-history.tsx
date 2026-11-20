import { SymbolView } from "expo-symbols";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { Badge } from "@/components/badge";
import { Card } from "@/components/card";
import { Accent } from "@/components/dashboard/accents";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { EM_DASH, formatDuration, formatShortDate, getDurationMinutes } from "@/lib/dashboard/date";
import { workoutVolume } from "@/lib/dashboard/stats";
import { TABLES } from "@/lib/db/database";
import { useLiveQuery } from "@/lib/db/live-query";
import type { WorkoutLogEntity } from "@/lib/db/types";
import { getExerciseName } from "@/lib/exercises/catalog";
import { useLocale, useT } from "@/lib/i18n/locale-context";
import { countCompletedWorkoutLogs, listCompletedWorkoutLogs, removeWorkoutLog } from "@/lib/repositories/workouts";

import { WorkoutExportCard } from "./workout-export";

const PAGE_SIZE = 20;

export function WorkoutHistoryList() {
  const t = useT();
  const theme = useTheme();
  const router = useRouter();
  const { locale } = useLocale();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const logs = useLiveQuery(() => listCompletedWorkoutLogs(limit), [TABLES.workoutLogs], [limit]);
  const total = useLiveQuery(countCompletedWorkoutLogs, [TABLES.workoutLogs]);
  const hasMore = logs.length < total;

  if (total === 0) {
    return <Text style={[styles.empty, { color: theme.textSecondary }]}>{t.workout.noHistory}</Text>;
  }

  const confirmDelete = (id: string) => {
    Alert.alert(t.workout.deleteConfirmTitle, t.workout.deleteConfirmDesc, [
      { text: t.workout.cancel, style: "cancel" },
      { text: t.workout.deleteWorkout, style: "destructive", onPress: () => removeWorkoutLog(id) },
    ]);
  };

  return (
    <>
      <WorkoutExportCard />
      <Card style={styles.card}>
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
              onLongPress={() => confirmDelete(log.id)}
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.muted }]}>
              <Text style={[styles.date, { color: theme.textSecondary }]}>{formatShortDate(log.startedAt, locale)}</Text>
              <Text style={[styles.session, { color: theme.text }]} numberOfLines={1}>
                {log.sessionName || t.dashboard.workoutFallback}
              </Text>
              <Text style={[styles.meta, { color: theme.textSecondary }]}>
                {duration != null ? formatDuration(duration) : EM_DASH}
              </Text>
              <Text style={[styles.volume, { color: theme.text }]}>
                {totalVolume > 0 ? `${Math.round(totalVolume)} ${t.dashboard.kg}` : EM_DASH}
              </Text>
              <SymbolView name={isOpen ? "chevron.up" : "chevron.down"} size={12} tintColor={theme.textSecondary} />
            </Pressable>
            {isOpen && (
              <HistoryDetails
                log={log}
                onDelete={() => confirmDelete(log.id)}
                onEdit={() => router.push({ pathname: "/workout/edit", params: { id: log.id } })}
              />
            )}
          </View>
        );
      })}
      </Card>
      {hasMore ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setLimit((n) => n + PAGE_SIZE)}
          style={({ pressed }) => [styles.loadMore, pressed && { opacity: 0.7 }]}>
          <Text style={[styles.loadMoreLabel, { color: theme.primary }]}>{t.workout.loadMore}</Text>
        </Pressable>
      ) : null}
    </>
  );
}

function HistoryDetails({
  log,
  onDelete,
  onEdit,
}: {
  log: WorkoutLogEntity;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const t = useT();
  const theme = useTheme();
  const { locale } = useLocale();
  const exercises = log.exercises.filter((e) => e.sets.some((s) => s.completed));

  return (
    <View style={styles.details}>
      {exercises.length === 0 ? (
        <Text style={[styles.detailEmpty, { color: theme.textSecondary }]}>{t.dashboard.noCompletedSets}</Text>
      ) : (
        exercises.map((exercise) => {
          const completed = exercise.sets.filter((s) => s.completed).sort((a, b) => a.setOrder - b.setOrder);
          return (
            <View key={exercise.id} style={styles.exercise}>
              <View style={styles.exerciseHeader}>
                <Text style={[styles.exerciseName, { color: theme.text }]}>
                  {getExerciseName(exercise.exerciseId, locale, t.dashboard.unknownExercise)}
                </Text>
                {exercise.excludeFromStats && <Badge variant="outline">{t.dashboard.excludedFromStats}</Badge>}
              </View>
              {exercise.notes?.trim() ? (
                <Text style={[styles.notes, { color: theme.textSecondary }]}>{exercise.notes.trim()}</Text>
              ) : null}
              {completed.map((set, index) => {
                const typeLabel =
                  set.type === "warmup"
                    ? t.progress.warmupSet
                    : set.type === "dropset"
                      ? t.progress.dropsetSet
                      : null;
                return (
                  <Text key={set.id} style={[styles.set, { color: theme.text }]}>
                    {index + 1}. {set.weight} {t.dashboard.kg} × {set.reps}
                    {typeLabel ? ` (${typeLabel})` : ""}
                  </Text>
                );
              })}
            </View>
          );
        })
      )}
      <View style={styles.actions}>
        <Pressable onPress={onEdit} hitSlop={8}>
          <Text style={[styles.link, { color: theme.primary }]}>{t.workout.editWorkout}</Text>
        </Pressable>
        <Pressable onPress={onDelete} hitSlop={8}>
          <Text style={[styles.link, { color: Accent.red }]}>{t.workout.deleteWorkout}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    gap: 0,
    overflow: "hidden",
  },
  empty: {
    fontSize: 15,
    textAlign: "center",
    paddingVertical: Spacing.lg,
  },
  item: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + Spacing.xs,
  },
  date: {
    width: 56,
    fontSize: 14,
    fontVariant: ["tabular-nums"],
  },
  session: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  meta: {
    width: 44,
    fontSize: 13,
    textAlign: "right",
    fontVariant: ["tabular-nums"],
  },
  volume: {
    width: 72,
    fontSize: 13,
    fontWeight: "500",
    textAlign: "right",
    fontVariant: ["tabular-nums"],
  },
  details: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  detailEmpty: {
    fontSize: 13,
  },
  exercise: {
    gap: 2,
  },
  exerciseHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
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
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    paddingLeft: Spacing.sm,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  link: {
    fontSize: 14,
    fontWeight: "600",
  },
  loadMore: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  loadMoreLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
});

import { StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/card";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { SessionExercise } from "@/lib/db/types";
import { getExerciseName } from "@/lib/exercises/catalog";
import { useLocale, useT } from "@/lib/i18n/locale-context";
import { formatTarget } from "@/lib/workout/format";

type Props = { exercises: SessionExercise[] };

// Planned exercises of the selected session: name left, `4×5-8` right.
export function ExercisePlanList({ exercises }: Props) {
  const t = useT();
  const theme = useTheme();
  const { locale } = useLocale();

  return (
    <View style={styles.section}>
      <Text style={[styles.title, { color: theme.textSecondary }]}>
        {t.workout.exercises} ({exercises.length})
      </Text>
      <Card style={styles.card}>
        {exercises.map((se, i) => (
          <View
            key={se.id}
            style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border }]}>
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={2}>
              {getExerciseName(se.exerciseId, locale, t.workout.unknownExercise)}
            </Text>
            <Text style={[styles.target, { color: theme.textSecondary }]}>
              {formatTarget(se.targetSets, se.targetReps, t.workout.setsCount)}
            </Text>
          </View>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.sm,
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: Spacing.xs,
  },
  card: {
    padding: 0,
    gap: 0,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + Spacing.xs,
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  target: {
    fontSize: 15,
    fontVariant: ["tabular-nums"],
  },
});

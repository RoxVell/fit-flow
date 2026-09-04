import { SymbolView } from "expo-symbols";
import { StyleSheet, Text, View } from "react-native";

import { Badge } from "@/components/badge";
import { Card } from "@/components/card";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { LoggedExercise, SessionExercise } from "@/lib/db/types";
import { getExerciseName } from "@/lib/exercises/catalog";
import { useLocale, useT } from "@/lib/i18n/locale-context";
import { formatTarget } from "@/lib/workout/format";

type Props = {
  exercise: LoggedExercise;
  /** Planned exercise from the session, for the target label. */
  planned?: SessionExercise;
};

// Read-only view of one exercise in the active session.
// TODO(active-workout): editable weight/reps, completion toggle, rest timer,
// swap/remove, exercise history sheet (see web src/components/workout/exercise-card.tsx).
export function ActiveExerciseCard({ exercise, planned }: Props) {
  const t = useT();
  const theme = useTheme();
  const { locale } = useLocale();

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={2}>
          {getExerciseName(exercise.exerciseId, locale, t.workout.unknownExercise)}
        </Text>
        {planned && <Badge>{formatTarget(planned.targetSets, planned.targetReps, t.workout.setsCount)}</Badge>}
      </View>
      <View style={styles.sets}>
        {exercise.sets.map((set, i) => (
          <View
            key={set.id}
            style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border }]}>
            <SymbolView
              name={set.completed ? "checkmark.circle.fill" : "circle"}
              size={20}
              tintColor={set.completed ? theme.success : theme.textSecondary}
            />
            <Text style={[styles.setLabel, { color: theme.text }]}>{t.workout.setLabel(set.setOrder + 1)}</Text>
            <Text style={[styles.setMeta, { color: theme.textSecondary }]}>
              {set.completed ? `${set.weight} kg × ${set.reps}` : planned?.targetReps ? t.workout.repsTarget(planned.targetReps) : "—"}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
  sets: {
    marginHorizontal: -Spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm + Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  setLabel: {
    flex: 1,
    fontSize: 15,
  },
  setMeta: {
    fontSize: 14,
    fontVariant: ["tabular-nums"],
  },
});

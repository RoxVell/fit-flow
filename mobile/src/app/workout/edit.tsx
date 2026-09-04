import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { Screen } from "@/components/screen";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { LoggedExercise } from "@/lib/db/types";
import { getExerciseName } from "@/lib/exercises/catalog";
import { useLocale, useT } from "@/lib/i18n/locale-context";
import { getWorkoutLog, saveWorkoutEdits } from "@/lib/repositories/workouts";
import {
  formatDecimalForInput,
  isPartialDecimalInput,
  isPartialIntegerInput,
  parseLocalizedDecimal,
} from "@/lib/utils/decimal-input";

function cloneExercises(exercises: LoggedExercise[]): LoggedExercise[] {
  return exercises.map((ex) => ({ ...ex, sets: ex.sets.map((s) => ({ ...s })) }));
}

export default function WorkoutEditScreen() {
  const t = useT();
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const log = id ? getWorkoutLog(id) : undefined;

  if (!log) {
    return (
      <>
        <Stack.Title>{t.workout.editWorkout}</Stack.Title>
        <Screen>
          <Text style={{ color: theme.textSecondary }}>{t.workout.noHistory}</Text>
        </Screen>
      </>
    );
  }

  return <WorkoutEditForm key={log.id} log={log} />;
}

function WorkoutEditForm({ log }: { log: NonNullable<ReturnType<typeof getWorkoutLog>> }) {
  const t = useT();
  const theme = useTheme();
  const router = useRouter();
  const { locale } = useLocale();
  const [exercises, setExercises] = useState(() => cloneExercises(log.exercises));
  const [weightTexts, setWeightTexts] = useState<Record<string, string>>(() => {
    const texts: Record<string, string> = {};
    for (const exercise of log.exercises) {
      for (const set of exercise.sets) {
        if (set.completed) texts[set.id] = formatDecimalForInput(set.weight);
      }
    }
    return texts;
  });

  const visible = useMemo(
    () => exercises.filter((exercise) => exercise.sets.some((s) => s.completed)),
    [exercises],
  );
  const dirty = JSON.stringify(exercises) !== JSON.stringify(log.exercises);

  const updateExercise = (exerciseId: string, data: Partial<Pick<LoggedExercise, "notes" | "excludeFromStats">>) => {
    setExercises((current) => current.map((ex) => (ex.id === exerciseId ? { ...ex, ...data } : ex)));
  };

  const updateSet = (exerciseId: string, setId: string, data: { weight?: number; reps?: number }) => {
    setExercises((current) =>
      current.map((ex) =>
        ex.id !== exerciseId
          ? ex
          : { ...ex, sets: ex.sets.map((s) => (s.id === setId ? { ...s, ...data } : s)) },
      ),
    );
  };

  const save = () => {
    const normalized = exercises.map((exercise) => {
      const notes = exercise.notes?.trim();
      return { ...exercise, notes: notes ? notes : undefined };
    });
    saveWorkoutEdits(log.id, normalized, (exerciseId) => getExerciseName(exerciseId, locale, "") || undefined);
    router.back();
  };

  return (
    <>
      <Stack.Title>{log.sessionName || t.dashboard.workoutFallback}</Stack.Title>
      <Stack.Screen options={{ gestureEnabled: !dirty }} />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button onPress={save} variant="prominent" tintColor={theme.primary}>
          {t.workout.saveChanges}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      <Screen keyboardShouldPersistTaps="handled">
        {visible.map((exercise) => {
          const name = getExerciseName(exercise.exerciseId, locale, t.workout.unknownExercise);
          const completed = exercise.sets.filter((s) => s.completed).sort((a, b) => a.setOrder - b.setOrder);
          return (
            <View key={exercise.id} style={[styles.block, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.name, { color: theme.text }]}>{name}</Text>
              <View style={styles.toggleRow}>
                <Text style={[styles.toggleLabel, { color: theme.textSecondary }]}>{t.workout.excludeFromStats}</Text>
                <Switch
                  value={Boolean(exercise.excludeFromStats)}
                  onValueChange={(checked) => updateExercise(exercise.id, { excludeFromStats: checked })}
                  trackColor={{ true: theme.primary }}
                />
              </View>
              <TextInput
                value={exercise.notes ?? ""}
                onChangeText={(text) => updateExercise(exercise.id, { notes: text })}
                placeholder={t.workout.exerciseNotePlaceholder}
                placeholderTextColor={theme.textSecondary}
                multiline
                style={[styles.note, { color: theme.text, backgroundColor: theme.muted }]}
              />
              {completed.map((set, index) => (
                <View key={set.id} style={styles.setRow}>
                  <Text style={[styles.setIndex, { color: theme.textSecondary }]}>{index + 1}</Text>
                  <TextInput
                    accessibilityLabel={t.workout.setWeightLabel(name, index + 1)}
                    keyboardType="decimal-pad"
                    value={weightTexts[set.id] ?? ""}
                    onChangeText={(text) => {
                      if (!isPartialDecimalInput(text)) return;
                      setWeightTexts((prev) => ({ ...prev, [set.id]: text }));
                      updateSet(exercise.id, set.id, { weight: parseLocalizedDecimal(text) });
                    }}
                    onBlur={() => {
                      setWeightTexts((prev) => ({ ...prev, [set.id]: formatDecimalForInput(set.weight) }));
                    }}
                    placeholder={t.workout.kg}
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.input, { color: theme.text, backgroundColor: theme.muted, borderColor: theme.border }]}
                  />
                  <Text style={[styles.times, { color: theme.textSecondary }]}>×</Text>
                  <TextInput
                    accessibilityLabel={t.workout.setRepsLabel(name, index + 1)}
                    keyboardType="number-pad"
                    value={set.reps ? String(set.reps) : ""}
                    onChangeText={(text) => {
                      if (!isPartialIntegerInput(text)) return;
                      updateSet(exercise.id, set.id, { reps: text === "" ? 0 : Math.round(parseLocalizedDecimal(text)) });
                    }}
                    placeholder={t.workout.reps}
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.input, { color: theme.text, backgroundColor: theme.muted, borderColor: theme.border }]}
                  />
                </View>
              ))}
            </View>
          );
        })}
        <Pressable onPress={save} style={[styles.save, { backgroundColor: theme.primary }]}>
          <Text style={[styles.saveLabel, { color: theme.primaryForeground }]}>{t.workout.saveChanges}</Text>
        </Pressable>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  toggleLabel: {
    flex: 1,
    fontSize: 13,
  },
  note: {
    minHeight: 64,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    fontSize: 15,
    textAlignVertical: "top",
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  setIndex: {
    width: 22,
    fontSize: 14,
    fontVariant: ["tabular-nums"],
    textAlign: "center",
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    textAlign: "center",
    fontSize: 16,
    fontVariant: ["tabular-nums"],
  },
  times: {
    fontSize: 14,
  },
  save: {
    height: 56,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  saveLabel: {
    fontSize: 17,
    fontWeight: "600",
  },
});

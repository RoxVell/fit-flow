import { Stack, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ExerciseThumbnail } from "@/components/exercises/exercise-thumbnail";
import { Screen } from "@/components/screen";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { TABLES } from "@/lib/db/database";
import { useLiveQuery } from "@/lib/db/live-query";
import { getExercise, getExerciseName } from "@/lib/exercises/catalog";
import { BODY_PART_LABELS, labelFor } from "@/lib/exercises/labels";
import { useLocale, useT } from "@/lib/i18n/locale-context";
import { computeUsageCounts, usedExerciseIds } from "@/lib/progress/exercise-stats";
import { setSelectedExerciseId, useSelectedExerciseId } from "@/lib/progress/selected-exercise";
import { listCompletedWorkoutLogs } from "@/lib/repositories/workouts";

export default function ProgressExercisePickerScreen() {
  const t = useT();
  const theme = useTheme();
  const router = useRouter();
  const { locale } = useLocale();
  const [query, setQuery] = useState("");
  const selectedId = useSelectedExerciseId();
  const logs = useLiveQuery(() => listCompletedWorkoutLogs(200), [TABLES.workoutLogs]);
  const usage = useMemo(() => computeUsageCounts(logs), [logs]);
  const used = usedExerciseIds(usage);

  const needle = query.trim().toLowerCase();
  const items = useMemo(() => {
    if (!needle) return used;
    return used.filter((id) => {
      const exercise = getExercise(id);
      if (!exercise) return getExerciseName(id, locale, "").toLowerCase().includes(needle);
      return (
        exercise.name.en.toLowerCase().includes(needle) ||
        exercise.name.ru.toLowerCase().includes(needle)
      );
    });
  }, [locale, needle, used]);

  return (
    <>
      <Stack.Title>{t.progress.chooseExercise}</Stack.Title>
      <Stack.SearchBar
        placeholder={t.exercises.searchPlaceholder}
        autoCapitalize="none"
        hideWhenScrolling={false}
        tintColor={theme.primary}
        onChangeText={(e) => setQuery(e.nativeEvent.text)}
        onCancelButtonPress={() => setQuery("")}
      />
      <Screen keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled">
        {items.length === 0 ? (
          <Text style={[styles.empty, { color: theme.textSecondary }]}>
            {needle ? t.exercises.noResults : t.progress.noExerciseHistory}
          </Text>
        ) : (
          items.map((id) => {
            const exercise = getExercise(id);
            const count = usage.get(id) ?? 0;
            const selected = id === selectedId;
            return (
              <Pressable
                key={id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => {
                  setSelectedExerciseId(id);
                  router.back();
                }}
                style={({ pressed }) => [
                  styles.row,
                  { backgroundColor: pressed ? theme.muted : theme.card, borderColor: theme.border },
                ]}>
                <ExerciseThumbnail uri={exercise?.thumbnailUri ?? null} style={styles.thumb} symbolSize={18} />
                <View style={styles.body}>
                  <Text style={[styles.name, { color: theme.text }]} numberOfLines={2}>
                    {getExerciseName(id, locale, t.dashboard.unknownExercise)}
                  </Text>
                  {count > 0 ? (
                    <Text style={[styles.meta, { color: theme.textSecondary }]}>
                      {[exercise ? labelFor(BODY_PART_LABELS, exercise.bodyPart, locale) : null, t.exercises.usageTimes(count)]
                        .filter(Boolean)
                        .join(" · ")}
                    </Text>
                  ) : exercise ? (
                    <Text style={[styles.meta, { color: theme.textSecondary }]}>
                      {labelFor(BODY_PART_LABELS, exercise.bodyPart, locale)}
                    </Text>
                  ) : null}
                </View>
                {selected ? <SymbolView name="checkmark" size={18} weight="semibold" tintColor={theme.primary} /> : null}
              </Pressable>
            );
          })
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm + Spacing.xs,
    padding: Spacing.sm + Spacing.xs,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  thumb: {
    width: 44,
    height: 44,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: "500",
  },
  meta: {
    fontSize: 12,
  },
  empty: {
    textAlign: "center",
    fontSize: 15,
    paddingVertical: Spacing.xl,
  },
});

import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { useMemo } from "react";
import { Pressable, SectionList, StyleSheet, Text, View } from "react-native";

import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { TABLES } from "@/lib/db/database";
import { useLiveQuery } from "@/lib/db/live-query";
import { getExerciseCatalog } from "@/lib/exercises/catalog";
import { sortExercisesByUsage } from "@/lib/exercises/filter";
import { BODY_PART_LABELS, labelFor } from "@/lib/exercises/labels";
import { pickLocalized } from "@/lib/exercises/locale";
import type { ExerciseManifestItem } from "@/lib/exercises/types";
import { useLocale, useT } from "@/lib/i18n/locale-context";
import { computeUsageCounts } from "@/lib/progress/exercise-stats";
import { listCompletedWorkoutLogs } from "@/lib/repositories/workouts";

type Props = {
  query: string;
  excludeIds: ReadonlySet<string>;
  onSelect: (exerciseId: string) => void;
};

type Section = { title: string; data: ExerciseManifestItem[] };

export function ExercisePicker({ query, excludeIds, onSelect }: Props) {
  const t = useT();
  const theme = useTheme();
  const { locale } = useLocale();
  const logs = useLiveQuery(() => listCompletedWorkoutLogs(200), [TABLES.workoutLogs]);
  const usage = useMemo(() => computeUsageCounts(logs), [logs]);

  const needle = query.trim().toLowerCase();
  const available = useMemo(() => {
    const sorted = sortExercisesByUsage(getExerciseCatalog(), usage, locale);
    return sorted.filter((item) => {
      if (excludeIds.has(item.id)) return false;
      if (!needle) return true;
      return item.name.en.toLowerCase().includes(needle) || item.name.ru.toLowerCase().includes(needle);
    });
  }, [excludeIds, locale, needle, usage]);

  const sections = useMemo<Section[]>(() => {
    const recent = available.filter((item) => (usage.get(item.id) ?? 0) > 0);
    const other = available.filter((item) => (usage.get(item.id) ?? 0) === 0);
    const result: Section[] = [];
    if (recent.length > 0) result.push({ title: t.exercises.recentExercises, data: recent });
    if (other.length > 0) result.push({ title: t.exercises.allExercises, data: other });
    return result;
  }, [available, t.exercises.allExercises, t.exercises.recentExercises, usage]);

  const emptyMessage =
    getExerciseCatalog().every((item) => excludeIds.has(item.id))
      ? t.programs.allExercisesAdded
      : t.programs.noMatchingExercises;

  const renderItem = ({ item }: { item: ExerciseManifestItem }) => {
    const count = usage.get(item.id) ?? 0;
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => onSelect(item.id)}
        style={({ pressed }) => [styles.row, { borderBottomColor: theme.border }, pressed && { backgroundColor: theme.muted }]}>
        <View style={[styles.thumb, { backgroundColor: theme.muted }]}>
          {item.thumbnailUri ? (
            <Image source={{ uri: item.thumbnailUri }} style={styles.thumbImage} contentFit="cover" transition={150} />
          ) : (
            <SymbolView name="figure.strengthtraining.traditional" size={18} tintColor={theme.textSecondary} />
          )}
        </View>
        <View style={styles.body}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={2}>
            {pickLocalized(item.name, locale)}
          </Text>
          <Text style={[styles.meta, { color: theme.textSecondary }]} numberOfLines={1}>
            {count > 0
              ? `${labelFor(BODY_PART_LABELS, item.bodyPart, locale)} · ${t.exercises.usageTimes(count)}`
              : labelFor(BODY_PART_LABELS, item.bodyPart, locale)}
          </Text>
        </View>
        <SymbolView name="plus.circle" size={22} tintColor={theme.primary} />
      </Pressable>
    );
  };

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      renderSectionHeader={({ section }) => (
        <Text style={[styles.section, { color: theme.textSecondary, backgroundColor: theme.background }]}>
          {section.title}
        </Text>
      )}
      style={{ backgroundColor: theme.background }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      stickySectionHeadersEnabled
      ListEmptyComponent={<Text style={[styles.empty, { color: theme.textSecondary }]}>{emptyMessage}</Text>}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm + Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + Spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  body: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
  },
  meta: {
    fontSize: 12,
  },
  section: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  empty: {
    textAlign: "center",
    fontSize: 15,
    paddingVertical: Spacing.xl,
  },
});

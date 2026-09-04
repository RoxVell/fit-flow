import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { getExerciseCatalog } from "@/lib/exercises/catalog";
import type { ExerciseManifestItem } from "@/lib/exercises/types";
import { useLocale, useT } from "@/lib/i18n/locale-context";

type Props = {
  query: string;
  excludeIds: ReadonlySet<string>;
  onSelect: (exerciseId: string) => void;
};

// Compact searchable list over the bundled catalog, used by the session
// editor. Exercises already in the session are hidden.
export function ExercisePicker({ query, excludeIds, onSelect }: Props) {
  const t = useT();
  const theme = useTheme();
  const { locale } = useLocale();

  const needle = query.trim().toLowerCase();
  const catalog = getExerciseCatalog();
  const available = catalog.filter((item) => !excludeIds.has(item.id));
  const items = needle
    ? available.filter(
        (item) => item.name.en.toLowerCase().includes(needle) || item.name.ru.toLowerCase().includes(needle),
      )
    : available;
  const emptyMessage = available.length === 0 ? t.programs.allExercisesAdded : t.programs.noMatchingExercises;

  const renderItem = ({ item }: { item: ExerciseManifestItem }) => (
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
      <Text style={[styles.name, { color: theme.text }]} numberOfLines={2}>
        {item.name[locale]}
      </Text>
      <SymbolView name="plus.circle" size={22} tintColor={theme.primary} />
    </Pressable>
  );

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      style={{ backgroundColor: theme.background }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      initialNumToRender={20}
      ListEmptyComponent={
        <Text style={[styles.empty, { color: theme.textSecondary }]}>{emptyMessage}</Text>
      }
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
  name: {
    flex: 1,
    fontSize: 16,
  },
  empty: {
    textAlign: "center",
    fontSize: 15,
    paddingVertical: Spacing.xl,
  },
});

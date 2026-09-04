import { Stack, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useMemo, useState, type ReactNode } from "react";
import { FlatList, StyleSheet, Text, View, type ListRenderItem } from "react-native";

import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { getExerciseCatalog } from "@/lib/exercises/catalog";
import { filterManifest, sortExercisesByUsage } from "@/lib/exercises/filter";
import { BODY_PART_LABELS, LATERALITY_LABELS, labelFor } from "@/lib/exercises/labels";
import { pickLocalized } from "@/lib/exercises/locale";
import type { BodyPart, ExerciseManifestItem } from "@/lib/exercises/types";
import { useLocale, useT } from "@/lib/i18n/locale-context";

import { BodyPartChips } from "./body-part-chips";
import { EXERCISE_ROW_HEIGHT, ExerciseRow } from "./exercise-row";

type Props = {
  // Rendered above the filters inside the sticky list header (e.g. the
  // Programs/Exercises segmented control).
  header?: ReactNode;
};

// Port of the web ExerciseLibraryList: native header search bar, body-part
// chips and a virtualized list of catalog rows. It is the screen's scroll
// container, so the large title collapses and the tab bar can minimize.
// Tapping a row pushes the detail screen in the Programs stack.
export function ExerciseLibraryList({ header }: Props) {
  const t = useT();
  const { locale } = useLocale();
  const theme = useTheme();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [bodyPart, setBodyPart] = useState<BodyPart | null>(null);

  // Usage counts (web sorts most-used first) arrive with workout history.
  const sorted = useMemo(() => sortExercisesByUsage(getExerciseCatalog(), undefined, locale), [locale]);
  const items = useMemo(
    () => filterManifest(sorted, { search, bodyPart }, locale),
    [sorted, search, bodyPart, locale],
  );

  const openDetail = (id: string) => {
    router.push({ pathname: "/programs/exercise/[id]", params: { id } });
  };

  const renderItem: ListRenderItem<ExerciseManifestItem> = ({ item, index }) => (
    <ExerciseRow
      id={item.id}
      name={pickLocalized(item.name, locale)}
      subtitle={[
        labelFor(BODY_PART_LABELS, item.bodyPart, locale),
        labelFor(LATERALITY_LABELS, item.laterality, locale),
      ].join(" · ")}
      thumbnailUri={item.thumbnailUri}
      first={index === 0}
      last={index === items.length - 1}
      onPress={openDetail}
    />
  );

  return (
    <>
      <Stack.SearchBar
        placeholder={t.exercises.searchPlaceholder}
        placement="stacked"
        autoCapitalize="none"
        tintColor={theme.primary}
        onChangeText={(e) => setSearch(e.nativeEvent.text)}
        onCancelButtonPress={() => setSearch("")}
      />
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={7}
        removeClippedSubviews
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        style={[styles.list, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.content}
        stickyHeaderIndices={[0]}
        ListHeaderComponent={
          <View style={[styles.header, { backgroundColor: theme.background }]}>
            {header}
            <View style={styles.filters}>
              <Text style={[styles.count, { color: theme.textSecondary }]}>
                {t.exercises.exerciseCount(items.length)}
              </Text>
              <BodyPartChips value={bodyPart} onChange={setBodyPart} />
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <SymbolView name="dumbbell" size={32} tintColor={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{t.exercises.noResults}</Text>
          </View>
        }
      />
    </>
  );
}

const keyExtractor = (item: ExerciseManifestItem) => item.id;

const getItemLayout = (_: ArrayLike<ExerciseManifestItem> | null | undefined, index: number) => ({
  length: EXERCISE_ROW_HEIGHT,
  offset: EXERCISE_ROW_HEIGHT * index,
  index,
});

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  // Same insets as the Screen container used by the Programs view.
  content: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  header: {
    gap: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm + Spacing.xs,
  },
  filters: {
    gap: Spacing.sm,
  },
  count: {
    fontSize: 12,
  },
  empty: {
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.xl * 1.5,
  },
  emptyText: {
    fontSize: 14,
  },
});

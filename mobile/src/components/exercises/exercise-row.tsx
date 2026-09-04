import { SymbolView } from "expo-symbols";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import { ExerciseThumbnail } from "./exercise-thumbnail";

export const EXERCISE_ROW_HEIGHT = 68;
const THUMB_SIZE = 48;

type Props = {
  id: string;
  name: string;
  subtitle: string;
  thumbnailUri: string | null;
  first: boolean;
  last: boolean;
  onPress: (id: string) => void;
};

// Fixed-height list row. Rows draw the card border themselves so a
// virtualized list still looks like one rounded card, as on the web.
export const ExerciseRow = memo(function ExerciseRow({
  id,
  name,
  subtitle,
  thumbnailUri,
  first,
  last,
  onPress,
}: Props) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(id)}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? theme.muted : theme.card, borderColor: theme.border },
        first && styles.first,
        last && styles.last,
      ]}>
      <ExerciseThumbnail uri={thumbnailUri} style={styles.thumb} />
      <View style={styles.body}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {name}
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <SymbolView name="chevron.right" size={14} weight="semibold" tintColor={theme.textSecondary} />
      {!last && <View style={[styles.separator, { backgroundColor: theme.border }]} />}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    height: EXERCISE_ROW_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm + Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  first: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
  },
  last: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: "500",
  },
  subtitle: {
    fontSize: 12,
  },
  separator: {
    position: "absolute",
    left: Spacing.md + THUMB_SIZE + Spacing.sm + Spacing.xs,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
  },
});

import { StyleSheet, Text, View } from "react-native";

import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { MuscleGroup } from "@/lib/db/types";
import { useT } from "@/lib/i18n/locale-context";

type Props = {
  weights: Partial<Record<MuscleGroup, number>>;
};

// Engagement bars, like the "Muscles" tab of the web detail sheet.
export function MuscleWeights({ weights }: Props) {
  const t = useT();
  const theme = useTheme();
  const entries = (Object.entries(weights) as [MuscleGroup, number][])
    .filter(([, percent]) => percent > 0)
    .sort(([, a], [, b]) => b - a);

  return (
    <View style={styles.list}>
      {entries.map(([group, percent]) => (
        <View key={group} style={styles.item}>
          <View style={styles.labels}>
            <Text style={[styles.name, { color: theme.text }]}>{t.exercises.muscleGroups[group] ?? group}</Text>
            <Text style={[styles.percent, { color: theme.textSecondary }]}>{percent}%</Text>
          </View>
          <View style={[styles.track, { backgroundColor: theme.muted }]}>
            <View style={[styles.fill, { backgroundColor: theme.primary, width: `${Math.min(100, percent)}%` }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.sm + Spacing.xs,
  },
  item: {
    gap: Spacing.xs,
  },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  name: {
    fontSize: 13,
    fontWeight: "500",
  },
  percent: {
    fontSize: 13,
  },
  track: {
    height: 6,
    borderRadius: Radius.full,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: Radius.full,
  },
});

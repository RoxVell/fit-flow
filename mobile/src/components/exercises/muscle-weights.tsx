import { StyleSheet, Text, View } from "react-native";

import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type Item = {
  name: string;
  percent: number;
};

type Props = {
  items: Item[];
};

// Engagement bars, like the "Muscles" tab of the web detail sheet.
export function MuscleWeights({ items }: Props) {
  const theme = useTheme();
  const entries = items.filter((item) => item.percent > 0).sort((a, b) => b.percent - a.percent);

  return (
    <View style={styles.list}>
      {entries.map((item) => (
        <View key={item.name} style={styles.item}>
          <View style={styles.labels}>
            <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
            <Text style={[styles.percent, { color: theme.textSecondary }]}>{item.percent}%</Text>
          </View>
          <View style={[styles.track, { backgroundColor: theme.muted }]}>
            <View style={[styles.fill, { backgroundColor: theme.primary, width: `${Math.min(100, item.percent)}%` }]} />
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

import { SymbolView } from "expo-symbols";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/card";
import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { PersonalRecord, PRType } from "@/lib/db/types";
import { useT } from "@/lib/i18n/locale-context";
import type { TriumphState } from "@/lib/workout/use-workout-session";

type Props = {
  triumph: TriumphState;
  onDone: () => void;
};

type RecordLike = Pick<PersonalRecord, "exerciseId" | "exerciseName" | "type" | "value">;

function formatPrValue(value: number, type: PRType): string {
  if (type === "estimated_1rm") return value.toFixed(1);
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function groupRecords(records: RecordLike[]) {
  const groups: { exerciseId: string; exerciseName: string; records: RecordLike[] }[] = [];
  for (const record of records) {
    const existing = groups.find((group) => group.exerciseId === record.exerciseId);
    if (existing) existing.records.push(record);
    else groups.push({ exerciseId: record.exerciseId, exerciseName: record.exerciseName, records: [record] });
  }
  return groups;
}

export function TriumphScreen({ triumph, onDone }: Props) {
  const t = useT();
  const theme = useTheme();
  const grouped = useMemo(() => groupRecords(triumph.records), [triumph.records]);
  const typeLabels: Record<PRType, string> = {
    weight: t.dashboard.prMaxWeight,
    volume: t.dashboard.prVolume,
    estimated_1rm: t.dashboard.prE1rm,
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={[styles.trophyWrap, { backgroundColor: `${theme.primary}22` }]}>
        <SymbolView name="trophy.fill" size={48} tintColor={theme.primary} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>{t.workout.triumphTitle}</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{t.workout.triumphSubtitle}</Text>

      <View style={styles.chips}>
        <Card style={styles.chip}>
          <View style={[styles.chipIcon, { backgroundColor: `${theme.primary}22` }]}>
            <SymbolView name="clock.fill" size={18} tintColor={theme.primary} />
          </View>
          <View style={styles.chipText}>
            <Text style={[styles.chipLabel, { color: theme.textSecondary }]}>{t.workout.durationLabel}</Text>
            <Text style={[styles.chipValue, { color: theme.text }]}>{triumph.elapsedLabel}</Text>
          </View>
        </Card>
        <Card style={styles.chip}>
          <View style={[styles.chipIcon, { backgroundColor: `${theme.primary}22` }]}>
            <SymbolView name="scalemass.fill" size={18} tintColor={theme.primary} />
          </View>
          <View style={styles.chipText}>
            <Text style={[styles.chipLabel, { color: theme.textSecondary }]}>{t.workout.volumeLabel}</Text>
            <Text style={[styles.chipValue, { color: theme.text }]}>
              {Math.round(triumph.volume).toLocaleString()} {t.workout.kg}
            </Text>
          </View>
        </Card>
      </View>

      {grouped.length > 0 ? (
        <View style={styles.prBlock}>
          <Text style={[styles.prHeading, { color: theme.primary }]}>{t.workout.triumphNewPRs}</Text>
          {grouped.map((group) => (
            <Card key={group.exerciseId}>
              <Text style={[styles.prName, { color: theme.text }]} numberOfLines={1}>
                {group.exerciseName}
              </Text>
              {group.records.map((record) => (
                <View key={`${record.type}-${record.value}`} style={styles.prRow}>
                  <Text style={[styles.prType, { color: theme.textSecondary }]}>{typeLabels[record.type]}</Text>
                  <Text style={[styles.prValue, { color: theme.primary, backgroundColor: `${theme.primary}22` }]}>
                    {formatPrValue(record.value, record.type)} {t.workout.kg}
                  </Text>
                </View>
              ))}
            </Card>
          ))}
        </View>
      ) : (
        <Text style={[styles.empty, { color: theme.textSecondary }]}>{t.workout.triumphNoPRs}</Text>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={onDone}
        style={[styles.done, { backgroundColor: theme.primary }]}>
        <Text style={[styles.doneLabel, { color: theme.primaryForeground }]}>{t.workout.triumphDone}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  trophyWrap: {
    alignSelf: "center",
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    fontFamily: Fonts?.rounded,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
  },
  chips: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  chip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  chipIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: {
    flex: 1,
    gap: 2,
  },
  chipLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  chipValue: {
    fontSize: 16,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  prBlock: {
    gap: Spacing.sm,
  },
  prHeading: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  prName: {
    fontSize: 15,
    fontWeight: "600",
  },
  prRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  prType: {
    fontSize: 13,
  },
  prValue: {
    fontSize: 13,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    overflow: "hidden",
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  empty: {
    fontSize: 15,
    textAlign: "center",
  },
  done: {
    marginTop: Spacing.sm,
    height: 56,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  doneLabel: {
    fontSize: 17,
    fontWeight: "600",
  },
});

import { SymbolView } from "expo-symbols";
import { StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/card";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { selectRecentPRs } from "@/lib/dashboard/recent-prs";
import { TABLES } from "@/lib/db/database";
import { useLiveQuery } from "@/lib/db/live-query";
import type { PRType } from "@/lib/db/types";
import { getExerciseName } from "@/lib/exercises/catalog";
import { useLocale, useT } from "@/lib/i18n/locale-context";
import { listPersonalRecords } from "@/lib/repositories/records";

import { SectionTitle } from "./section-title";

export function RecentPRs() {
  const t = useT();
  const theme = useTheme();
  const { locale } = useLocale();
  const records = useLiveQuery(listPersonalRecords, [TABLES.personalRecords]);

  if (records.length === 0) return null;

  const typeLabels: Record<PRType, string> = {
    weight: t.dashboard.prMaxWeight,
    volume: t.dashboard.prVolume,
    estimated_1rm: t.dashboard.prE1rm,
  };
  const unit = t.dashboard.kg;

  return (
    <Card>
      <SectionTitle symbol="trophy.fill" title={t.dashboard.recentPRs} />
      <View style={styles.list}>
        {selectRecentPRs(records).map(({ record, absDelta, pctDelta }) => (
          <View key={record.id} style={styles.row}>
            <SymbolView name="dumbbell.fill" size={14} tintColor={theme.textSecondary} />
            <View style={styles.body}>
              <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                {getExerciseName(record.exerciseId, locale, record.exerciseName)}
              </Text>
              <Text style={[styles.type, { color: theme.textSecondary }]}>{typeLabels[record.type]}</Text>
            </View>
            <View style={styles.right}>
              <Text style={[styles.value, { color: theme.text }]}>
                {record.value} {unit}
              </Text>
              {absDelta !== null && absDelta !== 0 && (
                <View style={styles.delta}>
                  <SymbolView name="arrow.up.right" size={10} tintColor={theme.success} weight="bold" />
                  <Text style={[styles.deltaText, { color: theme.success }]}>
                    +{absDelta.toFixed(2)} {unit}
                    {pctDelta !== null && <Text style={styles.deltaPct}> (+{pctDelta.toFixed(1)}%)</Text>}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.sm + Spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  body: {
    flex: 1,
    gap: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "500",
  },
  type: {
    fontSize: 11,
  },
  right: {
    alignItems: "flex-end",
    gap: 1,
  },
  value: {
    fontSize: 15,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  delta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  deltaText: {
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
  deltaPct: {
    opacity: 0.7,
  },
});

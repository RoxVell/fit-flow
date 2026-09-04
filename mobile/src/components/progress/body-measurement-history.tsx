import { SymbolView } from "expo-symbols";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";

import { Accent } from "@/components/dashboard/accents";
import { SectionTitle } from "@/components/dashboard/section-title";
import { Card } from "@/components/card";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { formatShortDate } from "@/lib/dashboard/date";
import type { BodyMeasurementEntity } from "@/lib/db/types";
import { useLocale, useT } from "@/lib/i18n/locale-context";
import { formatSnapshotSummary } from "@/lib/progress/body";
import { deleteBodyMeasurement } from "@/lib/repositories/measurements";

type Props = {
  measurements: BodyMeasurementEntity[];
};

const ACTION_WIDTH = 88;

// Raw snapshots, newest first; swipe left to delete, then confirm
// (CONTEXT.md, "body measurement history").
export function BodyMeasurementHistory({ measurements }: Props) {
  const t = useT();
  const theme = useTheme();
  const { locale } = useLocale();

  if (measurements.length === 0) return null;

  const history = [...measurements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const confirmDelete = (entry: BodyMeasurementEntity, close: () => void) => {
    Alert.alert(
      t.progress.deleteSnapshotTitle,
      `${formatShortDate(entry.date, locale)} · ${formatSnapshotSummary(entry, t.progress.snapshotSummary)}\n\n${t.progress.deleteSnapshotDesc}`,
      [
        { text: t.progress.cancel, style: "cancel", onPress: close },
        { text: t.progress.deleteSnapshot, style: "destructive", onPress: () => deleteBodyMeasurement(entry.id) },
      ],
    );
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <SectionTitle symbol="list.bullet.clipboard" title={t.progress.history} />
      </View>
      {history.map((entry, i) => (
        <ReanimatedSwipeable
          key={entry.id}
          friction={2}
          rightThreshold={40}
          overshootRight={false}
          renderRightActions={(_progress, _translation, methods) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.progress.deleteSnapshot}
              onPress={() => confirmDelete(entry, methods.close)}
              style={styles.action}>
              <SymbolView name="trash.fill" size={18} tintColor="#ffffff" />
              <Text style={styles.actionText}>{t.progress.deleteSnapshot}</Text>
            </Pressable>
          )}>
          <View
            style={[
              styles.row,
              { backgroundColor: theme.card },
              i > 0 && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth },
            ]}>
            <Text style={[styles.date, { color: theme.text }]}>{formatShortDate(entry.date, locale)}</Text>
            <Text style={[styles.summary, { color: theme.textSecondary }]}>
              {formatSnapshotSummary(entry, t.progress.snapshotSummary)}
            </Text>
          </View>
        </ReanimatedSwipeable>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 0,
    paddingBottom: 0,
    gap: 0,
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  row: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + Spacing.xs,
    gap: 2,
  },
  date: {
    fontSize: 14,
    fontWeight: "500",
  },
  summary: {
    fontSize: 12,
  },
  action: {
    width: ACTION_WIDTH,
    backgroundColor: Accent.red,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  actionText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
});

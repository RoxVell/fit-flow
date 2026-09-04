import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/card";
import { SectionTitle } from "@/components/dashboard/section-title";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { signed } from "@/lib/charts/domain";
import { useLocale, useT } from "@/lib/i18n/locale-context";
import { previousCountedBest, type ExerciseHistorySession } from "@/lib/progress/exercise-stats";

import { changeColor } from "./period-change";

type Props = {
  sessions: ExerciseHistorySession[];
};

// Per-session history with expandable set lists (web: HistoryAccordion).
export function ExerciseHistoryList({ sessions }: Props) {
  const t = useT();
  const theme = useTheme();
  const { locale } = useLocale();
  const [open, setOpen] = useState<Set<number>>(new Set());

  const toggle = (index: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  const allOpen = sessions.length > 0 && open.size === sessions.length;
  const toggleAll = () => setOpen(allOpen ? new Set() : new Set(sessions.map((_, i) => i)));

  const setTypeLabel: Record<string, string> = { warmup: t.progress.warmupSet, dropset: t.progress.dropsetSet };
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric" });

  return (
    <Card>
      <View style={styles.header}>
        <SectionTitle symbol="clock.arrow.circlepath" title={t.progress.history} />
        {sessions.length > 0 && (
          <Pressable accessibilityRole="button" onPress={toggleAll} hitSlop={8}>
            <SymbolView
              name={allOpen ? "arrow.down.right.and.arrow.up.left" : "arrow.up.left.and.arrow.down.right"}
              size={14}
              tintColor={theme.textSecondary}
            />
          </Pressable>
        )}
      </View>

      {sessions.length === 0 ? (
        <Text style={[styles.empty, { color: theme.textSecondary }]}>{t.progress.noData}</Text>
      ) : (
        sessions.map((session, i) => {
          const expanded = open.has(i);
          const prevBest = previousCountedBest(sessions, i);
          const delta = prevBest !== null ? session.bestE1RM - prevBest : null;
          return (
            <View key={`${session.date}-${i}`} style={[styles.session, i > 0 && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
              <Pressable accessibilityRole="button" onPress={() => toggle(i)} style={styles.row}>
                <Text style={[styles.date, { color: theme.textSecondary }]}>{formatDate(session.date)}</Text>
                {session.excludeFromStats && (
                  <Text style={[styles.excluded, { color: theme.textSecondary, borderColor: theme.border }]}>
                    {t.progress.excludedFromStats}
                  </Text>
                )}
                <View style={styles.spacer} />
                <Text style={[styles.best, { color: session.excludeFromStats ? theme.textSecondary : theme.text }]}>
                  {session.bestE1RM.toFixed(1)} {t.progress.kg}
                </Text>
                {delta !== null && (
                  <Text style={[styles.delta, { color: changeColor(delta, theme) }]}>{signed(delta)}</Text>
                )}
                <SymbolView
                  name={expanded ? "chevron.up" : "chevron.down"}
                  size={12}
                  weight="semibold"
                  tintColor={theme.textSecondary}
                />
              </Pressable>

              {expanded && (
                <View style={styles.sets}>
                  {session.notes && <Text style={[styles.notes, { color: theme.textSecondary }]}>{session.notes}</Text>}
                  {session.sets.map((set, j) => {
                    const dim = set.type !== "working";
                    return (
                      <View key={j} style={styles.setRow}>
                        <Text style={[styles.setIndex, { color: theme.textSecondary }]}>{set.setOrder + 1}</Text>
                        <Text style={[styles.setText, { color: dim ? theme.textSecondary : theme.text }]}>
                          {set.weight} {t.progress.kg} × {set.reps}
                        </Text>
                        {setTypeLabel[set.type] && (
                          <Text style={[styles.setType, { color: theme.textSecondary }]}>{setTypeLabel[set.type]}</Text>
                        )}
                      </View>
                    );
                  })}
                  {session.sets.length === 0 && (
                    <Text style={[styles.notes, { color: theme.textSecondary }]}>{t.dashboard.noCompletedSets}</Text>
                  )}
                </View>
              )}
            </View>
          );
        })
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  empty: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: Spacing.lg,
  },
  session: {
    marginHorizontal: -Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm + Spacing.xs,
  },
  date: {
    fontSize: 14,
  },
  excluded: {
    fontSize: 10,
    fontWeight: "500",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  spacer: {
    flex: 1,
  },
  best: {
    fontSize: 14,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  delta: {
    fontSize: 12,
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
  },
  sets: {
    paddingBottom: Spacing.sm + Spacing.xs,
    paddingLeft: Spacing.lg,
    gap: 2,
  },
  notes: {
    fontSize: 12,
    fontStyle: "italic",
    marginBottom: Spacing.xs,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  setIndex: {
    width: 16,
    textAlign: "right",
    fontSize: 12,
    opacity: 0.5,
    fontVariant: ["tabular-nums"],
  },
  setText: {
    fontSize: 13,
    fontVariant: ["tabular-nums"],
  },
  setType: {
    fontSize: 10,
    fontStyle: "italic",
    opacity: 0.6,
  },
});

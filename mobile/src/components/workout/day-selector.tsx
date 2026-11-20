import { SymbolView } from "expo-symbols";
import { ActionSheetIOS, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { Badge } from "@/components/badge";
import { Card } from "@/components/card";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { WorkoutSession } from "@/lib/db/types";
import { getDayLabels } from "@/lib/i18n/format";
import { useLocale, useT } from "@/lib/i18n/locale-context";

type Props = {
  sessions: WorkoutSession[];
  selected: WorkoutSession;
  recommendedId: string | null;
  onSelect: (id: string) => void;
};

// Card showing the chosen session; tap opens a native chooser with all
// sessions (the web app uses a radio-list dialog).
export function DaySelector({ sessions, selected, recommendedId, onSelect }: Props) {
  const t = useT();
  const theme = useTheme();
  const { locale } = useLocale();
  const dayLabels = getDayLabels(locale);

  const describe = (s: WorkoutSession) => `${dayLabels[s.dayOfWeek % 7]} · ${t.workout.exerciseCount(s.exercises.length)}`;

  const openChooser = () => {
    if (Platform.OS !== "ios") {
      // Android fallback: cycle to the next session.
      const i = sessions.findIndex((s) => s.id === selected.id);
      const next = sessions[(i + 1) % sessions.length];
      if (next) onSelect(next.id);
      return;
    }
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: t.workout.changeDay,
        options: [
          ...sessions.map((s) => {
            const label = `${s.name} — ${describe(s)}`;
            return s.id === recommendedId ? `${label} (${t.workout.today})` : label;
          }),
          t.workout.cancel,
        ],
        cancelButtonIndex: sessions.length,
      },
      (index) => {
        const s = sessions[index];
        if (s) onSelect(s.id);
      },
    );
  };

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={t.workout.changeDay} onPress={openChooser}>
      {({ pressed }) => (
        <Card style={[styles.card, pressed && styles.pressed]}>
          <View style={styles.body}>
            <Text style={[styles.name, { color: theme.text }]}>{selected.name}</Text>
            <Text style={[styles.meta, { color: theme.textSecondary }]}>{describe(selected)}</Text>
          </View>
          {selected.id === recommendedId && <Badge variant="primary">{t.workout.today}</Badge>}
          <SymbolView name="chevron.up.chevron.down" size={16} tintColor={theme.textSecondary} />
        </Card>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
  },
  meta: {
    fontSize: 13,
  },
});

import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/card";
import { GlassButton } from "@/components/glass-button";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useT } from "@/lib/i18n/locale-context";

type Props = {
  sessionName: string;
  startedAtLabel: string | null;
  onContinue: () => void;
  onDiscard: () => void;
};

// Shown on the plan screen while a draft exists. The web app auto-redirects
// to the active session; on mobile the user resumes or discards explicitly.
export function ContinueWorkoutCard({ sessionName, startedAtLabel, onContinue, onDiscard }: Props) {
  const t = useT();
  const theme = useTheme();

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: theme.muted }]}>
          <SymbolView name="figure.strengthtraining.traditional" size={22} tintColor={theme.success} />
        </View>
        <View style={styles.body}>
          <Text style={[styles.label, { color: theme.success }]}>{t.workout.inProgress}</Text>
          <Text style={[styles.name, { color: theme.text }]}>{sessionName}</Text>
          {startedAtLabel && <Text style={[styles.meta, { color: theme.textSecondary }]}>{startedAtLabel}</Text>}
        </View>
      </View>
      <GlassButton label={t.workout.continueWorkout} symbol="play.fill" onPress={onContinue} />
      <Pressable accessibilityRole="button" onPress={onDiscard} style={({ pressed }) => pressed && styles.pressed}>
        <Text style={[styles.discard, { color: theme.textSecondary }]}>{t.workout.discard}</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm + Spacing.xs,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
  },
  meta: {
    fontSize: 13,
  },
  discard: {
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
    paddingVertical: Spacing.xs,
  },
  pressed: {
    opacity: 0.6,
  },
});

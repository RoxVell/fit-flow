import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/card";
import { GlassButton } from "@/components/glass-button";
import { Screen } from "@/components/screen";
import { ContinueWorkoutCard } from "@/components/workout/continue-workout-card";
import { DaySelector } from "@/components/workout/day-selector";
import { ExercisePlanList } from "@/components/workout/exercise-plan-list";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { TABLES } from "@/lib/db/database";
import { useLiveQuery } from "@/lib/db/live-query";
import { useLocale, useT } from "@/lib/i18n/locale-context";
import { clearDraft } from "@/lib/repositories/drafts";
import { getActiveProgram } from "@/lib/repositories/programs";
import { startWorkoutDraft } from "@/lib/workout/start-session-draft";
import { useActiveWorkout } from "@/lib/workout/use-active-workout";

// Mirrors the "plan" tab of the web app's src/app/(main)/workout/page.tsx.
// History tab is out of scope for now.
export default function WorkoutScreen() {
  const t = useT();
  const theme = useTheme();
  const router = useRouter();
  const { locale } = useLocale();
  const program = useLiveQuery(getActiveProgram, [TABLES.programs]);
  const { isActive, draft } = useActiveWorkout();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const sessions = program?.sessions ?? [];
  const today = new Date().getDay();
  const recommendedId = sessions.find((s) => s.dayOfWeek === today)?.id ?? sessions[0]?.id ?? null;
  const selectedSession =
    sessions.find((s) => s.id === selectedId) ?? sessions.find((s) => s.id === recommendedId) ?? null;

  const openActive = () => router.push("/workout/active");

  const start = () => {
    if (!selectedSession) return;
    startWorkoutDraft(selectedSession);
    openActive();
  };

  const confirmDiscard = () => {
    Alert.alert(t.workout.abandonTitle, t.workout.abandonDesc, [
      { text: t.workout.cancel, style: "cancel" },
      { text: t.workout.abandon, style: "destructive", onPress: () => clearDraft() },
    ]);
  };

  if (isActive) {
    const draftSession = sessions.find((s) => s.id === draft.sessionId);
    const startedAtLabel = draft.startedAt
      ? t.workout.startedAt(
          new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date(draft.startedAt)),
        )
      : null;
    return (
      <Screen>
        <ContinueWorkoutCard
          sessionName={draftSession?.name ?? t.workout.activeSession}
          startedAtLabel={startedAtLabel}
          onContinue={openActive}
          onDiscard={confirmDiscard}
        />
        {draftSession && <ExercisePlanList exercises={draftSession.exercises} />}
      </Screen>
    );
  }

  if (!program) {
    return (
      <Screen>
        <Card style={styles.empty}>
          <View style={[styles.iconWrap, { backgroundColor: theme.muted }]}>
            <SymbolView name="dumbbell" size={28} tintColor={theme.textSecondary} />
          </View>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            {t.workout.noActiveProgram}
            {"\n"}
            {t.workout.createInPrograms}
          </Text>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        {program.name} · {program.daysPerWeek} {t.workout.daysPerWeek}
      </Text>

      {selectedSession && (
        <DaySelector
          sessions={sessions}
          selected={selectedSession}
          recommendedId={recommendedId}
          onSelect={setSelectedId}
        />
      )}

      <ExercisePlanList exercises={selectedSession?.exercises ?? []} />

      {selectedSession && <GlassButton label={t.workout.startWorkout} symbol="play.fill" onPress={start} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 15,
  },
  empty: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
});

import { Host, Picker, Text as SwiftText } from "@expo/ui/swift-ui";
import { labelsHidden, pickerStyle, tag } from "@expo/ui/swift-ui/modifiers";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/card";
import { GlassButton } from "@/components/glass-button";
import { Screen } from "@/components/screen";
import { ContinueWorkoutCard } from "@/components/workout/continue-workout-card";
import { DaySelector } from "@/components/workout/day-selector";
import { ExercisePlanList } from "@/components/workout/exercise-plan-list";
import { WorkoutHistoryList } from "@/components/workout/workout-history";
import { Radius, Spacing } from "@/constants/theme";
import { useScheme, useTheme } from "@/hooks/use-theme";
import { TABLES } from "@/lib/db/database";
import { useLiveQuery } from "@/lib/db/live-query";
import { useLocale, useT } from "@/lib/i18n/locale-context";
import { clearDraft } from "@/lib/repositories/drafts";
import { getActiveProgram } from "@/lib/repositories/programs";
import { recommendedSession, startWorkoutDraft } from "@/lib/workout/start-session-draft";
import { useActiveWorkout } from "@/lib/workout/use-active-workout";

type Tab = "plan" | "history";

export default function WorkoutScreen() {
  const t = useT();
  const theme = useTheme();
  const scheme = useScheme();
  const router = useRouter();
  const { locale } = useLocale();
  const program = useLiveQuery(getActiveProgram, [TABLES.programs]);
  const { isActive, draft } = useActiveWorkout();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("plan");

  const sessions = program?.sessions ?? [];
  const recommendedId = recommendedSession(sessions)?.id ?? null;
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

  const cardioLink = (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push("/workout/cardio")}
      style={({ pressed }) => [styles.cardio, pressed && { opacity: 0.7 }]}>
      <SymbolView name="figure.run" size={16} tintColor={theme.primary} />
      <Text style={[styles.cardioLabel, { color: theme.primary }]}>{t.workout.logCardio}</Text>
    </Pressable>
  );

  const picker = (
    <Host matchContents colorScheme={scheme}>
      <Picker
        label={t.workout.title}
        selection={tab}
        onSelectionChange={setTab}
        modifiers={[pickerStyle("segmented"), labelsHidden()]}>
        <SwiftText modifiers={[tag("plan")]}>{t.workout.tabPlan}</SwiftText>
        <SwiftText modifiers={[tag("history")]}>{t.workout.tabHistory}</SwiftText>
      </Picker>
    </Host>
  );

  if (tab === "history") {
    return (
      <Screen>
        {picker}
        <WorkoutHistoryList />
      </Screen>
    );
  }

  if (isActive) {
    const draftSession = sessions.find((s) => s.id === draft.sessionId);
    const startedAtLabel = draft.startedAt
      ? t.workout.startedAt(
          new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date(draft.startedAt)),
        )
      : null;
    return (
      <Screen>
        {picker}
        <ContinueWorkoutCard
          sessionName={draftSession?.name ?? t.workout.activeSession}
          startedAtLabel={startedAtLabel}
          onContinue={openActive}
          onDiscard={confirmDiscard}
        />
        {draftSession && <ExercisePlanList exercises={draftSession.exercises} />}
        {cardioLink}
      </Screen>
    );
  }

  if (!program) {
    return (
      <Screen>
        {picker}
        <Card style={styles.empty}>
          <View style={[styles.iconWrap, { backgroundColor: theme.muted }]}>
            <SymbolView name="dumbbell" size={28} tintColor={theme.textSecondary} />
          </View>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            {t.workout.noActiveProgram}
            {"\n"}
            {t.workout.createInPrograms}
          </Text>
          <GlassButton
            label={t.programs.createNew}
            symbol="plus"
            onPress={() => router.push("/programs/create")}
          />
          {cardioLink}
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      {picker}
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

      {cardioLink}
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
  cardio: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  cardioLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
});

import { Stack, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { ActiveExerciseCard } from "@/components/workout/active-exercise-card";
import { Fonts, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { TABLES } from "@/lib/db/database";
import { useLiveQuery } from "@/lib/db/live-query";
import { useLocale, useT } from "@/lib/i18n/locale-context";
import { clearDraft } from "@/lib/repositories/drafts";
import { listPrograms } from "@/lib/repositories/programs";
import { formatElapsedClock } from "@/lib/workout/format";
import { formatRestDuration, resolveRestDuration } from "@/lib/workout/rest-duration";
import { useActiveWorkout } from "@/lib/workout/use-active-workout";
import { useElapsedSeconds } from "@/lib/workout/use-elapsed";

// Minimal active session (web: src/app/(main)/workout/active/page.tsx).
// TODO(active-workout): set logging (weight/reps/complete), rest timer,
// add/swap/remove exercise, exercise history sheet, finish → WorkoutLog +
// personal records + triumph screen.
export default function ActiveWorkoutScreen() {
  const t = useT();
  const theme = useTheme();
  const router = useRouter();
  const { locale } = useLocale();
  const { isActive, draft } = useActiveWorkout();
  const programs = useLiveQuery(listPrograms, [TABLES.programs]);
  const elapsed = useElapsedSeconds(draft.startedAt);

  const program = programs.find((p) => p.sessions.some((s) => s.id === draft.sessionId));
  const session = program?.sessions.find((s) => s.id === draft.sessionId);
  const title = session?.name ?? t.workout.activeSession;
  const totalSets = draft.exercises.reduce((n, ex) => n + ex.sets.length, 0);
  const completedSets = draft.exercises.reduce((n, ex) => n + ex.sets.filter((s) => s.completed).length, 0);
  const startedAt = draft.startedAt
    ? new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date(draft.startedAt))
    : null;

  const close = () => {
    if (router.canDismiss()) router.dismiss();
    else router.replace("/workout");
  };

  const confirmFinish = () => {
    Alert.alert(t.workout.finishTitle, t.workout.finishDesc, [
      { text: t.workout.cancel, style: "cancel" },
      {
        text: t.workout.finish,
        onPress: () => {
          // TODO(active-workout): persist WorkoutLog + PRs, show triumph screen.
          clearDraft();
          close();
        },
      },
    ]);
  };

  const confirmDiscard = () => {
    Alert.alert(t.workout.abandonTitle, t.workout.abandonDesc, [
      { text: t.workout.cancel, style: "cancel" },
      {
        text: t.workout.abandon,
        style: "destructive",
        onPress: () => {
          clearDraft();
          close();
        },
      },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {/* Presentation ideally lives in the root layout; set here as well since this page owns the route. */}
      <Stack.Screen options={{ presentation: "fullScreenModal", headerShown: true, gestureEnabled: false }} />
      <Stack.Title>{title}</Stack.Title>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button onPress={confirmDiscard} tintColor={theme.textSecondary}>
          {t.workout.discard}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button onPress={confirmFinish} variant="prominent" tintColor={theme.primary}>
          {t.workout.finish}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>

      {isActive ? (
        <>
          <View style={[styles.info, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
            <View style={styles.timerRow}>
              <SymbolView name="timer" size={18} tintColor={theme.textSecondary} />
              <Text style={[styles.timer, { color: theme.text }]}>{formatElapsedClock(elapsed)}</Text>
              <View style={styles.spacer} />
              <SymbolView name="checkmark.circle" size={16} tintColor={theme.success} />
              <Text style={[styles.stat, { color: theme.text }]}>
                {completedSets}
                <Text style={{ color: theme.textSecondary }}> / {totalSets}</Text>
              </Text>
            </View>
            <Text style={[styles.meta, { color: theme.textSecondary }]}>
              {[startedAt && t.workout.startedAt(startedAt), `${t.workout.rest} ${formatRestDuration(resolveRestDuration(program?.restDurationSeconds))}`]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          </View>

          <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.list}>
            {draft.exercises.map((ex) => (
              <ActiveExerciseCard
                key={ex.id}
                exercise={ex}
                planned={session?.exercises.find((se) => se.exerciseId === ex.exerciseId)}
              />
            ))}
          </ScrollView>
        </>
      ) : (
        <View style={styles.center}>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>{t.workout.noDraft}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  info: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + Spacing.xs,
    gap: Spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  timer: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: Fonts?.rounded,
    fontVariant: ["tabular-nums"],
  },
  spacer: {
    flex: 1,
  },
  stat: {
    fontSize: 15,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  meta: {
    fontSize: 13,
  },
  list: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },
});

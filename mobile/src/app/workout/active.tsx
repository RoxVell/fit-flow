import { Stack, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ActiveExerciseCard } from "@/components/workout/active-exercise-card";
import { RestTimerBar } from "@/components/workout/rest-timer";
import { TriumphScreen } from "@/components/workout/triumph-screen";
import { Fonts, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { TABLES } from "@/lib/db/database";
import { useLiveQuery } from "@/lib/db/live-query";
import { useLocale, useT } from "@/lib/i18n/locale-context";
import { listPrograms } from "@/lib/repositories/programs";
import { formatElapsedClock } from "@/lib/workout/format";
import { formatRestDuration, resolveRestDuration } from "@/lib/workout/rest-duration";
import { useActiveWorkout } from "@/lib/workout/use-active-workout";
import { useWorkoutSession } from "@/lib/workout/use-workout-session";

const TRIUMPH_SCREEN_OPTIONS = { headerShown: false, gestureEnabled: false } as const;
const ACTIVE_SCREEN_OPTIONS = { presentation: "fullScreenModal", headerShown: true, gestureEnabled: false } as const;

export default function ActiveWorkoutScreen() {
  const t = useT();
  const theme = useTheme();
  const router = useRouter();
  const { locale } = useLocale();
  const programs = useLiveQuery(listPrograms, [TABLES.programs]);
  const { draft } = useActiveWorkout();
  const program = programs.find((p) => p.sessions.some((s) => s.id === draft.sessionId));
  const session = useWorkoutSession(program);

  const close = () => {
    if (router.canDismiss()) router.dismiss();
    else router.replace("/workout");
  };

  const finishToDashboard = () => {
    if (router.canDismiss()) router.dismissTo("/dashboard");
    else router.replace("/dashboard");
  };

  const draftSession = program?.sessions.find((s) => s.id === session.draft.sessionId);
  const title = draftSession?.name ?? t.workout.activeSession;
  const startedAt = session.draft.startedAt
    ? new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date(session.draft.startedAt))
    : null;

  if (session.triumph) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <Stack.Screen options={TRIUMPH_SCREEN_OPTIONS} />
        <TriumphScreen triumph={session.triumph} onDone={finishToDashboard} />
      </View>
    );
  }

  const confirmFinish = () => {
    if (session.completedSets === 0) {
      Alert.alert(t.workout.noCompletedSets, t.workout.noCompletedSetsDesc, [
        { text: t.workout.cancel, style: "cancel" },
        {
          text: t.workout.discard,
          style: "destructive",
          onPress: () => {
            session.abandon();
            close();
          },
        },
      ]);
      return;
    }
    if (session.completedSets < session.totalSets) {
      Alert.alert(t.workout.incompleteSets, t.workout.incompleteSetsDesc(session.completedSets, session.totalSets), [
        { text: t.workout.cancel, style: "cancel" },
        {
          text: t.workout.discard,
          style: "destructive",
          onPress: () => {
            session.abandon();
            close();
          },
        },
        { text: t.workout.finishAnyway, onPress: () => session.persistFinish(draftSession?.name) },
      ]);
      return;
    }
    session.persistFinish(draftSession?.name);
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <Stack.Screen options={ACTIVE_SCREEN_OPTIONS} />
      <Stack.Title>{title}</Stack.Title>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button onPress={close} tintColor={theme.textSecondary}>
          {t.workout.hide}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button onPress={confirmFinish} variant="prominent" tintColor={theme.primary}>
          {t.workout.finish}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>

      {session.isActive ? (
        <>
          <View style={[styles.info, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
            <View style={styles.timerRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={session.isPaused ? t.workout.resume : t.workout.pause}
                onPress={session.togglePause}
                hitSlop={8}
                style={styles.timerPress}>
                <SymbolView name={session.isPaused ? "play.fill" : "pause.fill"} size={16} tintColor={theme.textSecondary} />
                <Text style={[styles.timer, { color: theme.text }]}>{formatElapsedClock(session.elapsed)}</Text>
              </Pressable>
              <View style={styles.spacer} />
              <View style={styles.stats}>
                <SymbolView name="checkmark.circle" size={16} tintColor={theme.success} />
                <Text style={[styles.stat, { color: theme.text }]}>
                  {session.completedSets}
                  <Text style={{ color: theme.textSecondary }}> / {session.totalSets}</Text>
                </Text>
                <Text style={[styles.statDot, { color: theme.textSecondary }]}>·</Text>
                <Text style={[styles.stat, { color: theme.textSecondary }]}>
                  {Math.round(session.totalVolume)} {t.workout.kg}
                </Text>
              </View>
            </View>
            <Text style={[styles.meta, { color: theme.textSecondary }]}>
              {[
                startedAt && t.workout.startedAt(startedAt),
                `${t.workout.rest} ${formatRestDuration(resolveRestDuration(program?.restDurationSeconds))}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          </View>

          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            automaticallyAdjustKeyboardInsets
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.list}>
            {session.exercises.map((ex, index) => (
              <ActiveExerciseCard
                key={ex.id}
                index={index + 1}
                exercise={ex}
                planned={draftSession?.exercises.find((se) => se.exerciseId === ex.exerciseId)}
                previousSets={session.previousSetsMap.get(ex.id) ?? []}
                isCurrent={ex.id === session.activeExerciseId}
                onToggleSet={(setIndex) => session.onToggleSet(ex.id, setIndex)}
                onUpdateSet={(setIndex, data, options) => session.onUpdateSet(ex.id, setIndex, data, options)}
                onAddSet={() => session.onAddSet(ex.id)}
                onRemoveSet={(setIndex) => session.onRemoveSet(ex.id, setIndex)}
                onRemove={() => session.onRemoveExercise(ex.id)}
                onSwap={() =>
                  router.push({ pathname: "/workout/add-exercise", params: { mode: "swap", loggedId: ex.id } })
                }
                onHistory={() =>
                  router.push({ pathname: "/workout/exercise-history", params: { exerciseId: ex.exerciseId } })
                }
                onUpdateExercise={(data) => session.onUpdateExercise(ex.id, data)}
              />
            ))}
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: "/workout/add-exercise", params: { mode: "add" } })}
              style={[styles.add, { borderColor: theme.border, backgroundColor: theme.card }]}>
              <SymbolView name="plus" size={16} tintColor={theme.primary} />
              <Text style={[styles.addLabel, { color: theme.primary }]}>{t.workout.addExercise}</Text>
            </Pressable>
          </ScrollView>

          {session.restTimer.isRunning && (
            <RestTimerBar
              remaining={session.restTimer.remaining}
              duration={session.restTimer.duration}
              onSkip={session.restTimer.stop}
            />
          )}
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
  timerPress: {
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
  stats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stat: {
    fontSize: 15,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  statDot: {
    fontSize: 15,
    fontWeight: "600",
  },
  meta: {
    fontSize: 13,
  },
  list: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: 120,
  },
  add: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  addLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },
});

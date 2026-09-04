import { Stack, useLocalSearchParams } from "expo-router";

import { ExerciseHistoryList } from "@/components/progress/exercise-history-list";
import { Screen } from "@/components/screen";
import { TABLES } from "@/lib/db/database";
import { useLiveQuery } from "@/lib/db/live-query";
import { getExerciseName } from "@/lib/exercises/catalog";
import { useLocale, useT } from "@/lib/i18n/locale-context";
import { buildExerciseSessions } from "@/lib/progress/exercise-stats";
import { listCompletedWorkoutLogs } from "@/lib/repositories/workouts";

export default function WorkoutExerciseHistoryScreen() {
  const t = useT();
  const { locale } = useLocale();
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const logs = useLiveQuery(() => listCompletedWorkoutLogs(200), [TABLES.workoutLogs]);
  const sessions = exerciseId ? buildExerciseSessions(logs, exerciseId) : [];
  const name = exerciseId
    ? getExerciseName(exerciseId, locale, t.workout.unknownExercise)
    : t.workout.historyTitle;

  return (
    <>
      <Stack.Title>{name}</Stack.Title>
      <Screen>
        <ExerciseHistoryList sessions={sessions} />
      </Screen>
    </>
  );
}

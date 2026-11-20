import { Stack, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";

import { ExercisePicker } from "@/components/program-form/exercise-picker";
import { useT } from "@/lib/i18n/locale-context";
import { getDraft, updateDraftExercises } from "@/lib/repositories/drafts";
import { appendExercise, mapExercise, swapExercise } from "@/lib/workout/session";

export default function WorkoutExercisePickerScreen() {
  const t = useT();
  const { mode, loggedId } = useLocalSearchParams<{ mode?: string; loggedId?: string }>();
  const [query, setQuery] = useState("");
  const draft = getDraft();
  const excludeIds = new Set(draft.exercises.map((ex) => ex.exerciseId));

  const select = (exerciseId: string) => {
    if (mode === "swap" && loggedId) {
      updateDraftExercises((current) => mapExercise(current, loggedId, (ex) => swapExercise(ex, exerciseId)));
    } else {
      updateDraftExercises((current) => appendExercise(current, exerciseId, draft.activeWorkoutId ?? exerciseId));
    }
    router.back();
  };

  return (
    <>
      <Stack.Title>{mode === "swap" ? t.workout.swapExercise : t.workout.addExercise}</Stack.Title>
      <Stack.SearchBar
        placeholder={t.programs.searchExercises}
        autoCapitalize="none"
        hideWhenScrolling={false}
        onChangeText={(e) => setQuery(e.nativeEvent.text)}
        onCancelButtonPress={() => setQuery("")}
      />
      <ExercisePicker query={query} excludeIds={mode === "swap" ? new Set() : excludeIds} onSelect={select} />
    </>
  );
}

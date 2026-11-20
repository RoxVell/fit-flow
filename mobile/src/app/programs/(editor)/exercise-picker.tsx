import { Stack, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";

import { ExercisePicker } from "@/components/program-form/exercise-picker";
import { addExercise, useProgramDraft } from "@/components/program-form/store";
import { useT } from "@/lib/i18n/locale-context";

// Adds an exercise to a draft session (`?session=<draft session id>`).
// Search lives in the native header search bar.
export default function ExercisePickerScreen() {
  const t = useT();
  const { session } = useLocalSearchParams<{ session: string }>();
  const { draft } = useProgramDraft();
  const [query, setQuery] = useState("");

  const current = draft.sessions.find((s) => s.id === session);
  const excludeIds = new Set(current?.exercises.map((e) => e.exerciseId) ?? []);

  const select = (exerciseId: string) => {
    if (current) addExercise(current.id, exerciseId);
    router.back();
  };

  return (
    <>
      <Stack.Title>{t.programs.addExercise}</Stack.Title>
      <Stack.SearchBar
        placeholder={t.programs.searchExercises}
        autoCapitalize="none"
        hideWhenScrolling={false}
        onChangeText={(e) => setQuery(e.nativeEvent.text)}
        onCancelButtonPress={() => setQuery("")}
      />
      <ExercisePicker query={query} excludeIds={excludeIds} onSelect={select} />
    </>
  );
}

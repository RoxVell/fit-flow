import { Stack } from "expo-router";

import { Screen } from "@/components/screen";
import { WorkoutHistoryList } from "@/components/workout/workout-history";
import { useT } from "@/lib/i18n/locale-context";

export default function WorkoutHistoryScreen() {
  const t = useT();

  return (
    <>
      <Stack.Title>{t.workout.historyTitle}</Stack.Title>
      <Screen>
        <WorkoutHistoryList />
      </Screen>
    </>
  );
}

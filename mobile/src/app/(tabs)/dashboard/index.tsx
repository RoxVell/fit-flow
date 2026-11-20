import { useRouter } from "expo-router";
import { Alert } from "react-native";

import { Greeting } from "@/components/dashboard/greeting";
import { ProgressCard } from "@/components/dashboard/progress-card";
import { RecentPRs } from "@/components/dashboard/recent-prs";
import { RecentWorkouts } from "@/components/dashboard/recent-workouts";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { GlassButton } from "@/components/glass-button";
import { Screen } from "@/components/screen";
import { computeDashboardStats } from "@/lib/dashboard/stats";
import { TABLES } from "@/lib/db/database";
import { useLiveQuery } from "@/lib/db/live-query";
import { useT } from "@/lib/i18n/locale-context";
import { listBodyMeasurements } from "@/lib/repositories/measurements";
import { getActiveProgram } from "@/lib/repositories/programs";
import { listWorkoutLogs } from "@/lib/repositories/workouts";
import { recommendedSession, startWorkoutDraft } from "@/lib/workout/start-session-draft";
import { useActiveWorkout } from "@/lib/workout/use-active-workout";

export default function DashboardScreen() {
  const t = useT();
  const router = useRouter();
  const logs = useLiveQuery(() => listWorkoutLogs(100), [TABLES.workoutLogs]);
  const measurements = useLiveQuery(listBodyMeasurements, [TABLES.bodyMeasurements]);
  const program = useLiveQuery(getActiveProgram, [TABLES.programs]);
  const { isActive } = useActiveWorkout();
  const stats = computeDashboardStats(logs, measurements);

  const startWorkout = () => {
    if (isActive) {
      router.push("/workout/active");
      return;
    }
    const session = recommendedSession(program?.sessions ?? []);
    if (!session) {
      Alert.alert(t.workout.noActiveProgram, t.workout.createInPrograms, [
        { text: t.workout.cancel, style: "cancel" },
        { text: t.programs.createNew, onPress: () => router.push("/programs/create") },
      ]);
      return;
    }
    startWorkoutDraft(session);
    router.push("/workout/active");
  };

  return (
    <Screen>
      <Greeting />
      <StatsGrid {...stats} onWeightPress={() => router.push("/progress/body-log")} />
      <ProgressCard />
      <RecentPRs />
      <RecentWorkouts />
      <GlassButton
        label={isActive ? t.workout.continueWorkout : t.dashboard.startWorkout}
        symbol="play.fill"
        onPress={startWorkout}
      />
    </Screen>
  );
}

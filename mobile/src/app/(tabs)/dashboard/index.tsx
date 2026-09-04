import { useRouter } from "expo-router";

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
import { listWorkoutLogs } from "@/lib/repositories/workouts";

export default function DashboardScreen() {
  const t = useT();
  const router = useRouter();
  const logs = useLiveQuery(() => listWorkoutLogs(100), [TABLES.workoutLogs]);
  const measurements = useLiveQuery(listBodyMeasurements, [TABLES.bodyMeasurements]);
  const stats = computeDashboardStats(logs, measurements);

  return (
    <Screen>
      <Greeting />
      <StatsGrid {...stats} />
      <ProgressCard />
      <RecentPRs />
      <RecentWorkouts />
      <GlassButton
        label={t.dashboard.startWorkout}
        symbol="play.fill"
        onPress={() => router.navigate("/workout")}
      />
    </Screen>
  );
}

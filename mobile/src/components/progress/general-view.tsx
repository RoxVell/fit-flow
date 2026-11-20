import { MuscleHeatmap } from "@/components/progress/muscle-heatmap";
import { ProgressCard } from "@/components/dashboard/progress-card";
import { RecentPRs } from "@/components/dashboard/recent-prs";
import { buildWeeklyExerciseBest1RM, getSortedWeeks } from "@/lib/dashboard/progress";
import { TABLES } from "@/lib/db/database";
import { useLiveQuery } from "@/lib/db/live-query";
import { useT } from "@/lib/i18n/locale-context";
import { buildWeeklyMuscleLoad } from "@/lib/progress/muscle-load";
import { listCompletedWorkoutLogs } from "@/lib/repositories/workouts";

import { BodyPartProgressCard } from "./body-part-progress-card";
import { EmptyCard } from "./empty-card";

// Progress → General (web: GeneralTab).
export function GeneralView() {
  const t = useT();
  const logs = useLiveQuery(() => listCompletedWorkoutLogs(200), [TABLES.workoutLogs]);

  if (logs.length === 0) {
    return (
      <>
        <EmptyCard symbol="chart.line.uptrend.xyaxis" title={t.progress.noWorkoutsYet} body={t.progress.noWorkoutsHint} />
        <RecentPRs />
        <MuscleHeatmap data={buildWeeklyMuscleLoad(logs)} />
      </>
    );
  }

  const weeks = getSortedWeeks(buildWeeklyExerciseBest1RM(logs)).length;

  return (
    <>
      {weeks < 2 && <EmptyCard symbol="calendar.badge.clock" title={t.progress.noData} body={t.progress.needTwoWeeks} />}
      <ProgressCard />
      <BodyPartProgressCard logs={logs} />
      <RecentPRs />
      <MuscleHeatmap data={buildWeeklyMuscleLoad(logs)} />
    </>
  );
}

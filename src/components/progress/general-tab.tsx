"use client";

import { useWeeklyMuscleLoad } from "@/lib/hooks/use-data";
import { ProgressChart } from "@/components/dashboard/progress-chart";
import { BodyPartProgressChart } from "@/components/dashboard/body-part-progress-chart";
import { RecentPRs } from "@/components/dashboard/recent-prs";
import { MuscleHeatmap } from "@/components/dashboard/muscle-heatmap";

export function GeneralTab() {
  const muscleLoad = useWeeklyMuscleLoad();

  return (
    <div className="space-y-4">
      <ProgressChart />
      <BodyPartProgressChart />
      <RecentPRs />
      {muscleLoad && (
        <MuscleHeatmap data={muscleLoad} />
      )}
    </div>
  );
}

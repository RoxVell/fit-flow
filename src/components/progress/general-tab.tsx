"use client";

import { useDashboardStats } from "@/lib/hooks/use-data";
import { ProgressChart } from "@/components/dashboard/progress-chart";
import { BodyPartProgressChart } from "@/components/dashboard/body-part-progress-chart";
import { RecentPRs } from "@/components/dashboard/recent-prs";
import { MuscleHeatmap } from "@/components/dashboard/muscle-heatmap";

export function GeneralTab() {
  const stats = useDashboardStats();

  return (
    <div className="space-y-4">
      <ProgressChart />
      <BodyPartProgressChart />
      <RecentPRs />
      {stats && (
        <MuscleHeatmap data={stats.heatmapData} />
      )}
    </div>
  );
}

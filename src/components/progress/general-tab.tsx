"use client";

import { useDashboardStats } from "@/lib/hooks/use-queries";
import { ProgressChart } from "@/components/dashboard/progress-chart";
import { RecentPRs } from "@/components/dashboard/recent-prs";
import { MuscleHeatmap } from "@/components/dashboard/muscle-heatmap";

export function GeneralTab() {
  const { data: stats } = useDashboardStats();

  return (
    <div className="space-y-4">
      <ProgressChart />
      <RecentPRs />
      {stats && (
        <MuscleHeatmap data={stats.heatmapData} />
      )}
    </div>
  );
}

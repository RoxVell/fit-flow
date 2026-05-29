"use client";

import { useDashboardStats } from "@/lib/hooks/use-queries";
import { ProgressChart } from "@/components/dashboard/progress-chart";
import { MuscleHeatmap } from "@/components/dashboard/muscle-heatmap";
import { ExerciseChart } from "@/components/progress/exercise-chart";
import { WeightChart } from "@/components/progress/weight-chart";

export default function ProgressPage() {
  const { data: stats } = useDashboardStats();

  return (
    <div className="space-y-4 px-4 pb-24 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <h1 className="text-xl font-bold">Progress</h1>
      <ProgressChart />
      {stats && (
        <MuscleHeatmap data={stats.heatmapData} />
      )}
      <ExerciseChart />
      <WeightChart />
    </div>
  );
}

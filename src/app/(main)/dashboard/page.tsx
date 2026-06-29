"use client";

import { useDashboardStats, useActiveProgram } from "@/lib/hooks/use-data";
import { Greeting } from "@/components/dashboard/greeting";
import { SmartStats } from "@/components/dashboard/smart-stats";
import { RecentPRs } from "@/components/dashboard/recent-prs";
import { WorkoutHistory } from "@/components/workout/workout-history";
import { ProgressChart } from "@/components/dashboard/progress-chart";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const stats = useDashboardStats();
  const program = useActiveProgram();

  if (stats === undefined || program === undefined) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 pb-24 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <Greeting />

      {stats && (
        <SmartStats
          steps={stats.steps}
          calories={stats.calories}
          weight={stats.currentWeight}
          weightTrend={stats.weightTrend}
          hasWeightHistory={stats.hasWeightHistory}
        />
      )}

      <ProgressChart />

      <RecentPRs />

      <WorkoutHistory preview />
    </div>
  );
}

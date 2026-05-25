"use client";

import { useDashboardStats, useActiveProgram } from "@/lib/hooks/use-queries";
import { StartWorkoutButton } from "@/components/dashboard/start-workout-button";
import { MuscleHeatmap } from "@/components/dashboard/muscle-heatmap";
import { SmartStats } from "@/components/dashboard/smart-stats";
import { CurrentProgram } from "@/components/dashboard/current-program";
import { AiBriefingCard } from "@/components/ai/ai-briefing";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: program, isLoading: programLoading } = useActiveProgram();

  if (statsLoading || programLoading) {
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

  const nextSession = stats?.nextSession
    ? program?.sessions.find((s) => s.id === stats.nextSession!.id)
    : undefined;

  return (
    <div className="space-y-4 p-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">FitFlow</h1>
        <p className="text-sm text-muted-foreground">
          {stats?.activeDays}/{stats?.weeklyWorkouts} workouts this week
        </p>
      </div>

      <StartWorkoutButton />

      {stats && (
        <MuscleHeatmap data={stats.heatmapData} />
      )}

      {stats && (
        <SmartStats
          steps={stats.steps}
          calories={stats.calories}
          weight={stats.currentWeight}
          weightTrend={stats.weightTrend}
        />
      )}

      <AiBriefingCard />

      {program && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Today's Program
          </h2>
          <CurrentProgram programName={program.name} session={nextSession} />
        </div>
      )}
    </div>
  );
}

"use client";

import { useDashboardStats, useActiveProgram } from "@/lib/hooks/use-queries";
import { Greeting } from "@/components/dashboard/greeting";
import { StartWorkoutButton } from "@/components/dashboard/start-workout-button";
import { SmartStats } from "@/components/dashboard/smart-stats";
import { RecentPRs } from "@/components/dashboard/recent-prs";
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
    <div className="space-y-4 px-4 pb-24 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <Greeting />

      <StartWorkoutButton />

      {stats && (
        <SmartStats
          steps={stats.steps}
          calories={stats.calories}
          weight={stats.currentWeight}
          weightTrend={stats.weightTrend}
        />
      )}

      <RecentPRs />

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

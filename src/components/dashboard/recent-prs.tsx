"use client";

import { Trophy, Dumbbell } from "lucide-react";
import { PrImprovement } from "@/components/workout/pr-improvement";
import { usePersonalRecords } from "@/lib/hooks/use-data";
import { useExerciseLookup } from "@/lib/hooks/use-exercise-lookup";
import { useT } from "@/lib/i18n/use-t";
import { getPrTypeLabels } from "@/lib/workout/pr-labels";

export function RecentPRs() {
  const records = usePersonalRecords();
  const t = useT();
  const { getName } = useExerciseLookup();

  const prLabels = getPrTypeLabels(t);

  const prUnit = t.dashboard.kg;

  if (!records || records.length === 0) return null;

  const sorted = [...records].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">{t.dashboard.recentPRs}</h2>
      </div>
      <div className="space-y-2">
        {sorted.slice(0, 5).map((pr) => {
          return (
            <div
              key={pr.id}
              className="flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Dumbbell className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {getName(pr.exerciseId, pr.exerciseName)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {prLabels[pr.type] || pr.type}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0 min-w-0">
                <p className="text-sm font-bold">
                  {pr.value} {prUnit}
                </p>
                <PrImprovement record={pr} history={records} unit={prUnit} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

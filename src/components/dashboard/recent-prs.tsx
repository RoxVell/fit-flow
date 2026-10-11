"use client";

import { Trophy, Dumbbell, TrendingUp } from "lucide-react";
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
          const prev = records
            .filter(
              (r) =>
                r.exerciseId === pr.exerciseId &&
                r.type === pr.type &&
                r.id !== pr.id &&
                new Date(r.date) <= new Date(pr.date)
            )
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

          const absDelta = prev ? pr.value - prev.value : null;
          const pctDelta = prev && prev.value > 0 ? (pr.value / prev.value - 1) * 100 : null;

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
                {absDelta !== null && absDelta !== 0 && (
                  <p className="flex items-center gap-0.5 text-[11px] text-green-500 justify-end">
                    <TrendingUp className="h-3 w-3" />
                    +{absDelta.toFixed(2)} {prUnit}
                    {pctDelta !== null && (
                      <span className="text-green-500/70">
                        (+{pctDelta.toFixed(1)}%)
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

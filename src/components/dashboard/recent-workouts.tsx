"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronDown } from "lucide-react";
import { useCompletedWorkoutLogs } from "@/lib/hooks/use-data";
import { useExerciseLookup } from "@/lib/hooks/use-exercise-lookup";
import { formatDuration } from "@/lib/utils/calculations";
import { volume } from "@/lib/training-metrics";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/use-t";
import { useFormat } from "@/lib/i18n/use-format";
import { buttonVariants } from "@/components/ui/button";

const PREVIEW_LIMIT = 5;

const WORKOUT_ROW_GRID =
  "grid grid-cols-[4.25rem_minmax(0,1fr)_2.75rem_5.25rem_1rem] items-center gap-2";

function getDurationMinutes(startedAt: string, endedAt?: string) {
  if (!endedAt) return null;
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  return Math.max(1, Math.round(ms / 60000));
}

export function RecentWorkouts() {
  const logs = useCompletedWorkoutLogs(PREVIEW_LIMIT);
  const t = useT();
  const { formatShortDate } = useFormat();
  const { getName } = useExerciseLookup();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!logs || logs.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center gap-2 p-4 pb-2">
        <CalendarDays className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">{t.dashboard.recentWorkouts}</h2>
      </div>
      <div
        className={cn(
          WORKOUT_ROW_GRID,
          "border-b px-4 py-2 text-xs text-muted-foreground"
        )}
      >
        <span>{t.dashboard.date}</span>
        <span className="min-w-0 truncate">{t.dashboard.session}</span>
        <span className="text-right">{t.dashboard.time}</span>
        <span className="text-right">{t.dashboard.volume}</span>
        <span />
      </div>
      <div className="divide-y divide-border/50">
        {logs.map((log) => {
          const duration = getDurationMinutes(log.startedAt, log.endedAt);
          const totalVolume = log.exercises.reduce(
            (sum, e) => sum + volume(e.sets.filter((s) => s.completed)),
            0
          );
          const isOpen = expandedId === log.id;

          return (
            <div key={log.id}>
              <button
                type="button"
                onClick={() => setExpandedId(isOpen ? null : log.id)}
                className={cn(
                  WORKOUT_ROW_GRID,
                  "w-full px-4 py-2.5 text-left text-sm hover:bg-muted/20"
                )}
              >
                <span className="truncate text-muted-foreground">
                  {formatShortDate(log.startedAt)}
                </span>
                <span className="truncate font-medium">
                  {log.sessionName || t.dashboard.workoutFallback}
                </span>
                <span className="whitespace-nowrap text-right text-muted-foreground">
                  {duration != null
                    ? formatDuration(duration)
                    : t.common.emDash}
                </span>
                <span className="whitespace-nowrap text-right font-medium tabular-nums">
                  {totalVolume > 0
                    ? `${Math.round(totalVolume)} ${t.dashboard.kg}`
                    : t.common.emDash}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                    isOpen && "rotate-180"
                  )}
                />
              </button>

              <div
                className={cn(
                  "grid transition-all duration-200",
                  isOpen
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                )}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="space-y-3 border-t border-border/50 px-4 py-3">
                    {log.exercises.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        {t.workout.noCompletedSets}
                      </p>
                    ) : (
                      log.exercises
                        .filter((exercise) =>
                          exercise.sets.some((s) => s.completed)
                        )
                        .map((exercise) => {
                          const completedSets = exercise.sets
                            .filter((s) => s.completed)
                            .sort((a, b) => a.setOrder - b.setOrder);

                          return (
                            <div key={exercise.id}>
                              <p className="mb-1 text-xs font-medium">
                                {getName(exercise.exerciseId)}
                              </p>
                              <div className="space-y-0.5 pl-2">
                                {completedSets.map((set, index) => (
                                  <div
                                    key={set.id}
                                    className="grid grid-cols-[auto_1fr] gap-2 text-xs text-muted-foreground"
                                  >
                                    <span className="w-4 text-right tabular-nums text-muted-foreground/40">
                                      {index + 1}
                                    </span>
                                    <span className="tabular-nums text-foreground">
                                      {set.weight} {t.dashboard.kg} × {set.reps}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t px-4 py-3">
        <Link
          href="/workout?tab=history"
          className={cn(buttonVariants({ variant: "outline" }), "w-full")}
        >
          {t.dashboard.viewAllWorkouts}
        </Link>
      </div>
    </div>
  );
}

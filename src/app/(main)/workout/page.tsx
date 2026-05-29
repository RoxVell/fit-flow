"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Play, Dumbbell, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActiveProgram } from "@/lib/hooks/use-queries";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function WorkoutPlanPage() {
  const router = useRouter();
  const { data: program, isLoading } = useActiveProgram();
  const today = new Date().getDay();

  const recommendedId = useMemo(() => {
    if (!program) return null;
    return (
      program.sessions.find((s) => s.dayOfWeek === today)?.id ||
      program.sessions[0]?.id
    );
  }, [program, today]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const effectiveId = selectedId ?? recommendedId;

  const selectedSession = useMemo(() => {
    if (!program || !effectiveId) return null;
    return program.sessions.find((s) => s.id === effectiveId) || null;
  }, [program, effectiveId]);

  if (isLoading) {
    return (
      <div className="space-y-4 px-4 pb-24 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <Skeleton className="h-8 w-32 rounded-lg" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-4 pb-24 pt-[calc(env(safe-area-inset-top)+1rem)] h-full">
        <Dumbbell className="h-12 w-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground text-center">
          No active program found.<br />
          Create one in the Programs tab.
        </p>
      </div>
    );
  }

  const exercises = selectedSession?.exercises || [];

  return (
    <div className="space-y-6 px-4 pb-24 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <div>
        <h1 className="text-2xl font-bold">Workout</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {program.name} &middot; {program.daysPerWeek} days / week
        </p>
      </div>

      <section>
        <h2 className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Sessions
        </h2>
        <div className="overflow-hidden rounded-xl border bg-card">
          {program.sessions.map((s, i) => {
            const isRecommended = s.id === recommendedId;
            const isSelected = s.id === effectiveId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedId(s.id)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors active:bg-accent/50",
                  i < program.sessions.length - 1 && "border-b border-border"
                )}
              >
                <div
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isSelected
                      ? "border-primary"
                      : "border-muted-foreground/30"
                  )}
                >
                  {isSelected && (
                    <div className="h-3 w-3 rounded-full bg-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{s.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{DAY_LABELS[s.dayOfWeek % 7]}</span>
                    <span>&middot;</span>
                    <span>{s.exercises.length} exercises</span>
                  </div>
                </div>
                {isRecommended && (
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    Today
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {selectedSession && (
        <section>
          <h2 className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Exercises ({exercises.length})
          </h2>
          <div className="overflow-hidden rounded-xl border bg-card">
            {exercises.map((se, i) => (
              <div
                key={se.id}
                className={cn(
                  "flex items-center justify-between px-4 py-3",
                  i < exercises.length - 1 && "border-b border-border"
                )}
              >
                <span className="text-sm font-medium">
                  {se.exercise?.name || "Unknown"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {se.targetSets}&times;{se.targetReps}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <Button
        className="w-full gap-2 h-12 text-base font-semibold"
        onClick={() => router.push(`/workout/active?session=${effectiveId}`)}
      >
        <Play className="h-5 w-5" fill="currentColor" />
        Start Workout
      </Button>
    </div>
  );
}

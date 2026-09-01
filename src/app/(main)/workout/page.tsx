"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Play, Dumbbell, ChevronDown, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActiveProgram, useWorkoutDraft } from "@/lib/hooks/use-data";
import { useExerciseLookup } from "@/lib/hooks/use-exercise-lookup";
import { useSearchParamTab } from "@/lib/hooks/use-search-param-tab";
import { useT } from "@/lib/i18n/use-t";
import { useFormat } from "@/lib/i18n/use-format";
import { Skeleton } from "@/components/ui/skeleton";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { cn } from "@/lib/utils";
import { startWorkoutDraft } from "@/lib/workout/start-session-draft";
import { WorkoutHistory } from "@/components/workout/workout-history";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Tab = "plan" | "history";

export default function WorkoutPlanPage() {
  const router = useRouter();
  const t = useT();
  const [activeTab, setActiveTab] = useSearchParamTab<Tab>(
    ["plan", "history"],
    "plan"
  );
  const draft = useWorkoutDraft();

  useEffect(() => {
    if (draft === undefined) return;
    if (draft?.activeWorkoutId && draft.sessionId) {
      router.replace(`/workout/active?session=${draft.sessionId}`);
    }
  }, [draft, router]);

  const tabs = [
    { value: "plan" as const, label: t.workout.tabPlan, icon: Play },
    { value: "history" as const, label: t.workout.tabHistory, icon: CalendarDays },
  ];

  if (draft === undefined) {
    return (
      <div className="space-y-4 px-4 pb-24 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <Skeleton className="h-8 w-32 rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 pb-24 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <h1 className="text-2xl font-bold">{t.workout.title}</h1>

      <SegmentedTabs
        selectionMode="tabs"
        items={tabs}
        value={activeTab}
        onChange={setActiveTab}
        ariaLabel={t.workout.title}
      />

      {activeTab === "plan" && <WorkoutPlanTab />}
      {activeTab === "history" && <WorkoutHistory />}
    </div>
  );
}

function WorkoutPlanTab() {
  const router = useRouter();
  const t = useT();
  const { dayLabels } = useFormat();
  const program = useActiveProgram();
  const { getName } = useExerciseLookup();
  const today = new Date().getDay();

  const [starting, setStarting] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const recommendedId = useMemo(() => {
    if (!program) return null;
    return (
      program.sessions.find((s) => s.dayOfWeek === today)?.id ||
      program.sessions[0]?.id
    );
  }, [program, today]);

  const effectiveId = selectedId ?? recommendedId;

  const selectedSession = useMemo(() => {
    if (!program || !effectiveId) return null;
    return program.sessions.find((s) => s.id === effectiveId) || null;
  }, [program, effectiveId]);

  if (program === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <Dumbbell className="h-12 w-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground text-center">
          {t.workout.noActiveProgram}
          <br />
          {t.workout.createInPrograms}
        </p>
      </div>
    );
  }

  const exercises = selectedSession?.exercises || [];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          {program.name} &middot; {program.daysPerWeek} {t.workout.daysPerWeek}
        </p>
      </div>

      {selectedSession && (
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className="flex w-full items-center justify-between rounded-xl border bg-card px-4 py-3 text-left active:bg-accent/50 transition-colors"
        >
          <div>
            <p className="text-sm font-semibold">{selectedSession.name}</p>
            <p className="text-xs text-muted-foreground">
              {dayLabels[selectedSession.dayOfWeek % 7]} &middot;{" "}
              {t.workout.exerciseCount(selectedSession.exercises.length)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedSession.id === recommendedId && (
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                {t.workout.today}
              </span>
            )}
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </button>
      )}

      <section>
        <h2 className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.workout.exercises} ({exercises.length})
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
                {se.exercise?.name ||
                  getName(se.exerciseId, t.workout.unknownExercise)}
              </span>
              <span className="text-sm text-muted-foreground">
                {se.targetReps
                  ? `${se.targetSets}×${se.targetReps}`
                  : t.workout.setsCount(se.targetSets)}
              </span>
            </div>
          ))}
        </div>
      </section>

      <Button
        className="w-full gap-2 h-12 text-base font-semibold"
        disabled={!selectedSession || starting}
        onClick={() => {
          if (!selectedSession || starting) return;
          setStarting(true);
          void startWorkoutDraft(selectedSession)
            .then(() => {
              router.push(`/workout/active?session=${selectedSession.id}`);
            })
            .catch((err) => {
              console.warn("[startWorkout] failed", err);
            })
            .finally(() => {
              setStarting(false);
            });
        }}
      >
        <Play className="h-5 w-5" fill="currentColor" />
        {t.workout.startWorkout}
      </Button>

      <Dialog open={showPicker} onOpenChange={setShowPicker}>
        <DialogContent className="max-h-[70vh]">
          <DialogHeader>
            <DialogTitle>{t.workout.changeDay}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            {program.sessions.map((s) => {
              const isSelected = s.id === effectiveId;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(s.id);
                    setShowPicker(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition-colors hover:bg-accent",
                    isSelected && "bg-accent"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      isSelected ? "border-primary" : "border-muted-foreground/30"
                    )}
                  >
                    {isSelected && (
                      <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {dayLabels[s.dayOfWeek % 7]} &middot;{" "}
                      {t.workout.exerciseCount(s.exercises.length)}
                    </p>
                  </div>
                  {s.id === recommendedId && (
                    <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                      {t.workout.today}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

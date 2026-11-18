"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { LoggedExercise, WorkoutLogEntity } from "@/lib/db/types";
import { useExerciseLookup } from "@/lib/hooks/use-exercise-lookup";
import { saveWorkoutEdits } from "@/lib/repositories/workouts";
import { useT } from "@/lib/i18n/use-t";
import {
  formatDecimalForInput,
  isPartialDecimalInput,
  parseLocalizedDecimal,
} from "@/lib/utils/decimal-input";

interface WorkoutEditSheetProps {
  log: WorkoutLogEntity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkoutEditSheet({
  log,
  open,
  onOpenChange,
}: WorkoutEditSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        {log && (
          <WorkoutEditForm
            key={`${log.id}:${log.revision}:${open}`}
            log={log}
            onOpenChange={onOpenChange}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function WorkoutEditForm({
  log,
  onOpenChange,
}: Omit<WorkoutEditSheetProps, "log" | "open"> & { log: WorkoutLogEntity }) {
  const t = useT();
  const { getName } = useExerciseLookup();
  const [exercises, setExercises] = useState<LoggedExercise[]>(log.exercises);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [weightTexts, setWeightTexts] = useState<Record<string, string>>({});

  const updateExercise = (
    exerciseId: string,
    data: Partial<Pick<LoggedExercise, "notes" | "excludeFromStats">>
  ) => {
    setExercises((current) =>
      current.map((ex) => (ex.id !== exerciseId ? ex : { ...ex, ...data }))
    );
  };

  const updateSet = (
    exerciseId: string,
    setId: string,
    data: { weight?: number; reps?: number }
  ) => {
    setExercises((current) =>
      current.map((ex) =>
        ex.id !== exerciseId
          ? ex
          : {
              ...ex,
              sets: ex.sets.map((s) =>
                s.id === setId ? { ...s, ...data } : s
              ),
            }
      )
    );
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setSaveFailed(false);
    try {
      const normalized = exercises.map((exercise) => {
        const notes = exercise.notes?.trim();
        return {
          ...exercise,
          notes: notes ? notes : undefined,
        };
      });
      if (await saveWorkoutEdits(log.id, normalized)) onOpenChange(false);
      else setSaveFailed(true);
    } catch (err) {
      setSaveFailed(true);
      console.warn("[workout-edit] save failed", err);
    } finally {
      setSaving(false);
    }
  };

  const sessionLabel =
    log.sessionName || t.dashboard.workoutFallback;

  return (
    <>
        <SheetHeader>
          <SheetTitle>{sessionLabel}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-2">
          {exercises
            .filter((exercise) => exercise.sets.some((s) => s.completed))
            .map((exercise) => {
              const completedSets = exercise.sets
                .filter((s) => s.completed)
                .sort((a, b) => a.setOrder - b.setOrder);

              return (
                <div key={exercise.id} className="space-y-2">
                  <p className="text-sm font-medium">
                    {getName(exercise.exerciseId, exercise.exercise?.name ?? t.workout.unknownExercise)}
                  </p>
                  <label className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>{t.workout.excludeFromStats}</span>
                    <Switch
                      size="sm"
                      checked={Boolean(exercise.excludeFromStats)}
                      onCheckedChange={(checked) =>
                        updateExercise(exercise.id, {
                          excludeFromStats: Boolean(checked),
                        })
                      }
                    />
                  </label>
                  <Textarea
                    value={exercise.notes ?? ""}
                    onChange={(event) =>
                      updateExercise(exercise.id, {
                        notes: event.target.value,
                      })
                    }
                    placeholder={t.workout.exerciseNotePlaceholder}
                    rows={2}
                    aria-label={`${getName(exercise.exerciseId)} ${t.workout.exerciseNote}`}
                    className="min-h-16 text-sm"
                  />
                  <div className="space-y-2">
                    {completedSets.map((set, index) => (
                      <div
                        key={set.id}
                        className="grid grid-cols-[2rem_1fr_1fr] items-center gap-2"
                      >
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {index + 1}
                        </span>
                        <Input
                          type="text"
                          inputMode="decimal"
                          aria-label={t.workout.setWeightLabel(
                            getName(exercise.exerciseId),
                            index + 1
                          )}
                          value={weightTexts[set.id] ?? formatDecimalForInput(set.weight)}
                          onChange={(e) => {
                            const text = e.target.value;
                            if (!isPartialDecimalInput(text)) return;
                            setWeightTexts((prev) => ({
                              ...prev,
                              [set.id]: text,
                            }));
                            updateSet(exercise.id, set.id, { weight: parseLocalizedDecimal(text) });
                          }}
                          onBlur={() => {
                            setWeightTexts((prev) => ({
                              ...prev,
                              [set.id]: formatDecimalForInput(set.weight),
                            }));
                          }}
                          className="h-9"
                        />
                        <Input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          aria-label={t.workout.setRepsLabel(
                            getName(exercise.exerciseId),
                            index + 1
                          )}
                          value={set.reps || ""}
                          onChange={(e) => {
                            const reps = parseInt(e.target.value, 10);
                            updateSet(exercise.id, set.id, {
                              reps: Math.max(0, reps || 0),
                            });
                          }}
                          className="h-9"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>

        {saveFailed && <p role="alert" className="px-4 text-sm text-destructive">{t.common.saveFailed}</p>}
        <SheetFooter className="flex-row gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            {t.workout.cancel}
          </Button>
          <Button className="flex-1" onClick={() => void handleSave()} disabled={saving}>
            {saving ? t.workout.saving : t.workout.saveChanges}
          </Button>
        </SheetFooter>
    </>
  );
}

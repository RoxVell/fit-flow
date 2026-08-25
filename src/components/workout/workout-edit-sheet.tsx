"use client";

import { useEffect, useState } from "react";
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
  parseLocalizedDecimal,
} from "@/lib/utils/decimal-input";

interface WorkoutEditSheetProps {
  log: WorkoutLogEntity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

function cloneExercises(exercises: LoggedExercise[]): LoggedExercise[] {
  return exercises.map((ex) => ({
    ...ex,
    sets: ex.sets.map((s) => ({ ...s })),
  }));
}

export function WorkoutEditSheet({
  log,
  open,
  onOpenChange,
  onSaved,
}: WorkoutEditSheetProps) {
  const t = useT();
  const { exerciseMap, getName } = useExerciseLookup();
  const [exercises, setExercises] = useState<LoggedExercise[]>([]);
  const [saving, setSaving] = useState(false);
  const [weightTexts, setWeightTexts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!log || !open) return;
    const cloned = cloneExercises(log.exercises);
    setExercises(cloned);
    const texts: Record<string, string> = {};
    for (const ex of cloned) {
      for (const set of ex.sets) {
        if (set.completed) {
          texts[set.id] = formatDecimalForInput(set.weight);
        }
      }
    }
    setWeightTexts(texts);
  }, [log, open]);

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
    if (!log || saving) return;
    setSaving(true);
    try {
      const normalized = exercises.map((exercise) => {
        const notes = exercise.notes?.trim();
        return {
          ...exercise,
          notes: notes ? notes : undefined,
        };
      });
      await saveWorkoutEdits(log.id, normalized, exerciseMap);
      onSaved();
      onOpenChange(false);
    } catch (err) {
      console.warn("[workout-edit] save failed", err);
    } finally {
      setSaving(false);
    }
  };

  const sessionLabel =
    log?.sessionName || t.dashboard.workoutFallback;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
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
                    {getName(exercise.exerciseId, t.workout.unknownExercise)}
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
                          value={weightTexts[set.id] ?? ""}
                          onChange={(e) => {
                            const text = e.target.value;
                            setWeightTexts((prev) => ({
                              ...prev,
                              [set.id]: text,
                            }));
                            const parsed = parseLocalizedDecimal(text);
                            if (parsed !== null) {
                              updateSet(exercise.id, set.id, { weight: parsed });
                            }
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
                          aria-label={t.workout.setRepsLabel(
                            getName(exercise.exerciseId),
                            index + 1
                          )}
                          value={set.reps || ""}
                          onChange={(e) => {
                            const reps = parseInt(e.target.value, 10);
                            updateSet(exercise.id, set.id, {
                              reps: Number.isNaN(reps) ? 0 : reps,
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
      </SheetContent>
    </Sheet>
  );
}

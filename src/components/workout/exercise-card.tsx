"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Shuffle, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SetRow } from "./set-row";
import type { LoggedExercise } from "@/lib/db/types";
import { useT } from "@/lib/i18n/use-t";
import { useFormat } from "@/lib/i18n/use-format";
import { ExercisePickerDialog } from "@/components/exercises/exercise-picker-dialog";

interface ExerciseCardProps {
  exercise: LoggedExercise;
  exerciseName: string;
  muscleGroup: string;
  previousSets: ({ weight: number; reps: number } | null)[];
  isActive?: boolean;
  onAddSet: () => void;
  onRemoveSet: (index: number) => void;
  onUpdateSet: (index: number, data: any) => void;
  onCompleteSet: (index: number) => void;
  onRemove: () => void;
  onSwap: (newExerciseId: string) => void;
}

export function ExerciseCard({
  exercise,
  exerciseName,
  muscleGroup,
  previousSets,
  isActive,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
  onCompleteSet,
  onRemove,
  onSwap,
}: ExerciseCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showSwap, setShowSwap] = useState(false);
  const t = useT();
  const { muscleGroupLabel } = useFormat();

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border bg-card">
        {isActive && (
          <div className="absolute left-0 top-1 bottom-1 w-[2px] rounded-full bg-primary/80 shadow-[0_0_12px_2px] shadow-primary/25" />
        )}
        <motion.div
          drag="x"
          dragConstraints={{ left: -72, right: 0 }}
          dragElastic={0.1}
          dragSnapToOrigin
          onDragEnd={(_, info) => {
            if (info.offset.x < -50) onRemove();
          }}
          className="flex w-[calc(100%+72px)]"
        >
          <div className="w-[calc(100%-72px)] shrink-0 bg-card p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{exerciseName}</p>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {muscleGroupLabel(muscleGroup)}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setShowSwap(true)}
                  className="rounded-lg p-1.5 text-muted-foreground/50 hover:bg-muted transition-colors"
                >
                  <Shuffle className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCollapsed(!collapsed)}
                  className="rounded-lg p-1.5 text-muted-foreground/50 hover:bg-muted transition-colors"
                >
                  {collapsed ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {!collapsed && (
              <div>
                <div className="flex items-center gap-1 px-2 pt-1.5 pb-0.5 text-sm text-muted-foreground/50 font-medium">
                  <span className="w-5 shrink-0 text-center">{t.workout.set}</span>
                  <span className="w-7 shrink-0 text-center">{t.workout.setTypeCol}</span>
                  <span className="w-20 shrink-0 text-right">{t.workout.previous}</span>
                  <span className="flex-1" />
                  <span className="w-14 shrink-0 text-center">{t.workout.kg}</span>
                  <span className="w-3 shrink-0 text-center" />
                  <span className="w-10 shrink-0 text-center">{t.workout.reps}</span>
                  <span className="w-7 shrink-0 ml-1" />
                </div>
                <AnimatePresence mode="popLayout">
                  {exercise.sets.map((set, idx) => (
                    <motion.div
                      key={set.id}
                      layout
                      initial={{ opacity: 0, x: -20, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: "auto" }}
                      exit={{ opacity: 0, x: -100, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <SetRow
                        set={set}
                        setNumber={idx + 1}
                        previousSet={previousSets[idx] || null}
                        onUpdate={(data) => onUpdateSet(idx, data)}
                        onRemove={() => onRemoveSet(idx)}
                        onComplete={() => onCompleteSet(idx)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full gap-1 text-xs h-9 rounded-xl border-t border-border/80 hover:bg-accent/50 text-muted-foreground/60 hover:text-foreground"
                  onClick={onAddSet}
                >
                  <Plus className="h-3.5 w-3.5" /> {t.workout.addSet}
                </Button>
              </div>
            )}
          </div>

          <div className="w-[72px] shrink-0 flex items-center justify-center bg-destructive">
            <Trash2 className="h-5 w-5 text-destructive-foreground" />
          </div>
        </motion.div>
      </div>

      <ExercisePickerDialog
        open={showSwap}
        onOpenChange={setShowSwap}
        title={t.workout.swapExercise}
        excludeIds={new Set([exercise.exerciseId])}
        onSelect={(newId) => {
          onSwap(newId);
          setShowSwap(false);
        }}
      />
    </>
  );
}

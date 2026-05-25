"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Shuffle,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SetRow } from "./set-row";
import type { LoggedExercise } from "@/lib/db/types";
import { MUSCLE_GROUP_LABELS } from "@/lib/utils/constants";
import { useExercises } from "@/lib/hooks/use-queries";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ExerciseCardProps {
  exercise: LoggedExercise;
  exerciseName: string;
  muscleGroup: string;
  previousSets: ({ weight: number; reps: number } | null)[];
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
  onAddSet,
  onRemoveSet,
  onUpdateSet,
  onCompleteSet,
  onRemove,
  onSwap,
}: ExerciseCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showSwap, setShowSwap] = useState(false);
  const [swapSearch, setSwapSearch] = useState("");
  const { data: swapExercises } = useExercises({
    search: swapSearch || undefined,
  });

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border bg-card">
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
                    {MUSCLE_GROUP_LABELS[muscleGroup as keyof typeof MUSCLE_GROUP_LABELS] || muscleGroup}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={() => setShowSwap(true)}
                  className="rounded-lg p-1.5 text-muted-foreground/50 hover:bg-muted transition-colors"
                >
                  <Shuffle className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCollapsed(!collapsed)}
                  className="rounded-lg p-1 text-muted-foreground/50 hover:bg-muted transition-colors"
                >
                  {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {!collapsed && (
              <div>
                <div className="flex items-center gap-1 border-t border-border/80 px-2 pt-1.5 pb-0.5 text-sm text-muted-foreground/50 font-medium">
                  <span className="w-5 shrink-0 text-center">Set</span>
                  <span className="w-7 shrink-0 text-center">T</span>
                  <span className="w-20 shrink-0 text-right">Previous</span>
                  <span className="flex-1" />
                  <span className="w-14 shrink-0 text-center">Kg</span>
                  <span className="w-3 shrink-0 text-center" />
                  <span className="w-10 shrink-0 text-center">Reps</span>
                  <span className="w-7 shrink-0 ml-1" />
                </div>
                {exercise.sets.map((set, idx) => (
                  <SetRow
                    key={set.id}
                    set={set}
                    setNumber={idx + 1}
                    previousSet={previousSets[idx] || null}
                    onUpdate={(data) => onUpdateSet(idx, data)}
                    onRemove={() => onRemoveSet(idx)}
                    onComplete={() => onCompleteSet(idx)}
                  />
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full gap-1 text-xs h-9 rounded-xl border-t border-border/80 hover:bg-accent/50 text-muted-foreground/60 hover:text-foreground"
                  onClick={onAddSet}
                >
                  <Plus className="h-3.5 w-3.5" /> Add Set
                </Button>
              </div>
            )}
          </div>

          <div className="w-[72px] shrink-0 flex items-center justify-center bg-destructive">
            <Trash2 className="h-5 w-5 text-destructive-foreground" />
          </div>
        </motion.div>
      </div>

      <Dialog open={showSwap} onOpenChange={setShowSwap}>
        <DialogContent className="max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Swap Exercise</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Search exercises..."
            value={swapSearch}
            onChange={(e) => setSwapSearch(e.target.value)}
            className="mb-2"
          />
          <ScrollArea className="max-h-[50vh]">
            <div className="space-y-1">
              {swapExercises?.map((ex) => (
                <button
                  key={ex.id}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                  onClick={() => {
                    onSwap(ex.id);
                    setShowSwap(false);
                  }}
                >
                  <span className="font-medium">{ex.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {MUSCLE_GROUP_LABELS[ex.muscleGroup]}
                  </span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Shuffle,
  ChevronDown,
  ChevronUp,
  Trash2,
  EllipsisVertical,
  StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SetRow } from "./set-row";
import type { LoggedExercise, LoggedSet } from "@/lib/db/types";
import { useT } from "@/lib/i18n/use-t";
import { useFormat } from "@/lib/i18n/use-format";

interface ExerciseCardProps {
  exercise: LoggedExercise;
  index: number;
  exerciseName: string;
  muscleGroup: string;
  previousSets: ({ weight: number; reps: number } | null)[];
  isActive?: boolean;
  onAddSet: () => void;
  onRemoveSet: (index: number) => void;
  onUpdateSet: (
    index: number,
    data: Partial<LoggedSet>,
    options?: { propagateWeight?: boolean; baselineWeight?: number }
  ) => void;
  onCompleteSet: (index: number) => void;
  onRemove: () => void;
  onSwapRequest: () => void;
  onHistoryRequest: () => void;
  onUpdateExercise: (
    data: Partial<Pick<LoggedExercise, "notes" | "excludeFromStats">>
  ) => void;
}

export function ExerciseCard({
  exercise,
  index,
  exerciseName,
  muscleGroup,
  previousSets,
  isActive,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
  onCompleteSet,
  onRemove,
  onSwapRequest,
  onHistoryRequest,
  onUpdateExercise,
}: ExerciseCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState(exercise.notes ?? "");
  const t = useT();
  const { muscleGroupLabel } = useFormat();
  const noteText = exercise.notes?.trim() ?? "";
  const excluded = Boolean(exercise.excludeFromStats);

  useEffect(() => {
    if (noteOpen) setNoteDraft(exercise.notes ?? "");
  }, [exercise.notes, noteOpen]);

  const saveNote = () => {
    const trimmed = noteDraft.trim();
    onUpdateExercise({ notes: trimmed ? trimmed : undefined });
    setNoteOpen(false);
  };

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
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 flex-1 items-start gap-2">
                <span className="mt-0.5 w-5 shrink-0 text-sm font-medium tabular-nums text-muted-foreground">
                  {index}.
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onHistoryRequest}
                      className="truncate text-left text-sm font-medium underline decoration-dotted underline-offset-4 hover:text-primary transition-colors"
                    >
                      {exerciseName}
                    </button>
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {muscleGroupLabel(muscleGroup)}
                    </Badge>
                    {excluded && (
                      <Badge variant="outline" className="text-[10px] shrink-0 text-muted-foreground">
                        {t.workout.excludedFromStatsShort}
                      </Badge>
                    )}
                  </div>
                  {noteText ? (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {noteText}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    aria-label={t.workout.exerciseMenu}
                    className="rounded-lg p-1.5 text-muted-foreground/50 hover:bg-muted transition-colors"
                  >
                    <EllipsisVertical className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-52 w-auto">
                    <DropdownMenuItem
                      onClick={() => {
                        window.setTimeout(() => setNoteOpen(true), 0);
                      }}
                    >
                      <StickyNote />
                      {noteText ? t.workout.editNote : t.workout.addNote}
                    </DropdownMenuItem>
                    <DropdownMenuCheckboxItem
                      checked={excluded}
                      onCheckedChange={(checked) =>
                        onUpdateExercise({ excludeFromStats: Boolean(checked) })
                      }
                    >
                      {t.workout.excludeFromStats}
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onSwapRequest}>
                      <Shuffle />
                      {t.workout.swapExercise}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <button
                  type="button"
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
                  <span className="ml-3 w-20 shrink-0 text-right">{t.workout.previous}</span>
                  <span className="flex-1" />
                  <span className="w-14 shrink-0 text-center">{t.workout.kg}</span>
                  <span className="w-3 shrink-0 text-center" />
                  <span className="w-10 shrink-0 text-center">{t.workout.reps}</span>
                  <span className="w-7 shrink-0 ml-[15px]" />
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
                        exerciseName={exerciseName}
                        previousSet={previousSets[idx] || null}
                        onUpdate={(data, options) => onUpdateSet(idx, data, options)}
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

      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.workout.exerciseNote}</DialogTitle>
            <DialogDescription>{exerciseName}</DialogDescription>
          </DialogHeader>
          <Textarea
            value={noteDraft}
            onChange={(event) => setNoteDraft(event.target.value)}
            placeholder={t.workout.exerciseNotePlaceholder}
            rows={4}
            aria-label={t.workout.exerciseNote}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteOpen(false)}>
              {t.workout.cancel}
            </Button>
            <Button onClick={saveNote}>{t.workout.saveNote}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

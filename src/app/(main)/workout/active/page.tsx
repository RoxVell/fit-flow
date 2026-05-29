"use client";

import { Suspense, use, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Timer,
  CheckCircle2,
  Play,
  Pause,
  StopCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkoutStore } from "@/lib/store/workout-store";
import { useExercises, useWorkoutLogs, useActiveProgram } from "@/lib/hooks/use-queries";
import { ExerciseCard } from "@/components/workout/exercise-card";
import { RestTimer } from "@/components/workout/rest-timer";
import { TriumphScreen } from "@/components/workout/triumph-screen";
import { calculateVolume, formatDuration } from "@/lib/utils/calculations";
import type { PersonalRecord } from "@/lib/db/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MUSCLE_GROUP_LABELS } from "@/lib/utils/constants";

function ActiveWorkoutContent({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { session: sessionId } = use(searchParams);
  const router = useRouter();
  const store = useWorkoutStore();
  const { data: allExercises } = useExercises();
  const { data: program, isLoading: programLoading } = useActiveProgram();
  const [elapsed, setElapsed] = useState(0);
  const [showTriumph, setShowTriumph] = useState(false);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [lastActiveExerciseId, setLastActiveExerciseId] = useState<string | null>(null);
  const [newRecords, setNewRecords] = useState<PersonalRecord[]>([]);

  // Timer effect
  useEffect(() => {
    if (!store.startedAt || isPaused) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(store.startedAt!).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [store.startedAt, isPaused]);

  // Start workout from session
  useEffect(() => {
    if (store.activeWorkoutId) return;
    if (!sessionId) {
      router.replace("/workout");
      return;
    }
    if (programLoading || !program) return;

    const session = program.sessions.find((s) => s.id === sessionId);
    if (!session) {
      router.replace("/workout");
      return;
    }

    const exercises = session.exercises
      .filter((se) => se.exercise)
      .map((se) => ({
        exerciseId: se.exerciseId,
        sets: se.targetSets,
      }));

    store.startWorkout(sessionId, exercises);
  }, [sessionId, program, programLoading, store.activeWorkoutId]);

  const exerciseMap = new Map(allExercises?.map((e) => [e.id, e]));
  const { data: workoutLogs } = useWorkoutLogs(10);

  const totalVolume = calculateVolume(
    store.exercises.flatMap((e) => e.sets.filter((s) => s.completed))
  );
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  const hasNoData = !store.exercises.some((ex) =>
    ex.sets.some((s) => s.weight > 0)
  );
  const hasEmptyComplete = store.exercises.some((ex) =>
    ex.sets.some((s) => s.completed && s.weight === 0)
  );
  const disableFinish = hasNoData || hasEmptyComplete;

  const incompleteExists = store.exercises.some((ex) =>
    ex.sets.some((s) => !s.completed)
  );

  const lastEx = lastActiveExerciseId
    ? store.exercises.find(e => e.id === lastActiveExerciseId)
    : null;

  const activeExerciseId = lastEx && lastEx.sets.some(s => !s.completed)
    ? lastEx.id
    : (store.exercises.find((ex) =>
        ex.sets.some((s) => !s.completed)
      )?.id || store.exercises[store.exercises.length - 1]?.id);

  const previousSetsMap = useMemo(() => {
    const map = new Map<string, ({ weight: number; reps: number } | null)[]>();
    if (!workoutLogs) return map;
    for (const ex of store.exercises) {
      for (const log of workoutLogs) {
        const loggedEx = log.exercises.find((e) => e.exerciseId === ex.exerciseId);
        if (loggedEx) {
          const completed = [...loggedEx.sets].sort((a, b) => a.setOrder - b.setOrder);
          map.set(ex.id, completed.map((s) => ({ weight: s.weight, reps: s.reps })));
          break;
        }
      }
    }
    return map;
  }, [workoutLogs, store.exercises]);

  const finishWorkout = () => {
    store.finishWorkout();
    const records: PersonalRecord[] = [];
    for (const ex of store.exercises) {
      const exercise = exerciseMap.get(ex.exerciseId);
      if (!exercise) continue;
      const completed = ex.sets.filter((s) => s.completed);
      if (completed.length === 0) continue;
      const maxWeight = Math.max(...completed.map((s) => s.weight));
      const vol = completed.reduce((sum, s) => sum + s.weight * s.reps, 0);
      if (maxWeight > 0) {
        records.push({
          id: `pr-${ex.id}-w`,
          exerciseId: ex.exerciseId,
          exerciseName: exercise.name,
          type: "weight",
          value: maxWeight,
          date: new Date().toISOString(),
        });
      }
      if (vol > 0) {
        records.push({
          id: `pr-${ex.id}-v`,
          exerciseId: ex.exerciseId,
          exerciseName: exercise.name,
          type: "volume",
          value: vol,
          date: new Date().toISOString(),
        });
      }
    }
    setNewRecords(records);
    setShowTriumph(true);
  };

  const handleFinish = () => {
    if (incompleteExists) {
      setShowConfirmFinish(true);
      return;
    }
    finishWorkout();
  };

  const confirmFinish = () => {
    setShowConfirmFinish(false);
    finishWorkout();
  };

  const handleCloseTriumph = () => {
    store.reset();
    router.push("/dashboard");
  };

  if (!store.activeWorkoutId) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <p className="text-muted-foreground">Starting workout...</p>
      </div>
    );
  }

  const addableExercises = allExercises?.filter(
    (e) => !store.exercises.some((se) => se.exerciseId === e.id)
  );

  return (
    <>
      {/* Fixed header */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-muted-foreground" />
            <span className="text-lg font-bold tabular-nums">
              {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
            </span>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="rounded-full p-1 text-muted-foreground hover:bg-muted"
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              <span className="tabular-nums text-foreground">
                {store.exercises.reduce(
                  (sum, e) => sum + e.sets.filter((s) => s.completed).length,
                  0
                )}
              </span>
              <span className="text-muted-foreground/60">/</span>
              <span className="tabular-nums text-foreground">{store.exercises.reduce((sum, e) => sum + e.sets.length, 0)}</span>
              {/*<span>sets</span>*/}
              <span className="text-muted-foreground/60">·</span>
              <span className="tabular-nums">{totalVolume.toLocaleString()}</span>
              <span>kg</span>
            </div>
            <Button
              variant="default"
              size="sm"
              className="gap-1"
              onClick={handleFinish}
              disabled={disableFinish}
            >
              <StopCircle className="h-4 w-4" />
              Finish
            </Button>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="pt-[calc(env(safe-area-inset-top)+4rem)] pb-20 px-4">
        <AnimatePresence>
          {store.exercises.map((ex) => {
            const exercise = exerciseMap.get(ex.exerciseId);
            return (
              <motion.div
                key={ex.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mb-3 overflow-hidden"
              >
                <ExerciseCard
                  exercise={ex}
                  exerciseName={exercise?.name || "Unknown"}
                  muscleGroup={exercise?.muscleGroup || "chest"}
                  previousSets={previousSetsMap.get(ex.id) || []}
                  isActive={ex.id === activeExerciseId}
                  onAddSet={() => store.addSet(ex.id)}
                  onRemoveSet={(idx) => store.removeSet(ex.id, idx)}
                  onUpdateSet={(idx, data) => store.updateSet(ex.id, idx, data)}
                  onCompleteSet={(idx) => {
                    store.markSetCompleted(ex.id, idx);
                    setLastActiveExerciseId(ex.id);
                  }}
                  onRemove={() => store.removeExercise(ex.id)}
                  onSwap={(newId) => store.swapExercise(ex.id, newId)}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Add exercise button */}
        <Dialog open={showAddExercise} onOpenChange={setShowAddExercise}>
          <Button
            variant="outline"
            className="w-full gap-2 border-dashed"
            onClick={() => setShowAddExercise(true)}
          >
            <Plus className="h-4 w-4" />
            Add Exercise
          </Button>
          <DialogContent className="max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Add Exercise</DialogTitle>
            </DialogHeader>
            <Input
              placeholder="Search exercises..."
              value={addSearch}
              onChange={(e) => setAddSearch(e.target.value)}
              className="mb-2"
            />
            <ScrollArea className="max-h-[50vh]">
              <div className="space-y-1">
                {(addSearch
                  ? allExercises?.filter(
                      (e) =>
                        e.name.toLowerCase().includes(addSearch.toLowerCase()) ||
                        e.muscleGroup.includes(addSearch.toLowerCase())
                    )
                  : addableExercises
                )?.map((ex) => (
                  <button
                    key={ex.id}
                    className="w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-muted transition-colors flex items-center justify-between"
                    onClick={() => {
                      store.addExercise(ex.id);
                      setShowAddExercise(false);
                      setAddSearch("");
                    }}
                  >
                    <div>
                      <span className="font-medium">{ex.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {MUSCLE_GROUP_LABELS[ex.muscleGroup]}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      Add
                    </Badge>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rest Timer */}
      <AnimatePresence>
        <RestTimer
          endTime={store.restTimer.endTime}
          isRunning={store.restTimer.isRunning}
          onStop={store.stopRestTimer}
        />
      </AnimatePresence>

      {/* Confirm finish dialog */}
      {showConfirmFinish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-xs rounded-xl bg-popover p-4 shadow-lg">
            <h3 className="text-lg font-medium mb-2">Incomplete Sets</h3>
            <p className="text-base text-muted-foreground mb-5">
              You have sets with weight entered but not marked as complete. Finish anyway?
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowConfirmFinish(false)}>
                Cancel
              </Button>
              <Button onClick={confirmFinish}>
                Finish Anyway
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Triumph screen */}
      <AnimatePresence>
        {showTriumph && (
          <TriumphScreen
            records={newRecords}
            volume={totalVolume}
            duration={formatDuration(minutes)}
            onClose={handleCloseTriumph}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default function ActiveWorkoutPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full p-4">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    }>
      <ActiveWorkoutContent searchParams={searchParams} />
    </Suspense>
  );
}

"use client";

import { useEffect, useState } from "react";
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
import { useExercises } from "@/lib/hooks/use-queries";
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

export default function ActiveWorkoutPage() {
  const router = useRouter();
  const store = useWorkoutStore();
  const { data: allExercises } = useExercises();
  const [elapsed, setElapsed] = useState(0);
  const [showTriumph, setShowTriumph] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [isPaused, setIsPaused] = useState(false);

  // Timer effect
  useEffect(() => {
    if (!store.startedAt || isPaused) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(store.startedAt!).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [store.startedAt, isPaused]);

  // Auto-start workout with 6 default exercises × 3 sets
  useEffect(() => {
    if (!store.activeWorkoutId) {
      store.startWorkout(undefined, [
        { exerciseId: "ex1", sets: 3 },
        { exerciseId: "ex12", sets: 3 },
        { exerciseId: "ex6", sets: 3 },
        { exerciseId: "ex19", sets: 3 },
        { exerciseId: "ex22", sets: 3 },
        { exerciseId: "ex29", sets: 3 },
      ]);
    }
  }, []);

  const exerciseMap = new Map(allExercises?.map((e) => [e.id, e]));

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

  // PR detection
  const [newRecords, setNewRecords] = useState<PersonalRecord[]>([]);

  const handleFinish = () => {
    store.finishWorkout();
    const records: PersonalRecord[] = [];
    for (const ex of store.exercises) {
      const exercise = exerciseMap.get(ex.exerciseId);
      if (!exercise) continue;
      const completed = ex.sets.filter((s) => s.completed);
      if (completed.length === 0) continue;
      const maxWeight = Math.max(...completed.map((s) => s.weight));
      const vol = calculateVolume(completed);
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
      <div className="fixed top-0 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg bg-background/95 backdrop-blur-sm border-b px-4 py-3">
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
            <span className="text-sm text-muted-foreground">
              {store.exercises.length} exercises
            </span>
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
        <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{
              width: `${
                store.exercises.length > 0
                  ? (store.exercises.filter((e) =>
                      e.sets.every((s) => s.completed)
                    ).length /
                      store.exercises.length) *
                    100
                  : 0
              }%`,
            }}
          />
        </div>
      </div>

      {/* Fixed bottom bar */}
      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg bg-background/95 backdrop-blur-sm border-t px-4 py-2">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>
              {store.exercises.reduce(
                (sum, e) => sum + e.sets.filter((s) => s.completed).length,
                0
              )}{" "}
              sets completed
            </span>
            <span className="text-muted-foreground">
              · {totalVolume.toLocaleString()} kg
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="pt-20 pb-20 px-4">
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
                  onAddSet={() => store.addSet(ex.id)}
                  onRemoveSet={(idx) => store.removeSet(ex.id, idx)}
                  onUpdateSet={(idx, data) => store.updateSet(ex.id, idx, data)}
                  onCompleteSet={(idx) => store.markSetCompleted(ex.id, idx)}
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

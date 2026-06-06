"use client";

import { Suspense, use, useState } from "react";
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
import { useActiveWorkout } from "@/lib/hooks/use-active-workout";
import { useExerciseLookup } from "@/lib/hooks/use-exercise-lookup";
import { useT } from "@/lib/i18n/use-t";
import { ExerciseCard } from "@/components/workout/exercise-card";
import { ExercisePickerDialog } from "@/components/exercises/exercise-picker-dialog";
import { RestTimer } from "@/components/workout/rest-timer";
import { TriumphScreen } from "@/components/workout/triumph-screen";
import { formatDuration } from "@/lib/utils/calculations";

function ActiveWorkoutContent({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { session: sessionId } = use(searchParams);
  const restStore = useWorkoutStore();
  const t = useT();
  const { getName } = useExerciseLookup();
  const {
    exerciseMap,
    previousSetsMap,
    activeExerciseId,
    activeWorkoutId,
    exercises,
    minutes,
    seconds,
    isPaused,
    togglePause,
    completedSetsCount,
    totalSetsCount,
    totalVolume,
    handleFinish,
    confirmFinish,
    showConfirmFinish,
    setShowConfirmFinish,
    abandonWorkout,
    showTriumph,
    isAbandoning,
    newRecords,
    triumphData,
    handleCloseTriumph,
    toggleSetCompleted,
    addExercise,
    removeExercise,
    addSet,
    removeSet,
    updateSet,
    swapExercise,
  } = useActiveWorkout(sessionId);

  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);

  if (isAbandoning) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <p className="text-muted-foreground">{t.workout.starting}</p>
      </div>
    );
  }

  if (!activeWorkoutId && !showTriumph) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <p className="text-muted-foreground">{t.workout.starting}</p>
      </div>
    );
  }

  const excludedExerciseIds = new Set(exercises.map((ex) => ex.exerciseId));

  return (
    <>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-muted-foreground" />
            <span className="text-lg font-bold tabular-nums">
              {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
            </span>
            <button
              onClick={togglePause}
              className="rounded-full p-1 text-muted-foreground hover:bg-muted"
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              <span className="tabular-nums text-foreground">{completedSetsCount}</span>
              <span className="text-muted-foreground/60">/</span>
              <span className="tabular-nums text-foreground">{totalSetsCount}</span>
              <span className="text-muted-foreground/60">·</span>
              <span className="tabular-nums">{totalVolume.toLocaleString()}</span>
              <span>{t.dashboard.kg}</span>
            </div>
            <Button variant="default" size="sm" className="gap-1" onClick={handleFinish}>
              <StopCircle className="h-4 w-4" />
              {t.workout.finish}
            </Button>
          </div>
        </div>
      </div>

      <div className="pt-[calc(env(safe-area-inset-top)+4rem)] pb-20 px-4">
        <AnimatePresence>
          {exercises.map((ex) => {
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
                  exerciseName={exercise?.name || getName(ex.exerciseId, t.workout.unknownExercise)}
                  muscleGroup={exercise?.muscleGroup || "chest"}
                  previousSets={previousSetsMap.get(ex.id) || []}
                  isActive={ex.id === activeExerciseId}
                  onAddSet={() => addSet(ex.id)}
                  onRemoveSet={(idx) => removeSet(ex.id, idx)}
                  onUpdateSet={(idx, data) => updateSet(ex.id, idx, data)}
                  onCompleteSet={(idx) => toggleSetCompleted(ex.id, idx)}
                  onRemove={() => removeExercise(ex.id)}
                  onSwap={(newId) => swapExercise(ex.id, newId)}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>

        <Button
          variant="outline"
          className="w-full gap-2 border-dashed"
          onClick={() => setShowAddExercise(true)}
        >
          <Plus className="h-4 w-4" />
          {t.workout.addExercise}
        </Button>

        <ExercisePickerDialog
          open={showAddExercise}
          onOpenChange={setShowAddExercise}
          title={t.workout.addExercise}
          excludeIds={excludedExerciseIds}
          onSelect={addExercise}
        />
      </div>

      <AnimatePresence>
        <RestTimer
          endTime={restStore.restTimer.endTime}
          isRunning={restStore.restTimer.isRunning}
          onStop={restStore.stopRestTimer}
        />
      </AnimatePresence>

      {showConfirmFinish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl bg-popover p-4 shadow-lg">
            <h3 className="text-lg font-medium mb-2">
              {completedSetsCount === 0
                ? t.workout.noCompletedSets
                : t.workout.incompleteSets}
            </h3>
            <p className="text-base text-muted-foreground mb-3">
              {completedSetsCount === 0
                ? t.workout.noCompletedSetsDesc
                : t.workout.incompleteSetsDesc(completedSetsCount, totalSetsCount)}
            </p>
            <div className="w-full bg-muted rounded-full h-1.5 mb-5">
              <div
                className="bg-primary h-1.5 rounded-full transition-all"
                style={{
                  width: `${totalSetsCount > 0 ? (completedSetsCount / totalSetsCount) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="destructive"
                onClick={() => {
                  setShowConfirmFinish(false);
                  setShowAbandonConfirm(true);
                }}
              >
                {t.workout.discard}
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowConfirmFinish(false)}>
                  {t.workout.cancel}
                </Button>
                {completedSetsCount > 0 && (
                  <Button onClick={confirmFinish}>{t.workout.finishAnyway}</Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showAbandonConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-xs rounded-xl bg-popover p-4 shadow-lg">
            <h3 className="text-lg font-medium mb-2">{t.workout.abandonTitle}</h3>
            <p className="text-base text-muted-foreground mb-5">
              {t.workout.abandonDesc}
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowAbandonConfirm(false)}>
                {t.workout.cancel}
              </Button>
              <Button
                variant="destructive"
                onClick={() => void abandonWorkout()}
              >
                {t.workout.abandon}
              </Button>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showTriumph && (
          <TriumphScreen
            records={newRecords}
            volume={triumphData?.volume ?? 0}
            duration={
              triumphData
                ? formatDuration(triumphData.minutes)
                : formatDuration(minutes)
            }
            onClose={handleCloseTriumph}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function ActiveWorkoutLoading() {
  const t = useT();
  return (
    <div className="flex items-center justify-center h-full p-4">
      <p className="text-muted-foreground">{t.common.loading}</p>
    </div>
  );
}

export default function ActiveWorkoutPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  return (
    <Suspense fallback={<ActiveWorkoutLoading />}>
      <ActiveWorkoutContent searchParams={searchParams} />
    </Suspense>
  );
}

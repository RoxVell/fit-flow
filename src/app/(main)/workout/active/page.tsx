"use client";

import { Suspense, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
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
import { ExerciseHistorySheet } from "@/components/workout/exercise-history-sheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDuration, formatElapsedClock } from "@/lib/utils/calculations";

function CenteredMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center h-full p-4">
      <p className="text-muted-foreground">{children}</p>
    </div>
  );
}

function ActiveWorkoutContent() {
  const sessionId = useSearchParams().get("session") ?? undefined;
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
    updateExercise,
  } = useActiveWorkout(sessionId);

  const [showAddExercise, setShowAddExercise] = useState(false);
  const [swapTargetLoggedExerciseId, setSwapTargetLoggedExerciseId] = useState<
    string | null
  >(null);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const [historyExercise, setHistoryExercise] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const swapTargetExerciseId = useMemo(() => {
    if (!swapTargetLoggedExerciseId) return null;
    return (
      exercises.find((ex) => ex.id === swapTargetLoggedExerciseId)?.exerciseId ??
      null
    );
  }, [exercises, swapTargetLoggedExerciseId]);

  if (isAbandoning) {
    return <CenteredMessage>{t.workout.starting}</CenteredMessage>;
  }

  if (showTriumph) {
    return (
      <AnimatePresence>
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
      </AnimatePresence>
    );
  }

  if (!activeWorkoutId) {
    return <CenteredMessage>{t.workout.starting}</CenteredMessage>;
  }

  const excludedExerciseIds = new Set(exercises.map((ex) => ex.exerciseId));

  const handleSwapDialogOpenChange = (open: boolean) => {
    if (!open) setSwapTargetLoggedExerciseId(null);
  };

  return (
    <>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-muted-foreground" />
            <span className="text-lg font-bold tabular-nums">
              {formatElapsedClock(minutes, seconds)}
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
          {exercises.map((ex, index) => {
            const exercise = exerciseMap.get(ex.exerciseId);
            const exerciseName =
              exercise?.name || getName(ex.exerciseId, t.workout.unknownExercise);
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
                  index={index + 1}
                  exerciseName={exerciseName}
                  muscleGroup={exercise?.muscleGroup || "chest"}
                  previousSets={previousSetsMap.get(ex.id) || []}
                  isActive={ex.id === activeExerciseId}
                  onAddSet={() => addSet(ex.id)}
                  onRemoveSet={(idx) => removeSet(ex.id, idx)}
                  onUpdateSet={(idx, data, options) => updateSet(ex.id, idx, data, options)}
                  onCompleteSet={(idx) => toggleSetCompleted(ex.id, idx)}
                  onRemove={() => removeExercise(ex.id)}
                  onSwapRequest={() => setSwapTargetLoggedExerciseId(ex.id)}
                  onHistoryRequest={() =>
                    setHistoryExercise({ id: ex.exerciseId, name: exerciseName })
                  }
                  onUpdateExercise={(data) => updateExercise(ex.id, data)}
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

        {showAddExercise ? (
          <ExercisePickerDialog
            open={showAddExercise}
            onOpenChange={setShowAddExercise}
            title={t.workout.addExercise}
            excludeIds={excludedExerciseIds}
            onSelect={addExercise}
          />
        ) : null}

        {swapTargetLoggedExerciseId && swapTargetExerciseId ? (
          <ExercisePickerDialog
            open={swapTargetLoggedExerciseId != null}
            onOpenChange={handleSwapDialogOpenChange}
            title={t.workout.swapExercise}
            excludeIds={new Set([swapTargetExerciseId])}
            onSelect={(newId) => {
              swapExercise(swapTargetLoggedExerciseId, newId);
              setSwapTargetLoggedExerciseId(null);
            }}
          />
        ) : null}

        <ExerciseHistorySheet
          exerciseId={historyExercise?.id ?? null}
          exerciseName={historyExercise?.name ?? ""}
          open={historyExercise != null}
          onOpenChange={(open) => {
            if (!open) setHistoryExercise(null);
          }}
        />
      </div>

      <AnimatePresence>
        <RestTimer
          endTime={restStore.restTimer.endTime}
          duration={restStore.restTimer.duration}
          isRunning={restStore.restTimer.isRunning}
          onStop={restStore.stopRestTimer}
        />
      </AnimatePresence>

      {showConfirmFinish && (
        <ConfirmDialog
          open={showConfirmFinish}
          onOpenChange={setShowConfirmFinish}
          title={
            completedSetsCount === 0
              ? t.workout.noCompletedSets
              : t.workout.incompleteSets
          }
          description={
            completedSetsCount === 0
              ? t.workout.noCompletedSetsDesc
              : t.workout.incompleteSetsDesc(completedSetsCount, totalSetsCount)
          }
          confirmLabel={t.workout.discard}
          cancelLabel={t.workout.cancel}
          destructive
          onConfirm={() => {
            setShowConfirmFinish(false);
            setShowAbandonConfirm(true);
          }}
          extraButtons={
            completedSetsCount > 0 ? (
              <Button onClick={confirmFinish}>{t.workout.finishAnyway}</Button>
            ) : undefined
          }
        >
          <div className="w-full bg-muted rounded-full h-1.5">
            <div
              className="bg-primary h-1.5 rounded-full transition-all"
              style={{
                width: `${totalSetsCount > 0 ? (completedSetsCount / totalSetsCount) * 100 : 0}%`,
              }}
            />
          </div>
        </ConfirmDialog>
      )}

      {showAbandonConfirm && (
        <ConfirmDialog
          open={showAbandonConfirm}
          onOpenChange={setShowAbandonConfirm}
          title={t.workout.abandonTitle}
          description={t.workout.abandonDesc}
          confirmLabel={t.workout.abandon}
          cancelLabel={t.workout.cancel}
          destructive
          onConfirm={() => void abandonWorkout()}
        />
      )}
    </>
  );
}

function ActiveWorkoutLoading() {
  const t = useT();
  return <CenteredMessage>{t.common.loading}</CenteredMessage>;
}

// useSearchParams (instead of the searchParams prop) keeps the page static.
export default function ActiveWorkoutPage() {
  return (
    <Suspense fallback={<ActiveWorkoutLoading />}>
      <ActiveWorkoutContent />
    </Suspense>
  );
}

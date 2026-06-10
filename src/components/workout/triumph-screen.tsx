"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PersonalRecord } from "@/lib/db/types";
import { useT } from "@/lib/i18n/use-t";
import { useExerciseLookup } from "@/lib/hooks/use-exercise-lookup";

interface TriumphScreenProps {
  records: PersonalRecord[];
  volume: number;
  duration: string;
  onClose: () => void;
}

function groupRecordsByExercise(records: PersonalRecord[]) {
  const groups = new Map<
    string,
    { exerciseId: string; exerciseName: string; records: PersonalRecord[] }
  >();

  for (const pr of records) {
    const existing = groups.get(pr.exerciseId);
    if (existing) {
      existing.records.push(pr);
    } else {
      groups.set(pr.exerciseId, {
        exerciseId: pr.exerciseId,
        exerciseName: pr.exerciseName,
        records: [pr],
      });
    }
  }

  return Array.from(groups.values());
}

function formatPrValue(pr: PersonalRecord): string {
  if (pr.type === "estimated_1rm") {
    return pr.value.toFixed(1);
  }
  return Number.isInteger(pr.value) ? String(pr.value) : pr.value.toFixed(1);
}

export function TriumphScreen({ records, volume, duration, onClose }: TriumphScreenProps) {
  const t = useT();
  const { getName } = useExerciseLookup();

  const prLabels: Record<string, string> = {
    weight: t.dashboard.prMaxWeight,
    volume: t.dashboard.prVolume,
    estimated_1rm: t.dashboard.prE1rm,
  };

  const groupedRecords = useMemo(() => groupRecordsByExercise(records), [records]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed top-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] left-1/2 z-50 flex w-full max-w-lg -translate-x-1/2 flex-col bg-black/30 dark:bg-black/50 backdrop-blur-lg"
    >
      <div className="grid min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
        <div className="m-auto flex w-full max-w-xs flex-col items-center gap-4 px-6 py-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="shrink-0"
          >
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
              <Trophy className="h-12 w-12 text-primary" />
            </div>
          </motion.div>

          <div className="w-full shrink-0 text-center">
            <h2 className="text-2xl font-bold">{t.workout.triumphTitle}</h2>
            <p className="mt-1 text-sm text-foreground">
              {t.workout.triumphStats(
                duration,
                volume.toLocaleString(),
                t.dashboard.kg
              )}
            </p>
          </div>

          {groupedRecords.length > 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="w-full space-y-2"
            >
              <p className="flex items-center justify-center gap-1 text-center text-sm font-semibold text-primary">
                <TrendingUp className="h-4 w-4" />
                {t.workout.triumphNewPRs}
              </p>
              <div className="space-y-2">
                {groupedRecords.map((group, i) => (
                  <motion.div
                    key={group.exerciseId}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                    className="rounded-xl border bg-card p-3 text-left"
                  >
                    <div className="mb-2 flex min-w-0 items-center gap-2">
                      <Dumbbell className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate text-sm font-medium">
                        {getName(group.exerciseId, group.exerciseName)}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {group.records.map((pr) => (
                        <div
                          key={pr.id}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <span className="text-muted-foreground">
                            {prLabels[pr.type] ?? pr.type}
                          </span>
                          <span className="shrink-0 font-bold text-primary tabular-nums">
                            {formatPrValue(pr)} {t.dashboard.kg}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          <Button onClick={onClose} className="mt-2 w-full shrink-0">
            {t.workout.triumphDone}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

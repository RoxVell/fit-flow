"use client";

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

export function TriumphScreen({ records, volume, duration, onClose }: TriumphScreenProps) {
  const t = useT();
  const { getName } = useExerciseLookup();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/50 backdrop-blur-lg"
    >
      <div className="relative flex w-full max-w-sm flex-col items-center gap-6 px-6">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
            <Trophy className="h-12 w-12 text-primary" />
          </div>
        </motion.div>

        <div className="w-full text-center">
          <h2 className="text-2xl font-bold">{t.workout.triumphTitle}</h2>
          <p className="mt-1 text-sm text-foreground">
            {t.workout.triumphStats(
              duration,
              volume.toLocaleString(),
              t.dashboard.kg
            )}
          </p>
        </div>

        {records.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full space-y-2"
          >
            <p className="text-center text-sm font-semibold text-primary flex items-center justify-center gap-1">
              <TrendingUp className="h-4 w-4" />
              {t.workout.triumphNewPRs}
            </p>
            {records.map((pr, i) => (
              <motion.div
                key={pr.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex w-full items-center justify-between gap-3 rounded-xl border bg-card p-3 text-left"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <Dumbbell className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-left text-sm font-medium">
                    {getName(pr.exerciseId, pr.exerciseName)}
                  </span>
                </div>
                <span className="shrink-0 text-sm font-bold text-primary">
                  {pr.value}{" "}
                  {pr.type === "volume" ? t.workout.triumphVol : t.dashboard.kg}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}

        <Button onClick={onClose} className="mt-2 w-full max-w-xs">
          {t.workout.triumphDone}
        </Button>
      </div>
    </motion.div>
  );
}

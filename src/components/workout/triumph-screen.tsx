"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Trophy, TrendingUp, Dumbbell, Clock, Weight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PersonalRecord } from "@/lib/db/types";
import { useT } from "@/lib/i18n/use-t";
import { useExerciseLookup } from "@/lib/hooks/use-exercise-lookup";
import { getPrTypeLabels } from "@/lib/workout/pr-labels";

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

// Decorative confetti particles. Purely visual — no physics, deterministic.
const CONFETTI = [
  { x: 12, delay: 0.1, color: "var(--chart-1)", size: 8, shape: "square" },
  { x: 25, delay: 0.35, color: "var(--chart-2)", size: 6, shape: "circle" },
  { x: 38, delay: 0.2, color: "var(--chart-3)", size: 10, shape: "square" },
  { x: 50, delay: 0.5, color: "var(--chart-4)", size: 7, shape: "circle" },
  { x: 62, delay: 0.25, color: "var(--chart-1)", size: 9, shape: "square" },
  { x: 75, delay: 0.4, color: "var(--chart-5)", size: 6, shape: "circle" },
  { x: 88, delay: 0.15, color: "var(--chart-2)", size: 8, shape: "square" },
  { x: 20, delay: 0.6, color: "var(--chart-3)", size: 5, shape: "circle" },
  { x: 80, delay: 0.55, color: "var(--chart-4)", size: 7, shape: "square" },
  { x: 45, delay: 0.7, color: "var(--chart-5)", size: 6, shape: "circle" },
];

export function TriumphScreen({ records, volume, duration, onClose }: TriumphScreenProps) {
  const t = useT();
  const { getName } = useExerciseLookup();
  const reduceMotion = useReducedMotion();
  const closedRef = useRef(false);

  const prLabels = getPrTypeLabels(t);

  const groupedRecords = useMemo(() => groupRecordsByExercise(records), [records]);
  const hasRecords = groupedRecords.length > 0;

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClose = () => {
    if (closedRef.current) return;
    closedRef.current = true;
    onClose();
  };

  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col bg-gradient-to-b from-primary/15 via-background/95 to-background backdrop-blur-lg"
    >
      <div className="relative mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col">
      {/* Confetti layer */}
      {!reduceMotion && hasRecords && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {CONFETTI.map((c, i) => (
            <motion.div
              key={i}
              initial={{ y: -40, opacity: 0, rotate: 0 }}
              animate={{ y: "110%", opacity: [0, 1, 1, 0], rotate: 360 }}
              transition={{
                duration: 2.4,
                delay: c.delay,
                repeat: Infinity,
                repeatDelay: 1.5,
                ease: "easeIn",
              }}
              style={{
                left: `${c.x}%`,
                backgroundColor: c.color,
                width: c.size,
                height: c.size,
                borderRadius: c.shape === "circle" ? "9999px" : "2px",
              }}
              className="absolute top-0"
            />
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-4">
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6">
          {/* Trophy with glow */}
          <div className="relative shrink-0">
            {/* Glow halo */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute inset-0 -z-10 rounded-full bg-primary/30 blur-2xl"
            />
            <motion.div
              initial={reduceMotion ? false : { scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 14 }}
              className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-b from-primary/20 to-primary/5 ring-1 ring-primary/20"
            >
              <Trophy className="h-14 w-14 text-primary drop-shadow-sm" strokeWidth={1.75} />
              {/* Sparkles */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute -right-1 -top-1"
              >
                <Sparkles className="h-5 w-5 text-chart-2" />
              </motion.div>
            </motion.div>
          </div>

          {/* Title */}
          <div className="w-full shrink-0 text-center">
            <motion.h2
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold tracking-tight"
            >
              {t.workout.triumphTitle}
            </motion.h2>
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-1.5 text-sm text-muted-foreground"
            >
              {t.workout.triumphSubtitle}
            </motion.p>
          </div>

          {/* Stats chips */}
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="grid w-full shrink-0 grid-cols-2 gap-3"
          >
            <div className="flex items-center gap-3 rounded-2xl border bg-card/80 p-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {t.workout.durationLabel}
                </div>
                <div className="truncate text-base font-semibold tabular-nums">{duration}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border bg-card/80 p-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Weight className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {t.workout.volumeLabel}
                </div>
                <div className="truncate text-base font-semibold tabular-nums">
                  {volume.toLocaleString()} {t.dashboard.kg}
                </div>
              </div>
            </div>
          </motion.div>

          {/* PR section */}
          {hasRecords ? (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="w-full shrink-0 space-y-2.5"
            >
              <p className="flex items-center justify-center gap-1.5 text-center text-sm font-semibold text-primary">
                <TrendingUp className="h-4 w-4" />
                {t.workout.triumphNewPRs}
              </p>
              <div className="space-y-2">
                {groupedRecords.map((group, i) => (
                  <motion.div
                    key={group.exerciseId}
                    initial={{ x: -16, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.55 + i * 0.08, type: "spring", stiffness: 260, damping: 20 }}
                    className="rounded-2xl border bg-card p-3.5 shadow-sm"
                  >
                    <div className="mb-2.5 flex min-w-0 items-center gap-2">
                      <Dumbbell className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate text-sm font-medium">
                        {getName(group.exerciseId, group.exerciseName)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {group.records.map((pr) => (
                        <div
                          key={pr.id}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <span className="text-muted-foreground">
                            {prLabels[pr.type] ?? pr.type}
                          </span>
                          <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 font-bold text-primary tabular-nums">
                            {formatPrValue(pr)} {t.dashboard.kg}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="shrink-0 text-center text-sm text-muted-foreground"
            >
              {t.workout.triumphNoPRs}
            </motion.p>
          )}

        </div>
      </div>

      <div className="mx-auto w-full max-w-lg shrink-0 border-t bg-background/95 px-6 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="mx-auto w-full max-w-sm"
        >
          <Button onClick={handleClose} size="lg" className="w-full shadow-md">
            {t.workout.triumphDone}
          </Button>
        </motion.div>
      </div>
      </div>
    </motion.div>
  );

  if (!mounted) return null;

  return createPortal(content, document.body);
}

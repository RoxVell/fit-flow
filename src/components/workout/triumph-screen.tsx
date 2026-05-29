"use client";

import { motion } from "framer-motion";
import { Trophy, TrendingUp, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PersonalRecord } from "@/lib/db/types";

interface TriumphScreenProps {
  records: PersonalRecord[];
  volume: number;
  duration: string;
  onClose: () => void;
}

export function TriumphScreen({ records, volume, duration, onClose }: TriumphScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/50 backdrop-blur-lg"
    >
      <div className="relative flex flex-col items-center gap-6 px-8 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
            <Trophy className="h-12 w-12 text-primary" />
          </div>
        </motion.div>

        <div>
          <h2 className="text-2xl font-bold">Workout Complete!</h2>
          <p className="mt-1 text-sm text-foreground">
            {duration} · {volume.toLocaleString()} kg total volume
          </p>
        </div>

        {records.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full space-y-2"
          >
            <p className="text-sm font-semibold text-primary flex items-center justify-center gap-1">
              <TrendingUp className="h-4 w-4" />
              New Personal Records
            </p>
            {records.map((pr, i) => (
              <motion.div
                key={pr.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3"
              >
                <div className="flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{pr.exerciseName}</span>
                </div>
                <span className="text-sm font-bold text-primary">
                  {pr.value} {pr.type === "volume" ? "vol" : "kg"}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}

        <Button onClick={onClose} className="mt-2">
          Done
        </Button>
      </div>


    </motion.div>
  );
}

"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { withoutDeleted } from "@/lib/db/active-records";
import { db } from "@/lib/db/dexie";

export function useExerciseUsageCounts(): Map<string, number> | undefined {
  const logs = useLiveQuery(async () => {
    return withoutDeleted(await db.workoutLogs.toArray());
  }, []);

  return useMemo(() => {
    if (!logs) return undefined;
    const counts = new Map<string, number>();
    for (const log of logs) {
      const seen = new Set<string>();
      for (const ex of log.exercises) {
        if (seen.has(ex.exerciseId)) continue;
        seen.add(ex.exerciseId);
        counts.set(ex.exerciseId, (counts.get(ex.exerciseId) ?? 0) + 1);
      }
    }
    return counts;
  }, [logs]);
}

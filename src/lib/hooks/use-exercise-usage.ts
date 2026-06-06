"use client";

import { useSyncExternalStore } from "react";
import { liveQuery } from "dexie";
import { withoutDeleted } from "@/lib/db/active-records";
import { db } from "@/lib/db/dexie";
import type { WorkoutLogEntity } from "@/lib/db/types";

function computeUsageCounts(logs: WorkoutLogEntity[]): Map<string, number> {
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
}

let cachedCounts: Map<string, number> | undefined;
const listeners = new Set<() => void>();
let subscriptionStarted = false;

const countsObservable = liveQuery(async () => {
  const logs = withoutDeleted(await db.workoutLogs.toArray());
  return computeUsageCounts(logs);
});

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!subscriptionStarted) {
    subscriptionStarted = true;
    countsObservable.subscribe((value) => {
      cachedCounts = value;
      for (const listener of listeners) listener();
    });
  }
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return cachedCounts;
}

function getServerSnapshot() {
  return undefined;
}

export function useExerciseUsageCounts(): Map<string, number> | undefined {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

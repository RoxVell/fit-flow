"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/dexie";
import { sortExercisesByUsage } from "@/lib/exercises/sort-by-usage";
import type { ExerciseLibraryFilters } from "@/lib/exercises/types";
import { useLocale } from "@/lib/i18n/locale-context";
import { useExerciseLibrary } from "@/lib/hooks/use-exercise-library";
import { useExerciseUsageCounts } from "@/lib/hooks/use-exercise-usage";

export function useSortedExerciseLibrary(filters?: ExerciseLibraryFilters, replacementSourceId?: string) {
  const locale = useLocale();
  const { exercises, loading, error } = useExerciseLibrary(filters);
  const usageCounts = useExerciseUsageCounts();
  const preferredIds = useLiveQuery(async () => {
    if (!replacementSourceId) return [];
    const replacements = await db.exerciseReplacements
      .where("fromExerciseId").equals(replacementSourceId).toArray();
    return replacements
      .sort((a, b) => b.lastUsedAt.localeCompare(a.lastUsedAt))
      .map((r) => r.toExerciseId);
  }, [replacementSourceId]);

  const sorted = useMemo(() => {
    if (!exercises) return undefined;
    return sortExercisesByUsage(exercises, usageCounts, locale, preferredIds);
  }, [exercises, usageCounts, locale, preferredIds]);

  return { exercises: sorted, loading: loading || preferredIds === undefined, error, usageCounts, preferredIds };
}

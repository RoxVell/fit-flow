"use client";

import { useMemo } from "react";
import { sortExercisesByUsage } from "@/lib/exercises/sort-by-usage";
import type { ExerciseLibraryFilters } from "@/lib/exercises/types";
import { useLocale } from "@/lib/stores/locale-store";
import { useExerciseLibrary } from "@/lib/hooks/use-exercise-library";
import { useExerciseUsageCounts } from "@/lib/hooks/use-exercise-usage";

export function useSortedExerciseLibrary(filters?: ExerciseLibraryFilters) {
  const locale = useLocale();
  const { exercises, loading, error } = useExerciseLibrary(filters);
  const usageCounts = useExerciseUsageCounts();

  const sorted = useMemo(() => {
    if (!exercises) return undefined;
    return sortExercisesByUsage(exercises, usageCounts, locale);
  }, [exercises, usageCounts, locale]);

  return { exercises: sorted, loading, error, usageCounts };
}

"use client";

import { useMemo } from "react";
import { buildExerciseMapFromManifest } from "@/lib/exercises/adapter";
import type { Exercise } from "@/lib/db/types";
import { useExerciseManifest } from "@/lib/hooks/use-exercise-library";
import { useLocale } from "@/lib/i18n/locale-context";

/** Resolve exercise names and metadata from the static library manifest. */
export function useExerciseLookup() {
  const locale = useLocale();
  const { manifest, loading, error } = useExerciseManifest();

  const exerciseMap = useMemo(() => {
    if (!manifest) return new Map<string, Exercise>();
    return buildExerciseMapFromManifest(manifest, locale);
  }, [manifest, locale]);

  const getExercise = (exerciseId: string | undefined) =>
    exerciseId ? exerciseMap.get(exerciseId) : undefined;

  const getName = (exerciseId: string | undefined, fallback = ""): string =>
    getExercise(exerciseId)?.name || fallback;

  return { exerciseMap, getName, getExercise, loading, error, manifest };
}

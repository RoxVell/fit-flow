"use client";

import { useMemo } from "react";
import {
  buildExerciseMapFromManifest,
  manifestToExercise,
} from "@/lib/exercises/adapter";
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

  const getExercise = (exerciseId: string | undefined): Exercise | undefined => {
    if (!exerciseId) return undefined;
    const cached = exerciseMap.get(exerciseId);
    if (cached) return cached;
    if (!manifest) return undefined;
    const item = manifest.find((e) => e.id === exerciseId);
    return item ? manifestToExercise(item, locale) : undefined;
  };

  const getName = (exerciseId: string | undefined, fallback = ""): string =>
    getExercise(exerciseId)?.name || fallback;

  return { exerciseMap, getName, getExercise, loading, error, manifest };
}

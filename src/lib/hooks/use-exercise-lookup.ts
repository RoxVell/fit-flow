"use client";

import { useMemo } from "react";
import {
  buildExerciseMapFromManifest,
  manifestToExercise,
} from "@/lib/exercises/adapter";
import { pickLocalized } from "@/lib/exercises/locale";
import type { Exercise } from "@/lib/db/types";
import { useExerciseManifest } from "@/lib/hooks/use-exercise-library";
import { useLocale } from "@/lib/stores/locale-store";

/** Resolve exercise names and metadata from the static library manifest. */
export function useExerciseLookup() {
  const locale = useLocale();
  const { manifest, loading, error } = useExerciseManifest();

  const exerciseMap = useMemo(() => {
    if (!manifest) return new Map<string, Exercise>();
    return buildExerciseMapFromManifest(manifest, locale);
  }, [manifest, locale]);

  const getName = (exerciseId: string | undefined, fallback = ""): string => {
    if (!exerciseId) return fallback;
    const fromMap = exerciseMap.get(exerciseId)?.name;
    if (fromMap) return fromMap;
    if (!manifest) return fallback;
    const item = manifest.find((e) => e.id === exerciseId);
    return item ? pickLocalized(item.name, locale) : fallback;
  };

  const getExercise = (exerciseId: string | undefined): Exercise | undefined => {
    if (!exerciseId) return undefined;
    const cached = exerciseMap.get(exerciseId);
    if (cached) return cached;
    if (!manifest) return undefined;
    const item = manifest.find((e) => e.id === exerciseId);
    return item ? manifestToExercise(item, locale) : undefined;
  };

  return { exerciseMap, getName, getExercise, loading, error, manifest };
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { filterManifest } from "@/lib/exercises/filter";
import {
  ensureManifestLoaded,
  fetchExerciseDetail,
  fetchManifest,
  getCachedManifest,
  setCachedManifest,
  setManifestLoadError,
  subscribeExerciseLibraryCacheClear,
} from "@/lib/exercises/library-client";
import { useLocale } from "@/lib/i18n/locale-context";
import type {
  ExerciseDetail,
  ExerciseLibraryFilters,
  ExerciseManifestItem,
} from "@/lib/exercises/types";

export function useExerciseManifest() {
  const [state, setState] = useState<{
    manifest: ExerciseManifestItem[] | null;
    error: Error | null;
  }>(() => ({ manifest: getCachedManifest(), error: null }));

  useEffect(() => {
    let generation = 0;
    const load = () => {
      const request = ++generation;
      fetchManifest().then((manifest) => {
        if (request !== generation) return;
        setCachedManifest(manifest);
        setState({ manifest, error: null });
      }).catch((error: Error) => {
        if (request !== generation) return;
        setManifestLoadError(error);
        setState({ manifest: null, error });
      });
    };
    const unsubscribe = subscribeExerciseLibraryCacheClear(() => {
      setState({ manifest: null, error: null });
      load();
    });
    load();
    return () => {
      generation++;
      unsubscribe();
    };
  }, []);

  return { ...state, loading: !state.manifest && !state.error };
}

export function useExerciseLibrary(filters?: ExerciseLibraryFilters) {
  const locale = useLocale();
  const { manifest, loading, error } = useExerciseManifest();
  const { search, bodyPart, equipment, mechanics, tag } = filters ?? {};
  const items = useMemo(() => manifest
    ? filterManifest(manifest, { search, bodyPart, equipment, mechanics, tag }, locale)
    : undefined,
  [manifest, search, bodyPart, equipment, mechanics, tag, locale]);

  return { exercises: items, loading, error };
}

export function useExerciseDetail(exerciseId: string | null) {
  const { manifest, loading: manifestLoading } = useExerciseManifest();
  const manifestItem = useMemo(
    () => manifest?.find((exercise) => exercise.id === exerciseId) ?? null,
    [manifest, exerciseId]
  );
  // Each selection gets its own request identity, including closing and reopening
  // the same exercise. A previous response or error never belongs to a new request.
  const request = useMemo(() => ({ exerciseId, manifestItem }), [exerciseId, manifestItem]);
  const [result, setResult] = useState<{
    request: typeof request;
    detail: ExerciseDetail | null;
    error: Error | null;
  } | null>(null);

  useEffect(() => {
    if (!request.exerciseId || !request.manifestItem) return;
    let cancelled = false;
    fetchExerciseDetail(request.exerciseId, request.manifestItem.bodyPart)
      .then((detail) => {
        if (!cancelled) setResult({
          request, detail: detail ?? null,
          error: detail ? null : new Error("Exercise not found"),
        });
      })
      .catch((error: Error) => {
        if (!cancelled) setResult({ request, detail: null, error });
      });
    return () => { cancelled = true; };
  }, [request]);

  const current = result?.request === request ? result : null;
  return {
    detail: current?.detail ?? null,
    manifestItem,
    loading: manifestLoading || Boolean(exerciseId && manifestItem && !current),
    error: current?.error ?? null,
  };
}

export { ensureManifestLoaded };

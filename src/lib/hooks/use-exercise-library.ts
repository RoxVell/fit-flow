"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { filterManifest } from "@/lib/exercises/filter";
import {
  ensureManifestLoaded,
  fetchExerciseDetail,
  fetchManifest,
  getCachedManifest,
  getManifestLoadError,
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
  const [manifest, setManifest] = useState<ExerciseManifestItem[] | null>(
    getCachedManifest
  );
  const [error, setError] = useState<Error | null>(getManifestLoadError);
  const [loading, setLoading] = useState(
    () => !getCachedManifest() && !getManifestLoadError()
  );

  const loadManifest = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    fetchManifest()
      .then((data) => {
        if (cancelled) return;
        setCachedManifest(data);
        setManifest(data);
        setError(null);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setManifestLoadError(err);
        setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (getCachedManifest()) return;
    return loadManifest();
  }, [loadManifest]);

  useEffect(() => {
    return subscribeExerciseLibraryCacheClear(() => {
      setManifest(null);
      setError(null);
      loadManifest();
    });
  }, [loadManifest]);

  return { manifest, loading, error };
}

export function useExerciseLibrary(filters?: ExerciseLibraryFilters) {
  const locale = useLocale();
  const { manifest, loading, error } = useExerciseManifest();

  const stableFilters = useMemo(
    () => filters,
    [
      filters?.search,
      filters?.bodyPart,
      filters?.equipment,
      filters?.mechanics,
      filters?.tag,
    ]
  );

  const items = useMemo(() => {
    if (!manifest) return undefined;
    return filterManifest(manifest, stableFilters, locale);
  }, [manifest, stableFilters, locale]);

  return { exercises: items, loading, error };
}

export function useExerciseDetail(exerciseId: string | null) {
  const { manifest, loading: manifestLoading } = useExerciseManifest();
  const [detail, setDetail] = useState<ExerciseDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const manifestItem = useMemo(
    () => manifest?.find((e) => e.id === exerciseId) ?? null,
    [manifest, exerciseId]
  );

  useEffect(() => {
    if (!exerciseId || !manifestItem) {
      setDetail(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchExerciseDetail(exerciseId, manifestItem.bodyPart)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setError(new Error("Exercise not found"));
          setDetail(null);
        } else {
          setDetail(data);
        }
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err);
        setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [exerciseId, manifestItem]);

  return {
    detail,
    manifestItem,
    loading: manifestLoading || loading,
    error,
  };
}

export { ensureManifestLoaded };

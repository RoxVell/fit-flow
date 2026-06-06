"use client";

import { useEffect, useMemo, useState } from "react";
import { filterManifest } from "@/lib/exercises/filter";
import {
  fetchExerciseDetail,
  fetchManifest,
} from "@/lib/exercises/library-client";
import { pickLocalized } from "@/lib/exercises/locale";
import { useLocale } from "@/lib/stores/locale-store";
import type {
  BodyPart,
  ExerciseDetail,
  ExerciseLibraryFilters,
  ExerciseManifestItem,
} from "@/lib/exercises/types";

let cachedManifest: ExerciseManifestItem[] | null = null;
let manifestLoadError: Error | null = null;

export function useExerciseManifest() {
  const [manifest, setManifest] = useState<ExerciseManifestItem[] | null>(
    cachedManifest
  );
  const [error, setError] = useState<Error | null>(manifestLoadError);
  const [loading, setLoading] = useState(!cachedManifest && !manifestLoadError);

  useEffect(() => {
    if (cachedManifest) return;
    let cancelled = false;
    setLoading(true);
    fetchManifest()
      .then((data) => {
        if (cancelled) return;
        cachedManifest = data;
        setManifest(data);
        setError(null);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        manifestLoadError = err;
        setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { manifest, loading, error };
}

export function useExerciseLibrary(filters?: ExerciseLibraryFilters) {
  const locale = useLocale();
  const { manifest, loading, error } = useExerciseManifest();

  const items = useMemo(() => {
    if (!manifest) return undefined;
    return filterManifest(manifest, filters, locale);
  }, [manifest, filters, locale]);

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

export function useExerciseName(exerciseId: string | undefined): string {
  const locale = useLocale();
  const { manifest } = useExerciseManifest();

  return useMemo(() => {
    if (!exerciseId || !manifest) return "";
    const item = manifest.find((e) => e.id === exerciseId);
    return item ? pickLocalized(item.name, locale) : "";
  }, [exerciseId, manifest, locale]);
}

export function useExerciseMapFromLibrary() {
  const locale = useLocale();
  const { manifest, loading, error } = useExerciseManifest();

  const map = useMemo(() => {
    if (!manifest) return undefined;
    return new Map(
      manifest.map((item) => [
        item.id,
        {
          id: item.id,
          name: pickLocalized(item.name, locale),
          bodyPart: item.bodyPart,
          muscleGroup: item.bodyPart,
          thumbnailUri: item.thumbnailUri,
        },
      ])
    );
  }, [manifest, locale]);

  return { map, loading, error };
}

export function getCachedManifestItem(
  id: string
): ExerciseManifestItem | undefined {
  return cachedManifest?.find((e) => e.id === id);
}

export async function ensureManifestLoaded(): Promise<ExerciseManifestItem[]> {
  if (cachedManifest) return cachedManifest;
  cachedManifest = await fetchManifest();
  return cachedManifest;
}

export async function getManifestItemBodyPart(
  id: string
): Promise<BodyPart | undefined> {
  const manifest = await ensureManifestLoaded();
  return manifest.find((e) => e.id === id)?.bodyPart;
}

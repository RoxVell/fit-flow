import { ensureSeeded } from "@/lib/db/seed-loader";
import {
  buildExerciseMapFromManifest,
  manifestToExercise,
} from "@/lib/exercises/adapter";
import { filterManifest } from "@/lib/exercises/filter";
import { toLibraryFilters } from "@/lib/exercises/filter-adapter";
import { ensureManifestLoaded } from "@/lib/hooks/use-exercise-library";
import { getActiveLocale } from "@/lib/i18n/locale-context";
import type { Exercise, ExerciseEntity, ExerciseFilters } from "@/lib/db/types";

export function filterExercises(
  exercises: Exercise[],
  filters?: ExerciseFilters
): Exercise[] {
  let result = [...exercises];
  if (!filters) return result;
  if (filters.muscleGroup) {
    result = result.filter(
      (e) =>
        e.muscleGroup === filters.muscleGroup ||
        e.secondaryMuscles.includes(filters.muscleGroup!)
    );
  }
  if (filters.equipment) {
    result = result.filter((e) => e.equipment === filters.equipment);
  }
  if (filters.category) {
    result = result.filter((e) => e.category === filters.category);
  }
  if (filters.unilateral !== undefined) {
    result = result.filter((e) => e.unilateral === filters.unilateral);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.muscleGroup.toLowerCase().includes(q)
    );
  }
  return result;
}

export async function getExercises(filters?: ExerciseFilters): Promise<ExerciseEntity[]> {
  await ensureSeeded();
  const manifest = await ensureManifestLoaded();
  const locale = getActiveLocale();
  const libraryFilters = toLibraryFilters(filters);
  const filtered = filterManifest(manifest, libraryFilters, locale);
  return filtered.map((item) => ({
    ...manifestToExercise(item, locale),
    revision: 1,
    updatedAt: new Date().toISOString(),
  }));
}

export async function getExerciseById(id: string): Promise<ExerciseEntity | undefined> {
  await ensureSeeded();
  const manifest = await ensureManifestLoaded();
  const locale = getActiveLocale();
  const item = manifest.find((e) => e.id === id);
  if (!item) return undefined;
  return {
    ...manifestToExercise(item, locale),
    revision: 1,
    updatedAt: new Date().toISOString(),
  };
}

export async function getExerciseMap(): Promise<Map<string, ExerciseEntity>> {
  const manifest = await ensureManifestLoaded();
  const locale = getActiveLocale();
  const map = buildExerciseMapFromManifest(manifest, locale);
  const now = new Date().toISOString();
  return new Map(
    [...map.entries()].map(([id, exercise]) => [
      id,
      { ...exercise, revision: 1, updatedAt: now },
    ])
  );
}

export function attachExercisesToSessions<
  T extends { exercises: { exerciseId: string; exercise?: Exercise }[] },
>(sessions: T[], exerciseMap: Map<string, Exercise>): T[] {
  return sessions.map((session) => ({
    ...session,
    exercises: session.exercises.map((se) => ({
      ...se,
      exercise: exerciseMap.get(se.exerciseId),
    })),
  }));
}

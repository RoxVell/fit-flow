import { buildExerciseMapFromManifest } from "@/lib/exercises/adapter";
import { ensureManifestLoaded } from "@/lib/hooks/use-exercise-library";
import { getActiveLocale } from "@/lib/i18n/locale-context";
import type { Exercise, ExerciseEntity } from "@/lib/db/types";

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

/** Resolve `exercise` on every nested exercise ref (program sessions, workout logs, …). */
export function attachExercises<
  T extends { exercises: { exerciseId: string; exercise?: Exercise }[] },
>(items: T[], exerciseMap: Map<string, Exercise>): T[] {
  return items.map((item) => ({
    ...item,
    exercises: item.exercises.map((e) => ({
      ...e,
      exercise: exerciseMap.get(e.exerciseId),
    })),
  }));
}

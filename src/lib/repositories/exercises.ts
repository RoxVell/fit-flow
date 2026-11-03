import { buildExerciseMapFromManifest } from "@/lib/exercises/adapter";
import { ensureManifestLoaded } from "@/lib/exercises/library-client";
import { getActiveLocale } from "@/lib/i18n/locale-context";
import type { Exercise } from "@/lib/db/types";

export async function getExerciseMap(): Promise<Map<string, Exercise>> {
  const manifest = await ensureManifestLoaded();
  const locale = getActiveLocale();
  return buildExerciseMapFromManifest(manifest, locale);
}

/** Resolve `exercise` on every nested exercise ref (program sessions, workout logs, …). */
export function attachExercises<
  T extends { exercises: { exerciseId: string; exercise?: Exercise }[] },
>(items: T[], exerciseMap: Map<string, Exercise>): T[] {
  return items.map((item) => ({
    ...item,
    exercises: item.exercises.map((e) => ({
      ...e,
      exercise: exerciseMap.get(e.exerciseId) ?? e.exercise,
    })),
  }));
}

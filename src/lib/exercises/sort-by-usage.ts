import { pickLocalized } from "./locale";
import type { ExerciseManifestItem, Locale } from "./types";

export function sortExercisesByUsage(
  items: ExerciseManifestItem[],
  usageCounts: Map<string, number> | undefined,
  locale: Locale
): ExerciseManifestItem[] {
  return [...items].sort((a, b) => {
    const countDiff =
      (usageCounts?.get(b.id) ?? 0) - (usageCounts?.get(a.id) ?? 0);
    if (countDiff !== 0) return countDiff;
    return pickLocalized(a.name, locale).localeCompare(
      pickLocalized(b.name, locale),
      locale
    );
  });
}

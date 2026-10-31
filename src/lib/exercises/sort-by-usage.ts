import { pickLocalized } from "./locale";
import type { ExerciseManifestItem, Locale } from "./types";

export function sortExercisesByUsage(
  items: ExerciseManifestItem[],
  usageCounts: Map<string, number> | undefined,
  locale: Locale,
  preferredIds: string[] = []
): ExerciseManifestItem[] {
  const priority = new Map(preferredIds.map((id, index) => [id, index]));
  return [...items].sort((a, b) => {
    const aRank = priority.get(a.id) ?? preferredIds.length;
    const bRank = priority.get(b.id) ?? preferredIds.length;
    if (aRank !== bRank) return aRank - bRank;
    const countDiff =
      (usageCounts?.get(b.id) ?? 0) - (usageCounts?.get(a.id) ?? 0);
    if (countDiff !== 0) return countDiff;
    return pickLocalized(a.name, locale).localeCompare(
      pickLocalized(b.name, locale),
      locale
    );
  });
}

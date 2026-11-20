import type { Locale } from "@/lib/i18n/messages";

import { pickLocalized } from "./locale";
import type { ExerciseLibraryFilters, ExerciseManifestItem } from "./types";

// Ported from the web app's src/lib/exercises/filter.ts.
export function filterManifest(
  items: ExerciseManifestItem[],
  filters: ExerciseLibraryFilters | undefined,
  locale: Locale,
): ExerciseManifestItem[] {
  if (!filters) return items;

  let result = items;

  if (filters.bodyPart) {
    result = result.filter((e) => e.bodyPart === filters.bodyPart);
  }
  if (filters.equipment) {
    const equipment = filters.equipment;
    result = result.filter((e) => e.equipments.includes(equipment));
  }
  if (filters.mechanics) {
    result = result.filter((e) => e.mechanics === filters.mechanics);
  }
  if (filters.tag) {
    const tag = filters.tag;
    result = result.filter((e) => e.tags.includes(tag));
  }
  if (filters.search) {
    const q = filters.search.toLowerCase().trim();
    if (q) {
      result = result.filter((e) => {
        const en = e.name.en.toLowerCase();
        const ru = e.name.ru.toLowerCase();
        return en.includes(q) || ru.includes(q) || pickLocalized(e.name, locale).toLowerCase().includes(q);
      });
    }
  }

  return result;
}

// Ported from src/lib/exercises/sort-by-usage.ts: most used first, then by
// localized name. Usage counts are optional until workout history is ported.
export function sortExercisesByUsage(
  items: ExerciseManifestItem[],
  usageCounts: Map<string, number> | undefined,
  locale: Locale,
): ExerciseManifestItem[] {
  return [...items].sort((a, b) => {
    const countDiff = (usageCounts?.get(b.id) ?? 0) - (usageCounts?.get(a.id) ?? 0);
    if (countDiff !== 0) return countDiff;
    return pickLocalized(a.name, locale).localeCompare(pickLocalized(b.name, locale), locale);
  });
}

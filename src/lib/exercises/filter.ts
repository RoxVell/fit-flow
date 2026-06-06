import { pickLocalized } from "./locale";
import type {
  ExerciseLibraryFilters,
  ExerciseManifestItem,
  Locale,
} from "./types";

export function filterManifest(
  items: ExerciseManifestItem[],
  filters: ExerciseLibraryFilters | undefined,
  locale: Locale
): ExerciseManifestItem[] {
  if (!filters) return items;

  let result = items;

  if (filters.bodyPart) {
    result = result.filter((e) => e.bodyPart === filters.bodyPart);
  }

  if (filters.equipment) {
    result = result.filter((e) => e.equipments.includes(filters.equipment!));
  }

  if (filters.mechanics) {
    result = result.filter((e) => e.mechanics === filters.mechanics);
  }

  if (filters.tag) {
    result = result.filter((e) => e.tags.includes(filters.tag!));
  }

  if (filters.search) {
    const q = filters.search.toLowerCase().trim();
    result = result.filter((e) => {
      const en = e.name.en.toLowerCase();
      const ru = e.name.ru.toLowerCase();
      return (
        en.includes(q) ||
        ru.includes(q) ||
        pickLocalized(e.name, locale).toLowerCase().includes(q)
      );
    });
  }

  return result;
}

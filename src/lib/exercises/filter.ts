import type { ExerciseLibraryFilters, ExerciseManifestItem } from "./types";

export function filterManifest(
  items: ExerciseManifestItem[],
  filters?: ExerciseLibraryFilters
): ExerciseManifestItem[] {
  const { bodyPart, equipment, mechanics, tag, search } = filters ?? {};
  const query = search?.trim().toLowerCase();
  if (!bodyPart && !equipment && !mechanics && !tag && !query) return items;
  return items.filter((item) =>
    (!bodyPart || item.bodyPart === bodyPart) &&
    (!equipment || item.equipments.includes(equipment)) &&
    (!mechanics || item.mechanics === mechanics) &&
    (!tag || item.tags.includes(tag)) &&
    (!query || item.name.en.toLowerCase().includes(query) || item.name.ru.toLowerCase().includes(query))
  );
}

import manifest from "@/data/exercises/manifest.json";
import type { Locale } from "@/lib/i18n/messages";

import type { ExerciseManifestItem } from "./types";

// Bundled copy of the web app's public/exercises/manifest.json
// (refresh with `npm run sync:exercises`). Details/videos load later.
const items = manifest as ExerciseManifestItem[];

let byId: Map<string, ExerciseManifestItem> | null = null;

export function getExerciseCatalog(): ExerciseManifestItem[] {
  return items;
}

export function getExercise(id: string): ExerciseManifestItem | undefined {
  if (!byId) byId = new Map(items.map((item) => [item.id, item]));
  return byId.get(id);
}

export function getExerciseName(id: string, locale: Locale, fallback: string): string {
  return getExercise(id)?.name[locale] ?? fallback;
}

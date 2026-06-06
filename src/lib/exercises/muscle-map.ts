import type { Muscle } from "react-body-highlighter";

/** Maps library muscle keys to react-body-highlighter slugs with engagement weight. */
const LIBRARY_TO_HIGHLIGHTER: Record<string, { slug: Muscle; weight: number }> = {
  CHEST_UPPER: { slug: "chest", weight: 1 },
  CHEST_MIDDLE: { slug: "chest", weight: 1 },
  CHEST_LOWER: { slug: "chest", weight: 1 },
  LATISSIMUS_DORSI: { slug: "upper-back", weight: 1 },
  TRAPEZIUS_UPPER: { slug: "trapezius", weight: 1 },
  TRAPEZIUS_MIDDLE: { slug: "upper-back", weight: 0.8 },
  TRAPEZIUS_LOWER: { slug: "upper-back", weight: 0.6 },
  ERECTOR_SPINAE: { slug: "lower-back", weight: 1 },
  SHOULDERS_FRONT_PART: { slug: "front-deltoids", weight: 1 },
  SHOULDERS_MIDDLE_PART: { slug: "back-deltoids", weight: 1 },
  SHOULDERS_REAR_PART: { slug: "back-deltoids", weight: 1 },
  BICEPS_BRACHII: { slug: "biceps", weight: 1 },
  BRACHIALIS: { slug: "biceps", weight: 0.7 },
  BRACHIORADIALIS: { slug: "forearm", weight: 1 },
  TRICEPS_LONG_HEAD: { slug: "triceps", weight: 1 },
  TRICEPS_LATERAL_HEAD: { slug: "triceps", weight: 1 },
  TRICEPS_MEDIAL_HEAD: { slug: "triceps", weight: 0.8 },
  QUADRICEPS: { slug: "quadriceps", weight: 1 },
  RECTUS_FEMORIS: { slug: "quadriceps", weight: 1 },
  VASTUS_LATERALIS: { slug: "quadriceps", weight: 1 },
  VASTUS_MEDIALIS: { slug: "quadriceps", weight: 1 },
  BICEPS_FEMORIS: { slug: "hamstring", weight: 1 },
  SEMIMEMBRANOSUS: { slug: "hamstring", weight: 1 },
  SEMITENDINOSUS: { slug: "hamstring", weight: 1 },
  GLUTEUS_MAXIMUS: { slug: "gluteal", weight: 1 },
  GLUTEUS_MEDIUS: { slug: "gluteal", weight: 0.8 },
  CLAVES_GASTROCNEMIUS: { slug: "calves", weight: 1 },
  CLAVES_SOLEUS: { slug: "calves", weight: 0.8 },
  ABS_UPPER: { slug: "abs", weight: 1 },
  ABS_LOWER: { slug: "abs", weight: 1 },
  ABS_OBLIQUES: { slug: "obliques", weight: 1 },
};

export type MuscleEngagement = { name: string; percent: number };

export function topMuscles(
  exerciseMuscles: Record<string, number>,
  limit = 6
): MuscleEngagement[] {
  return Object.entries(exerciseMuscles)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([name, percent]) => ({ name, percent }));
}

export function toHighlighterData(
  exerciseMuscles: Record<string, number>
): { slug: Muscle; intensity: number }[] {
  const aggregated = new Map<Muscle, number>();

  for (const [key, percent] of Object.entries(exerciseMuscles)) {
    const mapping = LIBRARY_TO_HIGHLIGHTER[key];
    if (!mapping) continue;
    const score = percent * mapping.weight;
    aggregated.set(mapping.slug, Math.max(aggregated.get(mapping.slug) ?? 0, score));
  }

  return [...aggregated.entries()].map(([slug, intensity]) => ({
    slug,
    intensity: Math.min(3, Math.max(1, Math.round(intensity / 30))),
  }));
}

export function formatMuscleName(key: string): string {
  return key
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

import type { BodyMuscle } from "@/lib/charts/body-svg";

/** Maps library muscle keys to the native body SVG, matching the web highlighter map. */
const LIBRARY_TO_BODY: Record<string, { muscle: BodyMuscle; weight: number }> = {
  CHEST_UPPER: { muscle: "chest", weight: 1 },
  CHEST_MIDDLE: { muscle: "chest", weight: 1 },
  CHEST_LOWER: { muscle: "chest", weight: 1 },
  LATISSIMUS_DORSI: { muscle: "upper-back", weight: 1 },
  TRAPEZIUS_UPPER: { muscle: "trapezius", weight: 1 },
  TRAPEZIUS_MIDDLE: { muscle: "upper-back", weight: 0.8 },
  TRAPEZIUS_LOWER: { muscle: "upper-back", weight: 0.6 },
  ERECTOR_SPINAE: { muscle: "lower-back", weight: 1 },
  SHOULDERS_FRONT_PART: { muscle: "front-deltoids", weight: 1 },
  SHOULDERS_MIDDLE_PART: { muscle: "back-deltoids", weight: 1 },
  SHOULDERS_REAR_PART: { muscle: "back-deltoids", weight: 1 },
  BICEPS_BRACHII: { muscle: "biceps", weight: 1 },
  BRACHIALIS: { muscle: "biceps", weight: 0.7 },
  BRACHIORADIALIS: { muscle: "forearm", weight: 1 },
  TRICEPS_LONG_HEAD: { muscle: "triceps", weight: 1 },
  TRICEPS_LATERAL_HEAD: { muscle: "triceps", weight: 1 },
  TRICEPS_MEDIAL_HEAD: { muscle: "triceps", weight: 0.8 },
  QUADRICEPS: { muscle: "quadriceps", weight: 1 },
  RECTUS_FEMORIS: { muscle: "quadriceps", weight: 1 },
  VASTUS_LATERALIS: { muscle: "quadriceps", weight: 1 },
  VASTUS_MEDIALIS: { muscle: "quadriceps", weight: 1 },
  BICEPS_FEMORIS: { muscle: "hamstring", weight: 1 },
  SEMIMEMBRANOSUS: { muscle: "hamstring", weight: 1 },
  SEMITENDINOSUS: { muscle: "hamstring", weight: 1 },
  GLUTEUS_MAXIMUS: { muscle: "gluteal", weight: 1 },
  GLUTEUS_MEDIUS: { muscle: "gluteal", weight: 0.8 },
  CLAVES_GASTROCNEMIUS: { muscle: "calves", weight: 1 },
  CLAVES_SOLEUS: { muscle: "calves", weight: 0.8 },
  ABS_UPPER: { muscle: "abs", weight: 1 },
  ABS_LOWER: { muscle: "abs", weight: 1 },
  ABS_OBLIQUES: { muscle: "obliques", weight: 1 },
};

export type MuscleEngagement = { name: string; percent: number };

/** Top named muscles for the exercise-detail bars (web: topMuscles). */
export function topMuscles(exerciseMuscles: Record<string, number>, limit = 6): MuscleEngagement[] {
  return Object.entries(exerciseMuscles)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([name, percent]) => ({ name, percent }));
}

export function formatMuscleName(key: string): string {
  return key
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Intensity 1–4 per body region for the native SVG heatmap. */
export function toBodyMuscleLoad(exerciseMuscles: Record<string, number>): Partial<Record<BodyMuscle, number>> {
  const aggregated = new Map<BodyMuscle, number>();
  for (const [key, percent] of Object.entries(exerciseMuscles)) {
    const mapping = LIBRARY_TO_BODY[key];
    if (!mapping || percent <= 0) continue;
    const score = percent * mapping.weight;
    aggregated.set(mapping.muscle, Math.max(aggregated.get(mapping.muscle) ?? 0, score));
  }

  const load: Partial<Record<BodyMuscle, number>> = {};
  for (const [muscle, score] of aggregated) {
    load[muscle] = Math.min(4, Math.max(1, Math.round(score / 30)));
  }
  return load;
}

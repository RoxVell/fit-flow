import type { Equipment, Exercise, MuscleGroup } from "@/lib/db/types";
import { pickLocalized } from "./locale";
import type { BodyPart, ExerciseManifestItem, Locale } from "./types";

const BODY_PART_TO_MUSCLE: Record<BodyPart, MuscleGroup> = {
  CHEST: "chest",
  BACK: "back",
  SHOULDERS: "shoulders",
  BICEPS: "biceps",
  TRICEPS: "triceps",
  FOREARMS: "forearms",
  LEGS: "quads",
  GLUTEUS: "glutes",
  ABS: "abs",
};

const EQUIPMENT_MAP: Record<string, Equipment> = {
  BARBELL: "barbell",
  DUMBBELL: "dumbbell",
  KETTLEBELL: "kettlebell",
  CABLE_MACHINE: "cable",
  SELECTORIZED_MACHINE: "machine",
  PLATE_LOADED_MACHINE: "machine",
  ASSISTED_MACHINE: "machine",
  SMITH_MACHINE: "smith_machine",
  EZ_BAR: "ez_bar",
  RESISTANCE_BAND: "band",
  WEIGHT_PLATE: "plate",
  BENCH: "bench",
  PULL_UP_BAR: "bodyweight",
  DIP_BARS: "bodyweight",
};

export function bodyPartToMuscleGroup(bodyPart: BodyPart): MuscleGroup {
  return BODY_PART_TO_MUSCLE[bodyPart];
}

export function manifestToExercise(
  item: ExerciseManifestItem,
  locale: Locale
): Exercise {
  const primaryEquipment = item.equipments[0] ?? "BODYWEIGHT";
  return {
    id: item.id,
    name: pickLocalized(item.name, locale),
    muscleGroup: bodyPartToMuscleGroup(item.bodyPart),
    secondaryMuscles: [],
    equipment: EQUIPMENT_MAP[primaryEquipment] ?? "bodyweight",
    unilateral:
      item.laterality === "UNILATERAL" || item.laterality === "ALTERNATING",
    category: item.mechanics === "COMPOUND" ? "compound" : "isolation",
    description: "",
    imageUrl: item.thumbnailUri ?? undefined,
  };
}

export function buildExerciseMapFromManifest(
  items: ExerciseManifestItem[],
  locale: Locale
): Map<string, Exercise> {
  return new Map(items.map((item) => [item.id, manifestToExercise(item, locale)]));
}

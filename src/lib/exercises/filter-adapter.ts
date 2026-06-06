import type { Equipment, ExerciseFilters, MuscleGroup } from "@/lib/db/types";
import type { BodyPart, ExerciseLibraryFilters } from "./types";

const MUSCLE_TO_BODY_PART: Partial<Record<MuscleGroup, BodyPart>> = {
  chest: "CHEST",
  back: "BACK",
  shoulders: "SHOULDERS",
  biceps: "BICEPS",
  triceps: "TRICEPS",
  forearms: "FOREARMS",
  quads: "LEGS",
  hamstrings: "LEGS",
  glutes: "GLUTEUS",
  calves: "LEGS",
  abs: "ABS",
  traps: "BACK",
  hip_flexors: "ABS",
  full_body: "LEGS",
};

const EQUIPMENT_TO_LIBRARY: Partial<Record<Equipment, string>> = {
  barbell: "BARBELL",
  dumbbell: "DUMBBELL",
  kettlebell: "KETTLEBELL",
  cable: "CABLE_MACHINE",
  machine: "SELECTORIZED_MACHINE",
  smith_machine: "SMITH_MACHINE",
  ez_bar: "EZ_BAR",
  bodyweight: "PULL_UP_BAR",
  band: "RESISTANCE_BAND",
  plate: "WEIGHT_PLATE",
  bench: "BENCH",
};

export function toLibraryFilters(
  filters?: ExerciseFilters
): ExerciseLibraryFilters | undefined {
  if (!filters) return undefined;

  const result: ExerciseLibraryFilters = {};

  if (filters.search) result.search = filters.search;
  if (filters.muscleGroup) {
    result.bodyPart = MUSCLE_TO_BODY_PART[filters.muscleGroup] ?? null;
  }
  if (filters.equipment) {
    result.equipment = EQUIPMENT_TO_LIBRARY[filters.equipment] ?? null;
  }
  if (filters.category) {
    result.mechanics =
      filters.category === "compound" ? "COMPOUND" : "ISOLATION";
  }

  return result;
}

export function matchesUnilateralFilter(
  laterality: string,
  unilateral?: boolean
): boolean {
  if (unilateral === undefined) return true;
  const isUnilateral =
    laterality === "UNILATERAL" || laterality === "ALTERNATING";
  return unilateral === isUnilateral;
}

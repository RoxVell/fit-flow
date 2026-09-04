import type { MuscleGroup } from "@/lib/db/types";

export type LocalizedString = { en: string; ru: string };

export type BodyPart =
  | "ABS"
  | "BACK"
  | "BICEPS"
  | "CHEST"
  | "FOREARMS"
  | "GLUTEUS"
  | "LEGS"
  | "SHOULDERS"
  | "TRICEPS";

export type Mechanics = "COMPOUND" | "ISOLATION";

export type Laterality = "BILATERAL" | "UNILATERAL" | "ALTERNATING";

export type ExerciseManifestItem = {
  id: string;
  name: LocalizedString;
  bodyPart: BodyPart;
  equipments: string[];
  mechanics: Mechanics;
  laterality: Laterality;
  weightType: string;
  tags: string[];
  thumbnailUri: string | null;
  muscleWeights?: Partial<Record<MuscleGroup, number>>;
};

// Mirrors the web app's ExerciseLibraryFilters (src/lib/exercises/types.ts).
export type ExerciseLibraryFilters = {
  search?: string;
  bodyPart?: BodyPart | null;
  equipment?: string | null;
  mechanics?: Mechanics | null;
  tag?: string | null;
};

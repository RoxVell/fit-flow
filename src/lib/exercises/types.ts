export type Locale = "en" | "ru";

export type LocalizedString = { en: string; ru: string };
export type LocalizedList = { en: string[]; ru: string[] };

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

export type LibraryMechanics = "COMPOUND" | "ISOLATION";
export type LibraryLaterality = "BILATERAL" | "UNILATERAL" | "ALTERNATING";

export type ExerciseManifestItem = {
  id: string;
  name: LocalizedString;
  bodyPart: BodyPart;
  equipments: string[];
  mechanics: LibraryMechanics;
  laterality: LibraryLaterality;
  weightType: string;
  tags: string[];
  thumbnailUri: string | null;
};

export type ExerciseDetail = ExerciseManifestItem & {
  description: LocalizedString;
  instructions: LocalizedList;
  tips: LocalizedList;
  commonMistakes: LocalizedList;
  imageUri: string | null;
  thumbnail1Uri: string | null;
  thumbnail2Uri: string | null;
  videoDarkUrl: string;
  videoLightUrl: string;
  exerciseMuscles: Record<string, number>;
};

export type ExerciseLibraryMeta = {
  version: number;
  builtAt: string;
  count: number;
  bodyParts: BodyPart[];
};

export type ExerciseLibraryFilters = {
  search?: string;
  bodyPart?: BodyPart | null;
  equipment?: string | null;
  mechanics?: LibraryMechanics | null;
  tag?: string | null;
};

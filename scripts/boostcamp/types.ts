import type { LoggedExercise } from "../../src/lib/db/types";
import type { ExerciseManifestItem } from "../../src/lib/exercises/types";

export type BoostcampRow = {
  workout: string;
  date: string;
  week: string;
  day: string;
  exercise: string;
  set: number;
  weight: number;
  unit: string;
  reps: number;
};

export type BoostcampSession = {
  date: string;
  workout: string;
  week: string;
  day: string;
  rows: BoostcampRow[];
};

export type MappingConfidence = "high" | "medium" | "manual";

export type ExerciseMappingEntry = {
  exerciseId: string | null;
  matchedName: string | null;
  confidence: MappingConfidence;
  alternatives: string[];
};

export type ExerciseMappingFile = Record<string, ExerciseMappingEntry>;

export type BoostcampWorkoutLog = {
  id: string;
  startedAt: string;
  endedAt: string;
  programName: string;
  sessionName: string;
  notes: string;
  exercises: LoggedExercise[];
  revision: number;
  updatedAt: string;
};

export type { ExerciseManifestItem };

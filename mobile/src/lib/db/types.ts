export const MUSCLE_GROUPS = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "forearms",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "abs",
  "traps",
  "hip_flexors",
  "full_body",
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export type Equipment =
  | "barbell"
  | "dumbbell"
  | "kettlebell"
  | "cable"
  | "machine"
  | "smith_machine"
  | "ez_bar"
  | "bodyweight"
  | "band"
  | "plate"
  | "step"
  | "bench"
  | "foam_roller";

export type SetType = "working" | "warmup" | "dropset";

export type CardioType = "run" | "cycle" | "elliptical" | "row";

export type PRType = "volume" | "weight" | "estimated_1rm";

export interface SyncableEntity {
  revision: number;
  updatedAt: string;
  deletedAt?: string;
}

export type EntityType =
  | "exercise"
  | "program"
  | "workoutLog"
  | "bodyMeasurement"
  | "cardioSession"
  | "personalRecord";

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  unilateral: boolean;
  category: "compound" | "isolation" | "cardio";
  description: string;
  imageUrl?: string;
  videoUrl?: string;
}

export interface WorkoutProgram {
  id: string;
  name: string;
  description: string;
  daysPerWeek: number;
  sessions: WorkoutSession[];
  isActive: boolean;
  createdAt: string;
  /** Rest timer duration in seconds; shared across all exercises in the program. */
  restDurationSeconds?: number;
}

export interface WorkoutSession {
  id: string;
  name: string;
  dayOfWeek: number;
  programId: string;
  sortOrder: number;
  exercises: SessionExercise[];
}

export interface SessionExercise {
  id: string;
  exerciseId: string;
  sessionId: string;
  exercise?: Exercise;
  sortOrder: number;
  supersetGroupId?: string;
  targetSets: number;
  targetReps: string;
  notes?: string;
}

export interface WorkoutLog {
  id: string;
  startedAt: string;
  endedAt?: string;
  programId?: string;
  sessionId?: string;
  programName?: string;
  sessionName?: string;
  notes?: string;
  exercises: LoggedExercise[];
}

export interface LoggedExercise {
  id: string;
  exerciseId: string;
  exercise?: Exercise;
  workoutLogId: string;
  sortOrder: number;
  supersetGroupId?: string;
  notes?: string;
  /** When true, this performance is omitted from e1RM, PRs, and progress charts. */
  excludeFromStats?: boolean;
  sets: LoggedSet[];
}

export interface LoggedSet {
  id: string;
  loggedExerciseId: string;
  type: SetType;
  setOrder: number;
  reps: number;
  weight: number;
  rir?: number;
  completed: boolean;
}

export interface CardioSession {
  id: string;
  type: CardioType;
  distance: number;
  duration: number;
  avgHeartRate?: number;
  workoutLogId?: string;
  date: string;
}

export interface BodyMeasurement {
  id: string;
  date: string;
  weight?: number;
  bodyFat?: number;
  chest?: number;
  waist?: number;
  leftArm?: number;
  rightArm?: number;
  leftThigh?: number;
  rightThigh?: number;
  leftCalf?: number;
  rightCalf?: number;
}

export interface PersonalRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  type: PRType;
  value: number;
  date: string;
  workoutLogId?: string;
}

export interface DashboardStats {
  weeklyWorkouts: number;
  weeklyVolume: number;
  currentWeight: number | null;
  weightTrend: "up" | "down" | "stable";
  hasWeightHistory: boolean;
  activeDays: number;
  nextSession?: WorkoutSession;
  heatmapData: Record<MuscleGroup, number>;
}

export interface ExerciseFilters {
  muscleGroup?: MuscleGroup;
  equipment?: Equipment;
  search?: string;
  unilateral?: boolean;
  category?: "compound" | "isolation" | "cardio";
}

export type ExerciseEntity = Exercise & SyncableEntity;
export type ProgramEntity = WorkoutProgram & SyncableEntity;
export type WorkoutLogEntity = WorkoutLog & SyncableEntity;
export type BodyMeasurementEntity = BodyMeasurement & SyncableEntity;
export type CardioSessionEntity = CardioSession & SyncableEntity;
export type PersonalRecordEntity = PersonalRecord & SyncableEntity;

export interface SyncQueueEntry {
  id: string;
  entityType: EntityType;
  entityId: string;
  operation: "create" | "update" | "delete";
  payload?: unknown;
  revision: number;
  createdAt: string;
  status: "pending" | "synced" | "failed";
}

export interface AppMeta {
  key: "app";
  initialized: boolean;
  lastPullAt: string | null;
  lastSyncAt: string | null;
  schemaVersion: number;
}

export interface WorkoutDraft {
  id: "active";
  activeWorkoutId: string | null;
  sessionId: string | null;
  exercises: LoggedExercise[];
  startedAt: string | null;
  updatedAt: string;
}

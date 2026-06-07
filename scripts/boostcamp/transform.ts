import type { LoggedExercise, LoggedSet } from "../../src/lib/db/types";
import { buildExerciseMapping, validateMapping } from "./match-exercises";
import { groupRowsIntoSessions, sessionTimestamps } from "./parse-csv";
import type {
  BoostcampRow,
  BoostcampSession,
  BoostcampWorkoutLog,
  ExerciseMappingFile,
  ExerciseManifestItem,
} from "./types";
import { IMPORT_NOTE } from "./utils";

function generateId(): string {
  return crypto.randomUUID();
}

function groupRowsByExercise(rows: BoostcampRow[]): { exercise: string; rows: BoostcampRow[] }[] {
  const order: string[] = [];
  const groups = new Map<string, BoostcampRow[]>();

  for (const row of rows) {
    if (!groups.has(row.exercise)) {
      order.push(row.exercise);
      groups.set(row.exercise, []);
    }
    groups.get(row.exercise)!.push(row);
  }

  return order.map((exercise) => ({
    exercise,
    rows: groups.get(exercise)!.sort((a, b) => a.set - b.set),
  }));
}

function toLoggedSet(row: BoostcampRow, loggedExerciseId: string): LoggedSet {
  const reps = Math.round(row.reps);
  return {
    id: generateId(),
    loggedExerciseId,
    type: "working",
    setOrder: row.set - 1,
    reps,
    weight: row.weight,
    completed: reps > 0 && row.weight > 0,
  };
}

function toLoggedExercise(
  exerciseName: string,
  exerciseId: string,
  workoutLogId: string,
  sortOrder: number,
  rows: BoostcampRow[]
): LoggedExercise {
  const loggedExerciseId = generateId();
  return {
    id: loggedExerciseId,
    exerciseId,
    workoutLogId,
    sortOrder,
    sets: rows.map((row) => toLoggedSet(row, loggedExerciseId)),
  };
}

export function sessionToWorkoutLog(
  session: BoostcampSession,
  mapping: ExerciseMappingFile
): BoostcampWorkoutLog {
  const workoutLogId = generateId();
  const { startedAt, endedAt } = sessionTimestamps(session.date);
  const exerciseGroups = groupRowsByExercise(session.rows);

  const exercises = exerciseGroups.map((group, index) => {
    const entry = mapping[group.exercise];
    if (!entry?.exerciseId) {
      throw new Error(`Exercise "${group.exercise}" is not mapped`);
    }
    return toLoggedExercise(group.exercise, entry.exerciseId, workoutLogId, index, group.rows);
  });

  const now = new Date().toISOString();

  return {
    id: workoutLogId,
    startedAt,
    endedAt,
    programName: session.workout,
    sessionName: session.day,
    notes: `${IMPORT_NOTE}; ${session.week}`,
    exercises,
    revision: 1,
    updatedAt: now,
  };
}

export function transformBoostcampRows(
  rows: BoostcampRow[],
  mapping: ExerciseMappingFile,
  manifest: ExerciseManifestItem[]
): BoostcampWorkoutLog[] {
  const usedNames = getUniqueExerciseNamesFromRows(rows);
  const errors = validateMapping(mapping, manifest, usedNames);
  if (errors.length > 0) {
    throw new Error(`Exercise mapping validation failed:\n${errors.map((e) => `  - ${e}`).join("\n")}`);
  }

  const sessions = groupRowsIntoSessions(rows);
  return sessions.map((session) => sessionToWorkoutLog(session, mapping));
}

export function getUniqueExerciseNamesFromRows(rows: BoostcampRow[]): string[] {
  return [...new Set(rows.map((row) => row.exercise))].sort();
}

export function ensureMappingForRows(
  rows: BoostcampRow[],
  manifest: ExerciseManifestItem[],
  existing?: ExerciseMappingFile
): ExerciseMappingFile {
  const names = getUniqueExerciseNamesFromRows(rows);
  return buildExerciseMapping(names, manifest, existing);
}

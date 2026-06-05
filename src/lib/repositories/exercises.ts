import { db } from "@/lib/db/dexie";
import { ensureSeeded } from "@/lib/db/seed-loader";
import type { Exercise, ExerciseEntity, ExerciseFilters } from "@/lib/db/types";

export function filterExercises(
  exercises: Exercise[],
  filters?: ExerciseFilters
): Exercise[] {
  let result = [...exercises];
  if (!filters) return result;
  if (filters.muscleGroup) {
    result = result.filter(
      (e) =>
        e.muscleGroup === filters.muscleGroup ||
        e.secondaryMuscles.includes(filters.muscleGroup!)
    );
  }
  if (filters.equipment) {
    result = result.filter((e) => e.equipment === filters.equipment);
  }
  if (filters.category) {
    result = result.filter((e) => e.category === filters.category);
  }
  if (filters.unilateral !== undefined) {
    result = result.filter((e) => e.unilateral === filters.unilateral);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.muscleGroup.toLowerCase().includes(q)
    );
  }
  return result;
}

export async function getExercises(filters?: ExerciseFilters): Promise<ExerciseEntity[]> {
  await ensureSeeded();
  const all = await db.exercises.toArray();
  return filterExercises(all, filters) as ExerciseEntity[];
}

export async function getExerciseById(id: string): Promise<ExerciseEntity | undefined> {
  await ensureSeeded();
  return db.exercises.get(id);
}

export async function getExerciseMap(): Promise<Map<string, ExerciseEntity>> {
  const all = await db.exercises.toArray();
  return new Map(all.map((e) => [e.id, e]));
}

export function attachExercisesToSessions<
  T extends { exercises: { exerciseId: string; exercise?: Exercise }[] },
>(sessions: T[], exerciseMap: Map<string, Exercise>): T[] {
  return sessions.map((session) => ({
    ...session,
    exercises: session.exercises.map((se) => ({
      ...se,
      exercise: exerciseMap.get(se.exerciseId),
    })),
  }));
}

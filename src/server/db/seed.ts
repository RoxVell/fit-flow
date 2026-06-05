import { exercises as exercisesTable, programs as programsTable } from "./schema";
import { db } from "./index";
import { exercises, programs } from "@/lib/db/seed";

let seeded = false;

export async function ensureServerSeeded(): Promise<void> {
  if (seeded) return;
  const existing = await db.select({ id: exercisesTable.id }).from(exercisesTable).limit(1);
  if (existing.length > 0) {
    seeded = true;
    return;
  }

  const now = new Date();
  await db.insert(exercisesTable).values(
    exercises.map((e) => ({
      id: e.id,
      name: e.name,
      muscleGroup: e.muscleGroup,
      secondaryMuscles: e.secondaryMuscles,
      equipment: e.equipment,
      unilateral: e.unilateral,
      category: e.category,
      description: e.description,
      imageUrl: e.imageUrl,
      videoUrl: e.videoUrl,
      revision: 1,
      updatedAt: now,
    }))
  );

  await db.insert(programsTable).values(
    programs.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      daysPerWeek: p.daysPerWeek,
      isActive: p.isActive,
      createdAt: new Date(p.createdAt),
      sessions: p.sessions,
      revision: 1,
      updatedAt: now,
    }))
  );

  seeded = true;
}

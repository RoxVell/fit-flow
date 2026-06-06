import { programs as programsTable } from "./schema";
import { db } from "./index";
import { programs } from "@/lib/db/seed";

let seeded = false;

const LEGACY_EXERCISE_ID = /^ex\d+$/;

async function hasLegacyProgramExerciseIds(): Promise<boolean> {
  const rows = await db.select().from(programsTable);
  return rows.some((p) =>
    p.sessions.some((s) =>
      s.exercises.some((e) => LEGACY_EXERCISE_ID.test(e.exerciseId))
    )
  );
}

export async function ensureServerSeeded(): Promise<void> {
  if (seeded) return;

  const existing = await db.select().from(programsTable);
  const legacy = existing.length > 0 && (await hasLegacyProgramExerciseIds());

  if (existing.length > 0 && !legacy) {
    seeded = true;
    return;
  }

  if (existing.length > 0 && legacy) {
    await db.delete(programsTable);
  }

  const now = new Date();
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

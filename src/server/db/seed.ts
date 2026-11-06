import { programs as programsTable } from "./schema";
import { getDb } from "./index";
import { programs } from "@/lib/db/seed";

let seeded = false;

export async function ensureServerSeeded(): Promise<void> {
  if (seeded) return;

  const db = getDb();
  const existing = await db.select({ id: programsTable.id }).from(programsTable).limit(1);
  if (existing.length > 0) {
    seeded = true;
    return;
  }

  const now = new Date().toISOString();
  await db.insert(programsTable).values(
    programs.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      daysPerWeek: p.daysPerWeek,
      isActive: p.isActive,
      createdAt: p.createdAt,
      restDurationSeconds: p.restDurationSeconds,
      sessions: p.sessions,
      revision: 1,
      updatedAt: now,
    }))
  ).onConflictDoNothing();

  seeded = true;
}

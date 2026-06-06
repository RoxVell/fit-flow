import { programs as programsTable } from "./schema";
import { db } from "./index";
import { programs } from "@/lib/db/seed";

let seeded = false;

export async function ensureServerSeeded(): Promise<void> {
  if (seeded) return;

  const existing = await db.select().from(programsTable);
  if (existing.length > 0) {
    seeded = true;
    return;
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

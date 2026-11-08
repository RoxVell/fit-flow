import { db, getAppMeta } from "./dexie";
import { programs } from "./seed";

/** Seed only an empty local database; schema upgrades belong to Dexie. */
export async function ensureSeeded(): Promise<void> {
  if (typeof window === "undefined") return;
  await db.transaction("rw", db.programs, db.meta, async () => {
    if ((await getAppMeta()).initialized || (await db.programs.count()) > 0) return;
    const updatedAt = new Date().toISOString();
    await db.programs.bulkPut(programs.map((program) => ({
      ...program, revision: 1, updatedAt,
    })));
  });
}

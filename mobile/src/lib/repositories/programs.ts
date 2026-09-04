import { withoutDeleted } from "@/lib/db/active-records";
import { TABLES, getDb } from "@/lib/db/database";
import type { ProgramEntity, WorkoutProgram, WorkoutSession } from "@/lib/db/types";
import { generateId } from "@/lib/utils/id";

type Row = { data: string };

// Same shape as the web app's ProgramInput (src/lib/repositories/programs.ts).
export type ProgramInput = Omit<WorkoutProgram, "id" | "createdAt" | "sessions" | "isActive"> & {
  isActive?: boolean;
  sessions: {
    name: string;
    dayOfWeek: number;
    sortOrder: number;
    exercises: {
      exerciseId: string;
      targetSets: number;
      targetReps: string;
      sortOrder: number;
    }[];
  }[];
};

function buildSessions(programId: string, sessions: ProgramInput["sessions"]): WorkoutSession[] {
  return sessions.map((s) => {
    const sessionId = generateId();
    return {
      ...s,
      id: sessionId,
      programId,
      exercises: s.exercises.map((e) => ({ ...e, id: generateId(), sessionId })),
    };
  });
}

function parse(rows: Row[]): ProgramEntity[] {
  return rows.map((r) => JSON.parse(r.data) as ProgramEntity);
}

function put(entity: ProgramEntity) {
  getDb().runSync(
    `INSERT OR REPLACE INTO ${TABLES.programs} (id, is_active, updated_at, deleted_at, data) VALUES (?, ?, ?, ?, ?)`,
    entity.id,
    entity.isActive ? 1 : 0,
    entity.updatedAt,
    entity.deletedAt ?? null,
    JSON.stringify(entity),
  );
}

export function listPrograms(): ProgramEntity[] {
  const rows = getDb().getAllSync<Row>(
    `SELECT data FROM ${TABLES.programs} WHERE deleted_at IS NULL ORDER BY is_active DESC, updated_at DESC`,
  );
  return parse(rows);
}

export function getProgram(id: string): ProgramEntity | undefined {
  const row = getDb().getFirstSync<Row>(
    `SELECT data FROM ${TABLES.programs} WHERE id = ? AND deleted_at IS NULL`,
    id,
  );
  return row ? (JSON.parse(row.data) as ProgramEntity) : undefined;
}

export function getActiveProgram(): ProgramEntity | undefined {
  const row = getDb().getFirstSync<Row>(
    `SELECT data FROM ${TABLES.programs} WHERE is_active = 1 AND deleted_at IS NULL LIMIT 1`,
  );
  return row ? (JSON.parse(row.data) as ProgramEntity) : undefined;
}

// The first program becomes active automatically.
export function createProgram(data: ProgramInput): ProgramEntity {
  const programId = generateId();
  const now = new Date().toISOString();
  const entity: ProgramEntity = {
    ...data,
    id: programId,
    description: data.description || "",
    isActive: data.isActive ?? getActiveProgram() === undefined,
    createdAt: now,
    sessions: buildSessions(programId, data.sessions),
    revision: 1,
    updatedAt: now,
  };
  put(entity);
  return entity;
}

// Sessions get fresh ids on every update, like the web app.
export function updateProgram(id: string, data: ProgramInput): ProgramEntity | undefined {
  const existing = getProgram(id);
  if (!existing) return undefined;
  const entity: ProgramEntity = {
    ...data,
    id,
    description: data.description || "",
    isActive: existing.isActive,
    createdAt: existing.createdAt,
    sessions: buildSessions(id, data.sessions),
    revision: existing.revision + 1,
    updatedAt: new Date().toISOString(),
  };
  put(entity);
  return entity;
}

// Exactly one program is active at a time (see CONTEXT.md, "active program").
export function setActiveProgram(id: string) {
  const db = getDb();
  const all = withoutDeleted(parse(db.getAllSync<Row>(`SELECT data FROM ${TABLES.programs}`)));
  if (!all.some((p) => p.id === id)) return;
  const now = new Date().toISOString();
  db.withTransactionSync(() => {
    for (const program of all) {
      const shouldBeActive = program.id === id;
      if (program.isActive === shouldBeActive) continue;
      put({ ...program, isActive: shouldBeActive, revision: program.revision + 1, updatedAt: now });
    }
  });
}

// Tombstone so a future sync layer can see the delete, like the web app.
export function deleteProgram(id: string) {
  const existing = getProgram(id);
  if (!existing) return;
  const now = new Date().toISOString();
  put({ ...existing, isActive: false, deletedAt: now, revision: existing.revision + 1, updatedAt: now });
}

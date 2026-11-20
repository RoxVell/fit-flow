import { TABLES, getDb } from "@/lib/db/database";
import type { CardioSession, CardioSessionEntity } from "@/lib/db/types";
import { persistHardDelete, persistWithSync } from "@/lib/repositories/entity-crud";
import { generateId } from "@/lib/utils/id";

type Row = { data: string };

function put(entity: CardioSessionEntity) {
  getDb().runSync(
    `INSERT OR REPLACE INTO ${TABLES.cardioSessions} (id, date, updated_at, deleted_at, data) VALUES (?, ?, ?, ?, ?)`,
    entity.id,
    entity.date,
    entity.updatedAt,
    entity.deletedAt ?? null,
    JSON.stringify(entity),
  );
}

export function listCardioSessions(): CardioSessionEntity[] {
  return getDb()
    .getAllSync<Row>(
      `SELECT data FROM ${TABLES.cardioSessions} WHERE deleted_at IS NULL ORDER BY date DESC`,
    )
    .map((r) => JSON.parse(r.data) as CardioSessionEntity);
}

export function createCardioSession(data: Omit<CardioSession, "id">): CardioSessionEntity {
  const entity: CardioSessionEntity = {
    ...data,
    id: generateId(),
    revision: 1,
    updatedAt: new Date().toISOString(),
  };
  persistWithSync(put, "cardioSession", entity, "create");
  return entity;
}

export function deleteCardioSession(id: string) {
  persistHardDelete("cardioSession", id, (sessionId) => {
    const row = getDb().getFirstSync<{ data: string }>(
      `SELECT data FROM ${TABLES.cardioSessions} WHERE id = ? AND deleted_at IS NULL`,
      sessionId,
    );
    return row ? (JSON.parse(row.data) as CardioSessionEntity) : undefined;
  }, (sessionId) => {
    getDb().runSync(`DELETE FROM ${TABLES.cardioSessions} WHERE id = ?`, sessionId);
  });
}

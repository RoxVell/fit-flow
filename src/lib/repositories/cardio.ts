import { db } from "@/lib/db/dexie";
import { ensureSeeded } from "@/lib/db/seed-loader";
import type { CardioSession, CardioSessionEntity } from "@/lib/db/types";
import { enqueueSync } from "@/lib/sync/queue";

export async function getCardioSessions(): Promise<CardioSessionEntity[]> {
  await ensureSeeded();
  const all = await db.cardioSessions.toArray();
  return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function createCardioSession(
  data: Omit<CardioSession, "id" | "revision" | "updatedAt">
): Promise<CardioSessionEntity> {
  const now = new Date().toISOString();
  const entity: CardioSessionEntity = {
    ...data,
    id: crypto.randomUUID(),
    revision: 1,
    updatedAt: now,
  };
  await db.cardioSessions.put(entity);
  await enqueueSync({
    entityType: "cardioSession",
    entityId: entity.id,
    operation: "create",
    payload: entity,
    revision: entity.revision,
  });
  return entity;
}

export async function deleteCardioSession(id: string): Promise<void> {
  const existing = await db.cardioSessions.get(id);
  if (!existing) return;
  const now = new Date().toISOString();
  const entity: CardioSessionEntity = {
    ...existing,
    deletedAt: now,
    revision: existing.revision + 1,
    updatedAt: now,
  };
  await db.cardioSessions.put(entity);
  await enqueueSync({
    entityType: "cardioSession",
    entityId: id,
    operation: "delete",
    revision: entity.revision,
  });
}

import { db } from "@/lib/db/dexie";
import type { CardioSession, CardioSessionEntity } from "@/lib/db/types";
import { createEntity, hardDeleteEntity } from "./entity-crud";

export async function createCardioSession(
  data: Omit<CardioSession, "id" | "revision" | "updatedAt">
): Promise<CardioSessionEntity> {
  return createEntity(db.cardioSessions, "cardioSession", data);
}

export async function deleteCardioSession(id: string): Promise<void> {
  await hardDeleteEntity(db.cardioSessions, "cardioSession", id);
}

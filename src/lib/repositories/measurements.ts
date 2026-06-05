import { db } from "@/lib/db/dexie";
import { ensureSeeded } from "@/lib/db/seed-loader";
import type { BodyMeasurement, BodyMeasurementEntity } from "@/lib/db/types";
import { enqueueSync } from "@/lib/sync/queue";

export async function getBodyMeasurements(): Promise<BodyMeasurementEntity[]> {
  await ensureSeeded();
  const all = await db.bodyMeasurements.toArray();
  return all.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function logBodyMeasurement(
  data: Omit<BodyMeasurement, "id" | "revision" | "updatedAt">
): Promise<BodyMeasurementEntity> {
  const now = new Date().toISOString();
  const entity: BodyMeasurementEntity = {
    ...data,
    id: crypto.randomUUID(),
    revision: 1,
    updatedAt: now,
  };
  await db.bodyMeasurements.put(entity);
  await enqueueSync({
    entityType: "bodyMeasurement",
    entityId: entity.id,
    operation: "create",
    payload: entity,
    revision: entity.revision,
  });
  return entity;
}

export async function deleteBodyMeasurement(id: string): Promise<void> {
  const existing = await db.bodyMeasurements.get(id);
  if (!existing) return;
  const now = new Date().toISOString();
  const entity: BodyMeasurementEntity = {
    ...existing,
    deletedAt: now,
    revision: existing.revision + 1,
    updatedAt: now,
  };
  await db.bodyMeasurements.put(entity);
  await enqueueSync({
    entityType: "bodyMeasurement",
    entityId: id,
    operation: "delete",
    revision: entity.revision,
  });
}

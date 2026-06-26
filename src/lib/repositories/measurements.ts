import { hasAnyBodyMetric } from "@/lib/body-measurements/metrics";
import { withoutDeleted } from "@/lib/db/active-records";
import { db } from "@/lib/db/dexie";
import { ensureSeeded } from "@/lib/db/seed-loader";
import type { BodyMeasurement, BodyMeasurementEntity } from "@/lib/db/types";
import { enqueueSync } from "@/lib/sync/queue";

export class BodyMeasurementValidationError extends Error {
  constructor() {
    super("At least one body metric is required");
    this.name = "BodyMeasurementValidationError";
  }
}

export async function getBodyMeasurements(): Promise<BodyMeasurementEntity[]> {
  await ensureSeeded();
  return withoutDeleted(await db.bodyMeasurements.toArray()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

export async function logBodyMeasurement(
  data: Omit<BodyMeasurement, "id" | "revision" | "updatedAt">
): Promise<BodyMeasurementEntity> {
  if (!hasAnyBodyMetric(data)) {
    throw new BodyMeasurementValidationError();
  }

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
  if (!existing || existing.deletedAt) return;
  const revision = existing.revision + 1;
  await enqueueSync({
    entityType: "bodyMeasurement",
    entityId: id,
    operation: "delete",
    revision,
  });
  await db.bodyMeasurements.delete(id);
}

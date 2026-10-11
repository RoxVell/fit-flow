import { hasAnyBodyMetric } from "@/lib/body-measurements/metrics";
import { db } from "@/lib/db/dexie";
import type { BodyMeasurement, BodyMeasurementEntity } from "@/lib/db/types";
import { createEntity, hardDeleteEntity } from "./entity-crud";

export class BodyMeasurementValidationError extends Error {
  constructor() {
    super("At least one body metric is required");
    this.name = "BodyMeasurementValidationError";
  }
}

export async function logBodyMeasurement(
  data: Omit<BodyMeasurement, "id" | "revision" | "updatedAt">
): Promise<BodyMeasurementEntity> {
  if (!hasAnyBodyMetric(data)) {
    throw new BodyMeasurementValidationError();
  }
  return createEntity(db.bodyMeasurements, "bodyMeasurement", data);
}

export async function deleteBodyMeasurement(id: string): Promise<void> {
  await hardDeleteEntity(db.bodyMeasurements, "bodyMeasurement", id);
}

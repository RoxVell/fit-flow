import { TABLES, getDb } from "@/lib/db/database";
import type { BodyMeasurement, BodyMeasurementEntity } from "@/lib/db/types";
import { persistHardDelete, persistWithSync } from "@/lib/repositories/entity-crud";
import { generateId } from "@/lib/utils/id";

// Tracked body metrics (web: src/lib/body-measurements/metrics.ts).
export const BODY_METRIC_FIELDS = [
  "weight",
  "chest",
  "waist",
  "leftArm",
  "rightArm",
  "leftThigh",
  "rightThigh",
  "leftCalf",
  "rightCalf",
] as const;

export type BodyMetricField = (typeof BODY_METRIC_FIELDS)[number];

export function hasBodyMetricValue(value: number | undefined): value is number {
  return value !== undefined && !Number.isNaN(value);
}

export function hasAnyBodyMetric(data: Partial<Pick<BodyMeasurement, BodyMetricField>>): boolean {
  return BODY_METRIC_FIELDS.some((field) => hasBodyMetricValue(data[field]));
}

export class BodyMeasurementValidationError extends Error {
  constructor() {
    super("At least one body metric is required");
    this.name = "BodyMeasurementValidationError";
  }
}

type Row = { data: string };

function put(entity: BodyMeasurementEntity) {
  getDb().runSync(
    `INSERT OR REPLACE INTO ${TABLES.bodyMeasurements} (id, date, updated_at, deleted_at, data) VALUES (?, ?, ?, ?, ?)`,
    entity.id,
    entity.date,
    entity.updatedAt,
    entity.deletedAt ?? null,
    JSON.stringify(entity),
  );
}

/** Raw snapshots, oldest first (see CONTEXT.md, "body measurement snapshot"). */
export function listBodyMeasurements(): BodyMeasurementEntity[] {
  return getDb()
    .getAllSync<Row>(
      `SELECT data FROM ${TABLES.bodyMeasurements} WHERE deleted_at IS NULL ORDER BY date ASC, updated_at ASC`,
    )
    .map((r) => JSON.parse(r.data) as BodyMeasurementEntity);
}

export function logBodyMeasurement(data: Omit<BodyMeasurement, "id">): BodyMeasurementEntity {
  if (!hasAnyBodyMetric(data)) throw new BodyMeasurementValidationError();
  const entity: BodyMeasurementEntity = {
    ...data,
    id: generateId(),
    revision: 1,
    updatedAt: new Date().toISOString(),
  };
  persistWithSync(put, "bodyMeasurement", entity, "create");
  return entity;
}

// Hard delete, like the web app.
export function deleteBodyMeasurement(id: string) {
  persistHardDelete("bodyMeasurement", id, (measurementId) => {
    const row = getDb().getFirstSync<{ data: string }>(
      `SELECT data FROM ${TABLES.bodyMeasurements} WHERE id = ? AND deleted_at IS NULL`,
      measurementId,
    );
    return row ? (JSON.parse(row.data) as BodyMeasurementEntity) : undefined;
  }, (measurementId) => {
    getDb().runSync(`DELETE FROM ${TABLES.bodyMeasurements} WHERE id = ?`, measurementId);
  });
}

import { BODY_METRIC_FIELDS } from "@/lib/body-measurements/metrics";
import type { SyncChange, SyncResponse } from "@/lib/sync/types";

type ObjectValue = Record<string, unknown>;
const object = (value: unknown): value is ObjectValue => typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === "string";
const id = (value: unknown): value is string => text(value) && value.length > 0 && value.length <= 256;
const number = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;
// The measurement and cardio columns use PostgreSQL real (float32).
const dbReal = (value: unknown) => number(value) &&
  Number.isFinite(Math.fround(value)) && (value === 0 || Math.fround(value) !== 0);
const oneOf = (value: unknown, options: readonly string[]) => text(value) && options.includes(value);
const integer = (value: unknown): value is number => number(value) && Number.isSafeInteger(value);
// PostgreSQL integer columns are signed 32-bit, even on a 64-bit client.
const dbInteger = (value: unknown): value is number => integer(value) && value <= 2_147_483_647;
const date = (value: unknown): value is string => text(value) && value.length <= 40 && Number.isFinite(Date.parse(value));
const optional = (value: unknown, check: (value: unknown) => boolean) => value === undefined || check(value);
const array = (value: unknown, check: (value: unknown) => boolean) => Array.isArray(value) && value.length <= 1000 && value.every(check);
const optionalTextFields = (value: ObjectValue, keys: string[]) => keys.every((key) => optional(value[key], text));

function validSet(value: unknown): boolean {
  return object(value) && id(value.id) && oneOf(value.type, ["working", "warmup", "dropset"]) &&
    integer(value.setOrder) && integer(value.reps) && number(value.weight) &&
    typeof value.completed === "boolean" && optional(value.rir, number);
}

function validLoggedExercise(value: unknown): boolean {
  return object(value) && id(value.id) && id(value.exerciseId) && integer(value.sortOrder) &&
    optional(value.excludeFromStats, (v) => typeof v === "boolean") &&
    optionalTextFields(value, ["notes", "supersetGroupId"]) && array(value.sets, validSet);
}

function validSession(value: unknown): boolean {
  return object(value) && id(value.id) && text(value.name) && integer(value.dayOfWeek) &&
    integer(value.sortOrder) && array(value.exercises, (exercise) =>
      object(exercise) && id(exercise.id) && id(exercise.exerciseId) &&
      integer(exercise.sortOrder) && integer(exercise.targetSets) && text(exercise.targetReps) &&
      optionalTextFields(exercise, ["notes", "supersetGroupId"]));
}

function validPayload(entityType: unknown, payload: unknown): boolean {
  if (!object(payload) || !id(payload.id)) return false;
  switch (entityType) {
    case "program": return text(payload.name) && text(payload.description) &&
      dbInteger(payload.daysPerWeek) && typeof payload.isActive === "boolean" && date(payload.createdAt) &&
      optional(payload.restDurationSeconds, dbInteger) && array(payload.sessions, validSession);
    case "workoutLog": return date(payload.startedAt) && optional(payload.endedAt, date) &&
      optional(payload.durationSeconds, dbInteger) &&
      optionalTextFields(payload, ["programId", "sessionId", "programName", "sessionName", "notes"]) &&
      array(payload.exercises, validLoggedExercise);
    case "bodyMeasurement": return date(payload.date) &&
      optional(payload.bodyFat, dbReal) && BODY_METRIC_FIELDS.every((key) => optional(payload[key], dbReal));
    case "cardioSession": return oneOf(payload.type, ["run", "cycle", "elliptical", "row"]) &&
      date(payload.date) && dbReal(payload.distance) && dbReal(payload.duration) &&
      optional(payload.avgHeartRate, dbInteger) && optional(payload.workoutLogId, text);
    default: return false;
  }
}

/** Reject bad changes individually so one old/invalid entry cannot block the queue. */
export function parseSyncRequest(value: unknown) {
  if (!object(value) || !Array.isArray(value.changes) || value.changes.length > 1000 ||
      !(value.lastPullAt == null || date(value.lastPullAt))) {
    throw new Error("Invalid sync request");
  }
  const changes: SyncChange[] = [];
  const superseded: string[] = [];
  const rejected: SyncResponse["rejected"] = [];
  for (const change of value.changes) {
    if (!object(change) || !id(change.id)) throw new Error("Invalid change id");
    if (change.entityType === "exercise" || change.entityType === "personalRecord") {
      superseded.push(change.id);
      continue;
    }
    const valid = oneOf(change.entityType, ["program", "workoutLog", "bodyMeasurement", "cardioSession"]) &&
      id(change.entityId) && dbInteger(change.revision) && change.revision > 0 &&
      oneOf(change.operation, ["create", "update", "delete"]) &&
      (change.operation === "delete" || (validPayload(change.entityType, change.payload) &&
        (change.payload as ObjectValue).id === change.entityId));
    if (valid) changes.push(change as unknown as SyncChange);
    else rejected.push({ id: change.id, reason: "Invalid change payload", permanent: true });
  }
  return { changes, superseded, rejected };
}

import type { SyncChange, SyncResponse } from "@/lib/sync/types";

type ObjectValue = Record<string, unknown>;
const object = (value: unknown): value is ObjectValue => typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === "string";
const id = (value: unknown): value is string => text(value) && value.length > 0 && value.length <= 256;
const number = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;
const integer = (value: unknown): value is number => number(value) && Number.isSafeInteger(value);
const date = (value: unknown): value is string => text(value) && value.length <= 40 && Number.isFinite(Date.parse(value));
const optional = (value: unknown, check: (value: unknown) => boolean) => value === undefined || check(value);
const array = (value: unknown, check: (value: unknown) => boolean) => Array.isArray(value) && value.length <= 1000 && value.every(check);
const optionalTextFields = (value: ObjectValue, keys: string[]) => keys.every((key) => optional(value[key], text));

function validSet(value: unknown): boolean {
  return object(value) && id(value.id) && ["working", "warmup", "dropset"].includes(String(value.type)) &&
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

function validPayload(entityType: string, payload: unknown): boolean {
  if (!object(payload) || !id(payload.id)) return false;
  switch (entityType) {
    case "program": return text(payload.name) && text(payload.description) &&
      integer(payload.daysPerWeek) && typeof payload.isActive === "boolean" && date(payload.createdAt) &&
      optional(payload.restDurationSeconds, integer) && array(payload.sessions, validSession);
    case "workoutLog": return date(payload.startedAt) && optional(payload.endedAt, date) &&
      optionalTextFields(payload, ["programId", "sessionId", "programName", "sessionName", "notes"]) &&
      array(payload.exercises, validLoggedExercise);
    case "bodyMeasurement": return date(payload.date) &&
      ["weight", "bodyFat", "chest", "waist", "leftArm", "rightArm", "leftThigh", "rightThigh", "leftCalf", "rightCalf"]
        .every((key) => optional(payload[key], number));
    case "cardioSession": return ["run", "cycle", "elliptical", "row"].includes(String(payload.type)) &&
      date(payload.date) && number(payload.distance) && number(payload.duration) &&
      optional(payload.avgHeartRate, integer) && optional(payload.workoutLogId, text);
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
    const valid = ["program", "workoutLog", "bodyMeasurement", "cardioSession"].includes(String(change.entityType)) &&
      id(change.entityId) && integer(change.revision) && change.revision > 0 &&
      ["create", "update", "delete"].includes(String(change.operation)) &&
      (change.operation === "delete" || (validPayload(String(change.entityType), change.payload) &&
        (change.payload as ObjectValue).id === change.entityId));
    if (valid) changes.push(change as unknown as SyncChange);
    else rejected.push({ id: change.id, reason: "Invalid change payload", permanent: true });
  }
  return { changes, superseded, rejected };
}

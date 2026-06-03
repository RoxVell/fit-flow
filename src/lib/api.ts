"use client";

import * as db from "@/lib/db/queries";
import {
  createOutbox,
  useOutboxState as useOutboxStateImpl,
  type Outbox,
} from "./outbox";

const outbox: Outbox = createOutbox({
  createWorkoutLog: db.createWorkoutLog,
  updateWorkoutLog: (id, data) => db.updateWorkoutLog(id, data),
  deleteWorkoutLog: (id) => db.deleteWorkoutLog(id),
  createProgram: db.createProgram,
  updateProgram: (id, data) => db.updateProgram(id, data),
  logBodyMeasurement: db.logBodyMeasurement,
  createCardioSession: db.createCardioSession,
  deleteCardioSession: (id) => db.deleteCardioSession(id),
  createPersonalRecord: db.createPersonalRecord,
});

export const getExercises = db.getExercises;
export const getExerciseById = db.getExerciseById;
export const getPrograms = db.getPrograms;
export const getActiveProgram = db.getActiveProgram;
export const getProgramById = db.getProgramById;
export const getWorkoutLogs = db.getWorkoutLogs;
export const getWorkoutLogById = db.getWorkoutLogById;
export const getBodyMeasurements = db.getBodyMeasurements;
export const getCardioSessions = db.getCardioSessions;
export const getPersonalRecords = db.getPersonalRecords;
export const getDashboardStats = db.getDashboardStats;
export const getExerciseHistory = db.getExerciseHistory;
export const getExerciseDetailedHistory = db.getExerciseDetailedHistory;

export const createWorkoutLog = outbox.wrap(
  "createWorkoutLog",
  db.createWorkoutLog
);
export const updateWorkoutLog = outbox.wrap(
  "updateWorkoutLog",
  db.updateWorkoutLog
);
export const deleteWorkoutLog = outbox.wrap(
  "deleteWorkoutLog",
  db.deleteWorkoutLog
);
export const createProgram = outbox.wrap("createProgram", db.createProgram);
export const updateProgram = outbox.wrap("updateProgram", db.updateProgram);
export const logBodyMeasurement = outbox.wrap(
  "logBodyMeasurement",
  db.logBodyMeasurement
);
export const createCardioSession = outbox.wrap(
  "createCardioSession",
  db.createCardioSession
);
export const deleteCardioSession = outbox.wrap(
  "deleteCardioSession",
  db.deleteCardioSession
);
export const createPersonalRecord = outbox.wrap(
  "createPersonalRecord",
  db.createPersonalRecord
);

export function useOutboxState() {
  return useOutboxStateImpl(outbox);
}

import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type {
  CardioType,
  LoggedExercise,
  WorkoutSession,
} from "@/lib/db/types";

const syncColumns = {
  revision: integer("revision").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
};

export const programs = pgTable("programs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  daysPerWeek: integer("days_per_week").notNull(),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
  restDurationSeconds: integer("rest_duration_seconds").notNull().default(90),
  sessions: jsonb("sessions").$type<WorkoutSession[]>().notNull().default([]),
  ...syncColumns,
});

export const workoutLogs = pgTable("workout_logs", {
  id: text("id").primaryKey(),
  startedAt: timestamp("started_at", { withTimezone: true, mode: "string" }).notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true, mode: "string" }),
  programId: text("program_id"),
  sessionId: text("session_id"),
  programName: text("program_name"),
  sessionName: text("session_name"),
  notes: text("notes"),
  exercises: jsonb("exercises").$type<LoggedExercise[]>().notNull().default([]),
  ...syncColumns,
});

export const bodyMeasurements = pgTable("body_measurements", {
  id: text("id").primaryKey(),
  date: timestamp("date", { withTimezone: true, mode: "string" }).notNull(),
  weight: real("weight"),
  bodyFat: real("body_fat"),
  chest: real("chest"),
  waist: real("waist"),
  leftArm: real("left_arm"),
  rightArm: real("right_arm"),
  leftThigh: real("left_thigh"),
  rightThigh: real("right_thigh"),
  leftCalf: real("left_calf"),
  rightCalf: real("right_calf"),
  ...syncColumns,
});

export const cardioSessions = pgTable("cardio_sessions", {
  id: text("id").primaryKey(),
  type: text("type").$type<CardioType>().notNull(),
  distance: real("distance").notNull(),
  duration: real("duration").notNull(),
  avgHeartRate: integer("avg_heart_rate"),
  workoutLogId: text("workout_log_id"),
  date: timestamp("date", { withTimezone: true, mode: "string" }).notNull(),
  ...syncColumns,
});

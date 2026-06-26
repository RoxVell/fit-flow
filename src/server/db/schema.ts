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
  LoggedExercise,
  MuscleGroup,
  WorkoutSession,
} from "@/lib/db/types";

const syncColumns = {
  revision: integer("revision").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
};

export const exercises = pgTable("exercises", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  muscleGroup: text("muscle_group").notNull(),
  secondaryMuscles: jsonb("secondary_muscles")
    .$type<MuscleGroup[]>()
    .notNull()
    .default([]),
  equipment: text("equipment").notNull(),
  unilateral: boolean("unilateral").notNull().default(false),
  category: text("category").notNull(),
  description: text("description").notNull().default(""),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  ...syncColumns,
});

export const programs = pgTable("programs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  daysPerWeek: integer("days_per_week").notNull(),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  sessions: jsonb("sessions").$type<WorkoutSession[]>().notNull().default([]),
  ...syncColumns,
});

export const workoutLogs = pgTable("workout_logs", {
  id: text("id").primaryKey(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
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
  date: timestamp("date", { withTimezone: true }).notNull(),
  weight: real("weight"),
  bodyFat: real("body_fat"),
  chest: real("chest"),
  waist: real("waist"),
  arms: real("arms"),
  thighs: real("thighs"),
  calves: real("calves"),
  ...syncColumns,
});

export const cardioSessions = pgTable("cardio_sessions", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  distance: real("distance").notNull(),
  duration: real("duration").notNull(),
  avgHeartRate: integer("avg_heart_rate"),
  workoutLogId: text("workout_log_id"),
  date: timestamp("date", { withTimezone: true }).notNull(),
  ...syncColumns,
});

export const personalRecords = pgTable("personal_records", {
  id: text("id").primaryKey(),
  exerciseId: text("exercise_id").notNull(),
  exerciseName: text("exercise_name").notNull(),
  type: text("type").notNull(),
  value: real("value").notNull(),
  date: timestamp("date", { withTimezone: true }).notNull(),
  workoutLogId: text("workout_log_id"),
  ...syncColumns,
});

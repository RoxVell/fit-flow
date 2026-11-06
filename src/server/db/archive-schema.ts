// Retained for Drizzle schema management only. Runtime sync no longer uses
// these tables; existing rows remain available for manual recovery/export.
import { boolean, integer, jsonb, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";
import type { MuscleGroup } from "@/lib/db/types";

const syncColumns = {
  revision: integer("revision").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
};

export const archivedExercises = pgTable("exercises", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  muscleGroup: text("muscle_group").notNull(),
  secondaryMuscles: jsonb("secondary_muscles").$type<MuscleGroup[]>().notNull().default([]),
  equipment: text("equipment").notNull(),
  unilateral: boolean("unilateral").notNull().default(false),
  category: text("category").notNull(),
  description: text("description").notNull().default(""),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  ...syncColumns,
});

export const archivedPersonalRecords = pgTable("personal_records", {
  id: text("id").primaryKey(),
  exerciseId: text("exercise_id").notNull(),
  exerciseName: text("exercise_name").notNull(),
  type: text("type").notNull(),
  value: real("value").notNull(),
  date: timestamp("date", { withTimezone: true }).notNull(),
  workoutLogId: text("workout_log_id"),
  ...syncColumns,
});

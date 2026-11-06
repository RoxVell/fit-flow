-- Additive only: the retired exercise/PR tables are retained as archives.
ALTER TABLE "programs" ADD COLUMN IF NOT EXISTS "rest_duration_seconds" integer NOT NULL DEFAULT 90;

-- Replace combined limb columns with left/right sided columns on body_measurements.
ALTER TABLE "body_measurements" ADD COLUMN IF NOT EXISTS "left_arm" real;--> statement-breakpoint
ALTER TABLE "body_measurements" ADD COLUMN IF NOT EXISTS "right_arm" real;--> statement-breakpoint
ALTER TABLE "body_measurements" ADD COLUMN IF NOT EXISTS "left_thigh" real;--> statement-breakpoint
ALTER TABLE "body_measurements" ADD COLUMN IF NOT EXISTS "right_thigh" real;--> statement-breakpoint
ALTER TABLE "body_measurements" ADD COLUMN IF NOT EXISTS "left_calf" real;--> statement-breakpoint
ALTER TABLE "body_measurements" ADD COLUMN IF NOT EXISTS "right_calf" real;--> statement-breakpoint
ALTER TABLE "body_measurements" DROP COLUMN IF EXISTS "arms";--> statement-breakpoint
ALTER TABLE "body_measurements" DROP COLUMN IF EXISTS "thighs";--> statement-breakpoint
ALTER TABLE "body_measurements" DROP COLUMN IF EXISTS "calves";

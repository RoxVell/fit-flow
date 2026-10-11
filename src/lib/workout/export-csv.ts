import type { WorkoutLogEntity } from "@/lib/db/types";
import { atEndOfDay, atStartOfDay, formatDateKey } from "@/lib/utils/date";

export type WorkoutExportRange = {
  from: Date;
  to: Date;
};

export type WorkoutExportPreset = "1m" | "3m" | "6m" | "custom";

export const WORKOUT_EXPORT_HEADERS = [
  "started_at",
  "ended_at",
  "program",
  "session",
  "exercise",
  "set_number",
  "set_type",
  "weight_kg",
  "reps",
  "rir",
  "completed",
  "workout_notes",
  "exercise_notes",
] as const;

export function createWorkoutExportRange(
  preset: Exclude<WorkoutExportPreset, "custom">,
  now = new Date()
): WorkoutExportRange {
  const months = preset === "1m" ? 1 : preset === "3m" ? 3 : 6;
  const from = atStartOfDay(now);
  from.setMonth(from.getMonth() - months);
  return {
    from,
    to: atEndOfDay(now),
  };
}

function csvCell(value: unknown): string {
  if (value == null) return "";
  const text = String(value);
  if (!/[",\r\n]/.test(text)) return text;
  return `"${text.replaceAll('"', '""')}"`;
}

export function buildWorkoutLogsCsv(logs: WorkoutLogEntity[]): string {
  const rows = logs.flatMap((log) =>
    log.exercises.flatMap((exercise) => {
      const exerciseName = exercise.exercise?.name ?? exercise.exerciseId;
      return exercise.sets
        .filter((set) => set.completed)
        .sort((a, b) => a.setOrder - b.setOrder)
        .map((set, index) => [
          log.startedAt,
          log.endedAt ?? "",
          log.programName ?? "",
          log.sessionName ?? "",
          exerciseName,
          index + 1,
          set.type,
          set.weight,
          set.reps,
          set.rir ?? "",
          set.completed ? "yes" : "no",
          log.notes ?? "",
          exercise.notes ?? "",
        ]);
    })
  );

  return [WORKOUT_EXPORT_HEADERS, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
}

export function getWorkoutExportFilename(range: WorkoutExportRange): string {
  return `workout-logs-${formatDateKey(range.from)}_${formatDateKey(range.to)}.csv`;
}

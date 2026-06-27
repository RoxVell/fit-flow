import type { WorkoutLogEntity } from "@/lib/db/types";

export type WorkoutExportRange = {
  from: Date;
  to: Date;
};

export type WorkoutExportPreset = "1m" | "3m" | "6m" | "custom";

export const WORKOUT_EXPORT_HEADERS = [
  "workout_id",
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

function atStartOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function atEndOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

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
          log.id,
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
  const datePart = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  return `workout-logs-${datePart(range.from)}_${datePart(range.to)}.csv`;
}

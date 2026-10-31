import type { PersonalRecord } from "@/lib/db/types";

export function getPrImprovement(pr: PersonalRecord, history: PersonalRecord[]) {
  const previous = history
    .filter((record) =>
      record.exerciseId === pr.exerciseId &&
      record.type === pr.type &&
      record.id !== pr.id &&
      (!pr.workoutLogId || record.workoutLogId !== pr.workoutLogId) &&
      new Date(record.date) <= new Date(pr.date)
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  if (!previous || pr.value <= previous.value) return null;
  return {
    absolute: pr.value - previous.value,
    percent: previous.value > 0 ? (pr.value / previous.value - 1) * 100 : null,
  };
}

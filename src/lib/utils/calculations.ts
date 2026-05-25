export function estimate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  if (reps >= 10) return weight * (1 + reps / 30);
  return weight * (1 + reps / 30);
}

export function calculateVolume(sets: { weight: number; reps: number }[]): number {
  return sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
}

export function calculatePace(durationMinutes: number, distanceKm: number): number {
  if (distanceKm === 0) return 0;
  return Math.round((durationMinutes / distanceKm) * 100) / 100;
}

export function formatPace(minPerKm: number): string {
  if (minPerKm === 0) return "--";
  const min = Math.floor(minPerKm);
  const sec = Math.round((minPerKm - min) * 60);
  return `${min}:${sec.toString().padStart(2, "0")} /km`;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function delay(ms: number = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
}

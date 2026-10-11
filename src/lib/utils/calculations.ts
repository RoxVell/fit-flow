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

/** Workout elapsed clock (`05:03`), not rest (`5:03`). */
export function formatElapsedClock(minutes: number, seconds: number): string {
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

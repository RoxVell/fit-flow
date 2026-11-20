/** Workout elapsed clock (`05:03`), not rest (`5:03`). */
export function formatElapsedClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/** Short target label for a planned exercise, e.g. `4×5-8`. */
export function formatTarget(targetSets: number, targetReps: string, setsFallback: (n: number) => string): string {
  return targetReps ? `${targetSets}×${targetReps}` : setsFallback(targetSets);
}

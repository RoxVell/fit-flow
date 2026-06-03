export type SetMetrics = {
  weight: number;
  reps: number;
};

export function e1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export function volume(sets: SetMetrics[]): number {
  return sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
}

export function bestWeight(sets: SetMetrics[]): number {
  if (sets.length === 0) return 0;
  return Math.max(...sets.map((s) => s.weight));
}

export function bestE1RM(sets: SetMetrics[]): number {
  if (sets.length === 0) return 0;
  return Math.max(...sets.map((s) => e1RM(s.weight, s.reps)));
}

export const DEFAULT_REST_DURATION_SECONDS = 90;
export const REST_DURATION_MIN_SECONDS = 30;
export const REST_DURATION_MAX_SECONDS = 300;
export const REST_DURATION_STEP_SECONDS = 15;

export function formatRestDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export function resolveRestDuration(seconds?: number): number {
  return seconds ?? DEFAULT_REST_DURATION_SECONDS;
}

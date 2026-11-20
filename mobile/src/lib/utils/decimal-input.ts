/** Accepts positive partial decimal strings with comma or dot as separator. */
export function isPartialDecimalInput(value: string): boolean {
  return /^\d*[,.]?\d*$/.test(value);
}

/** Accepts empty or digits-only strings (reps, minutes, heart rate). */
export function isPartialIntegerInput(value: string): boolean {
  return /^\d*$/.test(value);
}

export function parseLocalizedDecimal(value: string): number {
  const normalized = value.trim().replace(",", ".");
  if (normalized === "" || normalized === ".") return 0;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatDecimalForInput(value: number): string {
  if (value <= 0) return "";
  return String(value);
}

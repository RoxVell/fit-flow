function inferTickStep(range: number): number {
  if (range <= 2) return 0.5;
  if (range <= 10) return 1;
  if (range <= 30) return 2;
  if (range <= 80) return 5;
  if (range <= 200) return 10;
  if (range <= 500) return 25;
  return 50;
}

/** Y-axis domain that trims the bottom so progress/regression is easier to read. */
export function computeFocusDomain(values: number[]): [number, number] {
  if (values.length === 0) return [0, 1];

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const range = span > 0 ? span : Math.max(max * 0.08, 1);

  const bottomPad = range * 0.12;
  const topPad = range * 0.08;

  const tickStep = inferTickStep(range);
  let domainMin = Math.max(0, min - bottomPad);
  let domainMax = max + topPad;

  domainMin = Math.floor(domainMin / tickStep) * tickStep;
  domainMax = Math.ceil(domainMax / tickStep) * tickStep;

  if (domainMax <= domainMin) {
    domainMax = domainMin + tickStep;
  }

  return [domainMin, domainMax];
}

export interface PeriodChange {
  absolute: number;
  percent: number;
}

export function computePeriodChange(values: number[]): PeriodChange | null {
  if (values.length < 2) return null;

  const first = values[0];
  const last = values[values.length - 1];
  const absolute = Math.round((last - first) * 10) / 10;
  const percent =
    first > 0 ? Math.round(((last - first) / first) * 1000) / 10 : 0;

  return { absolute, percent };
}

export function formatPeriodChange(
  change: PeriodChange,
  unit: string
): { absoluteLabel: string; percentLabel: string } {
  const sign = (n: number) => (n > 0 ? "+" : n < 0 ? "" : "");
  return {
    absoluteLabel: `${sign(change.absolute)}${change.absolute} ${unit}`,
    percentLabel: `${sign(change.percent)}${change.percent}%`,
  };
}

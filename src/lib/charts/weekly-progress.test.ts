import { describe, expect, it } from "vitest";
import { computePeriodChange } from "./domain";
import {
  buildPerExerciseBaseline,
  computeOverallProgressSeries,
  computeOverallProgressSummary,
  getSortedWeeks,
} from "./weekly-progress";

function week(isoDate: string, exercises: Record<string, number>) {
  return [isoDate, new Map(Object.entries(exercises))] as [
    string,
    Map<string, number>,
  ];
}

describe("computeOverallProgressSeries", () => {
  it("indexes each exercise to 100% at its first week in the period", () => {
    const filteredWeeks = [
      week("2026-05-05T00:00:00.000Z", { bench: 110, curl: 50 }),
      week("2026-05-12T00:00:00.000Z", { bench: 100 }),
      week("2026-05-19T00:00:00.000Z", { curl: 55 }),
    ];
    const baseline = buildPerExerciseBaseline(filteredWeeks);

    const series = computeOverallProgressSeries(
      filteredWeeks,
      baseline,
      (iso) => iso.slice(5, 10)
    );

    expect(series[0].progress).toBe(100);
    expect(series[1].progress).toBe(95.5);
    expect(series[2].progress).toBe(100.5);
  });

  it("trends with per-exercise changes instead of absolute baseline dilution", () => {
    const filteredWeeks = [
      week("2026-05-05T00:00:00.000Z", { alpha: 120 }),
      week("2026-05-12T00:00:00.000Z", { alpha: 121, beta: 100 }),
      week("2026-05-19T00:00:00.000Z", { alpha: 122, beta: 101 }),
    ];
    const baseline = buildPerExerciseBaseline(filteredWeeks);

    const series = computeOverallProgressSeries(
      filteredWeeks,
      baseline,
      (iso) => iso
    );

    expect(series[0].progress).toBe(100);
    expect(series[2].progress).toBeGreaterThan(series[0].progress);
  });
});

describe("computeOverallProgressSummary", () => {
  it("averages per-exercise changes instead of comparing mixed weekly snapshots", () => {
    const filteredWeeks = [
      week("2026-05-05T00:00:00.000Z", { strong: 150, weak: 90 }),
      week("2026-05-19T00:00:00.000Z", { strong: 100, weak: 110 }),
    ];
    const baseline = buildPerExerciseBaseline(filteredWeeks);

    const summary = computeOverallProgressSummary(filteredWeeks, baseline);
    const series = computeOverallProgressSeries(filteredWeeks, baseline, (iso) => iso);
    const headline = computePeriodChange(series.map((point) => point.progress));

    // strong: 100%→66.7% = -33.3%, weak: 100%→122.2% = +22.2% → avg -5.5%
    expect(summary.change?.percent).toBe(-5.5);
    expect(headline?.percent).toBe(-5.5);
  });
});

describe("getSortedWeeks", () => {
  it("sorts chronologically", () => {
    const weeks = getSortedWeeks(
      new Map([
        ["2026-05-19T00:00:00.000Z", new Map()],
        ["2026-05-05T00:00:00.000Z", new Map()],
      ])
    );
    expect(weeks[0][0]).toBe("2026-05-05T00:00:00.000Z");
  });
});

import { describe, expect, it } from "vitest";
import { computePeriodChange } from "./domain";
import {
  buildPerExerciseBaseline,
  computeBodyPartChartChanges,
  computeBodyPartProgressSeries,
  computeBodyPartSummariesFromExercises,
  computeOverallProgressSeries,
  computeOverallProgressSummary,
  getSortedWeeks,
} from "./weekly-progress";
import type { BodyPart } from "@/lib/exercises/types";

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

describe("computeBodyPartProgressSeries", () => {
  const exerciseBodyPart = new Map<string, BodyPart>([
    ["lat", "BACK"],
    ["row", "BACK"],
    ["dead", "BACK"],
  ]);

  it("starts at 100% and trends with per-exercise period changes", () => {
    const sortedWeeks = [
      week("2026-01-05T00:00:00.000Z", { lat: 60, row: 50 }),
      week("2026-06-02T00:00:00.000Z", { lat: 80, row: 53.5 }),
      week("2026-06-09T00:00:00.000Z", { lat: 82, row: 54 }),
      week("2026-06-23T00:00:00.000Z", { lat: 83, row: 55, dead: 60 }),
    ];
    const filteredWeeks = sortedWeeks.slice(1);
    const baseline = buildPerExerciseBaseline(sortedWeeks);

    const { chartData, bodyParts } = computeBodyPartProgressSeries(
      filteredWeeks,
      baseline,
      exerciseBodyPart,
      (iso) => iso
    );

    expect(bodyParts).toContain("BACK");
    const backSeries = chartData.map((row) => row.BACK as number);
    expect(backSeries[0]).toBe(100);
    expect(backSeries.at(-1)).toBeGreaterThan(100);

    const summaries = computeBodyPartSummariesFromExercises(
      filteredWeeks,
      baseline,
      exerciseBodyPart,
      bodyParts
    );
    const summary = summaries.get("BACK")!;
    const chartChanges = computeBodyPartChartChanges(chartData, bodyParts);
    const chartChange = chartChanges.get("BACK")!;

    expect(summary.change?.percent).toBeGreaterThan(0);
    expect(chartChange?.percent).toBeGreaterThan(0);
    expect(chartChange?.percent).toBe(
      computePeriodChange(backSeries)?.percent
    );
  });

  it("category badge matches chart line, not exercise-average when cohort mix shifts", () => {
    const exerciseBodyPart = new Map<string, BodyPart>([
      ["wpu", "BACK"],
      ["lat", "BACK"],
      ["tbar", "BACK"],
      ["pullover", "BACK"],
      ["row1", "BACK"],
      ["row2", "BACK"],
    ]);
    const filteredWeeks = [
      week("2026-06-02T00:00:00.000Z", {
        wpu: 100,
        lat: 100,
        tbar: 100,
        pullover: 100,
      }),
      week("2026-06-23T00:00:00.000Z", {
        wpu: 94.1,
        lat: 100,
        tbar: 119.7,
        pullover: 102.5,
        row1: 100,
        row2: 100,
      }),
    ];
    const baseline = buildPerExerciseBaseline(filteredWeeks);

    const { chartData, bodyParts } = computeBodyPartProgressSeries(
      filteredWeeks,
      baseline,
      exerciseBodyPart,
      (iso) => iso
    );
    const backSeries = chartData.map((row) => row.BACK as number);
    const chartChanges = computeBodyPartChartChanges(chartData, bodyParts);
    const exerciseSummary = computeBodyPartSummariesFromExercises(
      filteredWeeks,
      baseline,
      exerciseBodyPart,
      bodyParts
    ).get("BACK")!;

    expect(backSeries[0]).toBe(100);
    expect(backSeries.at(-1)).toBe(102.7);
    expect(chartChanges.get("BACK")?.percent).toBe(2.7);
    expect(exerciseSummary.change?.percent).toBe(4.1);
  });

  it("does not fall when a new exercise joins mid-period", () => {
    const sortedWeeks = [
      week("2026-01-05T00:00:00.000Z", { lat: 60, row: 50 }),
      week("2026-06-02T00:00:00.000Z", { lat: 80, row: 53.5 }),
      week("2026-06-23T00:00:00.000Z", { lat: 83, row: 55, dead: 60 }),
    ];
    const filteredWeeks = sortedWeeks.slice(1);
    const baseline = buildPerExerciseBaseline(sortedWeeks);

    const { chartData } = computeBodyPartProgressSeries(
      filteredWeeks,
      baseline,
      exerciseBodyPart,
      (iso) => iso
    );

    const backSeries = chartData.map((row) => row.BACK as number);
    expect(backSeries.at(-1)).toBeGreaterThanOrEqual(backSeries[0]);
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

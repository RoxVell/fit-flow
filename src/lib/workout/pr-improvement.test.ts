import { describe, expect, it } from "vitest";
import type { PersonalRecord } from "@/lib/db/types";
import { getPrImprovement } from "./pr-improvement";

const record: PersonalRecord = {
  id: "new", exerciseId: "bench", exerciseName: "Bench", type: "weight",
  value: 110, date: "2026-10-31T12:00:00Z", workoutLogId: "current",
};

describe("PR improvement", () => {
  it("compares the same exercise and metric against the latest earlier workout", () => {
    const previous = { ...record, id: "old", value: 100, date: "2026-10-30T12:00:00Z", workoutLogId: "previous" };
    const result = getPrImprovement(record, [
      previous,
      { ...previous, id: "older", value: 50, date: "2026-10-29T12:00:00Z" },
      { ...previous, id: "future", value: 120, date: "2026-11-01T12:00:00Z" },
      { ...record, id: "saved-copy" },
      { ...previous, id: "volume", type: "volume" },
      { ...previous, id: "other", exerciseId: "squat" },
    ]);
    expect(result?.absolute).toBe(10);
    expect(result?.percent).toBeCloseTo(10);
  });

  it("omits growth for first records and avoids percentages from zero", () => {
    expect(getPrImprovement(record, [])).toBeNull();
    expect(getPrImprovement(record, [{ ...record, id: "zero", value: 0, workoutLogId: "old" }]))
      .toEqual({ absolute: 110, percent: null });
  });
});

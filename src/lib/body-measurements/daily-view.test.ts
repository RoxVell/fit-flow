import { describe, expect, it } from "vitest";
import {
  buildDailyBodyViews,
  getWeightTrendFromDailyViews,
} from "@/lib/body-measurements/daily-view";
import type { BodyMeasurementEntity } from "@/lib/db/types";

function snapshot(
  partial: Partial<BodyMeasurementEntity> & Pick<BodyMeasurementEntity, "id" | "date">
): BodyMeasurementEntity {
  return {
    revision: 1,
    updatedAt: partial.updatedAt ?? partial.date,
    weight: partial.weight,
    chest: partial.chest,
    waist: partial.waist,
    arms: partial.arms,
    thighs: partial.thighs,
    calves: partial.calves,
    leftArm: partial.leftArm,
    rightArm: partial.rightArm,
    leftThigh: partial.leftThigh,
    rightThigh: partial.rightThigh,
    leftCalf: partial.leftCalf,
    rightCalf: partial.rightCalf,
    ...partial,
  };
}

describe("buildDailyBodyViews", () => {
  it("merges same-day snapshots with last non-null per field", () => {
    const views = buildDailyBodyViews([
      snapshot({
        id: "1",
        date: "2025-06-01T08:00:00.000Z",
        updatedAt: "2025-06-01T08:00:00.000Z",
        weight: 80,
      }),
      snapshot({
        id: "2",
        date: "2025-06-01T20:00:00.000Z",
        updatedAt: "2025-06-01T20:00:00.000Z",
        waist: 85,
      }),
    ]);

    expect(views).toHaveLength(1);
    expect(views[0]).toMatchObject({ weight: 80, waist: 85 });
  });

  it("merges left and right limb fields independently", () => {
    const views = buildDailyBodyViews([
      snapshot({
        id: "1",
        date: "2025-06-01T08:00:00.000Z",
        updatedAt: "2025-06-01T08:00:00.000Z",
        leftArm: 32,
      }),
      snapshot({
        id: "2",
        date: "2025-06-01T20:00:00.000Z",
        updatedAt: "2025-06-01T20:00:00.000Z",
        rightArm: 33,
      }),
    ]);

    expect(views).toHaveLength(1);
    expect(views[0]).toMatchObject({ leftArm: 32, rightArm: 33 });
  });
});

describe("getWeightTrendFromDailyViews", () => {
  it("returns null weight when no weight was logged", () => {
    const result = getWeightTrendFromDailyViews([
      { date: "2025-06-01", waist: 85 },
    ]);

    expect(result.currentWeight).toBeNull();
    expect(result.weightTrend).toBe("stable");
  });

  it("skips days without weight when computing trend", () => {
    const result = getWeightTrendFromDailyViews([
      { date: "2025-06-01", weight: 80 },
      { date: "2025-06-02", waist: 85 },
      { date: "2025-06-03", weight: 82 },
    ]);

    expect(result.currentWeight).toBe(82);
    expect(result.weightTrend).toBe("up");
  });
});

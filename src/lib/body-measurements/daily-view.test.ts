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
    ...partial,
  };
}

describe("buildDailyBodyViews", () => {
  it("uses the latest filled value for each metric and preserves the local calendar day", () => {
    const date = "2025-06-01";
    const newer = snapshot({ id: "2", date, updatedAt: date + "T20:00:00Z", weight: 81, rightArm: 33 });
    const older = snapshot({ id: "1", date, updatedAt: date + "T08:00:00Z", weight: 80, leftArm: 32, waist: 85 });

    expect(buildDailyBodyViews([newer, older])).toEqual([
      { date, weight: 81, waist: 85, leftArm: 32, rightArm: 33 },
    ]);
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

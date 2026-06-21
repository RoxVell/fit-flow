import { describe, expect, it } from "vitest";
import {
  DEFAULT_REST_DURATION_SECONDS,
  formatRestDuration,
  resolveRestDuration,
  REST_DURATION_MAX_SECONDS,
  REST_DURATION_MIN_SECONDS,
  REST_DURATION_STEP_SECONDS,
} from "./rest-duration";

describe("formatRestDuration", () => {
  it("formats whole minutes without padding minutes", () => {
    expect(formatRestDuration(120)).toBe("2:00");
  });

  it("pads seconds with a leading zero", () => {
    expect(formatRestDuration(90)).toBe("1:30");
    expect(formatRestDuration(45)).toBe("0:45");
  });
});

describe("resolveRestDuration", () => {
  it("returns the default when value is missing", () => {
    expect(resolveRestDuration(undefined)).toBe(DEFAULT_REST_DURATION_SECONDS);
  });

  it("returns the stored value when present", () => {
    expect(resolveRestDuration(120)).toBe(120);
  });
});

describe("rest duration bounds", () => {
  it("uses a 90-second default within the allowed range", () => {
    expect(DEFAULT_REST_DURATION_SECONDS).toBe(90);
    expect(DEFAULT_REST_DURATION_SECONDS).toBeGreaterThanOrEqual(
      REST_DURATION_MIN_SECONDS
    );
    expect(DEFAULT_REST_DURATION_SECONDS).toBeLessThanOrEqual(
      REST_DURATION_MAX_SECONDS
    );
  });

  it("allows stepping from min to max in 15-second increments", () => {
    const steps =
      (REST_DURATION_MAX_SECONDS - REST_DURATION_MIN_SECONDS) /
      REST_DURATION_STEP_SECONDS;
    expect(steps).toBe(18);
    expect(Number.isInteger(steps)).toBe(true);
  });
});

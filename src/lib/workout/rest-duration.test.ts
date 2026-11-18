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
  it.each([[120, "2:00"], [90, "1:30"], [45, "0:45"], [65, "1:05"]] as const)(
    "formats %i seconds as %s", (seconds, expected) => {
      expect(formatRestDuration(seconds)).toBe(expected);
    }
  );
});

it("applies the 90-second default only when no saved duration exists", () => {
  expect(resolveRestDuration()).toBe(90);
  expect(resolveRestDuration(120)).toBe(120);
});

it("supports the default and both endpoints in 15-second steps", () => {
  expect(REST_DURATION_STEP_SECONDS).toBe(15);
  expect(REST_DURATION_MIN_SECONDS).toBe(30);
  expect(REST_DURATION_MAX_SECONDS).toBe(300);
  expect((DEFAULT_REST_DURATION_SECONDS - REST_DURATION_MIN_SECONDS) % REST_DURATION_STEP_SECONDS).toBe(0);
});

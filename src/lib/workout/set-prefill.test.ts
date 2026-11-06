import { describe, expect, it } from "vitest";
import { decideSetPrefill, shouldClearOnFocus } from "./set-prefill";

const previous = { weight: 80, reps: 6 };

describe("decideSetPrefill", () => {
  it("fills an incomplete empty set once previous history arrives", () => {
    expect(
      decideSetPrefill({
        completed: false,
        weight: 0,
        reps: 0,
        previousSet: null,
        settled: false,
      })
    ).toEqual({ settled: false, apply: null });

    expect(
      decideSetPrefill({
        completed: false,
        weight: 0,
        reps: 0,
        previousSet: previous,
        settled: false,
      })
    ).toEqual({ settled: true, apply: previous });
  });

  it("does not fill again after the set is settled", () => {
    expect(
      decideSetPrefill({
        completed: false,
        weight: 0,
        reps: 0,
        previousSet: previous,
        settled: true,
      })
    ).toEqual({ settled: true, apply: null });
  });

  it("does not overwrite a completed set or a set that already has a value", () => {
    expect(
      decideSetPrefill({
        completed: true,
        weight: 0,
        reps: 0,
        previousSet: previous,
        settled: false,
      }).apply
    ).toBeNull();

    expect(
      decideSetPrefill({
        completed: false,
        weight: 40,
        reps: 0,
        previousSet: previous,
        settled: false,
      }).apply
    ).toBeNull();

    expect(
      decideSetPrefill({
        completed: false,
        weight: 0,
        reps: 12,
        previousSet: previous,
        settled: false,
      }).apply
    ).toBeNull();
  });
});

describe("shouldClearOnFocus", () => {
  it("leaves an empty incomplete field alone so a late prefill can land", () => {
    expect(shouldClearOnFocus(false, 0)).toBe(false);
  });

  it("clears a visible value on an incomplete set", () => {
    expect(shouldClearOnFocus(false, 80)).toBe(true);
  });

  it("does not clear a completed set", () => {
    expect(shouldClearOnFocus(true, 80)).toBe(false);
  });
});

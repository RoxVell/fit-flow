import { describe, expect, it } from "vitest";
import { formatElapsedClock } from "./calculations";

describe("formatElapsedClock", () => {
  it("pads minutes and seconds to two digits", () => {
    expect(formatElapsedClock(5, 3)).toBe("05:03");
    expect(formatElapsedClock(0, 9)).toBe("00:09");
    expect(formatElapsedClock(12, 0)).toBe("12:00");
  });
});

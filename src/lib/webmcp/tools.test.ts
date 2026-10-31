import { describe, expect, it, vi } from "vitest";
import { createWorkoutTools, parseToolInput } from "./tools";
import { getCompletedWorkoutLogsInRange } from "@/lib/repositories/workouts";

vi.mock("@/lib/repositories/workouts", () => ({ getCompletedWorkoutLogsInRange: vi.fn(async () => []) }));

describe("WebMCP input validation", () => {
  it("defaults to three calendar months, clamping month ends", () => {
    const { range } = parseToolInput({}, true, new Date(2026, 4, 31, 12));
    expect(range.from.getMonth()).toBe(1);
    expect(range.from.getDate()).toBe(28);
    expect(range.to.getDate()).toBe(31);
    expect(range.to.getHours()).toBe(23);
  });

  it.each([
    null, [], "{}", { from: "2026-01-01" },
    { from: "2026-02-30", to: "2026-03-01" },
    { from: "2026-03-01", to: "2026-02-01" },
    { from: "2026-01-01T00:00:00Z", to: "2026-02-01" },
    { from: "2020-01-01", to: "2026-01-01" },
    { limit: 101 }, { limit: "50" }, { offset: -1 }, { offset: 1.5 }, { query: "sql" },
  ])("rejects invalid arguments %j", (input) => {
    expect(() => parseToolInput(input, true)).toThrow();
  });

  it("accepts the same day and validates pagination only for the raw tool", () => {
    expect(parseToolInput({ from: "2026-01-01", to: "2026-01-01", limit: 1, offset: 2 }, true).offset).toBe(2);
    expect(() => parseToolInput({ limit: 1 }, false)).toThrow();
  });
});

describe("WebMCP results", () => {
  it("returns empty histories explicitly and separates raw pages from summaries", async () => {
    const tools = createWorkoutTools();
    const raw = await tools[0].execute({}) as { content: { text: string }[] };
    expect(JSON.parse(raw.content[0].text)).toMatchObject({ total: 0, workouts: [], nextOffset: null });
    const summary = await tools[1].execute({}) as { content: { text: string }[] };
    expect(JSON.parse(summary.content[0].text).summary.workoutCount).toBe(0);
    expect(JSON.parse(summary.content[0].text)).not.toHaveProperty("workouts");
  });

  it("does not query the database for invalid arguments and reports failures as tool errors", async () => {
    vi.mocked(getCompletedWorkoutLogsInRange).mockClear();
    expect(await createWorkoutTools()[0].execute({ limit: 0 })).toMatchObject({ isError: true });
    expect(getCompletedWorkoutLogsInRange).not.toHaveBeenCalled();
    vi.mocked(getCompletedWorkoutLogsInRange).mockRejectedValueOnce(new Error("Local storage unavailable"));
    expect(await createWorkoutTools()[1].execute({})).toMatchObject({ isError: true, content: [{ text: "Local storage unavailable" }] });
  });
});

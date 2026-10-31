import { readFile } from "node:fs/promises";
import { test, expect, waitForSeed } from "../fixtures/base";

for (const api of ["document", "navigator"] as const) {
  test(`${api} WebMCP reads local history and JSON export matches the summary`, async ({ page }) => {
    // A browser bridge double checks integration without requiring an experimental browser binary.
    await page.addInitScript((target) => {
      type Tool = { name: string; execute: (input: object) => Promise<unknown> };
      const tools = new Map<string, Tool>();
      Object.defineProperty(target === "document" ? document : navigator, "modelContext", {
        configurable: true,
        value: {
          registerTool(tool: Tool, options?: { signal?: AbortSignal }) {
            if (tools.has(tool.name)) throw new Error("Duplicate tool registration");
            tools.set(tool.name, tool);
            if (target === "document") {
              options?.signal?.addEventListener("abort", () => tools.delete(tool.name), { once: true });
              return Promise.resolve();
            }
          },
          unregisterTool(name: string) { tools.delete(name); },
          getTools: async () => [...tools.values()].map(({ name }) => ({ name })),
          executeTool: async (tool: { name: string }, input: object) => tools.get(tool.name)!.execute(input),
        },
      });
    }, api);
    await page.goto("/dashboard");
    await waitForSeed(page);
    const call = async (name: string, input = {}) => {
      await page.waitForFunction(async ({ api, name }) => {
        const target = (api === "document" ? document : navigator) as unknown as {
          modelContext: { getTools: () => Promise<{ name: string }[]> };
        };
        return (await target.modelContext.getTools()).some((tool) => tool.name === name);
      }, { api, name });
      return page.evaluate(async ({ api, name, input }) => {
      const context = (api === "document" ? document : navigator) as unknown as {
        modelContext: { executeTool: (tool: { name: string }, input: object) => Promise<{ content: { text: string }[] }> };
      };
      return JSON.parse((await context.modelContext.executeTool({ name }, input)).content[0].text);
      }, { api, name, input });
    };
    // Let the repository finish its seed/migration before inserting test history.
    await call("get_workouts");
    await page.evaluate(async () => {
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("fitflow_v2");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction("workoutLogs", "readwrite");
          const store = tx.objectStore("workoutLogs");
          for (const [id, weight, deleted, ended] of [
            ["first", 50, false, true], ["second", 60, false, true],
            ["deleted", 999, true, true], ["unfinished", 999, false, false],
          ] as const) {
            const date = new Date();
            date.setDate(date.getDate() - (id === "first" ? 14 : 1));
            store.put({ id, startedAt: date.toISOString(), endedAt: ended ? date.toISOString() : undefined,
              revision: 1, updatedAt: date.toISOString(), deletedAt: deleted ? date.toISOString() : undefined,
              exercises: [{ id: "exercise", exerciseId: "test-bench", workoutLogId: id, sortOrder: 0,
                sets: [{ id: "set", loggedExerciseId: "exercise", type: "working", setOrder: 0, completed: true, weight, reps: 6, rir: 2 }],
              }],
            });
          }
          tx.oncomplete = () => { db.close(); resolve(); };
          tx.onerror = () => { db.close(); reject(tx.error); };
        };
      });
    });

    const raw = await call("get_workouts", { limit: 1 });
    expect(raw.total).toBe(2);
    expect(raw.workouts[0].id).toBe("first");
    expect(raw.nextOffset).toBe(1);
    const next = await call("get_workouts", { limit: 1, offset: raw.nextOffset });
    expect(next.workouts[0].id).toBe("second");
    expect(next.nextOffset).toBeNull();
    const summary = await call("get_progress_summary");
    expect(summary.summary.workoutCount).toBe(2);
    expect(summary.summary.volumeKgReps).toBe(660);
    expect(summary.summary.exercises[0].estimated1RMChangePercent).toBe(20);

    await page.goto("/workout?tab=history");
    // Tools survive navigation and still read the same local history.
    expect((await call("get_workouts")).total).toBe(2);
    await page.getByRole("button", { name: /^3 months$/i }).click();
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /^Export JSON$/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/workout-logs-.*\.json$/);
    const report = JSON.parse(await readFile((await download.path())!, "utf8"));
    expect(report.summary).toEqual(summary.summary);
    expect(report.workouts.map((workout: { id: string }) => workout.id)).toEqual(["first", "second"]);
    expect(report.workouts[0].exercises[0].sets[0].rir).toBe(2);
    await page.screenshot({ path: test.info().outputPath("export.png") });
  });
}

import { describe, expect, it, vi } from "vitest";
import { registerWorkoutTools } from "./register";
import type { BrowserTool } from "./tools";

const tool: BrowserTool = { name: "test", description: "test", inputSchema: {}, annotations: { readOnlyHint: true, untrustedContentHint: true }, execute: async () => ({}) };

describe("WebMCP lifecycle", () => {
  it("unregisters synchronous legacy tools before a Strict Mode remount", () => {
    const names = new Set<string>();
    const context = {
      registerTool: (entry: BrowserTool) => { if (names.has(entry.name)) throw new Error("duplicate"); names.add(entry.name); },
      unregisterTool: (name: string) => { names.delete(name); },
    };
    const cleanup = registerWorkoutTools(context, [tool], true);
    expect(names.size).toBe(1);
    cleanup();
    expect(names.size).toBe(0);
    registerWorkoutTools(context, [tool], true)();
    expect(names.size).toBe(0);
  });

  it("passes an abort signal to current draft registrations and aborts on cleanup", async () => {
    let signal: AbortSignal | undefined;
    const cleanup = registerWorkoutTools({ registerTool: async (_, options) => { signal = options?.signal; } }, [tool]);
    await Promise.resolve();
    expect(signal?.aborted).toBe(false);
    cleanup();
    expect(signal?.aborted).toBe(true);
  });

  it("handles rejected registration without breaking the application", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const cleanup = registerWorkoutTools({ registerTool: async () => { throw new Error("policy disabled"); } }, [tool]);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(warn).toHaveBeenCalledOnce();
    cleanup();
    warn.mockRestore();
  });
});

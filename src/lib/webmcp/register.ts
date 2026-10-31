import type { BrowserTool } from "./tools";

export type ModelContext = {
  registerTool: (tool: BrowserTool, options?: { signal: AbortSignal }) => void | Promise<void>;
  unregisterTool?: (name: string) => void;
};

/** Modern draft uses Document + AbortSignal; early previews used Navigator + unregisterTool. */
export function registerWorkoutTools(context: ModelContext, tools: BrowserTool[], legacy = false) {
  const controller = new AbortController();
  const registered = new Set<string>();
  for (const tool of tools) {
    try {
      const pending = context.registerTool(tool, { signal: controller.signal });
      // Legacy registration is synchronous; clean it up before React Strict Mode remounts.
      if (!pending) registered.add(tool.name);
      else void pending.then(() => {
        if (controller.signal.aborted && legacy) context.unregisterTool?.(tool.name);
        else registered.add(tool.name);
      }).catch((error) => {
        if (!controller.signal.aborted) console.warn("[webmcp] Tool registration failed", error);
      });
    } catch (error) {
      console.warn("[webmcp] Tool registration failed", error);
    }
  }
  return () => {
    controller.abort();
    if (legacy) for (const name of registered) context.unregisterTool?.(name);
  };
}

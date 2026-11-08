import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const SCRIPT = readFileSync(
  path.resolve(__dirname, "../../../public/offline.js"),
  "utf8"
);

type Listener = () => void;

function runOfflinePage(opts: { onLine: boolean; ping: () => Promise<Response> }) {
  const listeners = new Map<string, Listener[]>();
  const btn = { disabled: false, textContent: "", addEventListener: vi.fn() };
  const reload = vi.fn();
  const fetch = vi.fn(opts.ping);
  const navigator = { onLine: opts.onLine };
  const sandbox = {
    document: { getElementById: () => btn },
    window: {
      addEventListener: (type: string, fn: Listener) => {
        listeners.set(type, [...(listeners.get(type) ?? []), fn]);
      },
    },
    navigator,
    location: { reload },
    fetch,
    AbortController,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    Date,
    Promise,
  };
  vm.runInNewContext(SCRIPT, sandbox);
  const emit = (type: string) => listeners.get(type)?.forEach((fn) => fn());
  return { btn, reload, fetch, navigator, emit };
}

const unreachable = () => Promise.reject(new TypeError("Failed to fetch"));
const reachable = () => Promise.resolve(new Response(null, { status: 204 }));
const flush = () => vi.advanceTimersByTimeAsync(0);

describe("offline.js", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("never reloads while the server is unreachable, even with onLine=true", async () => {
    const page = runOfflinePage({ onLine: true, ping: unreachable });
    await vi.advanceTimersByTimeAsync(10 * 60_000);
    expect(page.reload).not.toHaveBeenCalled();
    // one probe on load + bounded background polling
    expect(page.fetch.mock.calls.length).toBeLessThanOrEqual(6);
    expect(page.btn.disabled).toBe(false);
  });

  it("reloads once the probe answers 204", async () => {
    const page = runOfflinePage({ onLine: true, ping: reachable });
    await flush();
    expect(page.reload).toHaveBeenCalledTimes(1);
  });

  it("does not probe at all without a network interface", async () => {
    const page = runOfflinePage({ onLine: false, ping: reachable });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(page.fetch).not.toHaveBeenCalled();
    expect(page.btn.disabled).toBe(true);
  });

  it("recovers on the online event after the auto-probe budget is spent", async () => {
    let up = false;
    const page = runOfflinePage({
      onLine: true,
      ping: () => (up ? reachable() : unreachable()),
    });
    await vi.advanceTimersByTimeAsync(10 * 60_000);
    const probesSoFar = page.fetch.mock.calls.length;
    expect(page.reload).not.toHaveBeenCalled();

    up = true;
    page.emit("online");
    await flush();
    expect(page.fetch.mock.calls.length).toBe(probesSoFar + 1);
    expect(page.reload).toHaveBeenCalledTimes(1);
  });

  it("does not spend the budget while offline, so it still probes later", async () => {
    const page = runOfflinePage({ onLine: false, ping: unreachable });
    await vi.advanceTimersByTimeAsync(10 * 60_000);
    expect(page.fetch).not.toHaveBeenCalled();

    page.navigator.onLine = true;
    page.emit("online");
    await flush();
    expect(page.fetch).toHaveBeenCalledTimes(1);
  });
});

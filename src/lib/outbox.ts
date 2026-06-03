"use client";

import { useEffect, useRef, useState } from "react";
import { generateId } from "./utils/calculations";
import { idbDelete, idbGetAll, idbPut, type OutboxEntry } from "./db/idb";

export type Op = (...args: any[]) => Promise<any>;

export interface Outbox {
  submit(name: string, args: unknown[]): Promise<void>;
  flush(): Promise<{ succeeded: number; failed: number }>;
  pendingCount(): Promise<number>;
  onChange(cb: () => void): () => void;
  wrap<TArgs extends unknown[], TResult>(
    name: string,
    op: (...args: TArgs) => Promise<TResult>
  ): (...args: TArgs) => Promise<TResult | undefined>;
}

export interface OutboxOptions {
  maxRetries?: number;
}

export function createOutbox(
  ops: Record<string, Op>,
  options: OutboxOptions = {}
): Outbox {
  const maxRetries = options.maxRetries ?? 5;
  const listeners = new Set<() => void>();

  const notify = (): void => {
    for (const cb of listeners) cb();
  };

  const submit = async (name: string, args: unknown[]): Promise<void> => {
    const entry: OutboxEntry = {
      id: generateId(),
      name,
      args,
      createdAt: Date.now(),
      retries: 0,
    };
    await idbPut("outbox", entry);
    notify();
  };

  const flush = async (): Promise<{ succeeded: number; failed: number }> => {
    const entries = await idbGetAll("outbox");
    entries.sort((a, b) => a.createdAt - b.createdAt);
    let succeeded = 0;
    let failed = 0;

    for (const entry of entries) {
      const op = ops[entry.name];
      if (!op) {
        await idbDelete("outbox", entry.id);
        failed++;
        continue;
      }
      try {
        await op(...entry.args);
        await idbDelete("outbox", entry.id);
        succeeded++;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (entry.retries + 1 >= maxRetries) {
          await idbDelete("outbox", entry.id);
        } else {
          await idbPut("outbox", {
            ...entry,
            retries: entry.retries + 1,
            lastError: message,
          });
        }
        failed++;
      }
    }
    notify();
    return { succeeded, failed };
  };

  const pendingCount = async (): Promise<number> => {
    const all = await idbGetAll("outbox");
    return all.length;
  };

  const onChange = (cb: () => void): (() => void) => {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  };

  const wrap = <TArgs extends unknown[], TResult>(
    name: string,
    op: (...args: TArgs) => Promise<TResult>
  ): ((...args: TArgs) => Promise<TResult | undefined>) => {
    return async (...args: TArgs) => {
      try {
        return await op(...args);
      } catch {
        await submit(name, args as unknown[]);
        return undefined;
      }
    };
  };

  return { submit, flush, pendingCount, onChange, wrap };
}

export interface OutboxState {
  pending: number;
  syncing: boolean;
  flush: () => Promise<void>;
}

export function useOutboxState(outbox: Outbox): OutboxState {
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const syncingRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      const n = await outbox.pendingCount();
      if (mounted) setPending(n);
    };
    void refresh();
    const unsubscribe = outbox.onChange(refresh);
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [outbox]);

  useEffect(() => {
    const doFlush = async (): Promise<void> => {
      if (syncingRef.current) return;
      syncingRef.current = true;
      setSyncing(true);
      try {
        await outbox.flush();
      } finally {
        syncingRef.current = false;
        setSyncing(false);
      }
    };
    const handleOnline = (): void => {
      void doFlush();
    };
    const handleVisibility = (): void => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        void doFlush();
      }
    };
    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibility);
    if (navigator.onLine) void doFlush();
    return () => {
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [outbox]);

  const flush = async (): Promise<void> => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);
    try {
      await outbox.flush();
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  };

  return { pending, syncing, flush };
}

import { generateId } from "@/lib/utils/calculations";
import { idbGetAll, idbPut, idbDelete } from "@/lib/db/idb";
import type { OutboxEntry } from "@/lib/db/idb";
import type { HttpMethod } from "./types";

const MAX_RETRIES = 5;

type TransactResult = { status: number; data: unknown };

export interface QueueClient {
  request<T = unknown>(
    method: HttpMethod,
    url: string,
    body?: unknown
  ): Promise<TransactResult & { data: T }>;
}

export type QueueableMethod = "POST" | "PUT" | "DELETE";

export async function enqueue(
  client: QueueClient,
  method: QueueableMethod,
  url: string,
  body?: unknown
): Promise<OutboxEntry> {
  const entry: OutboxEntry = {
    id: generateId(),
    method,
    url,
    body,
    createdAt: Date.now(),
    retries: 0,
  };
  await idbPut("outbox", entry);
  return entry;
}

export async function listOutbox(): Promise<OutboxEntry[]> {
  const all = await idbGetAll("outbox");
  return all.sort((a, b) => a.createdAt - b.createdAt);
}

export async function pendingCount(): Promise<number> {
  return (await idbGetAll("outbox")).length;
}

export async function flushQueue(
  client: QueueClient,
  onProgress?: (remaining: number) => void
): Promise<{ succeeded: number; failed: number }> {
  const entries = await listOutbox();
  let succeeded = 0;
  let failed = 0;

  for (const entry of entries) {
    try {
      const result = await client.request<unknown>(entry.method, entry.url, entry.body);
      if (result.status >= 200 && result.status < 300) {
        await idbDelete("outbox", entry.id);
        succeeded++;
      } else if (entry.retries + 1 >= MAX_RETRIES) {
        await idbDelete("outbox", entry.id);
        failed++;
      } else {
        const next: OutboxEntry = {
          ...entry,
          retries: entry.retries + 1,
          lastError: `HTTP ${result.status}`,
        };
        await idbPut("outbox", next);
        failed++;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (entry.retries + 1 >= MAX_RETRIES) {
        await idbDelete("outbox", entry.id);
      } else {
        const next: OutboxEntry = {
          ...entry,
          retries: entry.retries + 1,
          lastError: message,
        };
        await idbPut("outbox", next);
      }
      failed++;
    }
    if (onProgress) onProgress(entries.length - succeeded - failed);
  }

  return { succeeded, failed };
}

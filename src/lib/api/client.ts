import { localTransport, type Transport } from "./local-transport";
import { enqueue, flushQueue, type QueueClient } from "./sync-queue";
import type { ApiResult, HttpMethod } from "./types";

let activeTransport: Transport = localTransport;

export function setTransport(transport: Transport): void {
  activeTransport = transport;
}

export function getTransport(): Transport {
  return activeTransport;
}

async function performRequest<T>(
  method: HttpMethod,
  url: string,
  body?: unknown
): Promise<{ status: number; data: T }> {
  return activeTransport.request<T>(method, url, body);
}

const queueClient: QueueClient = {
  async request<T>(method: HttpMethod, url: string, body?: unknown) {
    return performRequest<T>(method, url, body);
  },
};

export async function apiGet<T>(url: string): Promise<ApiResult<T>> {
  try {
    const result = await performRequest<T>("GET", url);
    if (result.status >= 200 && result.status < 300) {
      return { ok: true, data: result.data };
    }
    return { ok: false, status: result.status, error: `HTTP ${result.status}` };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function apiMutate<T>(
  method: "POST" | "PUT" | "DELETE",
  url: string,
  body?: unknown,
  options: { queueOnError?: boolean } = {}
): Promise<ApiResult<T>> {
  try {
    const result = await performRequest<T>(method, url, body);
    if (result.status >= 200 && result.status < 300) {
      return { ok: true, data: result.data };
    }
    if (options.queueOnError !== false) {
      const entry = await enqueue(queueClient, method, url, body);
      return { ok: true, queued: true, id: entry.id };
    }
    return { ok: false, status: result.status, error: `HTTP ${result.status}` };
  } catch (err) {
    if (options.queueOnError !== false) {
      const entry = await enqueue(queueClient, method, url, body);
      return { ok: true, queued: true, id: entry.id };
    }
    return {
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export const apiPost = <T>(url: string, body?: unknown) =>
  apiMutate<T>("POST", url, body);
export const apiPut = <T>(url: string, body?: unknown) =>
  apiMutate<T>("PUT", url, body);
export const apiDelete = <T>(url: string) =>
  apiMutate<T>("DELETE", url, undefined);

export async function syncOutbox(): Promise<{ succeeded: number; failed: number }> {
  return flushQueue(queueClient);
}

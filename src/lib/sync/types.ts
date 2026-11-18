import type { EntityType, SyncQueueEntry } from "@/lib/db/types";

export type SyncChange = Pick<SyncQueueEntry, "id" | "entityType" | "entityId" | "operation" | "payload" | "revision">;

export interface ServerChange {
  entityType: EntityType;
  entity: unknown;
  revision: number;
}

export interface SyncRequest {
  lastPullAt: string | null;
  changes: SyncChange[];
}

export interface SyncResponse {
  accepted: string[];
  /** Stale client changes dropped from queue; server state wins via pull */
  superseded: string[];
  rejected: Array<{ id: string; reason: string; permanent?: boolean }>;
  serverChanges: ServerChange[];
  serverTime: string;
}

export interface SyncConfig {
  enabled: boolean;
}

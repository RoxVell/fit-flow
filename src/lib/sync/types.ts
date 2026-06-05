import type { EntityType } from "@/lib/db/types";

export interface SyncChange {
  id: string;
  entityType: EntityType;
  entityId: string;
  operation: "create" | "update" | "delete";
  payload?: unknown;
  revision: number;
}

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
  rejected: Array<{ id: string; reason: string }>;
  serverChanges: ServerChange[];
  serverTime: string;
}

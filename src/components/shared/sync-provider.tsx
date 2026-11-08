"use client";

import { useEffect } from "react";
import { startSyncRunner } from "@/lib/sync/sync-service";

export function SyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(startSyncRunner, []);
  return children;
}

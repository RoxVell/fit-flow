"use client";

import { useEffect } from "react";
import { initLocalDb, useSyncState } from "@/lib/sync/sync-service";

function SyncRunner() {
  useSyncState();
  return null;
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void initLocalDb();
  }, []);

  return (
    <>
      <SyncRunner />
      {children}
    </>
  );
}
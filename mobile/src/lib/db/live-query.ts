import { addDatabaseChangeListener } from "expo-sqlite";
import { useEffect, useState, type DependencyList } from "react";

import type { TableName } from "./database";

// Re-runs a synchronous query whenever one of the given tables changes.
// Row-level change events are coalesced into one re-run per tick.
export function useLiveQuery<T>(query: () => T, tables: TableName[], deps: DependencyList = []): T {
  const [value, setValue] = useState(query);

  useEffect(() => {
    setValue(query());
    let scheduled = false;
    const subscription = addDatabaseChangeListener((event) => {
      if (!tables.includes(event.tableName as TableName) || scheduled) return;
      scheduled = true;
      queueMicrotask(() => {
        scheduled = false;
        setValue(query());
      });
    });
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return value;
}

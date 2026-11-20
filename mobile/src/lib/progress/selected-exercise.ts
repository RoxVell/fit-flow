import { useSyncExternalStore } from "react";

// Exercise chosen in Progress → Exercises. Kept outside the router so the
// picker screen can set it and the selection survives tab switches.
let selectedId: string | null = null;
const listeners = new Set<() => void>();

export function setSelectedExerciseId(id: string | null) {
  if (id === selectedId) return;
  selectedId = id;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSelectedExerciseId(): string | null {
  return useSyncExternalStore(subscribe, () => selectedId);
}

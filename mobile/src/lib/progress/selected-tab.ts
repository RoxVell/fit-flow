import { useSyncExternalStore } from "react";

export type ProgressTab = "general" | "exercises" | "body";

// Segmented Progress tab. Web keeps this in `?tab=`; we keep it off the URL
// (native segmented control) but outside React so body-log can open Body and
// the choice survives NativeTabs unmounting the screen.
let tab: ProgressTab = "general";
const listeners = new Set<() => void>();

export function setProgressTab(next: ProgressTab) {
  if (next === tab) return;
  tab = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useProgressTab(): ProgressTab {
  return useSyncExternalStore(subscribe, () => tab, () => tab);
}

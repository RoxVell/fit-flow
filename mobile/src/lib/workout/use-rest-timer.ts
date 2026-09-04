import { useEffect, useState, useSyncExternalStore } from "react";
import { Vibration } from "react-native";

type RestTimerSnapshot = {
  endTime: number | null;
  duration: number;
};

let snapshot: RestTimerSnapshot = { endTime: null, duration: 0 };
const listeners = new Set<() => void>();
let completeTimer: ReturnType<typeof setTimeout> | null = null;

function emit() {
  listeners.forEach((cb) => cb());
}

function clearCompleteTimer() {
  if (completeTimer === null) return;
  clearTimeout(completeTimer);
  completeTimer = null;
}

function armComplete(endTime: number) {
  clearCompleteTimer();
  completeTimer = setTimeout(() => {
    completeTimer = null;
    if (snapshot.endTime !== endTime) return;
    Vibration.vibrate(40);
    snapshot = { ...snapshot, endTime: null };
    emit();
  }, Math.max(0, endTime - Date.now()));
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return snapshot;
}

export function startRestTimer(seconds: number) {
  const endTime = Date.now() + seconds * 1000;
  snapshot = { endTime, duration: seconds };
  armComplete(endTime);
  emit();
}

export function stopRestTimer() {
  clearCompleteTimer();
  if (snapshot.endTime === null) return;
  snapshot = { ...snapshot, endTime: null };
  emit();
}

// Shared across the active-session screen so Hide/reopen keeps the countdown,
// matching the web Zustand rest store. Skip does not buzz; natural end does.
export function useRestTimer() {
  const current = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (current.endTime === null) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [current.endTime]);

  const remaining = current.endTime === null ? 0 : Math.max(0, Math.ceil((current.endTime - now) / 1000));

  return {
    isRunning: remaining > 0,
    remaining,
    duration: current.duration,
    start: startRestTimer,
    stop: stopRestTimer,
  };
}

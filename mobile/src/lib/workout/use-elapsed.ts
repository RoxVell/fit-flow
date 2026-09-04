import { useEffect, useState } from "react";

function secondsSince(iso: string | null): number {
  if (!iso) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
}

// Whole seconds elapsed since `startedAt`, ticking once per second.
// TODO(active-workout): pause/resume like the web's togglePause.
export function useElapsedSeconds(startedAt: string | null): number {
  const [elapsed, setElapsed] = useState(() => secondsSince(startedAt));

  useEffect(() => {
    setElapsed(secondsSince(startedAt));
    if (!startedAt) return;
    const id = setInterval(() => setElapsed(secondsSince(startedAt)), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  return elapsed;
}

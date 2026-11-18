import { useEffect, useEffectEvent } from "react";

/** Pause a landing demo when it leaves view or the visitor takes control. */
export function useDemoInterval(enabled: boolean, delay: number, tick: () => void) {
  const onTick = useEffectEvent(tick);
  useEffect(() => {
    if (!enabled) return;
    const timer = window.setInterval(onTick, delay);
    return () => window.clearInterval(timer);
  }, [enabled, delay]);
}

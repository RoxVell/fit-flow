"use client";

import { useMemo } from "react";
import { useT } from "@/lib/i18n/use-t";

const name = "Anton";

function dailyIndex(): number {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return Math.floor(start.getTime() / 86400000) % 9;
}

export function Greeting() {
  const t = useT();

  const message = useMemo(() => {
    const hour = new Date().getHours();
    const idx = dailyIndex();
    const g = t.dashboard.greetings;

    const templates = [
      () => {
        if (hour < 12) return g.morning(name);
        if (hour < 17) return g.afternoon(name);
        return g.evening(name);
      },
      () => g.returns(name),
      () => g.crush(name),
      () => g.letsGo(name),
      () => g.backAtIt(name),
      () => g.anotherGain(name),
      () => g.inBuilding(name),
      () => g.earnIt(name),
      () => g.whatsPlan(name),
    ];

    return templates[idx]();
  }, [t]);

  const [before, after] = message.split(name);

  return (
    <p className="text-2xl font-bold text-foreground font-mono">
      {before}
      <span className="text-primary">{name}</span>
      {after}
    </p>
  );
}

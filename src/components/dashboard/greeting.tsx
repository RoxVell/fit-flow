"use client";

import { useMemo } from "react";

const name = "Anton";

const templates = [
  (h: number) => {
    if (h < 12) return `Good morning, ${name}!`;
    if (h < 17) return `Good afternoon, ${name}!`;
    return `Good evening, ${name}!`;
  },
  () => `${name} returns!`,
  () => `Ready to crush it, ${name}?`,
  () => `Let's go, ${name}!`,
  () => `Back at it, ${name}!`,
  () => `Another day, another gain, ${name}!`,
  () => `${name} in the building!`,
  () => `Time to earn it, ${name}!`,
  () => `What's the plan, ${name}?`,
];

function dailyIndex(): number {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return Math.floor(start.getTime() / 86400000) % templates.length;
}

export function Greeting() {
  const message = useMemo(() => {
    const idx = dailyIndex();
    const hour = new Date().getHours();
    return templates[idx](hour);
  }, []);

  const [before, after] = message.split(name);

  return (
    <p className="text-2xl font-bold text-foreground font-mono">
      {before}<span className="text-primary">{name}</span>{after}
    </p>
  );
}

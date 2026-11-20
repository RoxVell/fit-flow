import type { Messages } from "@/lib/i18n/messages";

// The web app hardcodes the name too (src/components/dashboard/greeting.tsx);
// there is no user profile yet.
export const USER_NAME = "Anton";

type Greetings = Messages["dashboard"]["greetings"];

/** Rotates through the 9 greeting templates once per calendar day. */
export function dailyIndex(now = new Date()): number {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return Math.floor(start.getTime() / 86400000) % 9;
}

export function buildGreeting(g: Greetings, name: string, now = new Date()): string {
  const hour = now.getHours();
  const templates = [
    () => (hour < 12 ? g.morning(name) : hour < 17 ? g.afternoon(name) : g.evening(name)),
    () => g.returns(name),
    () => g.crush(name),
    () => g.letsGo(name),
    () => g.backAtIt(name),
    () => g.anotherGain(name),
    () => g.inBuilding(name),
    () => g.earnIt(name),
    () => g.whatsPlan(name),
  ];
  return templates[dailyIndex(now)]();
}

import {
  Activity,
  Dumbbell,
  LayoutGrid,
  ListChecks,
  Ruler,
  Settings2,
  Library,
} from "lucide-react";
import type { ComponentType } from "react";
import type { DesktopMessages } from "@/lib/i18n/desktop-messages";

export type NavItem = {
  href: string;
  key: keyof DesktopMessages["nav"];
  icon: ComponentType<{ className?: string }>;
  group: keyof DesktopMessages["navGroups"];
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/desktop", key: "overview", icon: LayoutGrid, group: "insights" },
  { href: "/desktop/analytics", key: "analytics", icon: Activity, group: "insights" },
  { href: "/desktop/body", key: "body", icon: Ruler, group: "insights" },
  { href: "/desktop/sessions", key: "sessions", icon: ListChecks, group: "library" },
  { href: "/desktop/exercises", key: "exercises", icon: Dumbbell, group: "library" },
  { href: "/desktop/programs", key: "programs", icon: Library, group: "library" },
  { href: "/desktop/settings", key: "settings", icon: Settings2, group: "system" },
];

export const NAV_GROUPS: (keyof DesktopMessages["navGroups"])[] = [
  "insights",
  "library",
  "system",
];

/** Longest-prefix match so nested routes still light up their nav entry. */
export function matchNavItem(pathname: string): NavItem | undefined {
  return [...NAV_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(item.href + "/"));
}

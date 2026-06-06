"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Dumbbell,
  Library,
  BarChart3,
  Settings,
} from "lucide-react";
import { useWorkoutDraft } from "@/lib/hooks/use-data";
import { useT } from "@/lib/i18n/use-t";

export function BottomNav() {
  const pathname = usePathname();
  const draft = useWorkoutDraft();
  const t = useT();
  const showWorkoutDot = draft?.activeWorkoutId != null;

  const navItems = [
    { href: "/dashboard", label: t.nav.dashboard, icon: LayoutDashboard },
    { href: "/workout", label: t.nav.workout, icon: Dumbbell },
    { href: "/programs/library", label: t.nav.programs, icon: Library },
    { href: "/progress", label: t.nav.progress, icon: BarChart3 },
    { href: "/settings", label: t.nav.settings, icon: Settings },
  ];

  return (
    <nav className="absolute bottom-0 left-0 right-0 z-50 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto grid h-[4.25rem] max-w-lg grid-cols-5 items-center px-0.5">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          const isWorkout = item.href === "/workout";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex min-w-0 flex-col items-center gap-0.5 px-0.5 py-1.5 text-[10px] text-xs font-medium leading-tight transition-colors sm:text-[11px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="max-w-full truncate text-center">{item.label}</span>
              {isWorkout && showWorkoutDot && (
                <span
                  aria-hidden="true"
                  className="absolute top-0.5 right-1 h-1.5 w-1.5 rounded-full bg-green-500 sm:right-2"
                />
              )}
              {isWorkout && showWorkoutDot && (
                <span className="sr-only">{t.nav.activeSession}</span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

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

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/workout", label: "Workout", icon: Dumbbell },
  { href: "/programs/library", label: "Programs", icon: Library },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const draft = useWorkoutDraft();
  const showWorkoutDot = draft?.activeWorkoutId != null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          const isWorkout = item.href === "/workout";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
              {isWorkout && showWorkoutDot && (
                <span
                  aria-hidden="true"
                  className="absolute top-1 right-3 h-2 w-2 rounded-full bg-green-500"
                />
              )}
              {isWorkout && showWorkoutDot && (
                <span className="sr-only">Active session in progress</span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, Flame, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDt } from "@/lib/i18n/use-dt";
import { useWorkoutDraft } from "@/lib/hooks/use-data";
import { NAV_GROUPS, NAV_ITEMS, matchNavItem } from "./nav";

export function DesktopSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const dt = useDt();
  const draft = useWorkoutDraft();
  const active = matchNavItem(pathname);
  const hasDraft = draft?.activeWorkoutId != null;

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        "z-30 flex h-full shrink-0 flex-col border-r border-[var(--desk-line)] bg-[color-mix(in_oklch,var(--sidebar)_88%,transparent)] backdrop-blur-xl transition-[width] duration-200 ease-out",
        collapsed ? "w-[var(--desk-rail-collapsed)]" : "w-[var(--desk-rail)]"
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          "flex h-[var(--desk-topbar)] shrink-0 items-center border-b border-[var(--desk-line)]",
          collapsed ? "justify-center px-0" : "gap-2.5 px-4"
        )}
      >
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Flame className="size-4" />
        </span>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm leading-tight font-semibold tracking-tight">
              FitFlow
            </p>
            <p className="truncate text-[0.625rem] leading-tight text-muted-foreground">
              {dt.workspace}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="desk-scroll min-h-0 flex-1 overflow-y-auto px-2 py-3">
        {NAV_GROUPS.map((group) => {
          const items = NAV_ITEMS.filter((item) => item.group === group);
          if (items.length === 0) return null;
          return (
            <div key={group} className="mb-4 last:mb-0">
              {!collapsed && (
                <p className="desk-label px-2 pb-1.5">{dt.navGroups[group]}</p>
              )}
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = active?.href === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={collapsed ? dt.nav[item.key] : undefined}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "group relative flex items-center rounded-lg text-sm font-medium transition-colors",
                          collapsed ? "justify-center px-0 py-2" : "gap-2.5 px-2 py-1.5",
                          isActive
                            ? "bg-primary/12 text-primary"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        )}
                      >
                        {isActive && (
                          <span
                            aria-hidden
                            className="absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-primary"
                          />
                        )}
                        <Icon className="size-4 shrink-0" />
                        {!collapsed && (
                          <span className="truncate">{dt.nav[item.key]}</span>
                        )}
                        {!collapsed && item.key === "sessions" && hasDraft && (
                          <span className="ml-auto size-1.5 rounded-full bg-emerald-500" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="shrink-0 space-y-1 border-t border-[var(--desk-line)] p-2">
        <Link
          href="/dashboard"
          title={collapsed ? dt.window.mobileView : undefined}
          className={cn(
            "flex items-center rounded-lg text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground",
            collapsed ? "justify-center py-2" : "gap-2.5 px-2 py-1.5"
          )}
        >
          <Smartphone className="size-4 shrink-0" />
          {!collapsed && <span className="truncate">{dt.window.mobileView}</span>}
        </Link>
        <button
          type="button"
          onClick={onToggle}
          title={collapsed ? dt.window.expand : dt.window.collapse}
          className={cn(
            "flex w-full items-center rounded-lg text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground",
            collapsed ? "justify-center py-2" : "gap-2.5 px-2 py-1.5"
          )}
        >
          {collapsed ? (
            <ChevronsRight className="size-4 shrink-0" />
          ) : (
            <ChevronsLeft className="size-4 shrink-0" />
          )}
          {!collapsed && <span className="truncate">{dt.window.collapse}</span>}
        </button>
      </div>
    </aside>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Languages, Moon, Play, Search, Sun, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDt } from "@/lib/i18n/use-dt";
import { useLocale, useSetLocale } from "@/lib/i18n/locale-context";
import { useWorkoutDraft } from "@/lib/hooks/use-data";
import { useIsHydrated, useOnline } from "@/lib/desktop/client-state";
import { matchNavItem } from "./nav";

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
    >
      {children}
    </button>
  );
}

export function DesktopTopbar({ onSearch }: { onSearch: () => void }) {
  const pathname = usePathname();
  const dt = useDt();
  const locale = useLocale();
  const setLocale = useSetLocale();
  const { resolvedTheme, setTheme } = useTheme();
  const draft = useWorkoutDraft();
  const mounted = useIsHydrated();
  const online = useOnline();

  const active = matchNavItem(pathname);
  const hasDraft = draft?.activeWorkoutId != null;

  return (
    <header className="sticky top-0 z-20 flex h-[var(--desk-topbar)] shrink-0 items-center gap-3 border-b border-[var(--desk-line)] bg-[color-mix(in_oklch,var(--background)_82%,transparent)] px-4 backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-sm font-semibold tracking-tight">
          {active ? dt.nav[active.key] : "FitFlow"}
        </span>
        {active && (
          <>
            <span className="text-muted-foreground/40">/</span>
            <span className="hidden truncate text-xs text-muted-foreground lg:block">
              {dt.subtitles[active.key]}
            </span>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={onSearch}
        className="group ml-auto flex h-8 w-full max-w-xs items-center gap-2 rounded-lg border border-[var(--desk-line)] bg-background/60 px-2.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      >
        <Search className="size-3.5" />
        <span className="truncate">{dt.search.placeholder}</span>
        <kbd className="desk-num ml-auto hidden rounded border border-[var(--desk-line)] bg-muted/60 px-1.5 py-0.5 text-[0.625rem] font-medium sm:block">
          ⌘K
        </kbd>
      </button>

      <div className="flex shrink-0 items-center gap-1">
        <span
          className={cn(
            "hidden items-center gap-1.5 rounded-lg border border-[var(--desk-line)] px-2 py-1 text-[0.6875rem] font-medium xl:inline-flex",
            online ? "text-muted-foreground" : "text-amber-500"
          )}
        >
          {online ? (
            <span className="size-1.5 rounded-full bg-emerald-500" />
          ) : (
            <WifiOff className="size-3" />
          )}
          {online ? dt.window.online : dt.window.offline}
        </span>

        <IconButton
          label={locale === "ru" ? "English" : "Русский"}
          onClick={() => setLocale(locale === "ru" ? "en" : "ru")}
        >
          <span className="flex items-center gap-1 text-[0.625rem] font-semibold">
            <Languages className="size-4" />
            {locale.toUpperCase()}
          </span>
        </IconButton>

        <IconButton
          label="Theme"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          {mounted && resolvedTheme === "dark" ? (
            <Moon className="size-4" />
          ) : (
            <Sun className="size-4" />
          )}
        </IconButton>

        <Link
          href={hasDraft ? "/workout/active" : "/workout"}
          className="ml-1 inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Play className="size-3.5" />
          {hasDraft ? dt.window.resumeWorkout : dt.window.startWorkout}
        </Link>
      </div>
    </header>
  );
}

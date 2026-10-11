"use client";

import * as React from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Delta } from "@/lib/desktop/analytics";
import { useDt } from "@/lib/i18n/use-dt";

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

export function Panel({
  className,
  accent,
  ...props
}: React.ComponentProps<"section"> & { accent?: boolean }) {
  return (
    <section
      className={cn("desk-panel flex flex-col", accent && "desk-panel-accent", className)}
      {...props}
    />
  );
}

export function PanelHeader({
  title,
  hint,
  icon: Icon,
  action,
  className,
}: {
  title: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex items-start justify-between gap-4 border-b border-[var(--desk-line)] px-4 py-3",
        className
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="size-3.5 shrink-0 text-primary" />}
          <h2 className="truncate text-sm font-semibold tracking-tight">{title}</h2>
        </div>
        {hint && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

export function PanelBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("min-h-0 flex-1 p-4", className)} {...props} />;
}

/* ------------------------------------------------------------------ */
/* Delta badge                                                         */
/* ------------------------------------------------------------------ */

export function DeltaBadge({
  percent,
  invert = false,
  fallback,
  className,
}: {
  percent: number | null;
  /** When true a decrease is the good outcome (waist, body fat). */
  invert?: boolean;
  fallback?: string;
  className?: string;
}) {
  if (percent === null) {
    return (
      <span className={cn("text-[0.6875rem] text-muted-foreground", className)}>
        {fallback ?? "—"}
      </span>
    );
  }

  const flat = Math.abs(percent) < 0.05;
  const good = invert ? percent < 0 : percent > 0;
  const Icon = flat ? Minus : percent > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={cn(
        "desk-num inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[0.6875rem] font-semibold",
        flat
          ? "bg-muted text-muted-foreground"
          : good
            ? "bg-emerald-500/12 text-emerald-500"
            : "bg-rose-500/12 text-rose-500",
        className
      )}
    >
      <Icon className="size-3" />
      {Math.abs(percent).toFixed(1)}%
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Stat tile                                                           */
/* ------------------------------------------------------------------ */

export function StatTile({
  label,
  value,
  unit,
  delta,
  caption,
  icon: Icon,
  invert,
  accent,
  className,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  delta?: Delta;
  caption?: string;
  icon?: React.ComponentType<{ className?: string }>;
  invert?: boolean;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "desk-panel group relative overflow-hidden px-4 py-3.5 transition-colors hover:border-[color-mix(in_oklch,var(--primary)_35%,transparent)]",
        className
      )}
    >
      {accent && (
        <span
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-10 size-32 rounded-full bg-primary/10 blur-2xl"
        />
      )}
      <div className="flex items-center justify-between gap-2">
        <span title={label} className="desk-label truncate">
          {label}
        </span>
        {Icon && (
          <Icon className="size-3.5 shrink-0 text-muted-foreground/70 transition-colors group-hover:text-primary" />
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="desk-num text-2xl leading-none font-semibold">{value}</span>
        {unit && (
          <span className="text-xs font-medium text-muted-foreground">{unit}</span>
        )}
      </div>
      <div className="mt-2.5 flex items-center gap-1.5">
        {delta && <DeltaBadge percent={delta.percent} invert={invert} />}
        {caption && (
          <span
            title={caption}
            className="truncate text-[0.6875rem] text-muted-foreground"
          >
            {caption}
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sparkline                                                           */
/* ------------------------------------------------------------------ */

export function Sparkline({
  values,
  className,
  width = 72,
  height = 22,
  stroke,
}: {
  values: number[];
  className?: string;
  width?: number;
  height?: number;
  stroke?: string;
}) {
  if (values.length < 2) {
    return <div className={cn("h-[22px] w-[72px]", className)} />;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = width / (values.length - 1);
  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / span) * (height - 3) - 1.5;
      return x.toFixed(1) + "," + y.toFixed(1);
    })
    .join(" ");

  const rising = values[values.length - 1] >= values[0];
  const color = stroke ?? (rising ? "var(--color-emerald-500,#10b981)" : "#f43f5e");

  return (
    <svg
      viewBox={"0 0 " + width + " " + height}
      width={width}
      height={height}
      className={cn("overflow-visible", className)}
      aria-hidden
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Segmented control                                                   */
/* ------------------------------------------------------------------ */

export function Segmented<T extends string | number>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border border-[var(--desk-line)] bg-background/60 p-0.5",
        className
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Misc                                                                */
/* ------------------------------------------------------------------ */

export function EmptyState({
  title,
  description,
  action,
  icon: Icon,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 px-6 py-12 text-center",
        className
      )}
    >
      {Icon && (
        <div className="mb-1 rounded-xl border border-[var(--desk-line)] bg-muted/40 p-2.5">
          <Icon className="size-5 text-muted-foreground" />
        </div>
      )}
      <p className="text-sm font-medium">{title}</p>
      {description && (
        <p className="max-w-xs text-xs text-muted-foreground">{description}</p>
      )}
      {action}
    </div>
  );
}

export function Tag({
  children,
  color,
  className,
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-[var(--desk-line)] bg-muted/40 px-1.5 py-0.5 text-[0.6875rem] font-medium text-muted-foreground",
        className
      )}
    >
      {color && (
        <span
          aria-hidden
          className="size-1.5 rounded-full"
          style={{ background: color }}
        />
      )}
      {children}
    </span>
  );
}

export function MetricRow({
  label,
  value,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-b border-[var(--desk-line)] py-2 last:border-0",
        className
      )}
    >
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="desk-num text-xs font-semibold">{value}</span>
    </div>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl border border-[var(--desk-line)] bg-muted/40",
        className
      )}
    />
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="desk-num inline-grid min-w-4 place-items-center rounded border border-[var(--desk-line)] bg-muted/60 px-1 text-[0.625rem] leading-4 font-medium">
      {children}
    </kbd>
  );
}

/** Footer strip that advertises a list pane's keyboard controls. */
export function ListKeysHint({ className }: { className?: string }) {
  const dt = useDt();
  return (
    <div
      className={cn(
        "hidden shrink-0 items-center gap-3 border-t border-[var(--desk-line)] px-4 py-2 text-[0.625rem] text-muted-foreground xl:flex",
        className
      )}
    >
      <span className="inline-flex items-center gap-1">
        <Kbd>↑</Kbd>
        <Kbd>↓</Kbd>
        {dt.keys.navigate}
      </span>
      <span className="inline-flex items-center gap-1">
        <Kbd>/</Kbd>
        {dt.keys.search}
      </span>
    </div>
  );
}

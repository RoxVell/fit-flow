"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** Shared chart palette. Warm primary first so single-series charts stay on brand. */
export const CHART_COLORS = [
  "var(--color-chart-1)",
  "#38bdf8",
  "#a78bfa",
  "#34d399",
  "#fbbf24",
  "#f472b6",
  "#22d3ee",
  "#fb7185",
  "#94a3b8",
];

export const AXIS_STYLE = {
  fontSize: 11,
  fill: "var(--color-muted-foreground)",
} as const;

export const GRID_STROKE = "color-mix(in oklch, var(--color-foreground) 10%, transparent)";

type TooltipRow = { label: string; value: string; color?: string };

/**
 * Shape recharts hands to a custom `content` renderer. Declared structurally so
 * a typed accessor for one chart's datum still satisfies recharts' generics.
 */
export type TooltipRenderProps<T> = {
  active?: boolean;
  label?: string | number;
  payload?: readonly { payload?: T }[];
};

export function ChartTooltip({
  title,
  rows,
}: {
  title: string;
  rows: TooltipRow[];
}) {
  return (
    <div className="desk-panel min-w-[9rem] px-2.5 py-2 shadow-lg">
      <p className="mb-1.5 text-[0.6875rem] font-semibold text-muted-foreground">
        {title}
      </p>
      <div className="space-y-1">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-2 text-xs">
            {row.color && (
              <span
                aria-hidden
                className="size-1.5 shrink-0 rounded-full"
                style={{ background: row.color }}
              />
            )}
            <span className="text-muted-foreground">{row.label}</span>
            <span className="desk-num ml-auto font-semibold">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartFrame({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("w-full", className)}>{children}</div>;
}

export function Legend({
  items,
  className,
}: {
  items: { label: string; color: string }[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-1", className)}>
      {items.map((item) => (
        <span
          key={item.label}
          className="inline-flex items-center gap-1.5 text-[0.6875rem] text-muted-foreground"
        >
          <span
            aria-hidden
            className="size-2 rounded-[3px]"
            style={{ background: item.color }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

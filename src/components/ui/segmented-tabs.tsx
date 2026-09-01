"use client";

import {
  useId,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SegmentedTabItem<T extends string> {
  value: T;
  label: ReactNode;
  icon?: LucideIcon;
  /** Accessible name when `label` is not plain text (e.g. icon-only). */
  ariaLabel?: string;
}

const variantStyles = {
  muted: {
    container: "bg-muted/70",
    pill: "bg-background shadow-sm ring-1 ring-foreground/5 dark:bg-card",
  },
  card: {
    container: "border bg-muted/50",
    pill: "bg-card shadow-sm ring-1 ring-foreground/5",
  },
} as const;

interface SegmentedTabsProps<T extends string> {
  items: SegmentedTabItem<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  variant?: "muted" | "card";
  /** `tabs` = tablist + arrow keys; `toggle` = pressed group. */
  selectionMode?: "tabs" | "toggle";
  /** Equal flex widths. Turn off so segments size to their labels. */
  equalWidth?: boolean;
  /** Ellipsis overflowing labels. Off for short controls like chart periods. */
  truncate?: boolean;
  className?: string;
  buttonClassName?: string;
  ariaLabel?: string;
}

export function SegmentedTabs<T extends string>({
  items,
  value,
  onChange,
  variant = "muted",
  selectionMode = "toggle",
  equalWidth = true,
  truncate = true,
  className,
  buttonClassName,
  ariaLabel,
}: SegmentedTabsProps<T>) {
  const layoutId = useId();
  const styles = variantStyles[variant];
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const isTabs = selectionMode === "tabs";

  const selectIndex = (index: number) => {
    const item = items[index];
    if (!item) return;
    onChange(item.value);
    buttonRefs.current[index]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isTabs || items.length === 0) return;

    const currentIndex = Math.max(
      0,
      items.findIndex((item) => item.value === value)
    );
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % items.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (currentIndex - 1 + items.length) % items.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = items.length - 1;
    }

    if (nextIndex === null) return;
    event.preventDefault();
    selectIndex(nextIndex);
  };

  return (
    <div
      role={isTabs ? "tablist" : "group"}
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={cn(
        "flex rounded-xl p-1",
        !truncate && "min-w-min",
        styles.container,
        className
      )}
    >
      {items.map((item, index) => {
        const isActive = item.value === value;
        const Icon = item.icon;
        return (
          <button
            key={item.value}
            ref={(node) => {
              buttonRefs.current[index] = node;
            }}
            type="button"
            role={isTabs ? "tab" : undefined}
            aria-label={item.ariaLabel}
            {...(isTabs
              ? {
                  "aria-selected": isActive,
                  tabIndex: isActive || (value === undefined && index === 0) ? 0 : -1,
                }
              : { "aria-pressed": isActive })}
            onClick={() => onChange(item.value)}
            className={cn(
              "relative flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              equalWidth ? "flex-1" : "shrink-0",
              truncate ? "min-w-0" : "min-w-min whitespace-nowrap",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
              buttonClassName
            )}
          >
            {isActive && (
              <motion.span
                layoutId={layoutId}
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
                className={cn("absolute inset-0 rounded-lg", styles.pill)}
              />
            )}
            <span
              className={cn(
                "relative flex items-center gap-1.5",
                truncate ? "min-w-0" : "min-w-min"
              )}
            >
              {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden />}
              <span className={cn(truncate && "truncate")}>{item.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { useId, type ReactNode } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SegmentedTabItem<T extends string> {
  value: T;
  label: ReactNode;
  icon?: LucideIcon;
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
  className?: string;
  buttonClassName?: string;
  ariaLabel?: string;
}

export function SegmentedTabs<T extends string>({
  items,
  value,
  onChange,
  variant = "muted",
  className,
  buttonClassName,
  ariaLabel,
}: SegmentedTabsProps<T>) {
  const layoutId = useId();
  const styles = variantStyles[variant];

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn("flex rounded-xl p-1", styles.container, className)}
    >
      {items.map((item) => {
        const isActive = item.value === value;
        const Icon = item.icon;
        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(item.value)}
            className={cn(
              "relative flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
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
            <span className="relative flex min-w-0 items-center gap-1.5">
              {Icon && <Icon className="h-4 w-4 shrink-0" />}
              <span className="truncate">{item.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

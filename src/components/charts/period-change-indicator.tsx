"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import type { PeriodChange } from "@/lib/charts/domain";
import { formatPeriodChange } from "@/lib/charts/domain";
import { cn } from "@/lib/utils";

interface PeriodChangeIndicatorProps {
  change: PeriodChange;
  unit?: string;
  variant?: "absolute-and-percent" | "percent-points";
  className?: string;
}

export function PeriodChangeIndicator({
  change,
  unit = "",
  variant = "absolute-and-percent",
  className,
}: PeriodChangeIndicatorProps) {
  const isPositive = change.absolute > 0;
  const isNeutral = change.absolute === 0;
  const { absoluteLabel, percentLabel } = formatPeriodChange(change, unit);
  const sign = (n: number) => (n > 0 ? "+" : n < 0 ? "" : "");
  const percentPointsLabel = `${sign(change.absolute)}${change.absolute}%`;

  return (
    <p className={cn("flex items-center gap-1 text-lg font-bold", className)}>
      {isNeutral ? null : isPositive ? (
        <TrendingUp className="h-5 w-5 shrink-0 text-green-500" />
      ) : (
        <TrendingDown className="h-5 w-5 shrink-0 text-red-500" />
      )}
      <span
        className={cn(
          isNeutral
            ? "text-muted-foreground"
            : isPositive
              ? "text-green-500"
              : "text-red-500"
        )}
      >
        {variant === "percent-points" ? (
          percentPointsLabel
        ) : (
          <>
            {absoluteLabel}
            <span className="text-muted-foreground font-normal"> · </span>
            {percentLabel}
          </>
        )}
      </span>
    </p>
  );
}

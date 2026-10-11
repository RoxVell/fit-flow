"use client";

import type { MuscleSlice } from "@/lib/desktop/analytics";
import { BODY_PART_CHART_COLORS } from "@/lib/charts/body-part-colors";
import { formatCompact } from "@/lib/desktop/format";
import { useLocale } from "@/lib/i18n/locale-context";
import { useDt } from "@/lib/i18n/use-dt";

/** Ranked horizontal bars — easier to read than a pie for nine categories. */
export function DistributionBars({ data }: { data: MuscleSlice[] }) {
  const dt = useDt();
  const locale = useLocale();

  const rows = [...data].filter((slice) => slice.sets > 0).sort((a, b) => b.sets - a.sets);
  const max = Math.max(1, ...rows.map((row) => row.sets));

  if (rows.length === 0) {
    return <p className="py-6 text-center text-xs text-muted-foreground">{dt.panels.noData}</p>;
  }

  return (
    <ul className="space-y-3">
      {rows.map((row) => {
        const delta = row.sets - row.previousSets;
        return (
          <li
            key={row.bodyPart}
            title={formatCompact(row.volume, locale) + " " + dt.units.kg}
          >
            <div className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
              <span className="min-w-0 truncate font-medium">
                {dt.bodyParts[row.bodyPart]}
                <span className="desk-num ml-1.5 font-normal text-muted-foreground">
                  {row.share.toFixed(0)}%
                </span>
              </span>
              <span className="desk-num shrink-0 text-muted-foreground">
                {row.sets} {dt.units.sets}
                {row.previousSets > 0 && delta !== 0 && (
                  <span
                    className={
                      "ml-1.5 " + (delta > 0 ? "text-emerald-500" : "text-rose-500")
                    }
                  >
                    {delta > 0 ? "+" : ""}
                    {delta}
                  </span>
                )}
              </span>
            </div>
            <div className="relative h-1.5 overflow-hidden rounded-full bg-muted/60">
              <span
                className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500"
                style={{
                  width: (row.sets / max) * 100 + "%",
                  background: BODY_PART_CHART_COLORS[row.bodyPart],
                }}
              />
              {row.previousSets > 0 && (
                <span
                  aria-hidden
                  className="absolute inset-y-0 w-px bg-foreground/45"
                  style={{ left: Math.min(100, (row.previousSets / max) * 100) + "%" }}
                />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

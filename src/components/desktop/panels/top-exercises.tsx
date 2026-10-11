"use client";

import { BODY_PART_CHART_COLORS } from "@/lib/charts/body-part-colors";
import type { ExerciseStatRow } from "@/lib/desktop/analytics";
import { formatCompact, formatNumber, formatRelative } from "@/lib/desktop/format";
import { useLocale } from "@/lib/i18n/locale-context";
import { useDt } from "@/lib/i18n/use-dt";
import { cn } from "@/lib/utils";
import { DeltaBadge, Sparkline, Tag } from "@/components/desktop/ui";

export function TopExercisesTable({
  rows,
  selectedId,
  onSelect,
  showTrend = true,
}: {
  rows: ExerciseStatRow[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  showTrend?: boolean;
}) {
  const dt = useDt();
  const locale = useLocale();

  return (
    <table className="w-full text-sm">
      {/* Sticky so long lists keep their column labels while scrolling. */}
      <thead className="sticky top-0 z-10 bg-[var(--desk-panel)]">
        <tr className="border-b border-[var(--desk-line)]">
          <th className="desk-label px-4 py-2 text-left font-semibold">
            {dt.table.exercise}
          </th>
          <th className="desk-label px-4 py-2 text-right font-semibold">
            {dt.table.sessions}
          </th>
          <th className="desk-label px-4 py-2 text-right font-semibold">
            {dt.table.sets}
          </th>
          <th className="desk-label px-4 py-2 text-right font-semibold">
            {dt.table.volume}
          </th>
          <th className="desk-label px-4 py-2 text-right font-semibold">
            {dt.table.e1rm}
          </th>
          {showTrend && (
            <th className="desk-label px-4 py-2 text-right font-semibold">
              {dt.table.trend}
            </th>
          )}
          <th className="desk-label px-4 py-2 text-right font-semibold">
            {dt.table.lastDone}
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.exerciseId}
            data-selected={selectedId === row.exerciseId}
            onClick={() => onSelect?.(row.exerciseId)}
            className={cn(
              "desk-row border-b border-[var(--desk-line)] last:border-0 hover:bg-muted/40",
              onSelect && "cursor-pointer"
            )}
          >
            <td className="px-4 py-2.5">
              {/* A capped width instead of `max-w-0`: auto layout otherwise
                  starves the name column to feed the numeric ones. */}
              <div
                title={row.name}
                className="w-[clamp(9rem,22vw,20rem)] truncate text-xs font-medium"
              >
                {row.name}
              </div>
              <Tag
                className="mt-1"
                color={BODY_PART_CHART_COLORS[row.bodyPart]}
              >
                {dt.bodyParts[row.bodyPart]}
              </Tag>
            </td>
            <td className="desk-num px-4 py-2.5 text-right text-xs text-muted-foreground">
              {row.sessions}
            </td>
            <td className="desk-num px-4 py-2.5 text-right text-xs text-muted-foreground">
              {row.sets}
            </td>
            <td className="desk-num px-4 py-2.5 text-right text-xs font-semibold">
              {formatCompact(row.volume, locale)}
              <span className="ml-1 font-normal text-muted-foreground">
                {dt.units.kg}
              </span>
            </td>
            <td className="desk-num px-4 py-2.5 text-right text-xs">
              {row.bestE1rm > 0 ? formatNumber(row.bestE1rm, locale, 1) : "—"}
            </td>
            {showTrend && (
              <td className="px-4 py-2.5">
                <div className="flex items-center justify-end gap-2">
                  {/* Colour follows the badge so the two never disagree. */}
                  <Sparkline
                    values={row.sparkline}
                    stroke={
                      row.trend == null
                        ? "var(--color-muted-foreground)"
                        : row.trend >= 0
                          ? "#10b981"
                          : "#f43f5e"
                    }
                  />
                  <DeltaBadge percent={row.trend} />
                </div>
              </td>
            )}
            <td className="px-4 py-2.5 text-right text-[0.6875rem] whitespace-nowrap text-muted-foreground">
              {row.lastPerformed ? formatRelative(row.lastPerformed, locale) : "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

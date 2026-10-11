"use client";

import type { WorkoutLogEntity } from "@/lib/db/types";
import {
  logDuration,
  logSetCount,
  logVolume,
} from "@/lib/desktop/analytics";
import { formatClock, formatDay, formatNumber } from "@/lib/desktop/format";
import { useLocale } from "@/lib/i18n/locale-context";
import { useDt } from "@/lib/i18n/use-dt";
import { cn } from "@/lib/utils";

export function SessionsTable({
  logs,
  selectedId,
  onSelect,
  compact = false,
}: {
  logs: WorkoutLogEntity[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  compact?: boolean;
}) {
  const dt = useDt();
  const locale = useLocale();

  return (
    <table className="w-full text-sm">
      {/* Sticky so long lists keep their column labels while scrolling. */}
      <thead className="sticky top-0 z-10 bg-[var(--desk-panel)]">
        <tr className="border-b border-[var(--desk-line)]">
          <th className="desk-label px-4 py-2 text-left font-semibold">
            {dt.table.date}
          </th>
          <th className="desk-label px-4 py-2 text-left font-semibold">
            {dt.table.session}
          </th>
          {!compact && (
            <th className="desk-label px-4 py-2 text-right font-semibold">
              {dt.table.duration}
            </th>
          )}
          <th className="desk-label px-4 py-2 text-right font-semibold">
            {dt.table.sets}
          </th>
          <th className="desk-label px-4 py-2 text-right font-semibold">
            {dt.table.volume}
          </th>
        </tr>
      </thead>
      <tbody>
        {logs.map((log) => {
          const duration = logDuration(log);
          const selected = selectedId === log.id;
          return (
            <tr
              key={log.id}
              data-selected={selected}
              className={cn(
                "desk-row cursor-pointer border-b border-[var(--desk-line)] last:border-0 hover:bg-muted/40"
              )}
              onClick={() => onSelect?.(log.id)}
            >
              <td className="px-4 py-2.5 align-middle">
                <div className="desk-num text-xs font-medium">
                  {formatDay(log.startedAt, locale)}
                </div>
                <div className="desk-num text-[0.625rem] text-muted-foreground">
                  {formatClock(log.startedAt, locale)}
                </div>
              </td>
              <td className="max-w-0 px-4 py-2.5 align-middle">
                <div className="truncate text-xs font-medium">
                  {log.sessionName ?? log.programName ?? dt.nav.sessions}
                </div>
                <div className="truncate text-[0.625rem] text-muted-foreground">
                  {log.programName ?? "—"} · {log.exercises.length}{" "}
                  {dt.sessions.exercises.toLowerCase()}
                </div>
              </td>
              {!compact && (
                <td className="desk-num px-4 py-2.5 text-right align-middle text-xs text-muted-foreground">
                  {duration ? duration + " " + dt.units.min : "—"}
                </td>
              )}
              <td className="desk-num px-4 py-2.5 text-right align-middle text-xs text-muted-foreground">
                {logSetCount(log)}
              </td>
              <td className="desk-num px-4 py-2.5 text-right align-middle text-xs font-semibold">
                {formatNumber(Math.round(logVolume(log)), locale)}
                <span className="ml-1 font-normal text-muted-foreground">
                  {dt.units.kg}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

"use client";

import { Fragment, useMemo } from "react";
import type { CalendarCell } from "@/lib/desktop/analytics";
import { formatFullDay, formatNumber, weekdayLabels } from "@/lib/desktop/format";
import { useLocale } from "@/lib/i18n/locale-context";
import { useDt } from "@/lib/i18n/use-dt";

const LEVELS = [
  "color-mix(in oklch, var(--color-foreground) 7%, transparent)",
  "color-mix(in oklch, var(--color-chart-1) 28%, transparent)",
  "color-mix(in oklch, var(--color-chart-1) 48%, transparent)",
  "color-mix(in oklch, var(--color-chart-1) 72%, transparent)",
  "var(--color-chart-1)",
];

function levelFor(volume: number, max: number): number {
  if (volume <= 0) return 0;
  if (max <= 0) return 1;
  const ratio = volume / max;
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.25) return 2;
  return 1;
}

/** GitHub-style year grid: one column per week, one square per day. */
export function ConsistencyHeatmap({ data }: { data: CalendarCell[] }) {
  const locale = useLocale();
  const dt = useDt();
  const days = weekdayLabels(locale);
  // Grid rows run Monday-first; `weekdayLabels` starts on Sunday.
  const mondayFirst = [...days.slice(1), days[0]];

  const { columns, max, monthTicks } = useMemo(() => {
    const cells = [...data];
    if (cells.length === 0) return { columns: [], max: 0, monthTicks: [] };

    // Pad the first week so rows line up with weekdays (Monday-first).
    const firstDate = new Date(cells[0].date + "T00:00:00");
    const offset = (firstDate.getDay() + 6) % 7;
    const padded: (CalendarCell | null)[] = [
      ...Array.from({ length: offset }, () => null),
      ...cells,
    ];

    const cols: (CalendarCell | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) {
      cols.push(padded.slice(i, i + 7));
    }

    const ticks: { index: number; label: string }[] = [];
    let lastMonth = -1;
    cols.forEach((column, index) => {
      const first = column.find((cell): cell is CalendarCell => cell !== null);
      if (!first) return;
      const month = new Date(first.date + "T00:00:00").getMonth();
      if (month !== lastMonth) {
        lastMonth = month;
        ticks.push({
          index,
          label: new Date(first.date + "T00:00:00").toLocaleDateString(
            locale === "ru" ? "ru-RU" : "en-US",
            { month: "short" }
          ),
        });
      }
    });

    return {
      columns: cols,
      max: Math.max(...cells.map((c) => c.volume)),
      monthTicks: ticks,
    };
  }, [data, locale]);

  const trainedDays = data.filter((cell) => cell.workouts > 0).length;

  return (
    <div className="space-y-2">
      <div className="desk-scroll overflow-x-auto pb-1">
        {/* Cells are fluid so a year of weeks fills the panel; below ~11px a
            cell stops being readable, so the grid scrolls instead. */}
        <div
          className="grid gap-[3px]"
          style={{
            gridTemplateColumns:
              "1.75rem repeat(" + columns.length + ", minmax(11px, 1fr))",
            maxWidth: "calc(1.75rem + " + columns.length + " * 22px)",
          }}
        >
          <span />
          {columns.map((_, index) => {
            const tick = monthTicks.find((t) => t.index === index);
            return (
              <span
                key={index}
                className="overflow-visible text-[0.625rem] leading-4 whitespace-nowrap text-muted-foreground"
              >
                {tick ? tick.label : ""}
              </span>
            );
          })}

          {mondayFirst.map((day, rowIndex) => (
            <Fragment key={rowIndex}>
              <span className="self-center pr-1 text-right text-[0.625rem] leading-none text-muted-foreground">
                {rowIndex % 2 === 0 ? day : ""}
              </span>
              {columns.map((column, columnIndex) => {
                const cell = column[rowIndex] ?? null;
                if (!cell) {
                  return <span key={columnIndex} className="aspect-square" />;
                }
                const level = levelFor(cell.volume, max);
                return (
                  <span
                    key={columnIndex}
                    title={
                      formatFullDay(cell.date + "T00:00:00", locale) +
                      " · " +
                      formatNumber(cell.volume, locale) +
                      " " +
                      dt.units.kg +
                      " · " +
                      cell.sets +
                      " " +
                      dt.units.sets
                    }
                    className="aspect-square rounded-[3px] ring-1 ring-black/5 ring-inset transition-transform hover:scale-125 dark:ring-white/5"
                    style={{ background: LEVELS[level] }}
                  />
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 text-[0.6875rem] text-muted-foreground">
        <span className="desk-num">
          {trainedDays} {dt.units.days}
        </span>
        <span className="flex items-center gap-1">
          {LEVELS.map((color, index) => (
            <span
              key={index}
              className="size-[9px] rounded-[2px]"
              style={{ background: color }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}

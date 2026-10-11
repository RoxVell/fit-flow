"use client";

import { weekdayLabels } from "@/lib/desktop/format";
import { useLocale } from "@/lib/i18n/locale-context";

/** Weekday x time-of-day density grid — where the training habit actually sits. */
export function RhythmGrid({
  data,
}: {
  data: { day: number; hour: number; count: number }[];
}) {
  const locale = useLocale();
  const labels = weekdayLabels(locale);
  const order = [1, 2, 3, 4, 5, 6, 0];
  const hours = Array.from({ length: 12 }, (_, i) => i * 2);
  const max = Math.max(1, ...data.map((cell) => cell.count));

  const lookup = new Map(data.map((cell) => [cell.day + ":" + cell.hour, cell.count]));

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1 pl-6 text-[0.625rem] text-muted-foreground">
        {hours.map((hour) => (
          <span key={hour} className="flex-1 text-center">
            {hour % 6 === 0 ? String(hour).padStart(2, "0") : ""}
          </span>
        ))}
      </div>
      {order.map((day) => (
        <div key={day} className="flex items-center gap-1">
          <span className="w-6 shrink-0 text-[0.625rem] text-muted-foreground">
            {labels[day]}
          </span>
          {hours.map((hour) => {
            const count = lookup.get(day + ":" + hour) ?? 0;
            const intensity = count / max;
            return (
              <span
                key={hour}
                title={labels[day] + " " + String(hour).padStart(2, "0") + ":00 — " + count}
                className="h-4 flex-1 rounded-[3px] ring-1 ring-inset ring-black/5 dark:ring-white/5"
                style={{
                  background:
                    count === 0
                      ? "color-mix(in oklch, var(--color-foreground) 6%, transparent)"
                      : "color-mix(in oklch, var(--color-chart-1) " +
                        Math.round(20 + intensity * 80) +
                        "%, transparent)",
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
